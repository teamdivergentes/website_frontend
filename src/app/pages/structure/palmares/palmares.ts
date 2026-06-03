import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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

  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly featuredTrophies = this.trophiesService.featuredTrophies;
  readonly trophiesByYear = this.trophiesService.trophiesByYear;
  readonly isEmpty = computed(() => this.trophiesService.trophies().length === 0);

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

  private loadTrophies(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.subscription = this.trophiesService.loadTrophies().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement du palmarès');
      },
    });
  }
}
