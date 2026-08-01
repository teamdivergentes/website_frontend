import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Produit3Component } from './produit3.component';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopProduct } from '../../../shared/models/shop-product.model';
import { MICROFIBRE_NOTICE, ORIGIN, SORTING_NOTICE, TAX_LABEL } from '../../boutique/jersey-presentation';
import { SHOP_LEGAL, MISSING_MARKER } from '../../legal/legal-info';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: 'Aux couleurs de EVA Joker.',
  description: 'Polyester européen',
  priceCents: 4990,
  images: [
    { url: 'front.png', label: 'face', isBack: false },
    { url: 'back.png', label: 'dos', isBack: true },
  ],
  cardImage: 'front.png',
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: ['M', 'L'],
};

const MYSTIC: ShopProduct = {
  ...JOKER,
  id: 2,
  slug: 'maillot-2026-mystic',
  name: 'Maillot 2026 — DVG × Mystic',
};

describe('Produit3Component (variante /boutique3)', () => {
  let fixture: ComponentFixture<Produit3Component>;
  let component: Produit3Component;
  let cartService: jasmine.SpyObj<CartService>;
  let shopService: jasmine.SpyObj<ShopService>;

  const catalog = signal<ShopProduct[]>([JOKER, MYSTIC]);
  const cartSubtotal = signal(0);
  const cartMissing = signal(0);
  const cartFreeShipping = signal(false);
  const freeShippingThreshold = signal(12000);
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const build = (product: ShopProduct | null = JOKER) => {
    TestBed.resetTestingModule();
    catalog.set([JOKER, MYSTIC]);
    cartSubtotal.set(0);
    cartMissing.set(0);
    cartFreeShipping.set(false);
    paramMap = new BehaviorSubject(convertToParamMap({ slug: 'maillot-2026-joker' }));
    shopService = jasmine.createSpyObj<ShopService>('ShopService', ['findBySlug', 'loadCatalog'], {
      products: catalog.asReadonly(),
      shippingStandardCents: signal(500).asReadonly(),
      shippingExpressCents: signal(1000).asReadonly(),
      freeShippingThresholdCents: freeShippingThreshold.asReadonly(),
    });
    shopService.loadCatalog.and.returnValue(of({ products: [], shippingStandardCents: 500,
 shippingExpressCents: 1000,
 freeShippingThresholdCents: 12000, currency: 'eur', shopEnabled: true }));
    shopService.findBySlug.and.returnValue(
      product ? of(product) : throwError(() => new Error('404')),
    );
    // La fiche lit l'état du panier pour la franchise de port, et embarque la
    // pastille panier qui en lit davantage encore.
    cartService = jasmine.createSpyObj<CartService>('CartService', ['add'], {
      itemCount: signal(0).asReadonly(),
      subtotalCents: cartSubtotal.asReadonly(),
      missingForFreeShippingCents: cartMissing.asReadonly(),
      shippingIsFree: cartFreeShipping.asReadonly(),
    });

    TestBed.configureTestingModule({
      imports: [Produit3Component],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ShopService, useValue: shopService },
        { provide: CartService, useValue: cartService },
        { provide: SeoService, useValue: { updateMetaTags: jasmine.createSpy() } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap.asObservable(),
            snapshot: { paramMap: convertToParamMap({ slug: 'maillot-2026-joker' }) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(Produit3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => build());

  it('charge le produit et présélectionne la première taille', () => {
    expect(component.product()).toEqual(JOKER);
    expect(component.selectedSize()).toBe('M');
    expect(component.loading()).toBeFalse();
  });

  it('affiche un message si le produit est introuvable', () => {
    build(null);
    expect(component.error()).toBeDefined();
  });

  describe('changement de déclinaison', () => {
    it('recharge la fiche quand le slug change sans quitter la route', () => {
      shopService.findBySlug.and.returnValue(of(MYSTIC));
      paramMap.next(convertToParamMap({ slug: 'maillot-2026-mystic' }));

      expect(shopService.findBySlug).toHaveBeenCalledWith('maillot-2026-mystic');
      expect(component.product()).toEqual(MYSTIC);
      expect(component.displayName()).toBe('Maillot 2026 Mystic');
    });

    it('repart d’une sélection vierge sur la nouvelle déclinaison', () => {
      component.selectSize('L');
      component.changeQuantity(2);
      component.toggleFlocking(true);
      component.flockingText.set('Snake');

      shopService.findBySlug.and.returnValue(of({ ...MYSTIC, sizes: ['M', 'L'] }));
      paramMap.next(convertToParamMap({ slug: 'maillot-2026-mystic' }));

      expect(component.selectedSize()).toBe('M');
      expect(component.quantity()).toBe(1);
      expect(component.flockingEnabled()).toBeFalse();
      expect(component.flockingText()).toBe('');
      expect(component.viewingBack()).toBeFalse();
    });
  });

  describe('présentation', () => {
    it('compose la référence et met le nom d’équipe en accent', () => {
      expect(component.reference()).toBe('DVG26 / JOK');
      expect(component.heading()).toEqual({ lead: 'Maillot 2026', accent: 'Joker' });
      expect(component.displayName()).toBe('Maillot 2026 Joker');
    });

    it('affiche la galerie du produit, dans son ordre', () => {
      expect(component.views().map((v) => v.label)).toEqual(['face', 'dos']);

      build({ ...JOKER, images: [{ url: 'front.png', label: 'face', isBack: false }] });
      expect(component.views().map((v) => v.label)).toEqual(['face']);
    });

    it('accepte un nombre libre de vues', () => {
      build({
        ...JOKER,
        images: [
          { url: 'front.png', label: 'face', isBack: false },
          { url: 'back.png', label: 'dos', isBack: true },
          { url: 'porte.jpg', label: 'porté', isBack: false },
          { url: 'detail.jpg', label: 'détail col', isBack: false },
        ],
      });

      expect(component.views().map((v) => v.label)).toEqual([
        'face',
        'dos',
        'porté',
        'détail col',
      ]);
    });

    it('change de vue depuis le rail', () => {
      component.selectView(1);
      expect(component.viewingBack()).toBeTrue();
      expect(component.currentViewLabel()).toBe('dos');
      expect(component.currentImage()).toBe('back.png');
    });

    it('ouvre la fiche sur la première vue de la galerie', () => {
      expect(component.currentImage()).toBe('front.png');
      expect(component.viewingBack()).toBeFalse();
    });

    it('se replie sur la première vue quand le rang courant sort des bornes', () => {
      // La galerie peut rétrécir d'un chargement à l'autre : un rang orphelin
      // laisserait un cadre vide au lieu d'un visuel.
      component.selectView(1);
      build({ ...JOKER, images: [{ url: 'front.png', label: 'face', isBack: false }] });

      expect(component.currentImage()).toBe('front.png');
    });

    it('ne montre aucun visuel sur un produit sans galerie, sans planter', () => {
      build({ ...JOKER, images: [], cardImage: null });

      expect(component.views()).toEqual([]);
      expect(component.currentImage()).toBeNull();
      expect(component.currentViewLabel()).toBe('');
    });

    it('limite le guide des mesures aux tailles en vente', () => {
      expect(component.sizeGuide().map((row) => row.size)).toEqual(['M', 'L']);
    });

    it('expose la composition et les consignes d’entretien', () => {
      // Le detail du contenu vit dans jersey-presentation ; ce qui compte ici
      // est que la fiche les expose bien aux volets.
      expect(component.compositionNotes.length).toBeGreaterThan(0);
      expect(component.careInstructions.length).toBeGreaterThan(0);
      expect(component.compositionNotes.join(' ')).toContain('135 g/m²');
    });

    it('propose les autres déclinaisons du catalogue, sans le produit courant', () => {
      expect(component.otherJerseys().map((o) => o.slug)).toEqual(['maillot-2026-mystic']);
      expect(component.otherJerseys()[0].accent).toBe('Mystic');
    });
  });

  describe('prix', () => {
    it('affiche le prix nu sans flocage', () => {
      expect(component.unitPriceCents()).toBe(4990);
    });

    it('ajoute le surcoût quand un flocage non vide est saisi', () => {
      component.toggleFlocking(true);
      component.flockingText.set('Snake');

      expect(component.unitPriceCents()).toBe(4990 + 500);
    });

    it('ne facture pas le flocage si le champ reste vide', () => {
      component.toggleFlocking(true);
      component.flockingText.set('   ');

      expect(component.effectiveFlocking()).toBeNull();
      expect(component.unitPriceCents()).toBe(4990);
    });

    it('multiplie par la quantité', () => {
      component.changeQuantity(2);
      expect(component.totalCents()).toBe(4990 * 3);
    });

    it('borne la quantité entre 1 et 10', () => {
      component.changeQuantity(-5);
      expect(component.quantity()).toBe(1);

      for (let i = 0; i < 20; i++) {
        component.changeQuantity(1);
      }
      expect(component.quantity()).toBe(10);
    });
  });

  describe('validation du flocage', () => {
    beforeEach(() => component.toggleFlocking(true));

    it('accepte un pseudo simple', () => {
      component.flockingText.set('Snake_01');
      expect(component.flockingError()).toBeUndefined();
    });

    it('refuse un pseudo trop long', () => {
      component.flockingText.set('BeaucoupTropLong');
      expect(component.flockingError()).toBeDefined();
    });

    it('refuse les caractères hostiles', () => {
      component.flockingText.set('<script>');
      expect(component.flockingError()).toBeDefined();
    });

    it('empêche l’ajout au panier tant que la saisie est invalide', () => {
      component.flockingText.set('<script>');
      expect(component.canAdd()).toBeFalse();

      component.addToCart();
      expect(cartService.add).not.toHaveBeenCalled();
    });

    it('bascule sur la vue de dos à l’activation du flocage', () => {
      expect(component.viewingBack()).toBeTrue();
    });

    it('vise la première vue de dos quand la galerie en compte plusieurs', () => {
      build({
        ...JOKER,
        images: [
          { url: 'front.png', label: 'face', isBack: false },
          { url: 'porte.jpg', label: 'porté', isBack: false },
          { url: 'back.png', label: 'dos', isBack: true },
          { url: 'back-2.png', label: 'dos, gros plan', isBack: true },
        ],
      });

      component.toggleFlocking(true);

      expect(component.currentImage()).toBe('back.png');
    });

    it('reste sur la vue courante quand aucune vue de dos n’existe', () => {
      // Sans dos livré, forcer un changement de vue afficherait la face en
      // laissant croire que le flocage s'y pose.
      build({ ...JOKER, images: [{ url: 'front.png', label: 'face', isBack: false }] });

      component.toggleFlocking(true);

      expect(component.currentImage()).toBe('front.png');
      expect(component.viewingBack()).toBeFalse();
    });
  });

  describe('ajout au panier', () => {
    it('transmet la ligne normalisée', () => {
      component.selectSize('L');
      component.toggleFlocking(true);
      component.flockingText.set('  Le   Snake ');
      component.changeQuantity(1);

      component.addToCart();

      expect(cartService.add).toHaveBeenCalledWith({
        productId: 1,
        size: 'L',
        quantity: 2,
        flockingText: 'Le Snake',
      });
      expect(component.added()).toBeTrue();
    });

    it('transmet un flocage nul quand l’option est désactivée', () => {
      component.addToCart();

      expect(cartService.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ flockingText: null }),
      );
    });

    it('bascule le bouton en état « ajouté » le temps du retour visuel', () => {
      expect(component.justAdded()).toBeFalse();

      component.addToCart();
      fixture.detectChanges();

      expect(component.justAdded()).toBeTrue();
      const button = (fixture.nativeElement as HTMLElement).querySelector('.produit__add')!;
      expect(button.classList).toContain('produit__add--added');
      expect(button.textContent).toContain('ajouté au panier');
    });

    it('laisse le bouton cliquable pendant le retour visuel', () => {
      // On peut vouloir un second exemplaire sans attendre la fin de
      // l'animation.
      component.addToCart();
      fixture.detectChanges();

      const button = (fixture.nativeElement as HTMLElement).querySelector(
        '.produit__add',
      ) as HTMLButtonElement;
      expect(button.disabled).toBeFalse();

      button.click();
      expect(cartService.add).toHaveBeenCalledTimes(2);
    });

    it('remet le bouton à zéro en changeant de déclinaison', () => {
      component.addToCart();
      shopService.findBySlug.and.returnValue(of(MYSTIC));

      paramMap.next(convertToParamMap({ slug: 'maillot-2026-mystic' }));

      expect(component.justAdded()).toBeFalse();
      expect(component.added()).toBeFalse();
    });
  });

  describe('franchise de port', () => {
    it('annonce le seuil quand le panier est vide', () => {
      expect(component.freeShippingNotice()).toBe('threshold');

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('livraison offerte dès');
    });

    it('annonce ce qui manque dès que le panier est entamé', () => {
      cartSubtotal.set(8000);
      cartMissing.set(4000);
      fixture.detectChanges();

      expect(component.freeShippingNotice()).toBe('missing');
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('plus que');
    });

    it('annonce la franchise acquise une fois le seuil atteint', () => {
      cartSubtotal.set(12000);
      cartFreeShipping.set(true);
      fixture.detectChanges();

      expect(component.freeShippingNotice()).toBe('reached');
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('livraison offerte sur votre panier');
    });

    it('ne dit rien quand aucun seuil n’est réglé', () => {
      // Sans franchise, « plus que X € » n'aurait aucun sens.
      freeShippingThreshold.set(0);
      build();

      expect(component.freeShippingNotice()).toBe('none');
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('livraison offerte');

      freeShippingThreshold.set(12000);
    });
  });

  describe('mentions légales', () => {
    it('affiche la mention TTC à côté du prix et du total', () => {
      expect(component.taxLabel).toBe(TAX_LABEL);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(TAX_LABEL);
    });

    /**
     * Le délai doit être annoncé avant l'achat (art. L216-1) et provenir
     * exclusivement de `SHOP_LEGAL` : c'est un engagement contractuel, aucune
     * vue n'a le droit d'en fabriquer un de son côté. Tant qu'une valeur est
     * absente, le marqueur doit rester visible plutôt qu'une durée inventée.
     */
    it('affiche un délai de livraison avant l’achat, repris de SHOP_LEGAL', () => {
      const { shippingDelayBusinessDays, carrierDelayBusinessDays } = SHOP_LEGAL;
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

      expect(text).toContain(component.shippingDelay);

      if (shippingDelayBusinessDays === null || carrierDelayBusinessDays === null) {
        expect(component.shippingDelay).toContain(MISSING_MARKER);
        return;
      }
      expect(component.shippingDelay).toContain(`${shippingDelayBusinessDays} jours ouvrés`);
      expect(component.shippingDelay).toContain(`${carrierDelayBusinessDays} jours ouvrés`);
      expect(component.shippingDelay).not.toContain(MISSING_MARKER);
    });

    it('affiche les mentions environnementales imposées par la loi AGEC', () => {
      expect(component.microfibreNotice).toBe(MICROFIBRE_NOTICE);
      expect(component.sortingNotice).toBe(SORTING_NOTICE);

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(MICROFIBRE_NOTICE);
      expect(text).toContain(SORTING_NOTICE);
    });

    /**
     * Garde-fou contre une régression coûteuse : le fabricant produit en
     * Lettonie, pas en France. Une allégation d'origine inexacte est une
     * pratique commerciale trompeuse (art. L121-4 C. conso), sanctionnée bien
     * plus lourdement qu'une mention oubliée.
     */
    it('n’annonce jamais une fabrication française', () => {
      expect(ORIGIN).toBe('matières et fabrication européennes');
      expect(ORIGIN.toLowerCase()).not.toContain('france');

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain(ORIGIN);
      expect(text).not.toContain('floqué en France');
    });
  });
});
