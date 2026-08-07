import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/api/auth.service';
import { DashboardResumeComponent } from './components/dashboard-resume/dashboard-resume.component';
import { DashboardTodoComponent } from './components/dashboard-todo/dashboard-todo.component';
import { DashboardTrafficComponent } from './components/dashboard-traffic/dashboard-traffic.component';
import { DashboardRecentComponent } from './components/dashboard-recent/dashboard-recent.component';
import { OrdersCountersComponent } from '../shared/orders-counters.component';

/**
 * Composant orchestrateur du dashboard admin.
 *
 * Compose cinq sections :
 * - OrdersCountersComponent   : activité de la boutique
 * - DashboardResumeComponent  : brouillons a reprendre
 * - DashboardTodoComponent    : anomalies traitables du site
 * - DashboardTrafficComponent : métriques Google Analytics
 * - DashboardRecentComponent  : état du site (horloge, version, statut)
 *
 * La grille de liens rapides a ete retiree : elle dupliquait la sidebar, qui
 * porte desormais les memes destinations groupees, et la palette Cmd+K y donne
 * acces en trois frappes. Le dashboard repond a "ou j'en etais" plutot qu'a
 * "ou puis-je aller".
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    OrdersCountersComponent,
    DashboardResumeComponent,
    DashboardTodoComponent,
    DashboardTrafficComponent,
    DashboardRecentComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Header avec message de bienvenue -->
      <div class="dashboard-header">
        <div>
          <h1>Bonjour {{ userName() }}</h1>
          <p>{{ userRole() }}</p>
        </div>
      </div>

      <!-- Activité de la boutique -->
      <app-orders-counters />

      <!-- Reprises en cours -->
      <app-dashboard-resume />

      <!-- Anomalies traitables -->
      <app-dashboard-todo />

      <!-- Section Analytics (métriques GA) -->
      <app-dashboard-traffic />

      <!-- Section État du site -->
      <app-dashboard-recent />
    </div>
  `,
  styles: [`
    .dashboard-header {
      margin-bottom: 1.5rem;

      h1 {
        margin: 0 0 0.25rem;
        font-size: var(--admin-font-2xl);
        font-weight: 700;
        color: var(--white);
      }

      p {
        margin: 0;
        font-size: var(--admin-font-md);
        color: var(--gray);
      }
    }
  `]
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly userName = computed(() => this.authService.user()?.email?.split('@')[0] || 'Admin');
  readonly userRole = computed(() => this.authService.role()?.name || 'Admin');
}
