import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BoutiqueV1Component } from './boutique-v1';
import { SeoService } from '../../shared/services/seo.service';
import { shoppingList } from '../../data/shopping-list';

describe('BoutiqueV1Component', () => {
  let component: BoutiqueV1Component;
  let fixture: ComponentFixture<BoutiqueV1Component>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [BoutiqueV1Component],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SeoService, useValue: seoServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoutiqueV1Component);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler updateMetaTags au init', () => {
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Boutique' })
    );
  });

  it('devrait exposer la liste des produits', () => {
    expect(component.shoppingList).toBe(shoppingList);
    expect(component.shoppingList.length).toBeGreaterThan(0);
  });

  it('devrait filtrer les articles VIP/new', () => {
    // vipNewItem : new=true ET vip=true
    const vip = component.vipNewItem;
    if (vip) {
      expect(vip.new).toBeTrue();
      expect(vip.vip).toBeTrue();
    }
  });

  it('devrait filtrer les articles new non-VIP', () => {
    component.newItems.forEach(item => {
      expect(item.new).toBeTrue();
      expect(item.vip).toBeFalsy();
    });
  });

  it('devrait filtrer les anciens articles', () => {
    component.oldItems.forEach(item => {
      expect(item.new).toBeFalsy();
    });
  });

  it('devrait ouvrir le modal avec l\'item sélectionné', () => {
    const item = shoppingList[0];
    component.openDetails(item);
    expect(component.visible()).toBeTrue();
    expect(component.selectedItem()).toBe(item);
  });

  it('devrait fermer le modal', () => {
    component.visible.set(true);
    component.closeDetails();
    expect(component.visible()).toBeFalse();
    expect(component.selectedItem()).toBeNull();
  });

  it('devrait calculer le detailsHtml depuis l\'item sélectionné', () => {
    const item = shoppingList[0];
    component.selectedItem.set(item);
    const html = component.detailsHtml();
    expect(typeof html).toBe('string');
  });

  it('devrait retourner une chaîne vide pour detailsHtml si aucun item sélectionné', () => {
    component.selectedItem.set(null);
    expect(component.detailsHtml()).toBe('');
  });

  it('devrait toggler l\'état expanded d\'une carte', () => {
    const id = shoppingList[0].id;
    expect(component.expanded()[id]).toBeFalsy();

    component.toggleCard(id);
    expect(component.expanded()[id]).toBeTrue();

    component.toggleCard(id);
    expect(component.expanded()[id]).toBeFalse();
  });

  it('trackById devrait retourner l\'id de l\'item', () => {
    const item = shoppingList[0];
    expect(component.trackById(0, item)).toBe(item.id);
  });
});
