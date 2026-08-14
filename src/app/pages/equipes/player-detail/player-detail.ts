import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TeamsService } from '../../../shared/services';
import { TeamMember, Team } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/layout/breadcrumb.component';
import { PageComponent } from '../../../shared/components/layout/page.component';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, PageComponent],
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

  /**
   * Fil d'Ariane : source unique passée à la fois au composant d'affichage et
   * au JSON-LD BreadcrumbList (SeoService.getBreadcrumbListJsonLd), pour que
   * le chemin affiché ne diverge jamais de celui déclaré à Google.
   */
  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const player = this.player();
    if (!player) return [];

    const teamSlug = this.route.snapshot.paramMap.get('teamId');
    const playerSlug = this.route.snapshot.paramMap.get('playerSlug') ?? player.slug ?? String(player.id);
    const team = this.team();

    if (teamSlug && team) {
      return [
        { name: 'Accueil', url: '/' },
        { name: 'Équipes', url: '/structure/equipes' },
        { name: team.name, url: `/structure/equipes/${teamSlug}` },
        { name: player.name, url: `/structure/equipes/${teamSlug}/joueur/${playerSlug}` },
      ];
    }

    return [
      { name: 'Accueil', url: '/' },
      { name: 'Équipes', url: '/structure/equipes' },
      { name: player.name, url: `/structure/equipes/joueur/${playerSlug}` },
    ];
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
            // La biographie est le texte que la structure a écrit sur ce
            // joueur : c'est elle qui doit partir dans la carte de partage,
            // pas une phrase générée à partir de son nom.
            description: this.seoService.buildDescription(
              player.biography,
              `Découvrez le profil de ${player.name}, joueur de l'équipe ${team.name} chez Team Divergentes.`
            ),
            image: player.image,
            imageAlt: `${player.name}, joueur de l'équipe ${team.name}`,
            url: `/structure/equipes/${teamSlug}/joueur/${slug}`,
            type: 'profile'
          });
          const breadcrumb = this.seoService.getBreadcrumbListJsonLd(this.breadcrumbItems());
          const person = this.seoService.getPersonJsonLd(
            { name: player.name, role: player.role, image: player.image },
            { name: team.name, game: team.game },
          );
          this.seoService.setJsonLd([breadcrumb, person]);
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
            description: this.seoService.buildDescription(
              player.biography,
              `Découvrez le profil de ${player.name} chez Team Divergentes.`
            ),
            image: player.image,
            imageAlt: player.name,
            url: `/structure/equipes/joueur/${slug}`,
            type: 'profile'
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
