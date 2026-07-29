import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProduitComponent } from './produit.component';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { ShopProduct } from '../../../shared/models/shop-product.model';
import { MICROFIBRE_NOTICE, ORIGIN, SORTING_NOTICE, TAX_LABEL } from '../jersey-presentation';
import { SHOP_LEGAL, MISSING_MARKER } from '../../legal/legal-info';

const JOKER: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: 'Aux couleurs de EVA Joker.',
  description: 'Polyester européen',
  priceCents: 4990,
  imageFront: 'front.png',
  imageBack: 'back.png',
  imageCard: null,
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

describe('ProduitComponent', () => {
  let fixture: ComponentFixture<ProduitComponent>;
  let component: ProduitComponent;
  let cartService: jasmine.SpyObj<CartService>;
  let shopService: jasmine.SpyObj<ShopService>;

  const catalog = signal<ShopProduct[]>([JOKER, MYSTIC]);
  let paramMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const build = (product: ShopProduct | null = JOKER) => {
    TestBed.resetTestingModule();
    catalog.set([JOKER, MYSTIC]);
    paramMap = new BehaviorSubject(convertToParamMap({ slug: 'maillot-2026-joker' }));
    shopService = jasmine.createSpyObj<ShopService>('ShopService', ['findBySlug', 'loadCatalog'], {
      products: catalog.asReadonly(),
      shippingFeeCents: signal(590).asReadonly(),
    });
    shopService.loadCatalog.and.returnValue(of({ products: [], shippingFeeCents: 590, currency: 'eur', shopEnabled: true }));
    shopService.findBySlug.and.returnValue(
      product ? of(product) : throwError(() => new Error('404')),
    );
    cartService = jasmine.createSpyObj<CartService>('CartService', ['add']);

    TestBed.configureTestingModule({
      imports: [ProduitComponent],
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

    fixture = TestBed.createComponent(ProduitComponent);
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

    it('n’expose que les vues réellement livrées', () => {
      expect(component.views().map((v) => v.key)).toEqual(['face', 'dos']);

      build({ ...JOKER, imageBack: null });
      expect(component.views().map((v) => v.key)).toEqual(['face']);
    });

    it('change de vue depuis le rail', () => {
      component.selectView(component.views()[1]);
      expect(component.viewingBack()).toBeTrue();
      expect(component.currentViewLabel()).toBe('dos');
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
