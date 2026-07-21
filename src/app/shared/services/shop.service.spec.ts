import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShopService } from './shop.service';
import { ShopProduct } from '../models/shop-product.model';
import { environment } from '../../../environments/environment';

describe('ShopService', () => {
  let service: ShopService;
  let httpMock: HttpTestingController;

  const product: ShopProduct = {
    id: 'maillotDvg_2023',
    name: 'MAILLOT 2023',
    priceCents: 3990,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    descKey: 'detailsMaillot2023',
    images: { front: 'assets/img/shop/a.png', back: null },
    active: true,
  };

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

  it('charge le catalogue et alimente le signal', () => {
    service.loadProducts().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/shop/products`);
    expect(req.request.method).toBe('GET');
    req.flush([product]);

    expect(service.products()).toEqual([product]);
  });

  it("envoie le produit, la taille et la quantité au checkout, sans jamais de prix", () => {
    service.createCheckout({ productId: 'maillotDvg_2023', size: 'M', quantity: 2 }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/shop/checkout`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productId: 'maillotDvg_2023', size: 'M', quantity: 2 });
    expect(Object.keys(req.request.body as object)).not.toContain('priceCents');
    req.flush({ url: 'https://stripe/cs_1' });
  });

  it('omet la taille pour un produit sans déclinaison', () => {
    service.createCheckout({ productId: 'tapisSourisDvg', quantity: 1 }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/api/shop/checkout`);

    expect(req.request.body).toEqual({ productId: 'tapisSourisDvg', quantity: 1 });
    req.flush({ url: 'https://stripe/cs_1' });
  });
});
