import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  ChartConfiguration,
  ChartData
} from 'chart.js';
import { TrafficSourcesResponse } from '../../../../shared/models';

// Chart.register est idempotent — chaque composant standalone enregistre ses dépendances
// pour fonctionner indépendamment, sans dépendre d'un provider centralisé.
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const CHANNEL_COLORS = [
  '#32D299',
  '#28A785',
  '#1A7A5E',
  '#5C6BC0',
  '#FF7043',
  '#FFCA28',
  '#26C6DA',
  '#EC407A'
];

/**
 * Graphique en anneau affichant la répartition des sources de trafic.
 * Utilise byChannel (FIX ALPHA-001) depuis la réponse backend.
 */
@Component({
  selector: 'app-traffic-sources-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective, DecimalPipe],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">Sources de trafic</h3>

      @if (data() && data()!.byChannel.length > 0) {
        <div class="chart-layout">
          <div class="chart-wrapper">
            <!-- FIX BETA-007 : role="img" + aria-label pour l'accessibilité du graphique -->
            <canvas
              baseChart
              [data]="chartData()"
              [options]="chartOptions"
              type="doughnut"
              role="img"
              [attr.aria-label]="chartAriaLabel()"
            ></canvas>
          </div>

          <!-- FIX BETA-007 : résumé textuel sr-only -->
          <div class="sr-only">{{ chartAriaLabel() }}</div>

          <ul class="channel-legend" aria-label="Légende des sources de trafic">
            @for (channel of data()!.byChannel; track channel.channel; let i = $index) {
              <li class="channel-item">
                <span class="channel-dot" [style.background]="getColor(i)" aria-hidden="true"></span>
                <span class="channel-name">{{ channel.channel }}</span>
                <span class="channel-pct">{{ getChannelPercent(channel.sessions) | number: '1.1-1' }}%</span>
              </li>
            }
          </ul>
        </div>
      } @else {
        <div class="chart-empty">Aucune donnée disponible</div>
      }
    </div>
  `,
  styles: [`
    .chart-card {
      background: var(--admin-overlay-subtle);
      border: 1px solid var(--admin-accent-border);
      border-radius: var(--admin-radius-lg);
      padding: var(--admin-space-5) var(--admin-space-6);
      position: relative;
    }

    .chart-title {
      margin: 0 0 1rem;
      font-size: var(--admin-font-lg);
      font-weight: 600;
      color: var(--white, #fff);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .chart-layout {
      display: flex;
      align-items: center;
      gap: var(--admin-space-6);
      flex-wrap: wrap;
    }

    .chart-wrapper {
      width: 160px;
      height: 160px;
      flex-shrink: 0;
    }

    .channel-legend {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-2);
      flex: 1;
      min-width: 160px;
    }

    .channel-item {
      display: flex;
      align-items: center;
      gap: var(--admin-space-2);
      font-size: var(--admin-font-sm);
    }

    .channel-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .channel-name {
      flex: 1;
      color: var(--admin-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .channel-pct {
      color: var(--white, #fff);
      font-weight: 600;
      min-width: 3rem;
      text-align: right;
    }

    .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 120px;
      color: var(--admin-text-faint);
      font-size: var(--admin-font-md);
    }
  `]
})
export class TrafficSourcesChartComponent {
  readonly data = input<TrafficSourcesResponse | null>(null);

  private readonly totalSessions = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.byChannel.reduce((acc, c) => acc + c.sessions, 0);
  });

  // FIX ALPHA-001 : utilisation de byChannel au lieu de channels
  readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };

    return {
      labels: d.byChannel.map(c => c.channel),
      datasets: [{
        data: d.byChannel.map(c => c.sessions),
        backgroundColor: d.byChannel.map((_, i) => CHANNEL_COLORS[i % CHANNEL_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  });

  // FIX BETA-007 : label aria dynamique pour screen readers
  readonly chartAriaLabel = computed(() => {
    const d = this.data();
    if (!d || d.byChannel.length === 0) return 'Graphique sources de trafic : aucune donnée';
    const total = this.totalSessions();
    const parts = d.byChannel
      .map(c => `${c.channel} : ${Math.round((c.sessions / (total || 1)) * 100)}%`)
      .join(', ');
    return `Sources de trafic — ${parts}`;
  });

  readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(12, 13, 12, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(211, 211, 211, 0.8)',
        borderColor: 'rgba(50, 210, 153, 0.3)',
        borderWidth: 1
      }
    }
  };

  getColor(index: number): string {
    return CHANNEL_COLORS[index % CHANNEL_COLORS.length];
  }

  /** Calcule le pourcentage d'un canal par rapport au total des sessions */
  getChannelPercent(sessions: number): number {
    const total = this.totalSessions();
    return total > 0 ? (sessions / total) * 100 : 0;
  }
}
