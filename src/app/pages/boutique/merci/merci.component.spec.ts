import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MerciComponent } from './merci.component';
import { SeoService } from '../../../shared/services/seo.service';
import { CartService } from '../../../shared/services/cart.service';
import { ShopService } from '../../../shared/services/shop.service';
import { OrderConfirmation } from '../../../shared/models/shop-product.model';

describe('MerciComponent', () => {
  let component: MerciComponent;
  let fixture: ComponentFixture<MerciComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let shopServiceSpy: jasmine.SpyObj<ShopService>;

  const confirmation: OrderConfirmation = {
    reference: 'DVG-2026-0042',
    firstName: 'Maxime',
    paid: true,
    maskedEmail: 'm••••e@example.com',
    items: [
      { productName: 'Maillot 2026 Joker', size: 'L', flockingText: 'MAX', quantity: 1 },
      { productName: 'Maillot 2026 Mystic', size: 'M', flockingText: null, quantity: 2 },
    ],
    totalCents: 13500,
    currency: 'eur',
  };

  /** Monte le composant avec le `session_id` que Stripe aurait rapporte. */
  async function setup(sessionId: string | null): Promise<void> {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    cartServiceSpy = jasmine.createSpyObj('CartService', ['clear']);
    shopServiceSpy = jasmine.createSpyObj('ShopService', ['getOrderConfirmation']);
    shopServiceSpy.getOrderConfirmation.and.returnValue(of(confirmation));

    await TestBed.configureTestingModule({
      imports: [MerciComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: CartService, useValue: cartServiceSpy },
        { provide: ShopService, useValue: shopServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: (key: string) => (key === 'session_id' ? sessionId : null) } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerciComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await setup('cs_test_a1b2c3d4e5f6');
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

  it('sort la page des index', () => {
    // Page de retour de paiement, dont l'URL porte un identifiant de session.
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ noIndex: true }),
    );
  });

  it('vide le panier sur retour de Stripe', () => {
    // Sans ce vidage, le client retrouverait son panier intact apres avoir paye
    // et pourrait repayer la meme commande.
    fixture.detectChanges();
    expect(cartServiceSpy.clear).toHaveBeenCalled();
  });

  it('annonce les délais de SHOP_LEGAL, pas les siens', () => {
    // La page annoncait « une fois par semaine » et « quelques jours » quand la
    // fiche produit annoncait 25 jours ouvres : le delai engage le vendeur
    // (art. L216-1), il ne peut pas differer d'un ecran a l'autre.
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain(component.shippingDelay);
    expect(text).toContain(component.carrierDelay);
    expect(text).not.toContain('une fois par semaine');
  });

  it('devrait afficher un lien de retour vers la boutique', () => {
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });

  it('interroge le récapitulatif avec la session rapportée par Stripe', () => {
    fixture.detectChanges();
    expect(shopServiceSpy.getOrderConfirmation).toHaveBeenCalledWith('cs_test_a1b2c3d4e5f6');
  });

  it('salue le client par son prénom', () => {
    fixture.detectChanges();
    expect(component.greeting()).toBe('Merci Maxime');
    expect(fixture.nativeElement.textContent).toContain('Merci Maxime');
  });

  it('affiche la référence et le détail de la commande', () => {
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain('DVG-2026-0042');
    expect(text).toContain('Maillot 2026 Joker');
    expect(text).toContain('Taille L');
    expect(text).toContain('MAX');
    expect(text).toContain('135.00 €');
  });

  it('affiche l’e-mail masqué où part le reçu', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('m••••e@example.com');
  });

  describe('sans identifiant de session', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await setup(null);
    });

    it('reste presentable sans appeler l’API', () => {
      // Arrivee directe sur l'URL, ou session anterieure au parametre : le
      // message reste juste, il ne faut ni erreur ni page vide.
      fixture.detectChanges();

      expect(shopServiceSpy.getOrderConfirmation).not.toHaveBeenCalled();
      expect(component.state()).toBe('unknown');
      expect(component.greeting()).toBe('Merci pour votre commande');
      expect(fixture.nativeElement.textContent).toContain('Merci pour votre commande');
    });

    it('ne vide pas le panier sans preuve de paiement', () => {
      // `/boutique/merci` est une route publique ordinaire, atteignable par un
      // favori, l'historique ou un lien colle dans un salon. `clear()` ecrit
      // dans le `localStorage` : un panier de trois maillots avec leurs
      // flocages ne se reconstitue pas de memoire.
      fixture.detectChanges();
      expect(cartServiceSpy.clear).not.toHaveBeenCalled();
    });

    it('n’affirme pas qu’un paiement vient d’avoir lieu', () => {
      fixture.detectChanges();
      const text: string = fixture.nativeElement.textContent;

      expect(text).toContain('Si vous venez de payer');
      expect(text).not.toContain('Votre paiement a bien été pris en compte. Vous recevez');
    });
  });

  describe('quand le récapitulatif est indisponible', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await setup('cs_test_a1b2c3d4e5f6');
      shopServiceSpy.getOrderConfirmation.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
    });

    it('ne remet pas le paiement en cause, et cesse d’affirmer ce qu’elle ne sait plus', () => {
      fixture.detectChanges();

      expect(component.loading()).toBe(false);
      expect(component.confirmation()).toBeNull();
      expect(component.state()).toBe('unknown');
      expect(fixture.nativeElement.textContent).toContain('Si vous venez de payer');
    });
  });

  describe('quand le webhook Stripe n’est pas encore arrivé', () => {
    // `fakeAsync` est incompatible avec `provideZonelessChangeDetection` : sans
    // zone.js, il n'y a pas de file de taches a vider. L'horloge de Jasmine
    // remplace `setTimeout` au niveau du navigateur, ce qui suffit puisque la
    // relecture est planifiee par un `setTimeout` nu.
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await setup('cs_test_a1b2c3d4e5f6');
      jasmine.clock().install();
    });

    afterEach(() => jasmine.clock().uninstall());

    it('relit jusqu’à ce que la commande soit confirmée', () => {
      // Le client revient de Stripe avant le webhook : la commande est encore
      // PENDING a la premiere lecture, alors que l'argent est encaisse.
      shopServiceSpy.getOrderConfirmation.and.returnValues(
        of({ ...confirmation, paid: false, firstName: null, maskedEmail: null }),
        of(confirmation),
      );

      fixture.detectChanges();
      expect(component.state()).toBe('pending');
      // Tant que le webhook n'a pas confirme, la page ne promet pas de recu.
      expect(fixture.nativeElement.textContent).toContain('Stripe nous confirme');

      jasmine.clock().tick(2000);

      expect(shopServiceSpy.getOrderConfirmation).toHaveBeenCalledTimes(2);
      expect(component.state()).toBe('paid');
      expect(component.greeting()).toBe('Merci Maxime');
    });

    it('cesse de relire au bout de quelques tentatives', () => {
      // Sinon la page interrogerait l'API indefiniment sur un onglet laisse
      // ouvert, et se ferait limiter par le throttle.
      shopServiceSpy.getOrderConfirmation.and.returnValue(of({ ...confirmation, paid: false }));

      fixture.detectChanges();
      jasmine.clock().tick(60000);

      expect(shopServiceSpy.getOrderConfirmation).toHaveBeenCalledTimes(5);
    });
  });
});
