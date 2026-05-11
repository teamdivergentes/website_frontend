import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../shared/services/api/auth.service';
import { DashboardStatsComponent } from './components/dashboard-stats/dashboard-stats.component';
import { DashboardTrafficComponent } from './components/dashboard-traffic/dashboard-traffic.component';
import { DashboardRecentComponent } from './components/dashboard-recent/dashboard-recent.component';

/**
 * Composant orchestrateur du dashboard admin.
 * Fournit les données d'identité utilisateur et compose les trois sections :
 * - DashboardStatsComponent   : carte d'accueil + liens rapides
 * - DashboardTrafficComponent : métriques Google Analytics
 * - DashboardRecentComponent  : état du site (horloge, version, statut)
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DashboardStatsComponent, DashboardTrafficComponent, DashboardRecentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <!-- Header avec message de bienvenue -->
      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenue, {{ userName() }}</p>
        </div>
      </div>

      <!-- Carte d'accueil + liens rapides -->
      <app-dashboard-stats [userName]="userName()" [userRole]="userRole()" />

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
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--white);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
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
