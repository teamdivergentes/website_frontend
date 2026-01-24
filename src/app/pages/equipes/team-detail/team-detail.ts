import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamsService } from '../../../shared/services';
import { TeamWithMembers, TeamMember } from '../../../shared/models';

/**
 * Page de détail d'une équipe avec ses membres
 * Récupère les données depuis l'API via le slug
 */
@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-detail.html',
  styleUrls: ['./team-detail.scss']
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);

  // Signals
  readonly team = signal<TeamWithMembers | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

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
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Équipe introuvable');
        console.error('Load team error:', err);
        // Redirection après 2 secondes si équipe introuvable
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
   * Récupère l'URL de la photo du membre ou un placeholder
   */
  getMemberImage(member: TeamMember): string {
    return member.image || this.logoPath;
  }

  /**
   * Vérifie si un membre a une photo
   */
  hasMemberPhoto(member: TeamMember): boolean {
    return !!member.image;
  }

  /**
   * Récupère les liens sociaux d'un membre
   */
  getMemberSocials(member: TeamMember): Array<{ name: string; url: string; icon: string }> {
    if (!member.socials) return [];

    const socials: Array<{ name: string; url: string; icon: string }> = [];
    if (member.socials.twitter) socials.push({ name: 'Twitter', url: member.socials.twitter, icon: 'twitter' });
    if (member.socials.twitch) socials.push({ name: 'Twitch', url: member.socials.twitch, icon: 'twitch' });
    if (member.socials.instagram) socials.push({ name: 'Instagram', url: member.socials.instagram, icon: 'instagram' });
    if (member.socials.youtube) socials.push({ name: 'YouTube', url: member.socials.youtube, icon: 'youtube' });

    return socials;
  }

  /**
   * Récupère les liens sociaux de l'équipe
   */
  getTeamSocials(): Array<{ name: string; url: string; icon: string }> {
    const team = this.team();
    if (!team?.socials) return [];

    const socials: Array<{ name: string; url: string; icon: string }> = [];
    if (team.socials.twitter) socials.push({ name: 'Twitter', url: team.socials.twitter, icon: 'twitter' });
    if (team.socials.twitch) socials.push({ name: 'Twitch', url: team.socials.twitch, icon: 'twitch' });
    if (team.socials.instagram) socials.push({ name: 'Instagram', url: team.socials.instagram, icon: 'instagram' });
    if (team.socials.youtube) socials.push({ name: 'YouTube', url: team.socials.youtube, icon: 'youtube' });
    if (team.socials.discord) socials.push({ name: 'Discord', url: team.socials.discord, icon: 'discord' });
    if (team.socials.website) socials.push({ name: 'Site web', url: team.socials.website, icon: 'website' });

    return socials;
  }

  /**
   * TrackBy pour optimiser le rendu des membres
   */
  trackByMember(index: number, member: TeamMember): number {
    return member.id;
  }
}
