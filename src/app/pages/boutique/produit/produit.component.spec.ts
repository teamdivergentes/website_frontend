import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProduitComponent } from './produit.component';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopProduct } from '../../../shared/models/shop-product.model';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: 'Aux couleurs de EVA Joker.',
  description: 'Polyester européen',
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

describe('ProduitComponent', () => {
  let fixture: ComponentFixture<ProduitComponent>;
  let component: ProduitComponent;
  let cartService: jasmine.SpyObj<CartService>;
  let shopService: jasmine.SpyObj<ShopService>;

  const build = (product: ShopProduct | null = JOKER) => {
    TestBed.resetTestingModule();
    shopService = jasmine.createSpyObj<ShopService>('ShopService', ['findBySlug', 'loadCatalog']);
    shopService.loadCatalog.and.returnValue(of({ products: [], shippingFeeCents: 590, currency: 'eur', shopEnabled: true }));
    shopService.findBySlug.and.returnValue(
      product ? of(product) : throwError(() => new Error('404')),
    );
    cartService = jasmine.createSpyObj<CartService>('CartService', ['add']);

    TestBed.configureTestingModule({
      imports: [ProduitComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ShopService, useValue: shopService },
        { provide: CartService, useValue: cartService },
        { provide: SeoService, useValue: { updateMetaTags: jasmine.createSpy() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'maillot-2026-joker' } } },
        },
      ],
    });

    fixture = TestBed.createComponent(ProduitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => build());

  it('charge le produit et présélectionne la première taille', () => {
    expect(component.product()).toEqual(JOKER);
    expect(component.selectedSize()).toBe('M');
    expect(component.loading()).toBeFalse();
  });

  it('affiche un message si le produit est introuvable', () => {
    build(null);
    expect(component.error()).toBeDefined();
  });

  describe('prix', () => {
    it('affiche le prix nu sans flocage', () => {
      expect(component.unitPriceCents()).toBe(4990);
    });

    it('ajoute le surcoût quand un flocage non vide est saisi', () => {
      component.toggleFlocking(true);
      component.flockingText.set('Snake');

      expect(component.unitPriceCents()).toBe(4990 + 500);
    });

    it('ne facture pas le flocage si le champ reste vide', () => {
      component.toggleFlocking(true);
      component.flockingText.set('   ');

      expect(component.effectiveFlocking()).toBeNull();
      expect(component.unitPriceCents()).toBe(4990);
    });

    it('multiplie par la quantité', () => {
      component.changeQuantity(2);
      expect(component.totalCents()).toBe(4990 * 3);
    });

    it('borne la quantité entre 1 et 10', () => {
      component.changeQuantity(-5);
      expect(component.quantity()).toBe(1);

      for (let i = 0; i < 20; i++) {
        component.changeQuantity(1);
      }
      expect(component.quantity()).toBe(10);
    });
  });

  describe('validation du flocage', () => {
    beforeEach(() => component.toggleFlocking(true));

    it('accepte un pseudo simple', () => {
      component.flockingText.set('Snake_01');
      expect(component.flockingError()).toBeUndefined();
    });

    it('refuse un pseudo trop long', () => {
      component.flockingText.set('BeaucoupTropLong');
      expect(component.flockingError()).toBeDefined();
    });

    it('refuse les caractères hostiles', () => {
      component.flockingText.set('<script>');
      expect(component.flockingError()).toBeDefined();
    });

    it('empêche l’ajout au panier tant que la saisie est invalide', () => {
      component.flockingText.set('<script>');
      expect(component.canAdd()).toBeFalse();

      component.addToCart();
      expect(cartService.add).not.toHaveBeenCalled();
    });

    it('bascule sur la vue de dos à l’activation du flocage', () => {
      expect(component.viewingBack()).toBeTrue();
    });
  });

  describe('ajout au panier', () => {
    it('transmet la ligne normalisée', () => {
      component.selectSize('L');
      component.toggleFlocking(true);
      component.flockingText.set('  Le   Snake ');
      component.changeQuantity(1);

      component.addToCart();

      expect(cartService.add).toHaveBeenCalledWith({
        productId: 1,
        size: 'L',
        quantity: 2,
        flockingText: 'Le Snake',
      });
      expect(component.added()).toBeTrue();
    });

    it('transmet un flocage nul quand l’option est désactivée', () => {
      component.addToCart();

      expect(cartService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ flockingText: null }),
      );
    });
  });
});
