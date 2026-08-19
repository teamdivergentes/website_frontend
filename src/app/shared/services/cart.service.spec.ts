import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { CartService } from './cart.service';
import { ShopService } from './shop.service';
import { of, throwError } from 'rxjs';
import { CartQuote, ShopProduct } from '../models/shop-product.model';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: null,
  description: null,
  priceCents: 4990,
  listPriceCents: null,
  images: [
    { url: 'front.png', label: 'face', isBack: false },
    { url: 'back.png', label: 'dos', isBack: true },
  ],
  cardImage: 'front.png',
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: [
    { label: 'M', inStock: true },
    { label: 'L', inStock: true },
  ],
  soldOut: false,
};

const STORAGE_KEY = 'dvg_cart_v1';
const DISCOUNT_STORAGE_KEY = 'dvg_cart_discount_v1';

/** Devis serveur type : 5 € retirés d'un panier à 49,90 €. */
const QUOTE: CartQuote = {
  lines: [],
  subtotalCents: 4990,
  discountCents: 500,
  discountCode: 'BIENVENUE',
  shippingCents: 500,
  shippingIsFree: false,
  totalCents: 4990,
  currency: 'eur',
};

const quoteCart = jasmine.createSpy('quoteCart').and.returnValue(of(QUOTE));

