import { Injectable, computed, inject, signal } from '@angular/core';
import { CartLine, ShopProduct } from '../models/shop-product.model';
import { ShopService } from './shop.service';

const STORAGE_KEY = 'dvg_cart_v1';
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

  readonly totalCents = computed(() => this.subtotalCents() + this.shippingCents());

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
