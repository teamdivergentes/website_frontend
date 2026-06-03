import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamsService } from '../../../shared/services';
import { TeamWithMembers, CoachingStaffMember } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { Trophy } from '../../../shared/models/trophy.model';

/**
 * Page de détail d'une équipe avec ses membres
 * Design basé sur le Figma - version desktop avec grille, mobile avec slider
 */
@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-detail.html',
  styleUrls: ['./team-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);
  private readonly seoService = inject(SeoService);
  private readonly trophiesService = inject(TrophiesService);

  // Signals principaux
  readonly team = signal<TeamWithMembers | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

  /** Trophées de l'équipe pour les badges palmarès */
  readonly teamTrophies = signal<Trophy[]>([]);

  // Slider mobile
  readonly currentSlide = signal<number>(0);
  readonly sliderOffset = signal<number>(0);
  private touchStartX = 0;
  private touchCurrentX = 0;
  private slideWidth = 322; // Largeur d'une slide + gap

  readonly teamName = computed(() => {
    const team = this.team();
    if (!team) return '';
    return team.name;
  });

  /** Coaching staff trié par position (déjà trié par le backend, mais sécurisé ici) */
  readonly coachingStaff = computed<CoachingStaffMember[]>(() => {
    const team = this.team();
    if (!team?.coachingStaff?.length) return [];
    return [...team.coachingStaff].sort((a, b) => a.position - b.position);
  });

  placementLabel(placement: number): string {
    if (placement === 1) return '🥇';
    if (placement === 2) return '🥈';
    if (placement === 3) return '🥉';
    return `Top ${placement}`;
  }

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

    this.teamsService.getTeamBySlug(slug).subscribe({
      next: (team) => {
        this.team.set(team);
        this.loading.set(false);
        this.trophiesService.getTeamTrophies(team.id).subscribe({
          next: trophies => this.teamTrophies.set(trophies),
          error: () => this.teamTrophies.set([]),
        });
        this.seoService.updateMetaTags({
          title: team.name,
          description: `Découvrez l'équipe ${team.name} de Team Divergentes.`,
          url: `/structure/equipes/${slug}`
        });
        const breadcrumb = this.seoService.getBreadcrumbListJsonLd([
          { name: 'Accueil', url: '/' },
          { name: 'Equipes', url: '/structure/equipes' },
          { name: team.name, url: `/structure/equipes/${slug}` },
        ]);
        const sportsTeam = this.seoService.getSportsTeamJsonLd(team.name, team.game || '');
        this.seoService.setJsonLd([breadcrumb, sportsTeam]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Équipe introuvable');
        // Signale à Google que cette URL n'a plus de contenu (soft 404).
        // On reste sur l'URL courante, pas de redirect : Google doit voir
        // le noindex sur l'URL originale pour la déréférencer proprement.
        this.seoService.updateMetaTags({
          title: 'Équipe introuvable',
          description: "Cette équipe n'existe plus ou a été renommée.",
          noIndex: true,
        });
      }
    });
  }

  /**
   * Retour à la liste des équipes
   */
  goBack(): void {
    this.router.navigate(['/structure/equipes']);
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
