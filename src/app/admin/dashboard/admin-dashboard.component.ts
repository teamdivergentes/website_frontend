import { Component, OnInit, computed, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/api/auth.service';
import { AnalyticsAdminService } from '../../shared/services/analytics-admin.service';
import { OverviewResponse, RealtimeResponse } from '../../shared/models/analytics.model';
import { formatNumber, formatDuration } from '../pages/analytics/utils/format.utils';

/** Définition d'une métrique affichée dans la grille analytics */
interface AnalyticsMetric {
  title: string;
  icon: string;
  value: string;
  change: number | null;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
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
        <h2>Bienvenue, {{ userName() }}</h2>
        <p>Rôle : <strong>{{ userRole() }}</strong></p>
        <div class="quick-links">
          <a routerLink="/admin/teams" class="quick-link" data-testid="dashboard-stat-teams">
            <mat-icon aria-hidden="true">sports_esports</mat-icon>
            <span>Équipes</span>
          </a>
          <a routerLink="/admin/sponsors" class="quick-link" data-testid="dashboard-stat-sponsors">
            <mat-icon aria-hidden="true">handshake</mat-icon>
            <span>Sponsors</span>
          </a>
          <a routerLink="/admin/staff" class="quick-link" data-testid="dashboard-stat-staff">
            <mat-icon aria-hidden="true">badge</mat-icon>
            <span>Staff</span>
          </a>
          <a routerLink="/admin/recruitment" class="quick-link" data-testid="dashboard-stat-recruitment">
            <mat-icon aria-hidden="true">campaign</mat-icon>
            <span>Recrutement</span>
          </a>
          <a routerLink="/admin/config" class="quick-link" data-testid="dashboard-stat-config">
            <mat-icon aria-hidden="true">settings</mat-icon>
            <span>Config</span>
          </a>
        </div>
      </div>

      <!-- Section Analytics -->
      <section class="analytics-section">
        <div class="section-header">
          <h2>Analytics</h2>
          @if (!analyticsUnavailable()) {
            <span class="badge">Google Analytics</span>
          } @else {
            <span class="badge badge--unavailable">Non configuré</span>
          }
        </div>

        @if (analyticsUnavailable()) {
          <!-- État GA non configuré -->
          <div class="analytics-unconfigured">
            <mat-icon class="unconfigured-icon">analytics</mat-icon>
            <p>Analytics non configuré</p>
            <span>Connectez Google Analytics dans les paramètres pour voir les métriques.</span>
          </div>
        } @else {
          <div class="analytics-grid" [class.analytics-grid--loaded]="!analyticsLoading()">
            @for (metric of analyticsMetrics(); track metric.title) {
              <div class="metric-card" [attr.data-testid]="'dashboard-stat-' + metric.title.toLowerCase().replace(/ /g, '-').replace(/'/g, '')">
                <div class="metric-header">
                  <mat-icon class="metric-icon">{{ metric.icon }}</mat-icon>
                  <span class="metric-title">{{ metric.title }}</span>
                </div>
                @if (analyticsLoading()) {
                  <div class="metric-value metric-value--skeleton">—</div>
                  <div class="skeleton-bar"></div>
                } @else {
                  <div class="metric-value">{{ metric.value }}</div>
                  @if (metric.change !== null) {
                    <div class="metric-change" [class.metric-change--positive]="metric.change > 0" [class.metric-change--negative]="metric.change < 0">
                      <mat-icon class="change-icon">{{ metric.change >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                      <span>{{ metric.change >= 0 ? '+' : '' }}{{ metric.change | number:'1.1-1' }}%</span>
                    </div>
                  }
                }
              </div>
            }
          </div>

          <div class="analytics-footer">
            <a routerLink="/admin/analytics" class="analytics-link">
              Voir les analytics détaillés
              <mat-icon class="link-icon">arrow_forward</mat-icon>
            </a>
          </div>
        }
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

      h2 {
        margin: 0 0 0.25rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--white);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--gray);
      }
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .quick-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(50, 210, 153, 0.06);
      border: 1px solid var(--darkGreen);
      border-radius: 8px;
      color: var(--gray);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 500;
      transition: all 0.2s ease;

      mat-icon {
        font-size: 1.125rem;
        width: 1.125rem;
        height: 1.125rem;
        color: var(--green);
      }

      &:hover {
        border-color: rgba(50, 210, 153, 0.4);
        color: var(--white);
        background: rgba(50, 210, 153, 0.1);
      }
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

        &--unavailable {
          background: rgba(211, 211, 211, 0.05);
          border-color: rgba(211, 211, 211, 0.15);
          color: rgba(211, 211, 211, 0.4);
        }
      }
    }

    /* État non configuré */
    .analytics-unconfigured {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 3rem 1rem;
      background: var(--darkBackground);
      border: 1px solid var(--darkGreen);
      border-radius: 10px;
      text-align: center;

      .unconfigured-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
        color: rgba(211, 211, 211, 0.2);
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(211, 211, 211, 0.5);
      }

      span {
        font-size: 0.8125rem;
        color: rgba(211, 211, 211, 0.3);
        max-width: 360px;
      }
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      position: relative;

      /* Overlay skeleton uniquement pendant le chargement */
      &:not(.analytics-grid--loaded)::before {
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
      color: var(--white);
      line-height: 1;

      &--skeleton {
        color: rgba(211, 211, 211, 0.3);
      }
    }

    .metric-change {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(211, 211, 211, 0.4);

      .change-icon {
        font-size: 0.875rem;
        width: 0.875rem;
        height: 0.875rem;
      }

      &--positive {
        color: var(--green);
      }

      &--negative {
        color: #f44336;
      }
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

    /* Footer analytics avec lien */
    .analytics-footer {
      margin: 1rem 0 0;
      display: flex;
      justify-content: flex-end;
    }

    .analytics-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--green);
      text-decoration: none;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.75;
      }

      .link-icon {
        font-size: 1rem;
        width: 1rem;
        height: 1rem;
      }
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
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly analyticsService = inject(AnalyticsAdminService);

  // Signals pour l'utilisateur
  readonly userName = computed(() => this.authService.user()?.email?.split('@')[0] || 'Admin');
  readonly userRole = computed(() => this.authService.role()?.name || 'Admin');

  // Signal pour la date/heure actuelle (mise à jour toutes les minutes)
  readonly currentDateTime = signal(this.formatDateTime());

  // Signals analytics
  readonly analyticsLoading = signal<boolean>(true);
  readonly analyticsUnavailable = signal<boolean>(false);

  private readonly overviewData = signal<OverviewResponse | null>(null);
  private readonly realtimeData = signal<RealtimeResponse | null>(null);

  /** Métriques calculées depuis les données GA ou skeleton si en chargement.
   * FIX ALPHA-001 : accès via .value et .changePercent (MetricWithComparison).
   * FIX BETA-005 : formatNumber/formatDuration importés depuis format.utils.
   */
  readonly analyticsMetrics = computed<AnalyticsMetric[]>(() => {
    const overview = this.overviewData();
    const realtime = this.realtimeData();

    return [
      {
        title: 'Visiteurs aujourd\'hui',
        icon: 'people',
        value: overview ? formatNumber(overview.metrics.totalUsers.value) : '—',
        change: overview ? overview.metrics.totalUsers.changePercent : null
      },
      {
        title: 'Pages vues (7j)',
        icon: 'visibility',
        value: overview ? formatNumber(overview.metrics.pageViews.value) : '—',
        change: overview ? overview.metrics.pageViews.changePercent : null
      },
      {
        title: 'Sessions actives',
        icon: 'radio_button_checked',
        value: realtime ? formatNumber(realtime.activeUsers) : '—',
        change: null
      },
      {
        title: 'Taux de rebond',
        icon: 'trending_down',
        value: overview ? `${overview.metrics.bounceRate.value.toFixed(1)}%` : '—',
        change: overview ? overview.metrics.bounceRate.changePercent : null
      },
      {
        title: 'Durée moyenne',
        icon: 'schedule',
        value: overview ? formatDuration(overview.metrics.avgSessionDuration.value) : '—',
        change: overview ? overview.metrics.avgSessionDuration.changePercent : null
      },
      {
        title: 'Nouveaux visiteurs',
        icon: 'person_add',
        value: overview ? formatNumber(overview.metrics.newUsers.value) : '—',
        change: overview ? overview.metrics.newUsers.changePercent : null
      }
    ];
  });

  constructor() {
    // Mise à jour de l'horloge toutes les minutes
    effect((onCleanup) => {
      const interval = setInterval(() => {
        this.currentDateTime.set(this.formatDateTime());
      }, 60000); // 60 secondes

      onCleanup(() => clearInterval(interval));
    });
  }

  ngOnInit(): void {
    this.loadAnalytics();
  }

  /** Charge les données analytics (overview 7j + realtime) en parallèle.
   * Les deux observables sont protégés par catchError pour éviter de bloquer le forkJoin.
   */
  private loadAnalytics(): void {
    const { startDate, endDate } = this.getLast7Days();

    forkJoin({
      overview: this.analyticsService.getOverview(startDate, endDate).pipe(
        catchError((err) => {
          if (err?.status === 503) {
            this.analyticsUnavailable.set(true);
          }
          return of(null);
        })
      ),
      realtime: this.analyticsService.getRealtime().pipe(
        catchError(() => of(null))
      )
    }).subscribe(({ overview, realtime }) => {
      this.overviewData.set(overview);
      this.realtimeData.set(realtime);
      this.analyticsLoading.set(false);
    });
  }

  /** Retourne les dates de début et fin des 7 derniers jours au format YYYY-MM-DD */
  private getLast7Days(): { startDate: string; endDate: string } {
    const now = new Date();
    const end = now.toISOString().split('T')[0];

    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().split('T')[0];

    return { startDate, endDate: end };
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
