import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AnalyticsAdminService } from '../../../../shared/services/analytics-admin.service';
import { OverviewResponse, RealtimeResponse } from '../../../../shared/models/analytics.model';
import { formatNumber, formatDuration } from '../../../pages/analytics/utils/format.utils';

/** Définition d'une métrique affichée dans la grille analytics */
export interface AnalyticsMetric {
  title: string;
  icon: string;
  value: string;
  change: number | null;
}

/**
 * Section analytics du dashboard : métriques Google Analytics (overview 7j + realtime).
 * Gère le chargement, l'état skeleton et l'état "non configuré" (503).
 */
@Component({
  selector: 'app-dashboard-traffic',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-traffic.component.html',
  styleUrl: './dashboard-traffic.component.scss'
})
export class DashboardTrafficComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsAdminService);

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
}
