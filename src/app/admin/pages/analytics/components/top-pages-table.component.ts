import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TopPagesResponse, PageData } from '../../../../shared/models';
import { formatDuration } from '../utils/format.utils';

// FIX ALPHA-001 : colonnes alignées sur les champs réels du backend (path, totalUsers, avgSessionDuration)
type SortColumn = 'pageViews' | 'totalUsers' | 'avgSessionDuration' | 'bounceRate';
type SortDirection = 'asc' | 'desc';

/**
 * Tableau des pages les plus visitées avec tri interactif par colonne.
 * Affiche les 10 premières pages par défaut.
 */
@Component({
  selector: 'app-top-pages-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="table-card">
      <h3 class="table-title">Top pages</h3>

      @if (data() && data()!.data.length > 0) {
        <div class="table-wrapper">
          <table class="pages-table">
            <!-- FIX BETA-008 : caption sr-only pour l'accessibilité -->
            <caption class="sr-only">Top pages les plus visitées, triables par colonne</caption>
            <thead>
              <tr>
                <th class="col-page" scope="col">Page</th>
                <th
                  class="col-num sortable"
                  scope="col"
                  tabindex="0"
                  (click)="sortBy('pageViews')"
                  (keydown.enter)="sortBy('pageViews')"
                  (keydown.space)="$event.preventDefault(); sortBy('pageViews')"
                  [class.active]="sortColumn() === 'pageViews'"
                  [attr.aria-sort]="getSortAriaAttr('pageViews')"
                >
                  Vues
                  <mat-icon class="sort-icon" aria-hidden="true">{{ getSortIcon('pageViews') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  scope="col"
                  tabindex="0"
                  (click)="sortBy('totalUsers')"
                  (keydown.enter)="sortBy('totalUsers')"
                  (keydown.space)="$event.preventDefault(); sortBy('totalUsers')"
                  [class.active]="sortColumn() === 'totalUsers'"
                  [attr.aria-sort]="getSortAriaAttr('totalUsers')"
                >
                  Utilisateurs
                  <mat-icon class="sort-icon" aria-hidden="true">{{ getSortIcon('totalUsers') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  scope="col"
                  tabindex="0"
                  (click)="sortBy('avgSessionDuration')"
                  (keydown.enter)="sortBy('avgSessionDuration')"
                  (keydown.space)="$event.preventDefault(); sortBy('avgSessionDuration')"
                  [class.active]="sortColumn() === 'avgSessionDuration'"
                  [attr.aria-sort]="getSortAriaAttr('avgSessionDuration')"
                >
                  Temps moy.
                  <mat-icon class="sort-icon" aria-hidden="true">{{ getSortIcon('avgSessionDuration') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  scope="col"
                  tabindex="0"
                  (click)="sortBy('bounceRate')"
                  (keydown.enter)="sortBy('bounceRate')"
                  (keydown.space)="$event.preventDefault(); sortBy('bounceRate')"
                  [class.active]="sortColumn() === 'bounceRate'"
                  [attr.aria-sort]="getSortAriaAttr('bounceRate')"
                >
                  Rebond
                  <mat-icon class="sort-icon" aria-hidden="true">{{ getSortIcon('bounceRate') }}</mat-icon>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (page of sortedPages(); track page.path) {
                <tr>
                  <td class="col-page">
                    <span class="page-path" [title]="page.path">{{ page.path }}</span>
                  </td>
                  <td class="col-num">{{ page.pageViews | number }}</td>
                  <td class="col-num">{{ page.totalUsers | number }}</td>
                  <td class="col-num">{{ formatDuration(page.avgSessionDuration) }}</td>
                  <td class="col-num">
                    <span
                      class="bounce-badge"
                      [class.high]="page.bounceRate > 70"
                      [class.medium]="page.bounceRate > 40 && page.bounceRate <= 70"
                    >
                      {{ page.bounceRate | number: '1.1-1' }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="table-empty">Aucune donnée disponible</div>
      }
    </div>
  `,
  styles: [`
    .table-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(50, 210, 153, 0.12);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }

    .table-title {
      margin: 0 0 1rem;
      font-size: 1rem;
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

    .table-wrapper {
      overflow-x: auto;
    }

    .pages-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;

      thead tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      th {
        padding: 0.625rem 0.75rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(211, 211, 211, 0.5);
        white-space: nowrap;

        &.sortable {
          cursor: pointer;
          user-select: none;
          display: table-cell;

          &:hover { color: rgba(211, 211, 211, 0.85); }
          &.active { color: var(--green, #32D299); }
        }

        .sort-icon {
          font-size: 0.875rem;
          width: 0.875rem;
          height: 0.875rem;
          vertical-align: middle;
          margin-left: 0.25rem;
          opacity: 0.7;
        }
      }

      tbody tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        transition: background 0.15s;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      }

      td {
        padding: 0.625rem 0.75rem;
        color: rgba(211, 211, 211, 0.8);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      tbody tr { transition: none; }
    }

    .col-page {
      min-width: 180px;
      max-width: 300px;
    }

    .col-num {
      text-align: right !important;
      white-space: nowrap;
    }

    .page-path {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 280px;
      color: rgba(211, 211, 211, 0.9);
    }

    .bounce-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
      background: rgba(50, 210, 153, 0.1);
      color: var(--green, #32D299);

      &.medium {
        background: rgba(255, 202, 40, 0.1);
        color: #FFCA28;
      }

      &.high {
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
      }
    }

    .table-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: rgba(211, 211, 211, 0.4);
      font-size: 0.875rem;
    }
  `]
})
export class TopPagesTableComponent {
  readonly data = input<TopPagesResponse | null>(null);

  readonly sortColumn = signal<SortColumn>('pageViews');
  readonly sortDirection = signal<SortDirection>('desc');

  // FIX BETA-005 : formatDuration importé depuis format.utils
  readonly formatDuration = formatDuration;

  readonly sortedPages = computed<PageData[]>(() => {
    const d = this.data();
    if (!d) return [];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    return [...d.data]
      .sort((a, b) => {
        const diff = a[col] - b[col];
        return dir === 'asc' ? diff : -diff;
      })
      .slice(0, 10);
  });

  sortBy(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'expand_less' : 'expand_more';
  }

  getSortAriaAttr(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }
}
