import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamsService, GamesService } from '../../../shared/services';
import { TeamWithMembers } from '../../../shared/models';

/**
 * Page de détail d'une équipe avec ses membres
 * Design basé sur le Figma - version desktop avec grille, mobile avec slider
 */
@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-detail.html',
  styleUrls: ['./team-detail.scss']
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);
  private readonly gamesService = inject(GamesService);

  // Signals principaux
  readonly team = signal<TeamWithMembers | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

  // Slider mobile
  readonly currentSlide = signal<number>(0);
  readonly sliderOffset = signal<number>(0);
  private touchStartX = 0;
  private touchCurrentX = 0;
  private slideWidth = 322; // Largeur d'une slide + gap

  // Map des jeux pour récupérer le nom complet
  private readonly gamesMap = computed(() => {
    const map = new Map<string, string>();
    for (const game of this.gamesService.activeGames()) {
      map.set(game.key.toLowerCase(), game.name);
    }
    return map;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('teamId');
    if (slug) {
      this.loadTeam(slug);
    } else {
      this.router.navigate(['/structure/equipes']);
    }
  }

  /**
   * Charge les détails de l'équipe depuis l'API
   */
  private loadTeam(slug: string): void {
    this.loading.set(true);
    this.error.set(undefined);

    // Charger les jeux pour avoir le nom complet
    this.gamesService.loadActiveGames().subscribe();

    this.teamsService.getTeamBySlug(slug).subscribe({
      next: (team) => {
        this.team.set(team);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Équipe introuvable');
        console.error('Load team error:', err);
        setTimeout(() => {
          this.router.navigate(['/structure/equipes']);
        }, 2000);
      }
    });
  }

  /**
   * Retour à la liste des équipes
   */
  goBack(): void {
    this.router.navigate(['/structure/equipes']);
  }

  /**
   * Récupère le nom du jeu depuis la clé
   */
  getGameName(): string {
    const team = this.team();
    if (!team) return '';

    const gameName = this.gamesMap().get(team.game.toLowerCase());
    return gameName || team.game;
  }

  // ========================================
  // Méthodes du slider mobile
  // ========================================

  /**
   * Début du touch
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
  }

  /**
   * Mouvement du touch
   */
  onTouchMove(event: TouchEvent): void {
    this.touchCurrentX = event.touches[0].clientX;
    const diff = this.touchCurrentX - this.touchStartX;
    const baseOffset = -this.currentSlide() * this.slideWidth;
    this.sliderOffset.set(baseOffset + diff);
  }

  /**
   * Fin du touch - détermine si on change de slide
   */
  onTouchEnd(): void {
    const diff = this.touchCurrentX - this.touchStartX;
    const threshold = this.slideWidth / 4;
    const membersCount = this.team()?.members?.length || 0;

    if (diff < -threshold && this.currentSlide() < membersCount - 1) {
      // Swipe vers la gauche - slide suivante
      this.goToSlide(this.currentSlide() + 1);
    } else if (diff > threshold && this.currentSlide() > 0) {
      // Swipe vers la droite - slide précédente
      this.goToSlide(this.currentSlide() - 1);
    } else {
      // Retour à la position actuelle
      this.sliderOffset.set(-this.currentSlide() * this.slideWidth);
    }
  }

  /**
   * Aller à une slide spécifique
   */
  goToSlide(index: number): void {
    const membersCount = this.team()?.members?.length || 0;
    if (index >= 0 && index < membersCount) {
      this.currentSlide.set(index);
      this.sliderOffset.set(-index * this.slideWidth);
    }
  }
}
