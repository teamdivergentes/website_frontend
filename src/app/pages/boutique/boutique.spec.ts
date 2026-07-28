import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of } from 'rxjs';
import { BoutiqueComponent } from './boutique';
import { SeoService } from '../../shared/services/seo.service';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { ShopProduct } from '../../shared/models/shop-product.model';

const joker: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: 'Aux couleurs de EVA Joker.',
  description: 'Polyester européen',
  priceCents: 4990,
  imageFront: 'a.png',
  imageBack: 'b.png',
  imageCard: null,
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: ['S', 'M', 'L'],
};
const mystic: ShopProduct = { ...joker, id: 2, slug: 'maillot-2026-mystic', name: 'Mystic' };
const dvg: ShopProduct = { ...joker, id: 3, slug: 'maillot-2026-dvg', name: 'Team Divergentes' };

describe('BoutiqueComponent', () => {
  let component: BoutiqueComponent;
  let fixture: ComponentFixture<BoutiqueComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let shopServiceSpy: jasmine.SpyObj<ShopService>;

  const products = signal<ShopProduct[]>([joker, mystic, dvg]);
  const shopEnabled = signal(true);
  const itemCount = signal(0);

  beforeEach(async () => {
    products.set([joker, mystic, dvg]);
    shopEnabled.set(true);
    itemCount.set(0);

    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    shopServiceSpy = jasmine.createSpyObj('ShopService', ['loadCatalog'], {
      products: products.asReadonly(),
      shopEnabled: shopEnabled.asReadonly(),
    });
    shopServiceSpy.loadCatalog.and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [BoutiqueComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: ShopService, useValue: shopServiceSpy },
        { provide: CartService, useValue: { itemCount: itemCount.asReadonly() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoutiqueComponent);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler updateMetaTags au init', () => {
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Boutique' }),
    );
  });

  it('charge le catalogue au démarrage', () => {
    fixture.detectChanges();
    expect(shopServiceSpy.loadCatalog).toHaveBeenCalled();
  });

  it('met en avant le premier produit et place les autres en grille', () => {
    // L'ordre vient du champ `position`, piloté depuis l'admin.
    expect(component.featured()?.slug).toBe('maillot-2026-joker');
    expect(component.gridProducts().map((p) => p.slug)).toEqual([
      'maillot-2026-mystic',
      'maillot-2026-dvg',
    ]);
  });

  it('ne met rien en avant sur un catalogue vide', () => {
    products.set([]);
    expect(component.featured()).toBeNull();
    expect(component.gridProducts()).toEqual([]);
  });

  it('reflète une boutique fermée', () => {
    shopEnabled.set(false);
    expect(component.shopEnabled()).toBeFalse();
  });

  it('expose le nombre d’articles du panier', () => {
    itemCount.set(3);
    expect(component.cartCount()).toBe(3);
  });

  it('affiche une erreur si le catalogue est indisponible', () => {
    shopServiceSpy.loadCatalog.and.returnValue(
      new Observable((subscriber) => subscriber.error(new Error('boom'))),
    );
    fixture.detectChanges();
    expect(component.error()).toBe('La boutique est momentanément indisponible.');
  });

  it('cesse le chargement une fois le catalogue reçu', () => {
    shopServiceSpy.loadCatalog.and.returnValue(of({ products: [], shippingFeeCents: 590, currency: 'eur', shopEnabled: true }));
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
  });
});
