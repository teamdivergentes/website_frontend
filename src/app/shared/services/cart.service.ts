import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartLine, CreateCheckoutPayload, ShopProduct } from '../models/shop-product.model';
import { ShopService } from './shop.service';

const STORAGE_KEY = 'dvg_cart_v1';
/**
 * Le code appliqué vit dans sa propre clé plutôt que dans le panier.
 *
 * Les lignes sont relues par `isCartLine`, qui rejette tout ce qui n'est pas
 * une ligne : y loger une chaîne demanderait de changer la forme stockée, donc
 * de faire perdre son panier à qui en a un ouvert au moment du déploiement.
 */
const DISCOUNT_STORAGE_KEY = 'dvg_cart_discount_v1';
const MAX_LINE_QUANTITY = 10;
const MAX_CART_ITEMS = 20;

/** Ligne de panier enrichie des données catalogue et des montants recalculés. */
export interface CartLineView extends CartLine {
  product: ShopProduct;
  unitPriceCents: number;
  flockingFeeCents: number;
  lineTotalCents: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly shopService = inject(ShopService);

  private readonly linesSignal = signal<CartLine[]>(this.restore());
  readonly lines = this.linesSignal.asReadonly();

  readonly itemCount = computed(() =>
    this.linesSignal().reduce((sum, line) => sum + line.quantity, 0),
  );

  /**
   * Vue tarifée du panier. Les montants sont recalculés à chaque lecture depuis
   * le catalogue courant : un panier laissé ouvert ne doit jamais afficher un
   * prix périmé. Les lignes dont le produit a disparu du catalogue sont
   * ignorées plutôt que d'afficher un article fantôme.
   */
  readonly detailedLines = computed<CartLineView[]>(() => {
    const products = new Map(this.shopService.products().map((p) => [p.id, p]));

    return this.linesSignal().flatMap((line) => {
      const product = products.get(line.productId);
      if (!product) {
        return [];
      }
      const flockingFeeCents = line.flockingText ? product.flockingFeeCents : 0;
      return [
        {
          ...line,
          product,
          unitPriceCents: product.priceCents,
          flockingFeeCents,
          lineTotalCents: (product.priceCents + flockingFeeCents) * line.quantity,
        },
      ];
    });
  });

  readonly subtotalCents = computed(() =>
    this.detailedLines().reduce((sum, line) => sum + line.lineTotalCents, 0),
  );

  /**
   * Vrai quand le panier atteint le seuil qui offre la livraison. Un seuil a
   * zero desactive la franchise plutot que d'offrir le port a tout le monde :
   * meme regle que cote serveur, qui reste seul juge au paiement.
   */
  readonly shippingIsFree = computed(() => {
    const threshold = this.shopService.freeShippingThresholdCents();
    return threshold > 0 && this.subtotalCents() >= threshold;
  });

  /** Ce qu'il reste a ajouter pour que la livraison soit offerte. */
  readonly missingForFreeShippingCents = computed(() => {
    const threshold = this.shopService.freeShippingThresholdCents();
    if (threshold <= 0 || this.detailedLines().length === 0) {
      return 0;
    }
    return Math.max(0, threshold - this.subtotalCents());
  });

  /** Pas de frais de port sur un panier vide, ni au-dela de la franchise. */
  readonly shippingCents = computed(() => {
    if (this.detailedLines().length === 0 || this.shippingIsFree()) {
      return 0;
    }
    return this.shopService.shippingStandardCents();
  });

  readonly totalCents = computed(() =>
    Math.max(0, this.subtotalCents() - this.discountCentsSignal() + this.shippingCents()),
  );

  // --- Bon de réduction ---------------------------------------------------

  private readonly discountCodeSignal = signal<string | null>(this.restoreDiscount());
  /** Le code retenu, tel que le serveur l'a accepté. */
  readonly discountCode = this.discountCodeSignal.asReadonly();

  private readonly discountCentsSignal = signal(0);
  /** Ce que le code retire, 0 tant que le serveur ne l'a pas confirmé. */
  readonly discountCents = this.discountCentsSignal.asReadonly();

  /**
   * Applique un code et rend le montant déduit.
   *
   * Rien n'est décidé ici : la chaîne part au serveur, qui répond par un
   * montant ou par un refus. Un refus laisse le panier intact et calculable —
   * un mauvais code ne doit pas rendre une commande impossible.
   */
  async applyDiscount(rawCode: string): Promise<void> {
    const code = rawCode.trim();
    if (code.length === 0) {
      return;
    }

    const quote = await firstValueFrom(this.shopService.quoteCart(this.toPayload(code)));
    this.discountCodeSignal.set(quote.discountCode ?? code.toUpperCase());
    this.discountCentsSignal.set(quote.discountCents);
    this.persistDiscount(this.discountCodeSignal());
  }

  removeDiscount(): void {
    this.discountCodeSignal.set(null);
    this.discountCentsSignal.set(0);
    this.persistDiscount(null);
  }

