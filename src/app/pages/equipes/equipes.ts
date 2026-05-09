import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { TeamsService, StaffService, GamesService } from '../../shared/services';
import { SeoService } from '../../shared/services/seo.service';
import { Team } from '../../shared/models/team.model';
import { StaffMember } from '../../shared/models/staff.model';

/**
 * Page publique listant les équipes actives et les ambassadeurs
 * Utilise les données dynamiques depuis l'API
 */
@Component({
  selector: 'app-equipes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipes.html',
  styleUrls: ['./equipes.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipesComponent implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly staffService = inject(StaffService);
  private readonly gamesService = inject(GamesService);
  private readonly seoService = inject(SeoService);

  // Computed signal pour les équipes actives
  readonly teams = this.teamsService.activeTeams;

  // Computed signal pour les ambassadeurs
  readonly ambassadors = this.staffService.ambassadors;

  // Computed signal pour mapper les clés de jeux à leurs images
  private readonly gamesMap = computed(() => {
    const map = new Map<string, string | null>();
    for (const game of this.gamesService.activeGames()) {
      map.set(game.key.toLowerCase(), game.image);
    }
    return map;
  });

  // Signals pour l'état de chargement
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Equipes & Ambassadeurs',
      description: 'Retrouvez nos équipes compétitives et nos joueurs sur les différentes scènes esport.',
      url: '/structure/equipes'
    });
    const breadcrumb = this.seoService.getBreadcrumbListJsonLd([
      { name: 'Accueil', url: '/' },
      { name: 'Equipes', url: '/structure/equipes' },
    ]);
    this.seoService.setJsonLd(breadcrumb);
    this.loadData();
  }

  /**
   * Charge les équipes et ambassadeurs depuis l'API
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(undefined);

    forkJoin([
      this.teamsService.loadTeams().pipe(catchError(() => of([]))),
      this.staffService.loadStaff().pipe(catchError(() => of([]))),
      this.gamesService.loadActiveGames().pipe(catchError(() => of([])))
    ]).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des données');
      }
    });
  }

  /**
   * Récupère l'URL de l'image ou un placeholder
   */
  getImageUrl(image?: string): string {
    return image || 'assets/img/equipe_ambassadeur/equipes/placeholder.png';
  }

  /**
   * Récupère le logo du jeu depuis les données uploadées
   */
  getGameLogo(gameKey: string): string {
    const image = this.gamesMap().get(gameKey.toLowerCase());
    return image || 'assets/logos/logoTD.svg';
  }

  /**
   * TrackBy pour optimiser le rendu des équipes
   */
  trackByTeam(index: number, team: Team): number {
    return team.id;
  }

  /**
   * TrackBy pour optimiser le rendu des ambassadeurs
   */
  trackByAmbassador(index: number, ambassador: StaffMember): number {
    return ambassador.id;
  }

  /**
   * Récupère l'image de l'ambassadeur ou un placeholder
   */
  getAmbassadorImage(image?: string): string {
    return image || 'assets/logos/logoTD.svg';
  }
}
