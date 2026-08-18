import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { SeoService } from '../../shared/services/seo.service';
import { CartFabComponent } from '../boutique/cart-fab/cart-fab.component';
import { PriceComponent } from '../../shared/components/price/price.component';
import {
  MATERIAL,
  ORIGIN,
  TAX_LABEL,
  WEIGHT,
  asLabel,
  metaFor,
  reference,
  splitTitle,
} from '../boutique/jersey-presentation';

/**
 * Une déclinaison telle que la colonne la présente : le produit du catalogue,
 * plus ce dont la mise en page a besoin (référence d'atelier, découpe du titre
 * pour l'accent vert).
 */
export interface JerseyPanel {
  product: ShopProduct;
  reference: string;
  /** Le nom, jusqu'au dernier séparateur inclus. */
  titleLead: string;
  /** Ce qui suit le dernier séparateur : le nom d'équipe, mis en accent. */
  titleAccent: string;
  eyebrow: string;
  /** Le laïus du maillot, saisi en admin. */
  story: string | null;
  /** Ce qui distingue la déclinaison : tailles, flocage. */
  meta: string[];
}

@Component({
  selector: 'app-shop-v3',
  standalone: true,
  imports: [CartFabComponent, DecimalPipe, PriceComponent, RouterLink],
  templateUrl: './boutique3.html',
  styleUrls: ['./boutique3.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Boutique3Component implements OnInit, AfterViewInit {
  private readonly seoService = inject(SeoService);
  private readonly shopService = inject(ShopService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly products = this.shopService.products;
  readonly shopEnabled = this.shopService.shopEnabled;
  readonly cartCount = this.cartService.itemCount;
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  /** Même libellé « TTC » que sur la fiche produit (art. L112-1 C. conso). */
  readonly taxLabel = TAX_LABEL;

  /**
   * Le catalogue est présenté comme un portant : une colonne par déclinaison,
   * dans l'ordre `position` piloté depuis l'admin. Pas de produit « mis en
   * avant » : les maillots ont tous le même statut, donc la même largeur.
   */
  readonly jerseys = computed<JerseyPanel[]>(() =>
    this.products().map((product) => {
      const { lead, accent } = splitTitle(product.name);

      return {
        product,
        reference: reference(product),
        titleLead: lead,
        titleAccent: accent,
        eyebrow: product.shortDescription ? asLabel(product.shortDescription) : 'collection 2026',
        story: product.description,
        meta: metaFor(product),
      };
    }),
  );

  /**
   * Le titre du hero compte les déclinaisons réellement en ligne : le catalogue
   * n'expose que les maillots actifs, et annoncer « trois équipes » alors qu'un
   * seul est publié serait faux.
   */
  private static readonly COUNT_WORDS = ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six'];

  readonly heroCount = computed(() => {
    const total = this.products().length;
    const word = Boutique3Component.COUNT_WORDS[total];

    if (!word) {
      return { accent: 'toutes nos', noun: 'équipes' };
    }
    return { accent: word, noun: total === 1 ? 'équipe' : 'équipes' };
  });

  /**
   * Le hero s'ouvre sur la seule vidéo : le titre est absent de l'écran de
   * chargement et se révèle au premier défilement. Le seuil est bas — il s'agit
   * de répondre à l'intention de descendre, pas de faire attendre.
   */
  private static readonly TITLE_REVEAL_PX = 24;

  readonly titleRevealed = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.titleRevealed.set(window.scrollY > Boutique3Component.TITLE_REVEAL_PX);
  }

  /**
   * La vidéo démarre muette : Chrome refuse l'autoplay sonore, et un son qui
   * part seul à l'ouverture d'une page se subit plus qu'il ne s'écoute. Le
   * bouton le rend disponible à qui le veut.
   */
  readonly soundOn = signal(false);

  /**
   * Optimiste par défaut : le bouton s'affiche, puis disparaît si la lecture
   * révèle une vidéo sans bande-son. Une vidéo muette rendrait le bouton
   * mensonger, il agirait sans que rien ne change à l'oreille.
   */
  readonly videoHasSound = signal(true);

  private soundTrackChecked = false;

  /**
   * On ne masque le bouton que sur une réponse négative certaine.
   *
   * Firefox expose `mozHasAudio`, Safari `audioTracks` ; Chrome n'expose ni
   * l'un ni l'autre. Son `webkitAudioDecodedByteCount` reste à zéro tant que la
   * vidéo est muette — il ne décode pas ce qu'il ne joue pas — il ne distingue
   * donc pas une vidéo sans bande-son d'une vidéo qu'on n'a pas encore
   * démutée, et s'en servir masquait le bouton sur toutes les vidéos.
   *
   * Le repli assume donc un bouton parfois inopérant plutôt qu'un bouton
   * absent alors que la vidéo a du son.
   */
  onVideoProgress(event: Event): void {
    if (this.soundTrackChecked) {
      return;
    }

    const video = event.target as HTMLVideoElement & {
      mozHasAudio?: boolean;
      audioTracks?: { length: number };
    };

    if (typeof video.mozHasAudio === 'boolean') {
      this.settleSoundTrack(video.mozHasAudio);
      return;
    }
    if (video.audioTracks) {
      this.settleSoundTrack(video.audioTracks.length > 0);
    }
  }

  private settleSoundTrack(hasSound: boolean): void {
    this.soundTrackChecked = true;
    this.videoHasSound.set(hasSound);
    if (!hasSound) {
      this.soundOn.set(false);
    }
  }

  toggleSound(): void {
    this.soundOn.update((on) => !on);
  }

  // ----------------------------------------------------------------
  // Commande de son : visible à la demande, sur une vidéo qui joue
  // ----------------------------------------------------------------

  /** Le hero, pour l'observer et écouter les mouvements qui s'y produisent. */
  private readonly heroRef = viewChild<ElementRef<HTMLElement>>('hero');

  /** Le lecteur, mis en pause dès qu'il sort de l'écran. */
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');

  /** Vrai quand le hero est à l'écran. */
  readonly heroVisible = signal(true);

  /** Vrai le temps que dure l'attention : un mouvement, puis un délai. */
  readonly controlsVisible = signal(false);

  /** Le bouton n'apparaît que sur une vidéo qui joue et qu'on regarde. */
  readonly soundButtonVisible = computed(
    () => this.videoHasSound() && this.heroVisible() && this.controlsVisible(),
  );

  private static readonly CONTROLS_HIDE_MS = 2200;

  private hideControlsTimer?: ReturnType<typeof setTimeout>;

  // ----------------------------------------------------------------
  // Mode immersif : la page s'efface autour de la vidéo
  //
  // Même geste que la commande de son, poussé d'un cran : quand le pointeur
  // s'immobilise sur le hero, l'en-tête remonte et le curseur disparaît, comme
  // dans un lecteur vidéo. Tout revient au premier mouvement.
  // ----------------------------------------------------------------

  /**
   * Le délai est plus long que celui du bouton de son : effacer la navigation
   * est un geste plus fort que masquer une commande, il ne doit pas se
   * déclencher sur une main qui hésite.
   */
  private static readonly IMMERSIVE_DELAY_MS = 3000;

  /**
   * L'en-tête vit dans `MainLayout`, hors de ce composant : on ne peut pas
   * l'atteindre par une feuille de style encapsulée. La bascule passe donc par
   * une classe sur `<body>`, à laquelle `styles.scss` répond. Elle n'est posée
   * que par cette page et retirée à sa destruction.
   */
  private static readonly IMMERSIVE_CLASS = 'shop-immersive';

  /**
   * Posée tant que la page vit, elle porte les transitions du mode immersif.
   * Séparée de l'état parce qu'une transition qui disparaît avec la classe
   * qu'elle anime ne joue qu'à l'aller : le retour se ferait d'un coup.
   */
  private static readonly VIDEO_PAGE_CLASS = 'shop-video-page';

  private readonly document = inject(DOCUMENT);

  /** Vrai quand la page est effacée autour de la vidéo. */
  readonly immersive = signal(false);

  private immersiveTimer?: ReturnType<typeof setTimeout>;

  /**
   * Le compte à rebours ne s'arme qu'après un premier geste. Sans cela, une
   * page ouverte et laissée telle quelle escamoterait sa navigation trois
   * secondes après le chargement, sans que personne ait rien demandé.
   */
  private pointerSeen = false;

  /**
   * Écouteurs posés à la main plutôt qu'en liaison de template : un
   * `(pointermove)` marquerait le composant à vérifier à chaque pixel parcouru.
   * Ici les signaux ne changent qu'aux transitions, le reste n'est qu'un timer
   * réarmé.
   */
  private watchHeroActivity(): void {
    const hero = this.heroRef()?.nativeElement;
    if (!hero || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.document.body.classList.add(Boutique3Component.VIDEO_PAGE_CLASS);

    const reveal = () => this.revealControls();
    hero.addEventListener('pointermove', reveal, { passive: true });
    hero.addEventListener('pointerdown', reveal, { passive: true });
    // Le clavier n'émet aucun pointeur : sans cela le bouton resterait
    // invisible pour qui navigue au Tab.
    hero.addEventListener('focusin', reveal);

    // Ces trois-là sont posés sur le document et non sur le hero : une touche
    // frappée ou un focus pris n'importe où doit ramener la navigation, sinon
    // un utilisateur au clavier se retrouve à naviguer dans une page dont
    // l'en-tête est invisible.
    const doc = this.document;
    doc.addEventListener('keydown', reveal);
    doc.addEventListener('focusin', reveal);
    doc.addEventListener('scroll', reveal, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => this.onHeroVisibility(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(hero);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      hero.removeEventListener('pointermove', reveal);
      hero.removeEventListener('pointerdown', reveal);
      hero.removeEventListener('focusin', reveal);
      doc.removeEventListener('keydown', reveal);
      doc.removeEventListener('focusin', reveal);
      doc.removeEventListener('scroll', reveal);
      clearTimeout(this.hideControlsTimer);
      clearTimeout(this.immersiveTimer);
      // Quitter la page en mode immersif laisserait le site sans en-tête et
      // sans curseur : les classes ne survivent pas au composant qui les a
      // posées.
      this.setImmersive(false);
      this.document.body.classList.remove(Boutique3Component.VIDEO_PAGE_CLASS);
    });
  }

  /**
   * Hors de l'écran, la vidéo est mise en pause : décoder des images que
   * personne ne regarde coûte du processeur et de la batterie pour rien.
   */
  private onHeroVisibility(visible: boolean): void {
    this.heroVisible.set(visible);

    if (!visible) {
      // Plus de vidéo à l'écran, plus de raison d'effacer quoi que ce soit.
      clearTimeout(this.immersiveTimer);
      this.setImmersive(false);
    }

    const video = this.videoRef()?.nativeElement;
    if (!video) {
      return;
    }
    if (visible) {
      // Le `.catch` suffit à traiter la promesse : le navigateur rejette la
      // lecture quand il la refuse, et il n'y a rien à en dire — la vidéo est
      // décorative.
      video.play().catch(() => undefined);
    } else {
      video.pause();
      this.controlsVisible.set(false);
    }
  }

  private revealControls(): void {
    if (!this.controlsVisible()) {
      this.controlsVisible.set(true);
    }
    clearTimeout(this.hideControlsTimer);
    this.hideControlsTimer = setTimeout(
      () => this.controlsVisible.set(false),
      Boutique3Component.CONTROLS_HIDE_MS,
    );

    this.pointerSeen = true;
    this.setImmersive(false);
    clearTimeout(this.immersiveTimer);
    this.immersiveTimer = setTimeout(() => {
      // Relu au moment où le compte à rebours tombe, et non au moment où il
      // est armé : le hero a pu sortir de l'écran entre-temps.
      if (this.pointerSeen && this.heroVisible()) {
        this.setImmersive(true);
      }
    }, Boutique3Component.IMMERSIVE_DELAY_MS);
  }

  private setImmersive(on: boolean): void {
    if (this.immersive() === on) {
      return;
    }
    this.immersive.set(on);
    this.document.body.classList.toggle(Boutique3Component.IMMERSIVE_CLASS, on);
  }

  /**
   * `noIndex` sur toute la variante : elle expose le même catalogue que
   * `/boutique` sous une seconde URL. Laissée indexable, elle mettrait les deux
   * pages en concurrence sur les mêmes requêtes et diluerait celle qui compte.
   * Le titre porte la mention « v2 » pour qu'un onglet ouvert dise de quelle
   * version il parle pendant la revue.
   */
  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Boutique (v3)',
      description: `Boutique officielle Team Divergentes : maillots de la collection 2026, personnalisables au flocage. ${MATERIAL}, ${WEIGHT}, ${ORIGIN}.`,
      url: '/boutique3',
      noIndex: true,
    });
    this.loadCatalog();
  }

  ngAfterViewInit(): void {
    this.watchHeroActivity();
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.shopService.loadCatalog().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  /**
   * Crédit du créateur des maillots, en lieu et place du bandeau de
   * partenaires. Variante d'essai : la version de référence est `boutique`,
   * qui affiche aussi le nom à côté du monogramme.
   */
  readonly sponsors = [
    {
      url: 'https://www.behance.net/samuel_mateus',
      img: 'assets/img/shop/samuel-mateus.png',
      alt: 'Samuel Mateus',
    },
  ];
}
