import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { AnalyticsAdminService } from '../../../shared/services';
import {
  OverviewResponse,
  VisitorsResponse,
  TopPagesResponse,
  TrafficSourcesResponse,
  GeoResponse,
  DevicesResponse,
  DateRange
} from '../../../shared/models';

import { DateRangePickerComponent } from './components/date-range-picker.component';
import { KpiCardComponent } from './components/kpi-card.component';
import { VisitorsChartComponent } from './components/visitors-chart.component';
import { TopPagesTableComponent } from './components/top-pages-table.component';
import { TrafficSourcesChartComponent } from './components/traffic-sources-chart.component';
import { DevicesChartComponent } from './components/devices-chart.component';
import { GeoTableComponent } from './components/geo-table.component';
import { RealtimeCounterComponent } from './components/realtime-counter.component';

/**
 * Dashboard Analytics principal
 * Charge toutes les données en parallèle via forkJoin selon la plage de dates sélectionnée
 * Gère l'état "GA non configuré" (erreur 503) avec un message explicatif
 */
@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DateRangePickerComponent,
    KpiCardComponent,
    VisitorsChartComponent,
    TopPagesTableComponent,
    TrafficSourcesChartComponent,
    DevicesChartComponent,
    GeoTableComponent,
    RealtimeCounterComponent
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent {
  private readonly analyticsService = inject(AnalyticsAdminService);

  // ─── State ────────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly errorType = signal<'none' | 'not_configured' | 'generic'>('none');
  readonly currentRange = signal<DateRange | null>(null);

  // ─── Data signals ─────────────────────────────────────────────────────────
  readonly overview = signal<OverviewResponse | null>(null);
  readonly visitors = signal<VisitorsResponse | null>(null);
  readonly topPages = signal<TopPagesResponse | null>(null);
  readonly trafficSources = signal<TrafficSourcesResponse | null>(null);
  readonly geography = signal<GeoResponse | null>(null);
  readonly devices = signal<DevicesResponse | null>(null);

  // ─── Computed helpers ─────────────────────────────────────────────────────
  readonly hasData = computed(() => this.overview() !== null);
  readonly isNotConfigured = computed(() => this.errorType() === 'not_configured');
  readonly hasGenericError = computed(() => this.errorType() === 'generic');

  // ─── KPI accessors ────────────────────────────────────────────────────────
  readonly kpiTotalUsers = computed(() => this.overview()?.metrics.totalUsers ?? 0);
  readonly kpiNewUsers = computed(() => this.overview()?.metrics.newUsers ?? 0);
  readonly kpiSessions = computed(() => this.overview()?.metrics.sessions ?? 0);
  readonly kpiPageViews = computed(() => this.overview()?.metrics.pageViews ?? 0);
  readonly kpiAvgDuration = computed(() => this.overview()?.metrics.avgSessionDuration ?? 0);
  readonly kpiBounceRate = computed(() => this.overview()?.metrics.bounceRate ?? 0);

  readonly kpiChangeTotalUsers = computed(() => this.overview()?.comparison.totalUsers.change ?? null);
  readonly kpiChangeNewUsers = computed(() => this.overview()?.comparison.newUsers.change ?? null);
  readonly kpiChangeSessions = computed(() => this.overview()?.comparison.sessions.change ?? null);
  readonly kpiChangePageViews = computed(() => this.overview()?.comparison.pageViews.change ?? null);
  readonly kpiChangeAvgDuration = computed(() => this.overview()?.comparison.avgSessionDuration.change ?? null);
  readonly kpiChangeBounceRate = computed(() => this.overview()?.comparison.bounceRate.change ?? null);

  /**
   * Appelé par le date-range-picker lors d'un changement de période
   */
  onRangeChange(range: DateRange): void {
    this.currentRange.set(range);
    this.loadAllData(range);
  }

  retry(): void {
    const range = this.currentRange();
    if (range) {
      this.loadAllData(range);
    }
  }

  private loadAllData(range: DateRange): void {
    this.loading.set(true);
    this.errorType.set('none');

    forkJoin({
      overview: this.analyticsService.getOverview(range.startDate, range.endDate),
      visitors: this.analyticsService.getVisitors(range.startDate, range.endDate),
      topPages: this.analyticsService.getTopPages(range.startDate, range.endDate),
      trafficSources: this.analyticsService.getTrafficSources(range.startDate, range.endDate),
      geography: this.analyticsService.getGeography(range.startDate, range.endDate),
      devices: this.analyticsService.getDevices(range.startDate, range.endDate)
    }).subscribe({
      next: (data) => {
        this.overview.set(data.overview);
        this.visitors.set(data.visitors);
        this.topPages.set(data.topPages);
        this.trafficSources.set(data.trafficSources);
        this.geography.set(data.geography);
        this.devices.set(data.devices);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        // 503 = Google Analytics non configuré
        if (err?.status === 503) {
          this.errorType.set('not_configured');
        } else {
          this.errorType.set('generic');
        }
      }
    });
  }
}
