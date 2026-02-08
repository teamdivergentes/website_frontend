import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUsers, faShield, faGamepad, faChartLine, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../shared/services/api/auth.service';

interface StatCard {
  title: string;
  value: string;
  icon: IconDefinition;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Bienvenue, {{ userName() }}</p>
      </div>

      <div class="stats-grid">
        @for (stat of stats; track stat.title) {
          <div class="stat-card" [style.border-left-color]="stat.color">
            <div class="stat-icon" [style.background]="stat.color + '20'">
              <fa-icon [icon]="stat.icon" [style.color]="stat.color" />
            </div>
            <div class="stat-content">
              <p class="stat-title">{{ stat.title }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </div>
        }
      </div>

      <div class="welcome-card">
        <h2>Bienvenue sur le dashboard admin DVG</h2>
        <p>
          Vous etes connecte avec le role <strong>{{ userRole() }}</strong>.
        </p>
        @if (userPermissions().length > 0) {
          <p>Permissions disponibles :</p>
          <ul class="permissions-list">
            @for (permission of userPermissions(); track permission) {
              <li>{{ permission }}</li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        color: var(--white);
      }

      p {
        margin: 0;
        color: var(--gray);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--darkBackground);
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-title {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      color: var(--gray);
    }

    .stat-value {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--white);
    }

    .welcome-card {
      background: var(--darkBackground);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

      h2 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: var(--white);
      }

      p {
        margin: 0 0 0.75rem 0;
        color: var(--gray);
        line-height: 1.6;
      }

      strong {
        color: var(--green);
      }
    }

    .permissions-list {
      margin: 1rem 0 0 0;
      padding-left: 1.5rem;
      color: var(--gray);

      li {
        margin-bottom: 0.5rem;
        font-family: monospace;
        font-size: 0.875rem;
      }
    }
  `]
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);

  readonly userName = computed(() => this.authService.user()?.email?.split('@')[0] || 'Admin');
  readonly userRole = computed(() => this.authService.role()?.name || 'N/A');
  readonly userPermissions = computed(() => this.authService.permissions());

  readonly stats: StatCard[] = [
    { title: 'Total Utilisateurs', value: '0', icon: faUsers, color: '#32D299' },
    { title: 'Roles', value: '0', icon: faShield, color: '#28413B' },
    { title: 'Equipes', value: '0', icon: faGamepad, color: '#32D299' },
    { title: 'Statistiques', value: '0', icon: faChartLine, color: '#28413B' },
  ];
}
