import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { formatDuration, formatNumber, formatPercent } from '../utils/format.utils';

export type KpiFormat = 'number' | 'duration' | 'percent';

/**
 * Carte KPI affichant une métrique principale, son évolution et une icone
 * Supporte les formats : nombre entier, durée (mm:ss), pourcentage
 *
 * US-empty-metrics-placeholder : input `noData` pour afficher "--" avec tooltip
 * quand la donnée n'est pas disponible sur la période.
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="kpi-card" [class.no-data]="noData()">
      <div class="kpi-header">
        <span class="kpi-title">{{ title() }}</span>
        <div class="kpi-icon-wrapper">
          <mat-icon class="kpi-icon" aria-hidden="true">{{ icon() }}</mat-icon>
        </div>
      </div>

      @if (noData()) {
        <div
          class="kpi-value kpi-value--empty"
          title="Donnée non disponible sur cette période"
          aria-label="Donnée non disponible"
        >--</div>
      } @else {
        <div class="kpi-value">{{ formattedValue() }}</div>

        @if (change() !== null) {
          <div class="kpi-change" [class.positive]="invertChange() ? change()! < 0 : change()! >= 0" [class.negative]="invertChange() ? change()! >= 0 : change()! < 0">
            <span class="sr-only">Variation {{ title() }} :</span>
            <mat-icon class="change-arrow" aria-hidden="true">
              {{ change()! >= 0 ? 'trending_up' : 'trending_down' }}
            </mat-icon>
            <span>{{ change()! >= 0 ? '+' : '' }}{{ change() | number: '1.1-1' }}%</span>
            <span class="vs-label">vs période précédente</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
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

    .kpi-card {
      background: var(--admin-overlay-subtle);
      border: 1px solid var(--admin-accent-border);
      border-radius: var(--admin-radius-lg);
      padding: var(--admin-space-5) var(--admin-space-6);
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-2);
      transition: border-color 0.2s ease;

      &:hover {
        border-color: var(--admin-accent-ring);
      }

      &.no-data {
        opacity: 0.6;
        border-color: var(--admin-border);

        &:hover {
          border-color: var(--admin-border-light);
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .kpi-card { transition: none; }
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .kpi-title {
      font-size: var(--admin-font-sm);
      color: var(--admin-text-quiet);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: var(--admin-accent-bg-subtle);
      border-radius: var(--admin-radius-sm);
    }

    .kpi-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: var(--green);
    }

    .kpi-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--admin-text);
      line-height: 1.1;

      &--empty {
        font-size: var(--admin-font-2xl);
        color: var(--admin-text-faint);
        cursor: help;
      }
    }

    .kpi-change {
      display: flex;
      align-items: center;
      gap: var(--admin-space-1);
      font-size: var(--admin-font-sm);
      font-weight: 600;

      &.positive {
        color: var(--green);
      }

      &.negative {
        color: var(--admin-danger);
      }

      .change-arrow {
        font-size: var(--admin-font-lg);
        width: 1rem;
        height: 1rem;
      }

      .vs-label {
        font-size: var(--admin-font-2xs);
        font-weight: 400;
        color: var(--admin-text-faint);
        margin-left: 0.25rem;
      }
    }

    @media (max-width: 599px) {
      .vs-label {
        display: none;
      }
    }
  `]
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<number>();
  readonly change = input<number | null>(null);
  readonly icon = input<string>('bar_chart');
  readonly format = input<KpiFormat>('number');
  readonly invertChange = input<boolean>(false);
  /** US-empty-metrics-placeholder : si true, affiche "--" + tooltip "Donnée non disponible" */
  readonly noData = input<boolean>(false);

  // FIX BETA-005 : délégation aux fonctions utilitaires centralisées
  readonly formattedValue = computed(() => {
    const v = this.value();
    switch (this.format()) {
      case 'duration': return formatDuration(v);
      case 'percent':  return formatPercent(v);
      case 'number':
      default:         return formatNumber(v);
    }
  });
}
