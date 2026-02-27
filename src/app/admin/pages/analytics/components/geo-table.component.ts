import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GeoResponse, GeoCountry } from '../../../../shared/models';

/**
 * Tableau des top pays avec barre de progression proportionnelle
 */
@Component({
  selector: 'app-geo-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="geo-card">
      <h3 class="geo-title">Répartition géographique</h3>

      @if (topCountries().length > 0) {
        <ul class="country-list">
          @for (country of topCountries(); track country.countryCode) {
            <li class="country-item">
              <div class="country-info">
                <span class="country-name">{{ country.country }}</span>
                <span class="country-users">{{ country.users | number }}</span>
              </div>
              <div class="progress-bar-wrapper">
                <div
                  class="progress-bar"
                  [style.width.%]="getPercent(country)"
                ></div>
              </div>
              <span class="country-sessions">{{ country.sessions | number }} sessions</span>
            </li>
          }
        </ul>
      } @else {
        <div class="geo-empty">Aucune donnée disponible</div>
      }
    </div>
  `,
  styles: [`
    .geo-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(50, 210, 153, 0.12);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }

    .geo-title {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--white, #fff);
    }

    .country-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .country-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .country-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .country-name {
      font-size: 0.875rem;
      color: rgba(211, 211, 211, 0.85);
      font-weight: 500;
    }

    .country-users {
      font-size: 0.875rem;
      color: var(--white, #fff);
      font-weight: 700;
    }

    .progress-bar-wrapper {
      height: 4px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #32D299, rgba(50, 210, 153, 0.5));
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .country-sessions {
      font-size: 0.6875rem;
      color: rgba(211, 211, 211, 0.4);
    }

    .geo-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: rgba(211, 211, 211, 0.4);
      font-size: 0.875rem;
    }
  `]
})
export class GeoTableComponent {
  readonly data = input<GeoResponse | null>(null);

  readonly topCountries = computed<GeoCountry[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [...d.countries]
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
  });

  readonly maxUsers = computed<number>(() => {
    const countries = this.topCountries();
    if (!countries.length) return 1;
    return countries[0].users;
  });

  getPercent(country: GeoCountry): number {
    const max = this.maxUsers();
    if (!max) return 0;
    return Math.round((country.users / max) * 100);
  }
}
