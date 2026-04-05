import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SponsorsService } from '../../shared/services/sponsors.service';
import { SponsorCardComponent } from './components/sponsor-card.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Page publique d'affichage des sponsors
 */
@Component({
  standalone: true,
  selector: 'app-sponsor',
  imports: [CommonModule, RouterLink, SponsorCardComponent],
  templateUrl: './sponsors.html',
  styleUrls: ['./sponsors.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SponsorComponent implements OnInit, OnDestroy {
  private readonly sponsorsService = inject(SponsorsService);
  private readonly seoService = inject(SeoService);
  private subscription?: Subscription;

  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  // Liste des sponsors
  readonly sponsors = this.sponsorsService.sponsors;

  // Vérifie si on a des sponsors
  readonly noSponsors = computed(() => this.sponsors().length === 0);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Sponsors',
      description: 'Nos partenaires et sponsors qui soutiennent Team Divergentes dans l\'esport.',
      url: '/structure/sponsors'
    });
    this.loadSponsors();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Charge les sponsors depuis l'API
   */
  private loadSponsors(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.subscription = this.sponsorsService.loadSponsors().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des sponsors');
      }
    });
  }
}
