import { Component, ChangeDetectionStrategy, input, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { ChartConfiguration, ChartData } from 'chart.js';
import { VisitorsResponse } from '../../../../shared/models';

// Enregistrement minimal des composants Chart.js nécessaires pour un line chart
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

/**
 * Graphique en ligne affichant l'évolution des visiteurs dans le temps
 * Deux séries : total utilisateurs (vert) et nouveaux utilisateurs (gris)
 */
@Component({
  selector: 'app-visitors-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-card">
      <div class="chart-header">
        <h3 class="chart-title">Évolution des visiteurs</h3>
        <div class="legend">
          <span class="legend-dot green"></span><span class="legend-label">Total</span>
          <span class="legend-dot gray"></span><span class="legend-label">Nouveaux</span>
        </div>
      </div>

      @if (data()) {
        <div class="chart-wrapper">
          <canvas
            baseChart
            [data]="chartData()"
            [options]="chartOptions"
            type="line"
          ></canvas>
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

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .chart-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--white, #fff);
    }

    .legend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: rgba(211, 211, 211, 0.6);
    }

    .legend-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;

      &.green { background: #32D299; }
      &.gray  { background: rgba(211, 211, 211, 0.4); }
    }

    .legend-label {
      margin-right: 0.5rem;
    }

    .chart-wrapper {
      position: relative;
      height: 260px;
    }

    .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(211, 211, 211, 0.4);
      font-size: 0.875rem;
    }
  `]
})
export class VisitorsChartComponent {
  readonly data = input<VisitorsResponse | null>(null);

  readonly chartData = computed<ChartData<'line'>>(() => {
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };

    const labels = d.data.map(item =>
      new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Total utilisateurs',
          data: d.data.map(item => item.totalUsers),
          borderColor: '#32D299',
          backgroundColor: 'rgba(50, 210, 153, 0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#32D299',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Nouveaux utilisateurs',
          data: d.data.map(item => item.newUsers),
          borderColor: 'rgba(211, 211, 211, 0.4)',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointBackgroundColor: 'rgba(211, 211, 211, 0.4)',
          pointRadius: 2,
          pointHoverRadius: 4,
          fill: false,
          tension: 0.4,
          borderDash: [4, 4]
        }
      ]
    };
  });

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(12, 13, 12, 0.9)',
        titleColor: '#fff',
        bodyColor: 'rgba(211, 211, 211, 0.8)',
        borderColor: 'rgba(50, 210, 153, 0.3)',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(211,211,211,0.5)', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(211,211,211,0.5)', font: { size: 11 } },
        beginAtZero: true
      }
    }
  };
}
