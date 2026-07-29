import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShopService } from './shop.service';
import { ShopCatalog, ShopProduct } from '../models/shop-product.model';
import { environment } from '../../../environments/environment';

export const PRODUCT_FIXTURE: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: "Aux couleurs de l'équipe EVA Joker.",
  description: 'Polyester européen',
  priceCents: 4990,
  imageFront: 'assets/img/shop/joker-front.png',
  imageBack: 'assets/img/shop/joker-back.png',
  imageCard: null,
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: ['S', 'M', 'L', 'XL', 'XXL'],
};

const CATALOG: ShopCatalog = {
  products: [PRODUCT_FIXTURE],
  shippingStandardCents: 500,
  shippingExpressCents: 1000,
  freeShippingThresholdCents: 12000,
  currency: 'eur',
  shopEnabled: true,
};

describe('ShopService', () => {
  let service: ShopService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ShopService,
      ],
    });
    service = TestBed.inject(ShopService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('charge le catalogue et alimente les signaux', () => {
    service.loadCatalog().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/shop/products`);
    expect(req.request.method).toBe('GET');
    req.flush(CATALOG);

    expect(service.products()).toEqual([PRODUCT_FIXTURE]);
    expect(service.shippingStandardCents()).toBe(500);
    expect(service.shopEnabled()).toBeTrue();
  });

  it('considère la boutique ouverte tant que le catalogue n’a pas répondu', () => {
    // Sinon la page afficherait brièvement un faux message de fermeture.
    expect(service.shopEnabled()).toBeTrue();
    expect(service.products()).toEqual([]);
  });

  it('reflète une boutique fermée', () => {
    service.loadCatalog().subscribe();
    httpMock
      .expectOne(`${environment.apiUrl}/api/shop/products`)
      .flush({ ...CATALOG, products: [], shopEnabled: false });

    expect(service.shopEnabled()).toBeFalse();
  });

  it('résout un produit par son slug', () => {
    service.findBySlug('maillot-2026-joker').subscribe();
    const req = httpMock.expectOne(
      `${environment.apiUrl}/api/shop/products/maillot-2026-joker`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(PRODUCT_FIXTURE);
  });

  it('envoie le panier au checkout sans jamais transmettre de montant', () => {
    service
      .createCheckout({
        shippingMethod: 'STANDARD',
        items: [{ productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' }],
      })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/shop/checkout`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as { items: Record<string, unknown>[] };
    expect(body.items).toEqual([
      { productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' },
    ]);
    // Invariant : le serveur recalcule tous les montants.
    expect(Object.keys(body.items[0])).not.toContain('priceCents');
    expect(Object.keys(body.items[0])).not.toContain('flockingFeeCents');

    req.flush({ url: 'https://stripe/cs_1' });
  });
});
