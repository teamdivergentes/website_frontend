import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, of, firstValueFrom, Subscription, interval } from 'rxjs';
import { ApiService } from './api.service';
import type { User, AuthResponse, LoginRequest } from '../../models';

/** Intervalle de refresh proactif : toutes les 6 heures. */
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // State management avec Signals
  // Plus de tokenSignal : le cookie HttpOnly est la seule source de verite cote session.
  // isAuthenticated se base uniquement sur userSignal (charge via /api/auth/me).
  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly initializedSignal = signal<boolean>(false);

  /** Promise de l'initialisation (singleton, cached). */
  initPromise: Promise<boolean> | null = null;

  /** Subscription du timer de refresh proactif. */
  private refreshTimerSub: Subscription | null = null;

  // Computed properties
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly user = computed(() => this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);
  readonly permissions = computed(() => this.userSignal()?.role?.permissions ?? []);
  readonly loading = computed(() => this.loadingSignal());
  readonly initialized = computed(() => this.initializedSignal());

  constructor() {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.stopRefreshTimer();
  }

  initialize(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = firstValueFrom(this.loadProfile()).then(
      user => {
        this.initializedSignal.set(true);
        if (user) {
          this.startRefreshTimer();
        }
        return !!user;
      },
      () => {
        this.initializedSignal.set(true);
        return false;
      }
    );

    return this.initPromise;
  }

  async waitForInitialization(): Promise<boolean> {
    return this.initialize();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.userSignal.set(response.user);
        this.loadingSignal.set(false);
        this.initializedSignal.set(true);
        this.initPromise = Promise.resolve(true);
        this.startRefreshTimer();
        this.loadProfile().subscribe();
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    this.stopRefreshTimer();
    this.userSignal.set(null);
    this.initPromise = Promise.resolve(false);

    this.api.post('/api/auth/logout', {}).subscribe({
      complete: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  loadProfile(): Observable<User | null> {
    this.loadingSignal.set(true);
    return this.api.get<User>('/api/auth/me').pipe(
      tap(user => {
        this.userSignal.set(user);
        this.loadingSignal.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSignal.set(false);
        if (error.status === 401) {
          this.userSignal.set(null);
        }
        return of(null);
      })
    );
  }

  refreshToken(): Observable<void> {
    return this.api.post<void>('/api/auth/refresh', {});
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  hasRole(roleName: string): boolean {
    return this.role()?.name === roleName;
  }

  hasAnyRole(roleNames: string[]): boolean {
    const currentRole = this.role()?.name;
    return currentRole ? roleNames.includes(currentRole) : false;
  }

  startRefreshTimer(): void {
    if (this.refreshTimerSub && !this.refreshTimerSub.closed) {
      return;
    }
    this.refreshTimerSub = interval(REFRESH_INTERVAL_MS).subscribe(() => {
      if (this.isAuthenticated()) {
        this.refreshToken().subscribe({
          error: () => {
            // En cas d'echec, le flow 401 de l'intercepteur gere la deconnexion
          }
        });
      }
    });
  }

  stopRefreshTimer(): void {
    if (this.refreshTimerSub) {
      this.refreshTimerSub.unsubscribe();
      this.refreshTimerSub = null;
    }
  }
}
