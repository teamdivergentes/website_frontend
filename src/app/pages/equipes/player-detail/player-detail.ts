import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TeamsService } from '../../../shared/services';
import { TeamMember, Team } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-detail.html',
  styleUrls: ['./player-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);
  private readonly seoService = inject(SeoService);

  readonly player = signal<TeamMember | undefined>(undefined);
  readonly team = signal<Team | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

  readonly teamName = computed(() => {
    const team = this.team();
    if (!team) return '';
    return team.name;
  });

  readonly age = computed(() => {
    const player = this.player();
    if (!player?.birthDate) return undefined;

    const birthDate = new Date(player.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  });

  readonly socialLinks = computed(() => {
    const player = this.player();
    if (!player?.socials) return [];

    return Object.entries(player.socials)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ platform: key, url: value as string }));
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('playerSlug');
    const teamSlug = this.route.snapshot.paramMap.get('teamId');
    if (slug) {
      this.loadPlayer(slug, teamSlug);
    } else {
      this.goBack();
    }
  }

  private loadPlayer(slug: string, teamSlug: string | null): void {
    this.loading.set(true);
    this.error.set(undefined);

    const player$ = this.teamsService.getMemberBySlug(slug);

    if (teamSlug) {
      forkJoin({
        player: player$,
        team: this.teamsService.getTeamBySlug(teamSlug)
      }).subscribe({
        next: ({ player, team }) => {
          this.player.set(player);
          this.team.set(team);
          this.loading.set(false);
          this.seoService.updateMetaTags({
            title: player.name,
            description: `Découvrez le profil de ${player.name}, joueur de l'équipe ${team.name} chez Team Divergentes.`,
            url: `/structure/equipes/${teamSlug}/${slug}`
          });
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Joueur introuvable');
          this.seoService.updateMetaTags({
            title: 'Joueur introuvable',
            description: "Ce joueur n'est plus référencé.",
            noIndex: true,
          });
        }
      });
    } else {
      player$.subscribe({
        next: (player) => {
          this.player.set(player);
          this.loading.set(false);
          this.seoService.updateMetaTags({
            title: player.name,
            description: `Découvrez le profil de ${player.name} chez Team Divergentes.`,
            url: `/structure/equipes/${slug}`
          });
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Joueur introuvable');
          this.seoService.updateMetaTags({
            title: 'Joueur introuvable',
            description: "Ce joueur n'est plus référencé.",
            noIndex: true,
          });
        }
      });
    }
  }

  goBack(): void {
    const teamSlug = this.route.snapshot.paramMap.get('teamId');
    if (teamSlug) {
      this.router.navigate(['/structure/equipes', teamSlug]);
    } else {
      this.router.navigate(['/structure/equipes']);
    }
  }

  getCustomFields(): Array<{ key: string; value: unknown }> {
    const player = this.player();
    if (!player?.customFields) return [];

    return Object.entries(player.customFields).map(([key, value]) => ({ key, value }));
  }

  formatFieldKey(key: string): string {
    return key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
