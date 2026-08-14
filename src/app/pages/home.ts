import {afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';

import {ScreenSize, ScreenSizeService} from '../../shared/services/screen-size.service';
import {Router, RouterLink} from '@angular/router';
import {homepageVideoId, homepageVideoUrl, logoFilePath} from '../../shared/constants';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SliderComponent} from '../../shared/components/slider/slider';
import {PageHeaderComponent} from '../shared/components/layout/page-header.component';
import {PageComponent} from '../shared/components/layout/page.component';
import {homeSliderImages} from '../data/slider-images';
import {SeoService} from '../shared/services/seo.service';
import {ConfigService} from '../shared/services/config.service';
import {HomeArticlesSectionComponent} from './home-articles-section/home-articles-section';
import {MatchesService} from '../shared/services/matches.service';
import {MatchStripComponent} from '../shared/components/match-strip/match-strip';
import {Match} from '../shared/models/match.model';
import {PageVisibilityService} from '../../shared/services/page-visibility.service';
import {forkJoin, catchError, of} from 'rxjs';

@Component({
  selector: 'app-home',
  // `MatAnchor` / `MatButton` retires : les deux liens qui portaient `mat-button`
  // sont des etiquettes posees sur les images du hero, entierement redessinees
  // par `.image-container__text`. Ils tiraient `@angular/material/button` — et
  // avec lui le noyau Material, ses effets d'onde et `@angular/cdk/a11y` — dans
  // le chunk de la page d'accueil, l'une des quatre auditees.
  imports: [
    RouterLink,
    SliderComponent,
    PageHeaderComponent,
    PageComponent,
    HomeArticlesSectionComponent,
    MatchStripComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);
  private readonly configService = inject(ConfigService);
  private readonly matchesService = inject(MatchesService);
  private readonly pageVisibilityService = inject(PageVisibilityService);

  readonly nextMatch = signal<Match | null>(null);
  readonly lastResults = signal<Match[]>([]);
  readonly matchesLoading = signal(true);

  /** Bandeau matchs : piloté par la config admin, masqué par défaut. */
  readonly matchesVisible = computed(() => this.pageVisibilityService.isMatchBlockVisible());

  /** Ref vers l'indicateur de scroll pour calculer sa position dans le viewport */
  private readonly scrollIndicatorRef = viewChild<ElementRef<HTMLElement>>('scrollIndicator');

  /** Position top (%) du point vert dans l'indicateur de scroll : 14% (haut) → 60% (bas) */
  protected readonly dotTopPercent = signal(14);

  constructor() {
    afterNextRender(() => {
      const onScroll = () => {
        const el = this.scrollIndicatorRef()?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (vh - rect.top) / vh));
        this.dotTopPercent.set(14 + progress * 46);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }
  protected readonly router = inject(Router);
  protected readonly screenSizeService = inject(ScreenSizeService);
  protected readonly socialLinks = this.configService.socialLinksMap;
  protected readonly domSanitizer = inject(DomSanitizer);

  /** Donnees du slider externalisees */
  protected readonly sliderImages = homeSliderImages;

  protected readonly logoFileUrl = logoFilePath;
  protected readonly sponsorsFileUrl = {
    pulsar: 'assets/img/sponsors/pulsar.svg'
  };
  protected readonly sponsorsLinks = {
    pulsar: 'https://www.behance.net/Pulsarcorp'
  };

  /** Nombre de repetitions du motif sponsor dans chaque copie pour couvrir la largeur ecran */
  protected readonly sponsorsRepeat = Array.from({ length: 8 }, (_, i) => i);
  /** 2 copies du set complet pour l'animation CSS translateX(-50%) seamless */
  protected readonly sponsorsCopies = [0, 1];

  screenSize = signal<ScreenSize>('desktop');
  isMobile = computed(() => this.screenSize() === 'handset');

  /** YouTube facade : on ne charge l'iframe qu'apres le clic de l'utilisateur */
  protected readonly videoPlaying = signal(false);

  /** Thumbnail YouTube via l'API d'images publique de YouTube */
  protected readonly youtubeThumbnailUrl = `https://img.youtube.com/vi/${homepageVideoId}/maxresdefault.jpg`;

  /** URL sanitisee de la video YouTube (chargee uniquement apres le clic) */
  protected readonly homepageVideoUrl: SafeResourceUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(homepageVideoUrl);

  protected playVideo(): void {
    this.videoPlaying.set(true);
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Accueil',
      description: 'Team Divergentes - Structure esportive française fondée en 2017. Équipes compétitives, événements et communauté gaming.',
      url: '/'
    });
    this.seoService.setJsonLd([
      this.seoService.getOrganizationJsonLd(this.configService.socialUrls()),
      this.seoService.getWebSiteJsonLd(),
    ]);

    this.screenSizeService.screenSize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(size => {
        this.screenSize.set(size);
      });

    // Bandeau masqué : ni skeleton ni appels API. Deux requêtes de moins sur le
    // chemin critique de l'accueil, y compris au rendu serveur.
    if (!this.matchesVisible()) {
      this.matchesLoading.set(false);
      return;
    }

    forkJoin([
      this.matchesService.getUpcoming(1).pipe(catchError(() => of([]))),
      this.matchesService.getResults(3).pipe(catchError(() => of([]))),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([upcoming, results]) => {
        this.nextMatch.set(upcoming[0] ?? null);
        this.lastResults.set(results);
        this.matchesLoading.set(false);
      });
  }
}