describe('CartService', () => {
  let service: CartService;
  const products = signal<ShopProduct[]>([JOKER]);
  const shippingStandardCents = signal(500);
  const freeShippingThresholdCents = signal(12000);

  const configure = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CartService,
        {
          provide: ShopService,
          useValue: {
            products,
            shippingStandardCents,
            freeShippingThresholdCents,
            quoteCart,
          },
        },
      ],
    });
    return TestBed.inject(CartService);
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISCOUNT_STORAGE_KEY);
    quoteCart.calls.reset();
    products.set([JOKER]);
    shippingStandardCents.set(500);
    freeShippingThresholdCents.set(12000);
    service = configure();
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISCOUNT_STORAGE_KEY);
  });

  describe('ajout', () => {
    it('ajoute une ligne et compte les articles', () => {
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: null });

      expect(service.lines()).toHaveSize(1);
      expect(service.itemCount()).toBe(2);
    });

    it('fusionne deux lignes identiques', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: null });

      expect(service.lines()).toHaveSize(1);
      expect(service.lines()[0].quantity).toBe(3);
    });

    it('garde des lignes distinctes pour des flocages différents', () => {
      // Chaque pièce floquée est unique : elles ne peuvent pas être fusionnées.
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: 'Snake' });
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: 'Joker' });

      expect(service.lines()).toHaveSize(2);
    });

    it('normalise un flocage vide en absence de flocage', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: '   ' });

      expect(service.lines()[0].flockingText).toBeNull();
    });

    it('plafonne le panier à 20 articles', () => {
      service.add({ productId: 1, size: 'M', quantity: 10, flockingText: null });
      service.add({ productId: 1, size: 'L', quantity: 10, flockingText: null });
      service.add({ productId: 1, size: 'M', quantity: 5, flockingText: 'Snake' });

      expect(service.itemCount()).toBe(20);
    });
  });

  describe('montants', () => {
    it('recalcule les montants depuis le catalogue', () => {
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: null });

      expect(service.subtotalCents()).toBe(4990 * 2);
      expect(service.shippingCents()).toBe(500);
      expect(service.totalCents()).toBe(4990 * 2 + 500);
    });

    it('offre la livraison dès que le panier atteint le seuil', () => {
      // 4990 x 3 = 14 970, au-delà des 120 € de franchise.
      service.add({ productId: 1, size: 'M', quantity: 3, flockingText: null });

      expect(service.shippingIsFree()).toBeTrue();
      expect(service.shippingCents()).toBe(0);
      expect(service.missingForFreeShippingCents()).toBe(0);
    });

    it('indique ce qu’il manque pour déclencher la franchise', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });

      expect(service.missingForFreeShippingCents()).toBe(12000 - 4990);
    });

    /**
      * L'option rapide a ete retiree : le panier n'a plus qu'un seul tarif de
      * port, et plus aucun moyen d'en selectionner un autre.
      */
    it('facture le port standard, seul mode d’expedition', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });

      expect(service.shippingCents()).toBe(500);
    });

    it('ajoute le surcoût de flocage uniquement si un flocage est demandé', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: 'Snake' });

      expect(service.detailedLines()[0].flockingFeeCents).toBe(500);
      expect(service.subtotalCents()).toBe(4990 + 500);
    });

    it('suit un changement de prix du catalogue', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      // Un panier laissé ouvert ne doit jamais afficher un tarif périmé.
      products.set([{ ...JOKER, priceCents: 5990 }]);

      expect(service.subtotalCents()).toBe(5990);
    });

    it('ne facture pas de port sur un panier vide', () => {
      expect(service.shippingCents()).toBe(0);
      expect(service.totalCents()).toBe(0);
    });

    it('ignore une ligne dont le produit a disparu du catalogue', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      products.set([]);

      expect(service.detailedLines()).toEqual([]);
      expect(service.subtotalCents()).toBe(0);
    });
  });

  describe('modification', () => {
    it('met à jour la quantité', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      service.updateQuantity(0, 4);

      expect(service.lines()[0].quantity).toBe(4);
    });

    it('retire la ligne quand la quantité tombe à zéro', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      service.updateQuantity(0, 0);

      expect(service.lines()).toEqual([]);
    });

    it('vide le panier', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      service.clear();

      expect(service.lines()).toEqual([]);
    });
  });

  describe('persistance', () => {
    it('restaure le panier depuis le localStorage', () => {
      service.add({ productId: 1, size: 'L', quantity: 3, flockingText: 'Snake' });

      const restored = configure();

      expect(restored.lines()).toEqual([
        { productId: 1, size: 'L', quantity: 3, flockingText: 'Snake' },
      ]);
    });

    it('ignore un contenu de storage corrompu', () => {
      localStorage.setItem(STORAGE_KEY, '{ pas du json');

      expect(configure().lines()).toEqual([]);
    });

    it('rejette les lignes mal formées', () => {
      // Le localStorage est modifiable par l'utilisateur : on ne fait confiance à rien.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([{ productId: 'x', size: 'M', quantity: 1 }, { productId: 1 }]),
      );

      expect(configure().lines()).toEqual([]);
    });
  });

  describe('bon de réduction', () => {
    beforeEach(() => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
    });

    it('retire la remise du total sans toucher au sous-total', async () => {
      await service.applyDiscount('BIENVENUE');

      expect(service.subtotalCents()).toBe(4990);
      expect(service.discountCents()).toBe(500);
      // 49,90 − 5,00 + 5,00 de port.
      expect(service.totalCents()).toBe(4990);
    });

    it('transmet la chaîne saisie, jamais un montant', async () => {
      await service.applyDiscount('  bienvenue ');

      const [payload] = quoteCart.calls.mostRecent().args as [
        { items: unknown[]; discountCode?: string },
      ];
      expect(payload.discountCode).toBe('bienvenue');
      expect(JSON.stringify(payload)).not.toContain('4990');
    });

    it('retient le code que le serveur a accepté, pas celui qui a été tapé', async () => {
      await service.applyDiscount('bienvenue');

      expect(service.discountCode()).toBe('BIENVENUE');
    });

    it('laisse le panier calculable quand le code est refusé', async () => {
      quoteCart.and.returnValue(throwError(() => ({ status: 400 })));

      let rejete = false;
      await service.applyDiscount('EXPIRE').catch(() => (rejete = true));

      expect(rejete).toBeTrue();
      expect(service.discountCents()).toBe(0);
      expect(service.totalCents()).toBe(5490);
      quoteCart.and.returnValue(of(QUOTE));
    });

    it('rétablit le prix plein au retrait du code', async () => {
      await service.applyDiscount('BIENVENUE');

      service.removeDiscount();

      expect(service.discountCode()).toBeNull();
      expect(service.totalCents()).toBe(5490);
    });

    it('oublie le code en vidant le panier', async () => {
      // Le code n'a plus de panier auquel s'appliquer : le garder ferait
      // réapparaître une remise sur des articles sans rapport.
      await service.applyDiscount('BIENVENUE');

      service.clear();

      expect(service.discountCode()).toBeNull();
      expect(service.discountCents()).toBe(0);
    });

    it('survit à une visite suivante', async () => {
      await service.applyDiscount('BIENVENUE');

      expect(configure().discountCode()).toBe('BIENVENUE');
    });

    it('ne fait pas confiance au code relu du localStorage', () => {
      // Le stockage est modifiable : une valeur hors charset ne doit même pas
      // partir au serveur.
      localStorage.setItem(DISCOUNT_STORAGE_KEY, 'code invalide ! ' + 'x'.repeat(80));

      expect(configure().discountCode()).toBeNull();
    });

    it('rend le motif du refus quand le code est devenu invalide entre deux visites', async () => {
      // Cas nominal en production : un panier survit aux visites, une opération
      // dure quelques jours.
      await service.applyDiscount('BIENVENUE');
      quoteCart.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Ce code de réduction est invalide' } })),
      );

      const motif = await service.revalidateDiscount();

      expect(motif).toBe('Ce code de réduction est invalide');
      expect(service.discountCode()).toBeNull();
      expect(service.discountCents()).toBe(0);
      quoteCart.and.returnValue(of(QUOTE));
    });

    it('ne revalide rien quand aucun code n’est retenu', async () => {
      quoteCart.calls.reset();

      expect(await service.revalidateDiscount()).toBeNull();
      expect(quoteCart).not.toHaveBeenCalled();
    });
  });

  describe('toPayload', () => {
    it('ne porte aucun montant', () => {
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' });

      expect(service.toPayload()).toEqual({
        items: [{ productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' }],
      });
    });

    it('n’ajoute le code que s’il y en a un', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });

      expect(service.toPayload(null).discountCode).toBeUndefined();
      expect(service.toPayload('BIENVENUE').discountCode).toBe('BIENVENUE');
    });
  });
});
