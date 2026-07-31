import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MerciComponent } from './merci.component';
import { SeoService } from '../../../shared/services/seo.service';
import { CartService } from '../../../shared/services/cart.service';

describe('MerciComponent', () => {
  let component: MerciComponent;
  let fixture: ComponentFixture<MerciComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['clear']);

    await TestBed.configureTestingModule({
      imports: [MerciComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerciComponent);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait mettre à jour les meta tags au démarrage', () => {
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Merci pour votre commande', url: '/boutique/merci' }),
    );
  });

  it('vide le panier apres un paiement accepte', () => {
    // Stripe ne redirige ici qu'apres succes : sans ce vidage, le client
    // retrouverait son panier intact et pourrait repayer la meme commande.
    fixture.detectChanges();
    expect(cartServiceSpy.clear).toHaveBeenCalled();
  });

  it('devrait afficher un lien de retour vers la boutique', () => {
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });
});
