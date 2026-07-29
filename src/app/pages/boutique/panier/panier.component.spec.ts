import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PanierComponent } from './panier.component';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService, CartLineView } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopProduct } from '../../../shared/models/shop-product.model';
import { SHOP_LEGAL, TODO_MARKER } from '../../legal/legal-info';

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
  sizes: ['M'],
};

const LINE: CartLineView = {
  productId: 1,
  size: 'M',
  quantity: 2,
  flockingText: 'Snake',
  product: JOKER,
  unitPriceCents: 4990,
  flockingFeeCents: 500,
  lineTotalCents: 10980,
};

describe('PanierComponent', () => {
  let fixture: ComponentFixture<PanierComponent>;
  let component: PanierComponent;
  let shopService: jasmine.SpyObj<ShopService>;

  const detailedLines = signal<CartLineView[]>([LINE]);
  const subtotalCents = signal(10980);
  const shippingCents = signal(590);
  const totalCents = signal(11570);

  const build = (catalogFails = false) => {
    TestBed.resetTestingModule();
    shopService = jasmine.createSpyObj<ShopService>('ShopService', [
      'loadCatalog',
      'createCheckout',
    ]);
    shopService.loadCatalog.and.returnValue(
      catalogFails ? throwError(() => new Error('down')) : of({ products: [], shippingFeeCents: 590, currency: 'eur', shopEnabled: true }),
    );
    shopService.createCheckout.and.returnValue(of({ url: 'https://stripe/cs_1' }));

    TestBed.configureTestingModule({
      imports: [PanierComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ShopService, useValue: shopService },
        {
          provide: CartService,
          useValue: {
            detailedLines,
            subtotalCents,
            shippingCents,
            totalCents,
            updateQuantity: jasmine.createSpy('updateQuantity'),
            remove: jasmine.createSpy('remove'),
          },
        },
        { provide: SeoService, useValue: { updateMetaTags: jasmine.createSpy() } },
      ],
    });

    fixture = TestBed.createComponent(PanierComponent);
    component = fixture.componentInstance;
    spyOn(component, 'redirectToCheckout');
    fixture.detectChanges();
  };

  beforeEach(() => {
    detailedLines.set([LINE]);
    build();
  });

  it('charge le catalogue au démarrage — il porte les prix', () => {
    expect(shopService.loadCatalog).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  });

  it('signale une boutique indisponible', () => {
    build(true);
    expect(component.error()).toBeDefined();
  });

  describe('mentions contractuelles', () => {
    const hrefs = (): string[] =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.panier__terms a[href]',
        ) as NodeListOf<HTMLAnchorElement>,
      ).map((a) => a.getAttribute('href') ?? '');

    it('renvoie la case à cocher vers les CGV et la rétractation', () => {
      expect(hrefs()).toContain('/conditions-generales-de-vente');
      expect(hrefs()).toContain('/retractation');
    });

    it('conserve le texte de la case à cocher', () => {
      const terms = fixture.nativeElement.querySelector('.panier__terms').textContent as string;
      expect(terms).toContain('conditions générales de vente');
      expect(terms).toContain('droit de rétractation');
      expect(terms).toContain('flocage');
    });

    it('affiche le délai de livraison sous le récapitulatif', () => {
      const delay = fixture.nativeElement.querySelector('.panier__delay');
      expect(delay).withContext('le délai de livraison engage le vendeur').toBeTruthy();
      expect(delay.textContent).toContain('France métropolitaine');
    });

    /**
     * Le panier est le dernier écran avant le paiement : le délai qu'il affiche
     * engage le vendeur. Il doit donc venir de `SHOP_LEGAL`, et afficher le
     * marqueur plutôt qu'une durée inventée si la valeur manque encore.
     */
    it('reprend le délai de SHOP_LEGAL, ou le marqueur À COMPLÉTER à défaut', () => {
      const { shippingDelayBusinessDays, carrierDelayBusinessDays } = SHOP_LEGAL;
      const delay = fixture.nativeElement.querySelector('.panier__delay');

      if (shippingDelayBusinessDays === null || carrierDelayBusinessDays === null) {
        expect(component.shippingDelay).toContain(TODO_MARKER);
        expect(delay.textContent).toContain(TODO_MARKER);
        return;
      }
      expect(component.shippingDelay).toContain(`${shippingDelayBusinessDays} jours ouvrés`);
      expect(component.carrierDelay).toContain(`${carrierDelayBusinessDays} jours ouvrés`);
      expect(delay.textContent).toContain(`${shippingDelayBusinessDays} jours ouvrés`);
      expect(delay.textContent).not.toContain(TODO_MARKER);
    });
  });

  describe('checkout', () => {
    it('refuse de payer sans acceptation des CGV', () => {
      component.checkout();
      expect(shopService.createCheckout).not.toHaveBeenCalled();
    });

    it('refuse de payer un panier vide', () => {
      detailedLines.set([]);
      component.termsAccepted.set(true);

      component.checkout();

      expect(shopService.createCheckout).not.toHaveBeenCalled();
    });

    it('envoie les lignes sans aucun montant', () => {
      component.termsAccepted.set(true);
      component.checkout();

      expect(shopService.createCheckout).toHaveBeenCalledWith({
        items: [{ productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' }],
      });
    });

    it('omet flockingText pour une ligne sans flocage', () => {
      detailedLines.set([{ ...LINE, flockingText: null }]);
      component.termsAccepted.set(true);

      component.checkout();

      expect(shopService.createCheckout).toHaveBeenCalledWith({
        items: [{ productId: 1, size: 'M', quantity: 2 }],
      });
    });

    it('redirige vers Stripe en cas de succès', () => {
      component.termsAccepted.set(true);
      component.checkout();

      expect(component.redirectToCheckout).toHaveBeenCalledWith('https://stripe/cs_1');
    });

    it('affiche le message d’erreur du serveur', () => {
      shopService.createCheckout.and.returnValue(
        throwError(() => ({ error: { message: 'Taille indisponible' } })),
      );
      component.termsAccepted.set(true);

      component.checkout();

      expect(component.error()).toBe('Taille indisponible');
      expect(component.submitting()).toBeFalse();
    });

    it('agrège les messages de validation multiples', () => {
      shopService.createCheckout.and.returnValue(
        throwError(() => ({ error: { message: ['Panier vide', 'Taille invalide'] } })),
      );
      component.termsAccepted.set(true);

      component.checkout();

      expect(component.error()).toBe('Panier vide — Taille invalide');
    });
  });
});
