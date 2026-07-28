import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { CartService } from './cart.service';
import { ShopService } from './shop.service';
import { ShopProduct } from '../models/shop-product.model';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: null,
  description: null,
  priceCents: 4990,
  imageFront: 'front.png',
  imageBack: 'back.png',
  imageCard: null,
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: ['M', 'L'],
};

const STORAGE_KEY = 'dvg_cart_v1';

describe('CartService', () => {
  let service: CartService;
  const products = signal<ShopProduct[]>([JOKER]);
  const shippingFeeCents = signal(590);

  const configure = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CartService,
        { provide: ShopService, useValue: { products, shippingFeeCents } },
      ],
    });
    return TestBed.inject(CartService);
  };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    products.set([JOKER]);
    shippingFeeCents.set(590);
    service = configure();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  describe('ajout', () => {
    it('ajoute une ligne et compte les articles', () => {
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: null });

      expect(service.lines().length).toBe(1);
      expect(service.itemCount()).toBe(2);
    });

    it('fusionne deux lignes identiques', () => {
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: null });
      service.add({ productId: 1, size: 'M', quantity: 2, flockingText: null });

      expect(service.lines().length).toBe(1);
      expect(service.lines()[0].quantity).toBe(3);
    });

    it('garde des lignes distinctes pour des flocages différents', () => {
      // Chaque pièce floquée est unique : elles ne peuvent pas être fusionnées.
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: 'Snake' });
      service.add({ productId: 1, size: 'M', quantity: 1, flockingText: 'Joker' });

      expect(service.lines().length).toBe(2);
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
      expect(service.shippingCents()).toBe(590);
      expect(service.totalCents()).toBe(4990 * 2 + 590);
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
});
