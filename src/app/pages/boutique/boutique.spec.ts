import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of } from 'rxjs';
import { BoutiqueComponent } from './boutique';
import { SeoService } from '../../shared/services/seo.service';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { TAX_LABEL } from './jersey-presentation';

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

  it('présente une section par déclinaison, dans l’ordre du catalogue', () => {
    // L'ordre vient du champ `position`, piloté depuis l'admin.
    expect(component.jerseys().map((j) => j.product.slug)).toEqual([
      'maillot-2026-joker',
      'maillot-2026-mystic',
      'maillot-2026-dvg',
    ]);
  });

  it('alterne le sens des sections une déclinaison sur deux', () => {
    expect(component.jerseys().map((j) => j.reversed)).toEqual([false, true, false]);
  });

  it('compose la référence d’atelier depuis le slug', () => {
    expect(component.jerseys().map((j) => j.reference)).toEqual([
      'DVG26 / JOK',
      'DVG26 / MYS',
      'DVG26 / STD',
    ]);
  });

  it('met le nom d’équipe en accent et retire la ponctuation de séparation', () => {
    const [jokerSection, , dvgSection] = component.jerseys();

    // « Maillot 2026 — DVG × Joker » se lit « Maillot 2026 Joker » : ni tiret
    // cadratin, ni croix, ni répétition de la structure.
    expect(jokerSection.titleLead).toBe('Maillot 2026');
    expect(jokerSection.titleAccent).toBe('Joker');
    // Sans séparateur dans le nom, l'accent retombe sur le dernier mot.
    expect(dvgSection.titleAccent).toBe('Divergentes');
  });

  it('expose le laïus du catalogue tel quel', () => {
    expect(component.jerseys()[0].story).toBe('Polyester européen');
  });

  it('compose la ligne de méta avec les tailles et le surcoût de flocage', () => {
    // Matière et grammage sont communs aux trois maillots : ils vivent en bas de
    // page, pas répétés à chaque section.
    expect(component.jerseys()[0].meta).toEqual(['S à L', 'flocage au pseudo, + 5,00 €']);
  });

  it('omet le flocage de la méta quand le produit ne le permet pas', () => {
    products.set([{ ...joker, allowFlocking: false }]);

    expect(component.jerseys()[0].meta).toEqual(['S à L']);
  });

  it('accorde le titre du hero sur le nombre de maillots en ligne', () => {
    expect(component.heroCount()).toEqual({ accent: 'trois', noun: 'équipes' });

    products.set([joker]);
    expect(component.heroCount()).toEqual({ accent: 'une', noun: 'équipe' });

    products.set([]);
    expect(component.heroCount()).toEqual({ accent: 'toutes nos', noun: 'équipes' });
  });

  it('ne présente aucune section sur un catalogue vide', () => {
    products.set([]);
    expect(component.jerseys()).toEqual([]);
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

  it('affiche la mention TTC à côté du prix de chaque déclinaison', () => {
    // Le chargement du catalogue doit se terminer pour que la liste des
    // déclinaisons (et donc les prix) apparaisse dans le DOM.
    shopServiceSpy.loadCatalog.and.returnValue(
      of({ products: [], shippingFeeCents: 590, currency: 'eur', shopEnabled: true }),
    );
    fixture.detectChanges();
    expect(component.taxLabel).toBe(TAX_LABEL);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(TAX_LABEL);
  });
});
