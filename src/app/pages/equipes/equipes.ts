import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TeamsService, StaffService } from '../../shared/services';

/**
 * Page publique listant les équipes actives et les ambassadeurs
 * Utilise les données dynamiques depuis l'API
 */
@Component({
  selector: 'app-equipes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './equipes.html',
  styleUrls: ['./equipes.scss']
})
export class EquipesComponent implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly staffService = inject(StaffService);

  // Computed signal pour les équipes actives
  readonly teams = this.teamsService.activeTeams;

  // Computed signal pour les ambassadeurs
  readonly ambassadors = this.staffService.ambassadors;

  // Signals pour l'état de chargement
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Charge les équipes et ambassadeurs depuis l'API
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(undefined);

    forkJoin([
      this.teamsService.loadTeams(),
      this.staffService.loadStaff()
    ]).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des données');
        console.error('Load data error:', err);
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
   * Récupère le logo du jeu
   */
  getGameLogo(game: string): string {
    const logos: Record<string, string> = {
      'lol': 'assets/img/games/lol.png',
      'valorant': 'assets/img/games/valorant.png',
      'rl': 'assets/img/games/rocket_league.png',
      'cs': 'assets/img/games/csgo.png',
      'tft': 'assets/img/games/tft.png'
    };
    return logos[game.toLowerCase()] || 'assets/logos/logoTD.svg';
  }

  /**
   * TrackBy pour optimiser le rendu des équipes
   */
  trackByTeam(index: number, team: any): number {
    return team.id;
  }

  /**
   * TrackBy pour optimiser le rendu des ambassadeurs
   */
  trackByAmbassador(index: number, ambassador: any): number {
    return ambassador.id;
  }

  /**
   * Récupère l'image de l'ambassadeur ou un placeholder
   */
  getAmbassadorImage(image?: string): string {
    return image || 'assets/logos/logoTD.svg';
  }
}
