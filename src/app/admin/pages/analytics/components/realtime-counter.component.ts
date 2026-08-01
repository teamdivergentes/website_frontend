import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { interval, EMPTY } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsAdminService } from '../../../../shared/services';
import { RealtimeResponse } from '../../../../shared/models';

/**
 * Compteur temps réel des utilisateurs actifs sur le site.
 * Se rafraîchit automatiquement toutes les 30 secondes.
 * Fonctionne avec takeUntilDestroyed pour une gestion propre des abonnements.
 * Un catchError dans le switchMap (FIX ALPHA-002) empêche l'erreur de tuer l'observable de polling.
 */
@Component({
  selector: 'app-realtime-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="realtime-card">
      <div class="realtime-header">
        <div class="realtime-badge">
          <span class="pulse-dot" aria-hidden="true"></span>
          <span class="badge-label">En direct</span>
        </div>
        <span class="refresh-label">Actualisation toutes les 30s</span>
      </div>

      @if (loading()) {
        <div class="loading-state" role="status" aria-label="Chargement des données temps réel">
          <div class="spinner"></div>
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon aria-hidden="true">wifi_off</mat-icon>
          <span>Données indisponibles</span>
        </div>
      } @else if (data()) {
        <div class="active-count">
          <span class="count-value" [attr.aria-label]="data()!.activeUsers + ' utilisateurs actifs en ce moment'">
            {{ data()!.activeUsers }}
          </span>
          <span class="count-label" aria-hidden="true">utilisateurs actifs</span>
        </div>

        @if (data()!.byPage.length > 0) {
          <div class="active-pages">
            <p class="pages-title">Pages en cours de consultation</p>
            <ul class="pages-list">
              @for (page of data()!.byPage; track page.page) {
                <li class="page-item">
                  <span class="page-path">{{ page.page }}</span>
                  <span class="page-users">{{ page.activeUsers }}</span>
                </li>
              }
            </ul>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .realtime-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(50, 210, 153, 0.12);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .realtime-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .realtime-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .pulse-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: var(--admin-accent);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(50, 210, 153, 0.4);
      animation: pulse-realtime 2s ease-in-out infinite;
    }

    @keyframes pulse-realtime {
      0%, 100% { box-shadow: 0 0 0 0 rgba(50, 210, 153, 0.4); }
      50%       { box-shadow: 0 0 0 8px rgba(50, 210, 153, 0); }
    }

    /* FIX BETA-013 : respecter prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .pulse-dot { animation: none; }
      .spinner { animation: none; }
    }

    .badge-label {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--admin-accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .refresh-label {
      font-size: 0.6875rem;
      color: rgba(211, 211, 211, 0.4);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 1rem;

      .spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(50, 210, 153, 0.2);
        border-top-color: var(--admin-accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(211, 211, 211, 0.4);
      font-size: 0.875rem;

      mat-icon { font-size: 1.125rem; width: 1.125rem; height: 1.125rem; }
    }

    .active-count {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;

      .count-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--admin-accent);
        line-height: 1;
      }

      .count-label {
        font-size: 0.875rem;
        color: rgba(211, 211, 211, 0.6);
      }
    }

    .pages-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(211, 211, 211, 0.45);
      margin: 0 0 0.5rem;
    }

    .pages-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .page-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.375rem 0.625rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 6px;
      font-size: 0.8125rem;

      .page-path {
        color: rgba(211, 211, 211, 0.8);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 80%;
      }

      .page-users {
        color: var(--admin-accent);
        font-weight: 600;
        min-width: 1.5rem;
        text-align: right;
      }
    }
  `]
})
export class RealtimeCounterComponent {
  private readonly analyticsService = inject(AnalyticsAdminService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly data = signal<RealtimeResponse | null>(null);

  constructor() {
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.analyticsService.getRealtime().pipe(
            catchError(() => {
              this.error.set(true);
              this.loading.set(false);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        this.data.set(response);
        this.loading.set(false);
        this.error.set(false);
      });
  }
}
