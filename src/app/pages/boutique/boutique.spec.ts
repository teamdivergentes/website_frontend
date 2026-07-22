import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { NEVER, Observable, of } from 'rxjs';
import { BoutiqueComponent } from './boutique';
import { SeoService } from '../../shared/services/seo.service';
import { ShopService } from '../../shared/services/shop.service';
import { ShopProduct } from '../../shared/models/shop-product.model';

const maillot2023: ShopProduct = {
  id: 'maillotDvg_2023',
  name: 'MAILLOT 2023',
  priceCents: 3990,
  sizes: ['S', 'M', 'L'],
  descKey: 'detailsMaillot2023',
  images: { front: 'a.png', back: 'b.png' },
  active: true,
};
const maillot2020: ShopProduct = {
  ...maillot2023,
  id: 'maillotDvg',
  name: 'MAILLOT 2020',
  descKey: 'detailsMaillot',
};
const tShirtMenpo: ShopProduct = {
  ...maillot2023,
  id: 'tShirtMenpo_2023',
  name: 'T-SHIRT MENPŌ',
  descKey: 'detailsMenpoTShirt',
};

describe('BoutiqueComponent', () => {
  let component: BoutiqueComponent;
  let fixture: ComponentFixture<BoutiqueComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let shopServiceSpy: jasmine.SpyObj<ShopService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    const productsSignal = signal<ShopProduct[]>([maillot2023, maillot2020, tShirtMenpo]);
    shopServiceSpy = jasmine.createSpyObj('ShopService', ['loadProducts', 'createCheckout'], {
      products: productsSignal.asReadonly(),
    });
    shopServiceSpy.loadProducts.and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [BoutiqueComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: ShopService, useValue: shopServiceSpy },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
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
    expect(shopServiceSpy.loadProducts).toHaveBeenCalled();
  });

  it('classe le maillot 2023 en mise en avant, le t-shirt en nouveauté et le maillot 2020 en ancienne collection', () => {
    expect(component.vipNewItem()?.id).toBe('maillotDvg_2023');
    expect(component.newItems().map((p) => p.id)).toEqual(['tShirtMenpo_2023']);
    expect(component.oldItems().map((p) => p.id)).toEqual(['maillotDvg_2023', 'maillotDvg']);
  });

  it('résout la description depuis le catalogue local', () => {
    component.openDetails(maillot2023);
    expect(component.detailsHtml()).toContain('description_modalDetail');
  });

  it('retourne une description vide si aucun produit sélectionné', () => {
    component.closeDetails();
    expect(component.detailsHtml()).toBe('');
  });

  it("devrait ouvrir le modal avec l'item sélectionné", () => {
    component.openDetails(maillot2023);
    expect(component.visible()).toBeTrue();
    expect(component.selectedItem()).toBe(maillot2023);
  });

  it('devrait fermer le modal', () => {
    component.visible.set(true);
    component.closeDetails();
    expect(component.visible()).toBeFalse();
    expect(component.selectedItem()).toBeNull();
  });

  it('bascule l’état déplié d’une carte', () => {
    component.toggleCard('maillotDvg_2023');
    expect(component.expanded()['maillotDvg_2023']).toBe(true);
    component.toggleCard('maillotDvg_2023');
    expect(component.expanded()['maillotDvg_2023']).toBe(false);
  });

  it('ouvre la modale d’achat avec le produit choisi', () => {
    const dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    (dialog.open as jasmine.Spy).and.returnValue({ afterClosed: () => of(undefined) });

    component.openBuyDialog(maillot2023);

    expect(dialog.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({ data: { product: maillot2023 } }),
    );
  });

  it('affiche une erreur si le catalogue est indisponible', () => {
    shopServiceSpy.loadProducts.and.returnValue(
      new Observable((subscriber) => subscriber.error(new Error('boom'))),
    );
    fixture.detectChanges();
    expect(component.error()).toBe('La boutique est momentanément indisponible.');
  });
});
