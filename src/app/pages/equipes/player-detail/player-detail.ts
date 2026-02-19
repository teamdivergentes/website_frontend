import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TeamsService, GamesService } from '../../../shared/services';
import { TeamMember, Team } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-detail.html',
  styleUrls: ['./player-detail.scss']
})
export class PlayerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamsService = inject(TeamsService);
  private readonly gamesService = inject(GamesService);
  private readonly seoService = inject(SeoService);

  readonly player = signal<TeamMember | undefined>(undefined);
  readonly team = signal<Team | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

  readonly gameName = computed(() => {
    const team = this.team();
    if (!team) return '';
    const map = new Map<string, string>();
    for (const game of this.gamesService.activeGames()) {
      map.set(game.key.toLowerCase(), game.name);
    }
    return map.get(team.game.toLowerCase()) || team.game;
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

    // Charger les jeux pour avoir le nom complet
    this.gamesService.loadActiveGames().subscribe();

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
        error: (err) => {
          this.loading.set(false);
          this.error.set('Joueur introuvable');
          console.error('Load player error:', err);
          setTimeout(() => this.goBack(), 2000);
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
        error: (err) => {
          this.loading.set(false);
          this.error.set('Joueur introuvable');
          console.error('Load player error:', err);
          setTimeout(() => this.goBack(), 2000);
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
