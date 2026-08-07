import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../shared/services/orders.service';
import { OrderCounters } from '../../shared/models/order.model';
import { KpiCardComponent } from '../pages/analytics/components/kpi-card.component';

/**
 * Compteurs de commandes de la boutique : total depuis l'ouverture, et fenetre
 * glissante des 30 derniers jours.
 *
 * Un seul composant pour les deux ecrans qui l'affichent — le dashboard `/admin`
 * et la page Statistiques `/admin/analytics`. Deux implantations divergeraient
 * au premier changement de definition du perimetre, et c'est precisement ce
 * perimetre qui fait debat : `PENDING` compte-t-il, une commande annulee
 * compte-t-elle. La reponse est cote serveur, ici on affiche.
 *
 * Un utilisateur sans `commandes:read` voit le bloc disparaitre, pas une erreur.
 * Une alerte qu'on ne peut pas suivre n'a pas a etre remontee — meme regle que
 * le bloc "A faire" du dashboard.
 */
@Component({
  selector: 'app-orders-counters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KpiCardComponent],
  template: `
    @if (loading()) {
      <section class="orders-counters" aria-busy="true">
        <output class="counters-skeleton" aria-label="Chargement des compteurs de commandes">
          @for (card of [1, 2]; track card) {
            <div class="skeleton-card"></div>
          }
        </output>
      </section>
    } @else if (counters(); as data) {
      <section class="orders-counters" aria-label="Commandes de la boutique">
        <a class="counter-link" routerLink="/admin/commandes" data-testid="orders-counter-total">
          <app-kpi-card
            title="Commandes au total"
            [value]="data.total"
            icon="shopping_bag"
            format="number"
          />
        </a>
        <a class="counter-link" routerLink="/admin/commandes" data-testid="orders-counter-recent">
          <app-kpi-card
            [title]="recentTitle()"
            [value]="data.lastThirtyDays"
            icon="local_shipping"
            format="number"
          />
        </a>
      </section>
    }
    <!-- Sans permission ou sur panne, le bloc disparait sans barrer l'ecran. -->
  `,
  styles: [
    `
      .orders-counters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--admin-space-4);
        margin-bottom: 1.5rem;
      }

      // La carte porte deja sa bordure et son survol : le lien ne fait que
      // rendre la zone cliquable, sans ajouter de decor par-dessus.
      .counter-link {
        display: block;
        text-decoration: none;

        &:focus-visible {
          outline: 2px solid var(--green);
          outline-offset: 2px;
          border-radius: var(--admin-radius-lg);
        }
      }

      .counters-skeleton {
        display: contents;
      }

      .skeleton-card {
        height: 7.5rem;
        border-radius: var(--admin-radius-lg);
        background: var(--admin-overlay-subtle);
        border: 1px solid var(--admin-border);
        animation: counters-pulse 1.5s ease-in-out infinite;
      }

      @keyframes counters-pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.55;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .skeleton-card {
          animation: none;
        }
      }
    `,
  ],
})
export class OrdersCountersComponent {
  private readonly ordersService = inject(OrdersService);

  private readonly data = signal<OrderCounters | null>(null);
  private readonly failed = signal(false);

  readonly loading = computed(() => this.data() === null && !this.failed());
  readonly counters = computed(() => this.data());

  /**
   * Le libelle suit `windowDays` renvoye par l'API plutot qu'un « 30 jours »
   * ecrit en dur : si la fenetre serveur change, l'ecran ne doit pas continuer
   * a annoncer l'ancienne.
   */
  readonly recentTitle = computed(() => {
    const days = this.data()?.windowDays ?? 30;
    return `Commandes sur ${days} jours`;
  });

  constructor() {
    this.ordersService.loadCounters().subscribe({
      next: (counters) => this.data.set(counters),
      error: () => this.failed.set(true),
    });
  }
}
