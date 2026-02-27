import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { ChartConfiguration, ChartData } from 'chart.js';
import { TrafficSourcesResponse } from '../../../../shared/models';

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
 * Graphique en anneau affichant la répartition des sources de trafic
 */
@Component({
  selector: 'app-traffic-sources-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartDirective, DecimalPipe],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">Sources de trafic</h3>

      @if (data() && data()!.channels.length > 0) {
        <div class="chart-layout">
          <div class="chart-wrapper">
            <canvas
              baseChart
              [data]="chartData()"
              [options]="chartOptions"
              type="doughnut"
            ></canvas>
          </div>

          <ul class="channel-legend">
            @for (channel of data()!.channels; track channel.channel; let i = $index) {
              <li class="channel-item">
                <span class="channel-dot" [style.background]="getColor(i)"></span>
                <span class="channel-name">{{ channel.channel }}</span>
                <span class="channel-pct">{{ channel.percentage | number: '1.1-1' }}%</span>
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
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(50, 210, 153, 0.12);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }

    .chart-title {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--white, #fff);
    }

    .chart-layout {
      display: flex;
      align-items: center;
      gap: 1.5rem;
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
      gap: 0.5rem;
      flex: 1;
      min-width: 160px;
    }

    .channel-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
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
      color: rgba(211, 211, 211, 0.8);
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
      color: rgba(211, 211, 211, 0.4);
      font-size: 0.875rem;
    }
  `]
})
export class TrafficSourcesChartComponent {
  readonly data = input<TrafficSourcesResponse | null>(null);

  readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };

    return {
      labels: d.channels.map(c => c.channel),
      datasets: [{
        data: d.channels.map(c => c.sessions),
        backgroundColor: d.channels.map((_, i) => CHANNEL_COLORS[i % CHANNEL_COLORS.length]),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  });

  readonly chartOptions: ChartConfiguration['options'] = {
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
}
