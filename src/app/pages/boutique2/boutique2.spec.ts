import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NEVER, Observable, of } from 'rxjs';
import { Boutique2Component } from './boutique2';
import { SeoService } from '../../shared/services/seo.service';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { TAX_LABEL } from '../boutique/jersey-presentation';

const joker: ShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: 'Aux couleurs de EVA Joker.',
  description: 'Polyester européen',
  priceCents: 4990,
  images: [
    { url: 'a.png', label: 'face', isBack: false },
    { url: 'b.png', label: 'dos', isBack: true },
  ],
  cardImage: 'a.png',
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  sizes: ['S', 'M', 'L'],
};
const mystic: ShopProduct = { ...joker, id: 2, slug: 'maillot-2026-mystic', name: 'Mystic' };
const dvg: ShopProduct = { ...joker, id: 3, slug: 'maillot-2026-dvg', name: 'Team Divergentes' };

describe('Boutique2Component (variante /boutique2)', () => {
  let component: Boutique2Component;
  let fixture: ComponentFixture<Boutique2Component>;
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
      freeShippingThresholdCents: signal(12000).asReadonly(),
    });
    shopServiceSpy.loadCatalog.and.returnValue(NEVER);

    await TestBed.configureTestingModule({
      imports: [Boutique2Component],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: ShopService, useValue: shopServiceSpy },
        {
          // La page embarque la pastille panier, qui lit le détail du panier.
          provide: CartService,
          useValue: {
            itemCount: itemCount.asReadonly(),
            subtotalCents: signal(0).asReadonly(),
            missingForFreeShippingCents: signal(0).asReadonly(),
            shippingIsFree: signal(false).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Boutique2Component);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('se déclare sur /boutique2 et hors index', () => {
    // La variante expose le même catalogue que /boutique : laissée indexable,
    // elle mettrait les deux URL en concurrence sur les mêmes requêtes.
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Boutique (v2)', url: '/boutique2', noIndex: true }),
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
    shopServiceSpy.loadCatalog.and.returnValue(of({ products: [], shippingStandardCents: 500,
 shippingExpressCents: 1000,
 freeShippingThresholdCents: 12000, currency: 'eur', shopEnabled: true }));
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
  });

  it('affiche la mention TTC à côté du prix de chaque déclinaison', () => {
    // Le chargement du catalogue doit se terminer pour que la liste des
    // déclinaisons (et donc les prix) apparaisse dans le DOM.
    shopServiceSpy.loadCatalog.and.returnValue(
      of({ products: [], shippingStandardCents: 500,
 shippingExpressCents: 1000,
 freeShippingThresholdCents: 12000, currency: 'eur', shopEnabled: true }),
    );
    fixture.detectChanges();
    expect(component.taxLabel).toBe(TAX_LABEL);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(TAX_LABEL);
  });

  describe('hero', () => {
    /**
     * `scrollY` est en lecture seule : on la redéfinit le temps du test plutôt
     * que de défiler pour de bon, ce qu'une page sans hauteur ne ferait pas.
     */
    function setScrollY(value: number): void {
      Object.defineProperty(window, 'scrollY', { value, configurable: true });
    }

    afterEach(() => setScrollY(0));

    /** Le bloc de titre du hero, masqué tant que la page n'a pas défilé. */
    function heroContent(): HTMLElement {
      return (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__content')!;
    }

    it('garde le titre invisible au chargement', () => {
      fixture.detectChanges();

      expect(component.titleRevealed()).toBeFalse();
      expect(heroContent().classList).not.toContain('shop-hero__content--revealed');
    });

    it('révèle le titre dès que la page défile', () => {
      fixture.detectChanges();
      setScrollY(120);

      component.onWindowScroll();
      fixture.detectChanges();

      expect(component.titleRevealed()).toBeTrue();
      expect(heroContent().classList).toContain('shop-hero__content--revealed');
    });

    it('remasque le titre au retour tout en haut', () => {
      fixture.detectChanges();
      setScrollY(120);
      component.onWindowScroll();

      setScrollY(0);
      component.onWindowScroll();

      expect(component.titleRevealed()).toBeFalse();
    });

    it('démarre la vidéo muette et la démute au clic', () => {
      fixture.detectChanges();
      const video = (fixture.nativeElement as HTMLElement).querySelector('video')!;
      expect(video.muted).toBeTrue();

      component.toggleSound();
      fixture.detectChanges();

      expect(component.soundOn()).toBeTrue();
      expect(video.muted).toBeFalse();
    });

    /** Simule l'événement `timeupdate` d'une vidéo aux capacités données. */
    function videoProgress(video: Partial<HTMLVideoElement> & Record<string, unknown>): void {
      component.onVideoProgress({ target: video } as unknown as Event);
    }

    it('retire le bouton quand la vidéo n’a pas de bande-son', () => {
      // Sinon le bouton agirait sans que rien ne change à l'oreille.
      fixture.detectChanges();

      videoProgress({ mozHasAudio: false });
      fixture.detectChanges();

      expect(component.videoHasSound()).toBeFalse();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__sound'),
      ).toBeNull();
    });

    it('garde le bouton quand une piste audio est présente', () => {
      fixture.detectChanges();

      videoProgress({ audioTracks: { length: 1 } });
      fixture.detectChanges();

      expect(component.videoHasSound()).toBeTrue();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__sound'),
      ).not.toBeNull();
    });

    it('garde le bouton sur un moteur qui ne renseigne pas l’audio', () => {
      // Chrome n'expose ni `mozHasAudio` ni `audioTracks`, et son compteur
      // d'octets décodés reste à zéro tant que la vidéo est muette : s'y fier
      // masquait le bouton même sur une vidéo sonore.
      fixture.detectChanges();

      videoProgress({ webkitAudioDecodedByteCount: 0, currentTime: 5 });

      expect(component.videoHasSound()).toBeTrue();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__sound'),
      ).not.toBeNull();
    });

    it('masque le bouton quand aucune piste audio n’est déclarée', () => {
      fixture.detectChanges();

      videoProgress({ audioTracks: { length: 0 } });
      fixture.detectChanges();

      expect(component.videoHasSound()).toBeFalse();
    });

    it('coupe le son quand la vidéo se révèle muette', () => {
      fixture.detectChanges();
      component.toggleSound();

      videoProgress({ mozHasAudio: false });

      expect(component.soundOn()).toBeFalse();
    });

    it('garde le bouton quand aucune API ne renseigne sur l’audio', () => {
      fixture.detectChanges();

      videoProgress({});
      fixture.detectChanges();

      expect(component.videoHasSound()).toBeTrue();
    });

    it('garde le bouton hors de l’écran tant que rien ne bouge', () => {
      // Le bouton existe dans le DOM — il reste atteignable au clavier — mais
      // ne se montre qu'à la demande.
      fixture.detectChanges();

      expect(component.controlsVisible()).toBeFalse();
      expect(component.soundButtonVisible()).toBeFalse();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__sound--visible'),
      ).toBeNull();
    });

    it('révèle le bouton au mouvement du pointeur sur le hero', () => {
      fixture.detectChanges();
      const hero = (fixture.nativeElement as HTMLElement).querySelector('.shop-hero')!;

      hero.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
      fixture.detectChanges();

      expect(component.soundButtonVisible()).toBeTrue();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.shop-hero__sound--visible'),
      ).not.toBeNull();
    });

    it('révèle le bouton au focus clavier, sans pointeur', () => {
      fixture.detectChanges();
      const hero = (fixture.nativeElement as HTMLElement).querySelector('.shop-hero')!;

      hero.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      fixture.detectChanges();

      expect(component.soundButtonVisible()).toBeTrue();
    });

    it('garde le bouton caché quand le hero n’est plus à l’écran', () => {
      fixture.detectChanges();
      const hero = (fixture.nativeElement as HTMLElement).querySelector('.shop-hero')!;
      hero.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));

      component.heroVisible.set(false);

      expect(component.soundButtonVisible()).toBeFalse();
    });

    it('annonce au lecteur d’écran l’action du bouton de son', () => {
      fixture.detectChanges();
      const button = (fixture.nativeElement as HTMLElement).querySelector(
        '.shop-hero__sound',
      ) as HTMLButtonElement;

      expect(button.getAttribute('aria-label')).toBe('Activer le son de la vidéo');
      expect(button.getAttribute('aria-pressed')).toBe('false');

      button.click();
      fixture.detectChanges();

      expect(button.getAttribute('aria-label')).toBe('Couper le son de la vidéo');
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });
  });
});
