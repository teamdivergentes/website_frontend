import { Component, computed, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/services/api/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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

      <!-- Carte d'accueil -->
      <div class="welcome-card">
        <h2>Bienvenue sur le dashboard admin DVG</h2>
        <p>
          Vous êtes connecté avec le rôle <strong>{{ userRole() }}</strong>.
        </p>
      </div>

      <!-- Section Analytics Placeholder -->
      <section class="analytics-section">
        <div class="section-header">
          <h2>Analytics</h2>
          <span class="badge">Google Analytics</span>
        </div>

        <div class="analytics-grid">
          @for (metric of analyticsMetrics; track metric.title) {
            <div class="metric-card">
              <div class="metric-header">
                <mat-icon class="metric-icon">{{ metric.icon }}</mat-icon>
                <span class="metric-title">{{ metric.title }}</span>
              </div>
              <div class="metric-value">—</div>
              <div class="skeleton-bar"></div>
            </div>
          }
        </div>

        <p class="analytics-footer">Connexion Google Analytics requise</p>
      </section>

      <!-- Section État du site -->
      <section class="site-status">
        <h3>État du site</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">Date et heure</span>
            <span class="status-value">{{ currentDateTime() }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Version</span>
            <span class="status-value">v1.0.0</span>
          </div>
          <div class="status-item">
            <span class="status-label">Statut</span>
            <span class="status-value">
              <span class="status-dot"></span>
              En ligne
            </span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    

    .welcome-card {
      margin-bottom: 2.5rem;
    }

    /* Analytics Section */
    .analytics-section {
      margin-bottom: 2.5rem;
      position: relative;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--white);
      }

      .badge {
        padding: 0.25rem 0.625rem;
        background: rgba(50, 210, 153, 0.1);
        border: 1px solid var(--darkGreen);
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--green);
      }
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: -0.5rem;
        background: rgba(16, 17, 17, 0.5);
        backdrop-filter: blur(1px);
        border-radius: 10px;
        pointer-events: none;
        z-index: 1;
      }

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      background: var(--darkBackground);
      border: 1px solid var(--darkGreen);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      z-index: 0;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .metric-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
        color: var(--gray);
      }

      .metric-title {
        font-size: 0.8125rem;
        color: var(--gray);
        font-weight: 500;
      }
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: rgba(211, 211, 211, 0.3);
      line-height: 1;
    }

    .skeleton-bar {
      height: 6px;
      background: linear-gradient(
        90deg,
        rgba(40, 65, 59, 0.3) 0%,
        rgba(50, 210, 153, 0.1) 50%,
        rgba(40, 65, 59, 0.3) 100%
      );
      background-size: 200% 100%;
      border-radius: 3px;
      animation: skeleton-pulse 2s ease-in-out infinite;
    }

    @keyframes skeleton-pulse {
      0%, 100% {
        background-position: 200% 0;
      }
      50% {
        background-position: 0 0;
      }
    }

    .analytics-footer {
      margin: 1rem 0 0;
      font-size: 0.8125rem;
      color: rgba(211, 211, 211, 0.4);
      text-align: center;
    }

    /* Site Status Section */
    .site-status {
      background: var(--darkBackground);
      border: 1px solid var(--darkGreen);
      border-radius: 10px;
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--white);
      }
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }

    .status-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      .status-label {
        font-size: 0.75rem;
        color: rgba(211, 211, 211, 0.5);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .status-value {
        font-size: 0.9375rem;
        color: var(--white);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
      box-shadow: 0 0 0 0 rgba(50, 210, 153, 0.4);
    }

    @keyframes pulse-dot {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(50, 210, 153, 0.4);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(50, 210, 153, 0);
      }
    }
  `]
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);

  // Signals pour l'utilisateur
  readonly userName = computed(() => this.authService.user()?.email?.split('@')[0] || 'Admin');
  readonly userRole = computed(() => this.authService.role()?.name || 'Admin');

  // Signal pour la date/heure actuelle (mise à jour toutes les minutes)
  readonly currentDateTime = signal(this.formatDateTime());

  // Métriques Analytics (placeholder)
  readonly analyticsMetrics = [
    { title: 'Visiteurs aujourd\'hui', icon: 'people' },
    { title: 'Pages vues (7j)', icon: 'visibility' },
    { title: 'Sessions actives', icon: 'radio_button_checked' },
    { title: 'Taux de rebond', icon: 'trending_down' },
    { title: 'Durée moyenne', icon: 'schedule' },
    { title: 'Top pages', icon: 'bar_chart' }
  ];

  constructor() {
    // Mise à jour de l'horloge toutes les minutes
    effect((onCleanup) => {
      const interval = setInterval(() => {
        this.currentDateTime.set(this.formatDateTime());
      }, 60000); // 60 secondes

      onCleanup(() => clearInterval(interval));
    });
  }

  private formatDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${date} • ${time}`;
  }
}
