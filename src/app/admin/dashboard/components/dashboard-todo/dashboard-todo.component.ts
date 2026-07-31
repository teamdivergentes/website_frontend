import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {
  AdminDashboardService,
  DashboardTodo,
} from '../../../../shared/services/admin-dashboard.service';

/** Une alerte affichable, une fois son compteur connu et non nul. */
export interface TodoLine {
  key: keyof DashboardTodo;
  icon: string;
  count: number;
  label: string;
  route: string;
}

/** Choisit la forme singulier / pluriel selon le compteur. */
function plural(count: number, one: string, many: string): string {
  return count > 1 ? many : one;
}

/**
 * Definition des alertes, dans leur ordre d'affichage.
 *
 * L'ordre suit l'urgence : un match passe sans score est une donnee publique
 * fausse, un brouillon dormant n'est qu'un rappel.
 */
const LINES: {
  key: keyof DashboardTodo;
  icon: string;
  route: string;
  label: (count: number) => string;
}[] = [
  {
    key: 'matchesWithoutScore',
    icon: 'scoreboard',
    route: '/admin/matches',
    label: (n) => `${n} ${plural(n, 'match passé sans score', 'matchs passés sans score')}`,
  },
  {
    key: 'articlesWithoutImage',
    icon: 'image_not_supported',
    route: '/admin/articles',
    label: (n) =>
      `${n} ${plural(n, 'article publié sans image', 'articles publiés sans image')}`,
  },
  {
    key: 'matchesWithoutStream',
    icon: 'live_tv',
    route: '/admin/matches',
    label: (n) =>
      `${n} ${plural(n, 'match à venir sans lien de stream', 'matchs à venir sans lien de stream')}`,
  },
  {
    key: 'dormantDrafts',
    icon: 'schedule',
    route: '/admin/articles',
    label: (n) => `${n} ${plural(n, 'brouillon dormant', 'brouillons dormants')}`,
  },
];

/**
 * Bloc "A faire" : les anomalies traitables du site, avec leur compteur.
 *
 * Un compteur omis (permission manquante) et un compteur a zero produisent le
 * meme rendu — la ligne n'apparait pas. L'utilisateur ne voit jamais une alerte
 * sur laquelle il ne peut pas agir, ni un message d'acces refuse.
 */
@Component({
  selector: 'app-dashboard-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    @if (loading()) {
      <section class="dashboard-block" aria-busy="true">
        <h2 class="block-title">À faire</h2>
        <output class="block-skeleton" aria-label="Chargement des alertes">
          @for (row of [1, 2]; track row) {
            <div class="skeleton-row">
              <div class="skeleton-block skeleton-line"></div>
              <div class="skeleton-block skeleton-age"></div>
            </div>
          }
        </output>
      </section>
    } @else if (lines().length) {
      <section class="dashboard-block">
        <h2 class="block-title">À faire</h2>
        <ul class="block-list">
          @for (line of lines(); track line.key) {
            <li>
              <a
                class="block-entry"
                [routerLink]="line.route"
                [attr.data-testid]="'dashboard-todo-' + line.key"
              >
                <mat-icon aria-hidden="true">{{ line.icon }}</mat-icon>
                <span class="entry-label">{{ line.label }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
    <!-- Tous les compteurs a zero : le bloc disparait plutot que d'afficher quatre zeros. -->
  `,
  styleUrl: '../dashboard-resume/dashboard-block.scss',
})
export class DashboardTodoComponent {
  private readonly dashboardService = inject(AdminDashboardService);

  private readonly data = signal<DashboardTodo | null>(null);

  readonly loading = computed(() => this.data() === null);

  readonly lines = computed<TodoLine[]>(() => {
    const counters = this.data();
    if (!counters) return [];

    return LINES.flatMap((line) => {
      const count = counters[line.key];
      // `undefined` (permission manquante) et `0` tombent tous deux ici.
      if (!count) return [];
      return [{ key: line.key, icon: line.icon, count, label: line.label(count), route: line.route }];
    });
  });

  constructor() {
    this.dashboardService.getTodo().subscribe({
      next: (counters) => this.data.set(counters),
      // Une panne fait disparaitre le bloc plutot que de barrer le dashboard.
      error: () => this.data.set({}),
    });
  }
}