  /**
   * Revalide le code retenu au retour du client.
   *
   * Un panier survit aux visites, une opération commerciale dure quelques
   * jours : le cas le plus probable en production est un code devenu invalide
   * pendant que le panier dormait. Rétablir le prix plein sans rien dire ferait
   * payer un montant que le client n'a pas vu s'afficher la dernière fois — la
   * méthode rend donc le motif du refus, à charge de l'afficher.
   */
  async revalidateDiscount(): Promise<string | null> {
    const code = this.discountCodeSignal();
    if (!code || this.detailedLines().length === 0) {
      return null;
    }

    try {
      await this.applyDiscount(code);
      return null;
    } catch (error) {
      this.removeDiscount();
      return serverMessage(error);
    }
  }

  /** Charge utile du panier courant, sans aucun montant. */
  toPayload(discountCode?: string | null): CreateCheckoutPayload {
    return {
      items: this.detailedLines().map((line) => ({
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
        ...(line.flockingText ? { flockingText: line.flockingText } : {}),
      })),
      ...(discountCode ? { discountCode } : {}),
    };
  }

  /**
   * Ajoute une ligne. Deux articles identiques (même produit, même taille, même
   * flocage) sont fusionnés : ce sont les mêmes exemplaires. Un flocage
   * différent reste une ligne distincte, puisque chaque pièce est unique.
   */
  add(line: CartLine): void {
    const flockingText = line.flockingText?.trim() || null;
    const next = [...this.linesSignal()];
    const existing = next.findIndex(
      (l) =>
        l.productId === line.productId && l.size === line.size && l.flockingText === flockingText,
    );

    const room = MAX_CART_ITEMS - this.itemCount();
    if (room <= 0) {
      return;
    }
    const quantity = Math.min(line.quantity, room);

    if (existing >= 0) {
      next[existing] = {
        ...next[existing],
        quantity: Math.min(next[existing].quantity + quantity, MAX_LINE_QUANTITY),
      };
    } else {
      next.push({ ...line, flockingText, quantity: Math.min(quantity, MAX_LINE_QUANTITY) });
    }

    this.commit(next);
  }

  updateQuantity(index: number, quantity: number): void {
    if (quantity <= 0) {
      this.remove(index);
      return;
    }
    const next = [...this.linesSignal()];
    if (!next[index]) {
      return;
    }
    next[index] = { ...next[index], quantity: Math.min(quantity, MAX_LINE_QUANTITY) };
    this.commit(next);
  }

  remove(index: number): void {
    this.commit(this.linesSignal().filter((_, i) => i !== index));
  }

  clear(): void {
    this.commit([]);
    // Le code n'a plus de panier auquel s'appliquer : le garder ferait
    // réapparaître une remise sur des articles qui n'ont rien à voir.
    this.removeDiscount();
  }

  private commit(lines: CartLine[]): void {
    this.linesSignal.set(lines);
    this.persist(lines);
  }

  private persist(lines: CartLine[]): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Mode navigation privée ou quota atteint : le panier reste en mémoire.
      // Perdre la persistance ne doit pas casser la page.
    }
  }

  private persistDiscount(code: string | null): void {
    try {
      if (code) {
        globalThis.localStorage?.setItem(DISCOUNT_STORAGE_KEY, code);
      } else {
        globalThis.localStorage?.removeItem(DISCOUNT_STORAGE_KEY);
      }
    } catch {
      // Même raison que pour les lignes : perdre la persistance ne doit pas
      // casser la page.
    }
  }

  /**
   * Le code relu n'est pas cru sur parole : il est borné en longueur et en
   * charset avant d'être renvoyé au serveur, qui reste seul juge de sa
   * validité. Le `localStorage` est modifiable par l'utilisateur.
   */
  private restoreDiscount(): string | null {
    try {
      const raw = globalThis.localStorage?.getItem(DISCOUNT_STORAGE_KEY);
      return raw && /^[A-Z0-9-]{3,32}$/.test(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  private restore(): CartLine[] {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
    } catch {
      // Donnée corrompue ou storage indisponible : on repart d'un panier vide.
      return [];
    }
  }
}

/**
 * Le refus formulé par le serveur, quand il en a formulé un.
 *
 * Les motifs de refus d'un code — expiré, épuisé, panier trop petit — sont du
 * sens métier que le client peut lire et sur lequel il peut agir. Les autres
 * échecs n'ont pas à remonter tels quels : une recette a déjà fait apparaître
 * « ThrottlerException » en toutes lettres sous un bouton.
 */
function serverMessage(error: unknown): string {
  const response = error as { status?: number; error?: { message?: string | string[] } };
  const message = response?.error?.message;

  if (response?.status === 400 && typeof message === 'string') {
    return message;
  }
  return "Ce code de réduction n'a pas pu être vérifié.";
}

/**
 * Le contenu du localStorage est modifiable par l'utilisateur : on ne fait
 * confiance à rien. Les montants n'y figurent pas, mais une ligne mal formée
 * casserait l'affichage.
 */
function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const line = value as Record<string, unknown>;
  return (
    typeof line['productId'] === 'number' &&
    typeof line['size'] === 'string' &&
    typeof line['quantity'] === 'number' &&
    line['quantity'] > 0 &&
    (line['flockingText'] === null || typeof line['flockingText'] === 'string')
  );
}
