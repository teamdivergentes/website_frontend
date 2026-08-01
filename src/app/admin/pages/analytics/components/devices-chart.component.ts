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

// Chart.register est idempotent — chaque composant standalone enregistre ses dépendances
// pour fonctionner indépendamment, sans dépendre d'un provider centralisé.
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

import { DevicesResponse } from '../../../../shared/models';

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#32D299',
  mobile: '#5C6BC0',
  tablet: '#FF7043'
};

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Bureau',
  mobile: 'Mobile',
  tablet: 'Tablette'
};

/**
 * Graphique en anneau pour la répartition desktop / mobile / tablette.
 * Utilise byCategory et byBrowser (FIX ALPHA-001) depuis la réponse backend.
 */
@Component({
  selector: 'app-devices-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective, DecimalPipe],
  template: `
    <div class="chart-card">
      <h3 class="chart-title">Appareils</h3>

      @if (data() && data()!.byCategory.length > 0) {
        <div class="chart-layout">
          <div class="chart-wrapper">
            <!-- FIX BETA-007 : role="img" + aria-label dynamique -->
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

          <ul class="device-legend" aria-label="Légende des appareils">
            @for (device of data()!.byCategory; track device.category) {
              <li class="device-item">
                <span class="device-dot" [style.background]="getDeviceColor(device.category)" aria-hidden="true"></span>
                <span class="device-name">{{ getDeviceLabel(device.category) }}</span>
                <span class="device-pct">{{ device.percentage | number: '1.1-1' }}%</span>
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
      width: 140px;
      height: 140px;
      flex-shrink: 0;
    }

    .device-legend {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-3);
      flex: 1;
    }

    .device-item {
      display: flex;
      align-items: center;
      gap: var(--admin-space-2);
      font-size: var(--admin-font-md);
    }

    .device-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: var(--admin-radius-xs);
      flex-shrink: 0;
    }

    .device-name {
      flex: 1;
      color: var(--admin-text-muted);
    }

    .device-pct {
      color: var(--white, #fff);
      font-weight: 600;
      min-width: 3.5rem;
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
export class DevicesChartComponent {
  readonly data = input<DevicesResponse | null>(null);

  // FIX ALPHA-001 : utilisation de byCategory au lieu de devices, et totalUsers au lieu de users
  readonly chartData = computed<ChartData<'doughnut'>>(() => {
    const d = this.data();
    if (!d) return { labels: [], datasets: [] };

    return {
      labels: d.byCategory.map(dev => this.getDeviceLabel(dev.category)),
      datasets: [{
        data: d.byCategory.map(dev => dev.totalUsers),
        backgroundColor: d.byCategory.map(dev => this.getDeviceColor(dev.category)),
        borderWidth: 0,
        hoverOffset: 4
      }]
    };
  });

  // FIX BETA-007 : label aria dynamique
  readonly chartAriaLabel = computed(() => {
    const d = this.data();
    if (!d || d.byCategory.length === 0) return 'Graphique appareils : aucune donnée';
    const parts = d.byCategory
      .map(dev => `${this.getDeviceLabel(dev.category)} : ${dev.percentage.toFixed(1)}%`)
      .join(', ');
    return `Répartition des appareils — ${parts}`;
  });

  readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
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

  getDeviceColor(category: string): string {
    return DEVICE_COLORS[category.toLowerCase()] ?? '#888';
  }

  getDeviceLabel(category: string): string {
    return DEVICE_LABELS[category.toLowerCase()] ?? category;
  }
}
