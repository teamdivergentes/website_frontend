import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  AdminDashboardService,
  DashboardDraft,
} from '../../../../shared/services/admin-dashboard.service';

/** Anciennete lisible d'une date ISO : "aujourd'hui", "3 j", "2 sem". */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7) return `${days} j`;
  const weeks = Math.floor(days / 7);
  return `${weeks} sem`;
}

/**
 * Bloc "Reprendre" : les brouillons recents, pour repartir de la ou on s'est
 * arrete plutot que de rechercher son travail dans la liste des articles.
 */
@Component({
  selector: 'app-dashboard-resume',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    @if (loading()) {
      <section class="dashboard-block" aria-busy="true">
        <h2 class="block-title">Reprendre</h2>
        <output class="block-skeleton" aria-label="Chargement des brouillons">
          @for (row of [1, 2, 3]; track row) {
            <div class="skeleton-row">
              <div class="skeleton-block skeleton-line"></div>
              <div class="skeleton-block skeleton-age"></div>
            </div>
          }
        </output>
      </section>
    } @else if (drafts().length) {
      <section class="dashboard-block">
        <h2 class="block-title">Reprendre</h2>
        <ul class="block-list">
          @for (draft of drafts(); track draft.id) {
            <li>
              <a
                class="block-entry"
                [routerLink]="['/admin/articles/edit', draft.id]"
                [attr.data-testid]="'dashboard-draft-' + draft.id"
              >
                <mat-icon aria-hidden="true">edit_note</mat-icon>
                <span class="entry-label">{{ draft.title }}</span>
                @if (!draft.isMine) {
                  <span class="entry-tag">d’un autre auteur</span>
                }
                <span class="entry-age">{{ age(draft) }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
    <!-- Aucun brouillon : le bloc entier disparait plutot que d'afficher un vide. -->
  `,
  styleUrl: './dashboard-block.scss',
})
export class DashboardResumeComponent {
  private readonly dashboardService = inject(AdminDashboardService);

  private readonly data = signal<DashboardDraft[] | null>(null);

  readonly loading = computed(() => this.data() === null);
  readonly drafts = computed(() => this.data() ?? []);

  constructor() {
    this.dashboardService.getResume().subscribe({
      next: (response) => this.data.set(response.drafts),
      // Le dashboard n'est pas une page de travail : une panne de ce bloc le
      // fait disparaitre, elle ne barre pas le reste de la page d'un bandeau.
      error: () => this.data.set([]),
    });
  }

  age(draft: DashboardDraft): string {
    return relativeAge(draft.updatedAt);
  }
}
