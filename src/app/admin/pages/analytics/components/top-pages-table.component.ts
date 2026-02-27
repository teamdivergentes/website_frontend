import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TopPagesResponse, PageData } from '../../../../shared/models';

type SortColumn = 'pageViews' | 'uniquePageViews' | 'avgTimeOnPage' | 'bounceRate';
type SortDirection = 'asc' | 'desc';

/**
 * Tableau des pages les plus visitées avec tri interactif par colonne
 * Affiche les 10 premières pages par défaut
 */
@Component({
  selector: 'app-top-pages-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, DecimalPipe],
  template: `
    <div class="table-card">
      <h3 class="table-title">Top pages</h3>

      @if (data() && data()!.pages.length > 0) {
        <div class="table-wrapper">
          <table class="pages-table">
            <thead>
              <tr>
                <th class="col-page">Page</th>
                <th
                  class="col-num sortable"
                  (click)="sortBy('pageViews')"
                  [class.active]="sortColumn() === 'pageViews'"
                >
                  Vues
                  <mat-icon class="sort-icon">{{ getSortIcon('pageViews') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  (click)="sortBy('uniquePageViews')"
                  [class.active]="sortColumn() === 'uniquePageViews'"
                >
                  Vues uniques
                  <mat-icon class="sort-icon">{{ getSortIcon('uniquePageViews') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  (click)="sortBy('avgTimeOnPage')"
                  [class.active]="sortColumn() === 'avgTimeOnPage'"
                >
                  Temps moy.
                  <mat-icon class="sort-icon">{{ getSortIcon('avgTimeOnPage') }}</mat-icon>
                </th>
                <th
                  class="col-num sortable"
                  (click)="sortBy('bounceRate')"
                  [class.active]="sortColumn() === 'bounceRate'"
                >
                  Rebond
                  <mat-icon class="sort-icon">{{ getSortIcon('bounceRate') }}</mat-icon>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (page of sortedPages(); track page.page) {
                <tr>
                  <td class="col-page">
                    <span class="page-path" [title]="page.page">{{ page.page }}</span>
                  </td>
                  <td class="col-num">{{ page.pageViews | number }}</td>
                  <td class="col-num">{{ page.uniquePageViews | number }}</td>
                  <td class="col-num">{{ formatDuration(page.avgTimeOnPage) }}</td>
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

  readonly sortedPages = computed<PageData[]>(() => {
    const d = this.data();
    if (!d) return [];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    return [...d.pages]
      .slice(0, 10)
      .sort((a, b) => {
        const diff = a[col] - b[col];
        return dir === 'asc' ? diff : -diff;
      });
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

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
