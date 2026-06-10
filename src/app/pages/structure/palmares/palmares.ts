import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { GamesService } from '../../../shared/services/games.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Trophy } from '../../../shared/models/trophy.model';
import { placementLabel as _placementLabel, placementAria as _placementAria } from '../../../shared/utils/trophy-placement';

/**
 * Page publique du palmarès — layout « Salle des Trophées » (direction A).
 *
 * Structure :
 *  1. Hero monument — trophée featured le plus récent (ou meilleur placement si aucun featured)
 *  2. Mosaïque — autres featured
 *  3. Historique jalons — tous les trophées groupés par année
 */
@Component({
  selector: 'app-palmares',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './palmares.html',
  styleUrls: ['./palmares.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PalmaresComponent implements OnInit {
  private readonly trophiesService = inject(TrophiesService);
  private readonly gamesService = inject(GamesService);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly featuredTrophies = this.trophiesService.featuredTrophies;
  readonly trophiesByYear = this.trophiesService.trophiesByYear;
  readonly isEmpty = computed(() => this.trophiesService.trophies().length === 0);

  /**
   * Carte du jeu : clé lowercase → URL image.
   * Calculée à partir des jeux actifs chargés par GamesService.
   */
  private readonly gamesMap = computed(() => {
    const map = new Map<string, string | null>();
    for (const game of this.gamesService.activeGames()) {
      map.set(game.key.toLowerCase(), game.image);
    }
    return map;
  });

  /**
   * Trophée hero : premier featured trié par date desc.
   * Fallback : trophée au meilleur placement (placement le plus bas = meilleur) le plus récent
   * parmi tous les trophées si aucun n'est featured.
   * Retourne null si aucun trophée disponible.
   */
  readonly heroTrophy = computed<Trophy | null>(() => {
    const featured = this.featuredTrophies();
    if (featured.length > 0) {
      // featuredTrophies est filtré depuis trophiesSignal qui est chargé dans l'ordre API.
      // On s'assure du tri par date desc.
      return [...featured].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0];
    }
    const all = this.trophiesService.trophies();
    if (all.length === 0) return null;
    // Meilleur placement (1 = premier) puis date desc
    return [...all].sort((a, b) => {
      if (a.placement !== b.placement) return a.placement - b.placement;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];
  });

  /**
   * Mosaïque : trophées featured sans le hero, triés par date desc.
   */
  readonly mosaicTrophies = computed<Trophy[]>(() => {
    const hero = this.heroTrophy();
    if (!hero) return [];
    return this.featuredTrophies()
      .filter(t => t.id !== hero.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Palmarès',
      description:
        'Le palmarès de la Team Divergentes : titres, podiums et performances de nos équipes esport.',
      url: '/structure/palmares',
    });
    this.seoService.setJsonLd(
      this.seoService.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Structure', url: '/structure' },
        { name: 'Palmarès', url: '/structure/palmares' },
      ]),
    );
    this.loadData();
  }

  placementLabel(placement: number): string { return _placementLabel(placement); }
  placementAria(placement: number): string { return _placementAria(placement); }

  /**
   * Retourne l'URL du logo du jeu ou le fallback logoTD.
   */
  getGameLogo(gameKey: string | null | undefined): string {
    if (!gameKey) return 'assets/logos/logoTD.svg';
    const image = this.gamesMap().get(gameKey.toLowerCase());
    return image || 'assets/logos/logoTD.svg';
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(undefined);

    forkJoin([
      this.trophiesService.loadTrophies().pipe(catchError(() => of([]))),
      this.gamesService.loadActiveGames().pipe(catchError(() => of([]))),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Erreur lors du chargement du palmarès');
        },
      });
  }
}
