import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { PanierComponent } from './panier.component';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService, CartLineView } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { ShopProduct } from '../../../shared/models/shop-product.model';
import { SHOP_LEGAL, MISSING_MARKER } from '../../legal/legal-info';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: null,
  description: null,
  priceCents: 4990,
  listPriceCents: null,
  images: [
    { url: 'front.png', label: 'face', isBack: false },
    { url: 'back.png', label: 'dos', isBack: true },
  ],
  cardImage: 'front.png',
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: [{ label: 'M', inStock: true }],
  soldOut: false,
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
  // Lignes brutes du localStorage, indépendantes du catalogue : c'est sur elles
  // que le panier distingue « vide » de « catalogue en panne ».
  const rawLines = signal([{ productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' }]);
  const subtotalCents = signal(10980);
  const shippingCents = signal(590);
  const totalCents = signal(11570);
  const shippingIsFree = signal(false);
  const missingForFreeShippingCents = signal(1020);
  const freeShippingThreshold = signal(12000);
  const permissions = signal<string[]>([]);
  const discountCode = signal<string | null>(null);
  const discountCents = signal(0);
  const products = signal<ShopProduct[]>([JOKER]);

  const build = (catalogFails = false) => {
    TestBed.resetTestingModule();
    permissions.set([]);
    discountCode.set(null);
    discountCents.set(0);
    products.set([JOKER]);
    shopService = jasmine.createSpyObj<ShopService>(
      'ShopService',
      ['loadCatalog', 'createCheckout', 'createRetailCheckout'],
      {
        shippingStandardCents: signal(500).asReadonly(),
        freeShippingThresholdCents: freeShippingThreshold.asReadonly(),
        products: products.asReadonly(),
      },
    );
    shopService.loadCatalog.and.returnValue(
      catalogFails ? throwError(() => new Error('down')) : of({ products: [], shippingStandardCents: 500,
 freeShippingThresholdCents: 12000, currency: 'eur', shopEnabled: true }),
    );
    shopService.createCheckout.and.returnValue(of({ url: 'https://stripe/cs_1' }));
    // NEVER : la redirection vers Stripe ne doit pas se produire pendant un test.
    shopService.createRetailCheckout.and.returnValue(NEVER);

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
            lines: rawLines,
            subtotalCents,
            shippingCents,
            totalCents,
            shippingIsFree,
            missingForFreeShippingCents,
            updateQuantity: jasmine.createSpy('updateQuantity'),
            remove: jasmine.createSpy('remove'),
            // Bon de réduction. `revalidateDiscount` rend `null` par défaut :
            // aucun code retenu, donc rien à signaler au retour du client.
            discountCode: discountCode.asReadonly(),
            discountCents: discountCents.asReadonly(),
            applyDiscount: jasmine.createSpy('applyDiscount').and.resolveTo(undefined),
            removeDiscount: jasmine.createSpy('removeDiscount'),
            revalidateDiscount: jasmine.createSpy('revalidateDiscount').and.resolveTo(null),
            toPayload: jasmine
              .createSpy('toPayload')
              .and.callFake((code?: string | null) => ({
                items: detailedLines().map((line) => ({
                  productId: line.productId,
                  size: line.size,
                  quantity: line.quantity,
                  ...(line.flockingText ? { flockingText: line.flockingText } : {}),
                })),
                ...(code ? { discountCode: code } : {}),
              })),
          },
        },
        { provide: SeoService, useValue: { updateMetaTags: jasmine.createSpy() } },
        // Le bouton de commande au tarif réservé lit les permissions du compte.
        // Sans permission par défaut : c'est le cas de l'immense majorité des
        // visiteurs, et celui dans lequel les autres tests doivent s'exécuter.
        { provide: AuthService, useValue: { permissions: permissions.asReadonly() } },
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
    expect(component.catalogError()).toBeDefined();
  });

  describe('erreur de chargement du catalogue', () => {
    it('distingue l’erreur de chargement d’un panier vide, articles conservés', () => {
      build(true);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('Votre panier est vide');
      expect(text).toContain(component.catalogError());
      expect(text).toContain('conservés');
    });

    it('permet de réessayer sans recharger la page', () => {
      build(true);
      shopService.loadCatalog.and.returnValue(
        of({
          products: [],
          shippingStandardCents: 500,
          freeShippingThresholdCents: 12000,
          currency: 'eur',
          shopEnabled: true,
        }),
      );

      component.retryLoadCatalog();

      expect(component.catalogError()).toBeUndefined();
      expect(component.loading()).toBeFalse();
    });
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
      expect(delay.textContent).toContain(SHOP_LEGAL.shippingZoneLabel);
      expect(delay.textContent).not.toContain('France métropolitaine');
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
        expect(component.shippingDelay).toContain(MISSING_MARKER);
        expect(delay.textContent).toContain(MISSING_MARKER);
        return;
      }
      expect(component.shippingDelay).toContain(`${shippingDelayBusinessDays} jours ouvrés`);
      expect(component.carrierDelay).toContain(`${carrierDelayBusinessDays} jours ouvrés`);
      expect(delay.textContent).toContain(`${shippingDelayBusinessDays} jours ouvrés`);
      expect(delay.textContent).not.toContain(MISSING_MARKER);
    });
  });

  describe('affichage du surcoût de flocage', () => {
    // Retour utilisateur du 2026-08-12 : la virgule décimale d'un montant
    // rond (« + 5,00 € ») n'apporte rien et doit disparaître.
    it('affiche un montant rond sans décimales', () => {
      const fee = (fixture.nativeElement as HTMLElement).querySelector('.panier__line-fee');
      expect(fee?.textContent?.trim()).toBe('(+ 5 €)');
    });

    it('garde les décimales quand le montant n’est pas rond', () => {
      detailedLines.set([{ ...LINE, flockingFeeCents: 550 }]);
      fixture.detectChanges();

      const fee = (fixture.nativeElement as HTMLElement).querySelector('.panier__line-fee');
      expect(fee?.textContent?.trim()).toBe('(+ 5,50 €)');
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

    it('affiche un refus de stock ligne par ligne, sans vider le panier', () => {
      shopService.createCheckout.and.returnValue(
        throwError(() => ({
          status: 409,
          error: {
            code: 'OUT_OF_STOCK',
            items: [{ productId: 1, sizeId: 1, size: 'M', requested: 2, available: 1 }],
          },
        })),
      );
      component.termsAccepted.set(true);

      component.checkout();
      fixture.detectChanges();

      expect(component.hasStockErrors()).toBeTrue();
      expect(component.stockErrorLines()).toEqual([
        { productName: JOKER.name, size: 'M', requested: 2, available: 1 },
      ]);
      // Le panier n'est jamais vidé sur ce refus.
      expect(detailedLines()).toEqual([LINE]);
      // Ni traité comme un échec de paiement générique.
      expect(component.error()).toBeUndefined();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('demandé 2, disponible 1');
    });

    it('efface le refus de stock quand la quantité est ajustée', () => {
      shopService.createCheckout.and.returnValue(
        throwError(() => ({
          status: 409,
          error: {
            code: 'OUT_OF_STOCK',
            items: [{ productId: 1, sizeId: 1, size: 'M', requested: 2, available: 1 }],
          },
        })),
      );
      component.termsAccepted.set(true);
      component.checkout();
      expect(component.hasStockErrors()).toBeTrue();

      component.updateQuantity(0, 1);

      expect(component.hasStockErrors()).toBeFalse();
    });

    it('reprend le message métier du serveur sur un 400', () => {
      shopService.createCheckout.and.returnValue(
        throwError(() => ({ status: 400, error: { message: 'Taille indisponible' } })),
      );
      component.termsAccepted.set(true);

      component.checkout();

      expect(component.error()).toContain('Taille indisponible');
      expect(component.submitting()).toBeFalse();
    });

    it('ne montre jamais un tableau de messages de validation', () => {
      // Le `ValidationPipe` renvoie les messages de DTO en vrac : illisibles.
      shopService.createCheckout.and.returnValue(
        throwError(() => ({ status: 400, error: { message: ['Panier vide', 'Taille invalide'] } })),
      );
      component.termsAccepted.set(true);

      component.checkout();

      expect(component.error()).not.toContain('Panier vide');
      expect(component.error()).toContain('momentanément indisponible');
    });

    it('ne montre jamais le message technique d’un throttle', () => {
      // Constate en recette : « ThrottlerException: Too Many Requests »
      // s'affichait tel quel sous le bouton de paiement.
      shopService.createCheckout.and.returnValue(
        throwError(() => ({
          status: 429,
          error: { message: 'ThrottlerException: Too Many Requests' },
        })),
      );
      component.termsAccepted.set(true);

      component.checkout();

      expect(component.error()).not.toContain('Throttler');
      expect(component.error()).toContain('Trop de tentatives');
    });

    it('dit toujours qu’aucun paiement n’a été lancé', () => {
      // C'est la seule question que se pose un acheteur dont le paiement
      // vient d'echouer.
      for (const status of [0, 400, 429, 500]) {
        shopService.createCheckout.and.returnValue(
          throwError(() => ({ status, error: { message: 'peu importe' } })),
        );
        component.termsAccepted.set(true);
        component.checkout();

        expect(component.error()?.toLowerCase()).toContain("aucun paiement n'a été lancé");
      }
    });
  });

  describe('franchise de port', () => {
    const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    it('met en avant ce qui manque pour la livraison offerte', () => {
      expect(text()).toContain('plus que');
      // Le séparateur décimal suit la locale du navigateur de test, qui n'est
      // pas celle de l'application : on vérifie le montant, pas sa ponctuation.
      expect(text()).toMatch(/10[.,]20/);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.panier__freeship'),
      ).not.toBeNull();
    });

    it('annonce la franchise acquise une fois le seuil atteint', () => {
      shippingIsFree.set(true);
      missingForFreeShippingCents.set(0);
      fixture.detectChanges();

      expect(text()).toContain('livraison offerte');
      expect(text()).not.toContain('plus que');

      shippingIsFree.set(false);
      missingForFreeShippingCents.set(1020);
    });

    it('mesure la progression vers le seuil', () => {
      // 109,80 € de sous-total pour un seuil a 120 €.
      expect(component.freeShippingPercent()).toBe(92);
    });

    it('plafonne la jauge au seuil', () => {
      subtotalCents.set(30000);
      expect(component.freeShippingPercent()).toBe(100);
      subtotalCents.set(10980);
    });

    it('tait la franchise quand aucun seuil n’est réglé', () => {
      // Sans franchise, « plus que X € » n'aurait aucun sens.
      freeShippingThreshold.set(0);
      build();

      expect(component.showsFreeShipping()).toBeFalse();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.panier__freeship'),
      ).toBeNull();

      freeShippingThreshold.set(12000);
    });
  });

  describe('commande au tarif réservé', () => {
    // Le bouton n'est qu'un raccourci d'appel : l'autorisation vit côté
    // serveur, qui refuse la route à qui ne porte pas la permission et y déduit
    // le barème du jeton. Ces tests portent sur ce que le client envoie, jamais
    // sur ce qu'il aurait le droit de faire.

    it('ne propose rien à un visiteur ordinaire', () => {
      expect(component.canBuyAtRetail()).toBe(false);
    });

    it('propose le tarif au porteur de la permission', () => {
      permissions.set(['boutique:retail']);
      expect(component.canBuyAtRetail()).toBe(true);
    });

    it('ne le propose pas sur une permission voisine', () => {
      // Administrer le catalogue ne donne pas droit au tarif.
      permissions.set(['boutique:read', 'boutique:write', 'commandes:write']);
      expect(component.canBuyAtRetail()).toBe(false);
    });

    it('emporte TOUTES les lignes du panier, pas seulement la première', () => {
      // C'est la raison d'être du déplacement depuis la fiche produit : le
      // tarif réservé sert aux commandes groupées.
      const second: CartLineView = {
        ...LINE,
        productId: 2,
        size: 'L',
        quantity: 3,
        flockingText: null,
        lineTotalCents: 14970,
      };
      detailedLines.set([LINE, second]);
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(true);
      component.checkoutAtRetail();

      const payload = shopService.createRetailCheckout.calls.mostRecent().args[0];
      expect(payload.items).toEqual([
        { productId: 1, size: 'M', quantity: 2, flockingText: 'Snake' },
        { productId: 2, size: 'L', quantity: 3 },
      ]);
    });

    it('n’envoie aucun montant ni indicateur de tarif', () => {
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(true);
      component.checkoutAtRetail();

      const payload = shopService.createRetailCheckout.calls.mostRecent().args[0];
      expect(Object.keys(payload)).toEqual(['items']);
    });

    it('exige les CGV, comme le paiement normal', () => {
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(false);
      component.checkoutAtRetail();

      expect(shopService.createRetailCheckout).not.toHaveBeenCalled();
    });

    it('ne part pas sur un panier vide', () => {
      detailedLines.set([]);
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(true);
      component.checkoutAtRetail();

      expect(shopService.createRetailCheckout).not.toHaveBeenCalled();
    });

    it('n’ouvre pas deux sessions sur un double clic', () => {
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(true);
      component.checkoutAtRetail();
      component.checkoutAtRetail();

      expect(shopService.createRetailCheckout).toHaveBeenCalledTimes(1);
    });

    it('n’emprunte pas la route publique', () => {
      permissions.set(['boutique:retail']);
      component.termsAccepted.set(true);
      component.checkoutAtRetail();

      expect(shopService.createCheckout).not.toHaveBeenCalled();
    });
  });
});
