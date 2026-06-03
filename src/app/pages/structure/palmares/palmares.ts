import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { SeoService } from '../../../shared/services/seo.service';

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
export class PalmaresComponent implements OnInit, OnDestroy {
  private readonly trophiesService = inject(TrophiesService);
  private readonly seoService = inject(SeoService);
  private subscription?: Subscription;
  private readonly destroy$ = new Subject<void>();

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
        .pipe(debounceTime(100), takeUntil(this.destroy$))
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

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  placementLabel(placement: number): string {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return `Top ${placement}`;
  }

  placementAria(placement: number): string {
    if (placement === 1) return '1re place';
    if (placement === 2) return '2e place';
    if (placement === 3) return '3e place';
    return `Top ${placement}`;
  }

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
    this.subscription = this.trophiesService.loadTrophies().subscribe({
      next: () => {
        this.loading.set(false);
        // Re-check après chargement des données : le rail peut être apparu
        // ou sa largeur peut avoir changé suite au rendu des cartes.
        // setTimeout(0) laisse Angular finir le cycle de rendu du template.
        setTimeout(() => this.updateRailScrollable(), 0);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement du palmarès');
      },
    });
  }
}
