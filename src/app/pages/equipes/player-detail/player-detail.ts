import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TeamsService } from '../../../shared/services';
import { TeamMember } from '../../../shared/models';

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

  readonly player = signal<TeamMember | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

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
    if (slug) {
      this.loadPlayer(slug);
    } else {
      this.goBack();
    }
  }

  private loadPlayer(slug: string): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.teamsService.getMemberBySlug(slug).subscribe({
      next: (player) => {
        this.player.set(player);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Joueur introuvable');
        console.error('Load player error:', err);
        setTimeout(() => {
          this.goBack();
        }, 2000);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/structure/equipes']);
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
