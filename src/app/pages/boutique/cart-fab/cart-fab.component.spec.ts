import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID, provideZonelessChangeDetection, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { CartFabComponent } from './cart-fab.component';
import { CartService } from '../../../shared/services/cart.service';
import { ShopService } from '../../../shared/services/shop.service';

// Les montants sont formatés à la française dans l'application : le test
// enregistre la même locale, faute de quoi il vérifierait un rendu que
// personne ne voit.
registerLocaleData(localeFr);

describe('CartFabComponent', () => {
  let fixture: ComponentFixture<CartFabComponent>;
  let component: CartFabComponent;

  const itemCount = signal(0);
  const subtotalCents = signal(0);
  const missingCents = signal(0);
  const shippingIsFree = signal(false);
  const threshold = signal(12000);

  const build = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CartFabComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        {
          provide: CartService,
          useValue: {
            itemCount: itemCount.asReadonly(),
            subtotalCents: subtotalCents.asReadonly(),
            missingForFreeShippingCents: missingCents.asReadonly(),
            shippingIsFree: shippingIsFree.asReadonly(),
          },
        },
        {
          provide: ShopService,
          useValue: { freeShippingThresholdCents: threshold.asReadonly() },
        },
      ],
    });
    fixture = TestBed.createComponent(CartFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => {
    itemCount.set(0);
    subtotalCents.set(0);
    missingCents.set(0);
    shippingIsFree.set(false);
    threshold.set(12000);
    build();
  });

  it('reste absent tant que le panier est vide', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.cart-fab')).toBeNull();
  });

  it('apparaît dès qu’un article est au panier', () => {
    itemCount.set(2);
    subtotalCents.set(8000);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.cart-fab')).not.toBeNull();
    expect(text()).toContain('2');
    expect(text()).toContain('80,00');
  });

  it('annonce ce qui manque pour la livraison offerte', () => {
    itemCount.set(2);
    subtotalCents.set(8000);
    missingCents.set(4000);
    fixture.detectChanges();

    expect(text()).toContain('plus que');
    expect(text()).toContain('40,00');
  });

  it('bascule sur la livraison offerte une fois le seuil atteint', () => {
    itemCount.set(3);
    subtotalCents.set(12000);
    shippingIsFree.set(true);
    fixture.detectChanges();

    expect(text()).toContain('livraison offerte');
    expect(text()).not.toContain('plus que');
  });

  it('mesure la progression vers le seuil', () => {
    subtotalCents.set(6000);
    expect(component.progressPercent()).toBe(50);

    subtotalCents.set(24000);
    // Au-dela du seuil la jauge reste pleine : une barre a 200 % ne veut rien
    // dire.
    expect(component.progressPercent()).toBe(100);
  });

  it('tait la franchise quand aucun seuil n’est réglé', () => {
    threshold.set(0);
    itemCount.set(1);
    subtotalCents.set(4000);
    fixture.detectChanges();

    expect(component.showsFreeShipping()).toBeFalse();
    expect(text()).not.toContain('livraison offerte');
    expect(component.progressPercent()).toBe(0);
  });

  it('se signale à l’ajout d’un article', async () => {
    itemCount.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bumping()).toBeTrue();
  });

  it('ne se signale pas quand un article est retiré', async () => {
    itemCount.set(3);
    fixture.detectChanges();
    await fixture.whenStable();
    component.bumping.set(false);

    itemCount.set(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.bumping()).toBeFalse();
  });
});
