import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { SeoService } from '../../../shared/services/seo.service';
import { placementLabel as _placementLabel, placementAria as _placementAria } from '../../../shared/utils/trophy-placement';

/**
 * Page publique du palmarès : trophées à la une (rail scroll-snap) + historique par année.
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
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly featuredTrophies = this.trophiesService.featuredTrophies;
  readonly trophiesByYear = this.trophiesService.trophiesByYear;
  readonly isEmpty = computed(() => this.trophiesService.trophies().length === 0);

  /**
   * Signal indiquant si le rail featured déborde horizontalement.
   * Mis à jour après le premier rendu et à chaque resize passif.
   * Conditionne l'affichage du hint « glisse pour découvrir ».
   */
  readonly railScrollable = signal(false);

  /** Référence au conteneur du rail (signal-based viewChild, Angular 17+) */
  private readonly railRef = viewChild<ElementRef<HTMLElement>>('featuredRail');

  constructor() {
    // afterNextRender est nécessaire pour lire les dimensions DOM après rendu initial.
    afterNextRender(() => {
      this.updateRailScrollable();
      // Listener passif sur le resize — debounce léger pour éviter les rafales
      fromEvent(window, 'resize', { passive: true })
        .pipe(debounceTime(100), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateRailScrollable());
    });
  }

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
    this.loadTrophies();
  }

  placementLabel(placement: number): string { return _placementLabel(placement); }
  placementAria(placement: number): string { return _placementAria(placement); }

  /** Vérifie si le rail déborde et met à jour le signal railScrollable. */
  updateRailScrollable(): void {
    const el = this.railRef()?.nativeElement;
    if (el) {
      this.railScrollable.set(el.scrollWidth > el.clientWidth);
    }
  }

  private loadTrophies(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.trophiesService.loadTrophies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          // Re-check après chargement des données : le rail peut être apparu
          // ou sa largeur peut avoir changé suite au rendu des cartes.
          // afterNextRender attend le prochain cycle de rendu DOM (idiome zoneless).
          afterNextRender(() => this.updateRailScrollable(), { injector: this.injector });
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Erreur lors du chargement du palmarès');
        },
      });
  }
}
