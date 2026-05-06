import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, of, Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
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

  /**
   * Promise de l'initialisation (singleton, cached).
   * @internal — exposee uniquement pour les tests des guards.
   * Ne pas manipuler depuis le code applicatif.
   */
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

    // Au bootstrap, on contourne l'ApiService + authInterceptor pour eviter
    // une circular DI silencieuse (HttpClient -> authInterceptor -> inject(AuthService)
    // -> ApiService -> HttpClient) qui empechait l'appel /api/auth/me en build prod AOT.
    // fetch direct + credentials:'include' suffit puisque le cookie HttpOnly est
    // attache automatiquement par le navigateur.
    this.initPromise = this.fetchProfileViaFetch().then(user => {
      this.initializedSignal.set(true);
      if (user) {
        this.userSignal.set(user);
        this.startRefreshTimer();
      }
      return !!user;
    });

    return this.initPromise;
  }

  /**
   * Charge le profil utilisateur via fetch direct au bootstrap pour eviter la
   * circular DI (HttpClient -> authInterceptor -> AuthService -> ApiService -> HttpClient).
   *
   * ATTENTION : cette methode contourne ApiService et l'authInterceptor.
   * Tout header custom ajoute a authInterceptor (ex: X-Request-ID, X-Client-Version)
   * doit etre duplique ici sous peine de divergence entre bootstrap et runtime.
   */
  private async fetchProfileViaFetch(): Promise<User | null> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/auth/me`, {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return null;
      const data = (await response.json()) as unknown;
      return AuthService.parseUser(data);
    } catch (err) {
      // Erreur reseau / CORS / parse JSON. L'utilisateur est traite comme non
      // authentifie (silencieusement). En dev on log pour faciliter le diagnostic.
      if (!environment.production) {
        console.warn('[AuthService] fetchProfileViaFetch failed:', err);
      }
      return null;
    }
  }

  /**
   * Validation runtime du shape User retourne par /api/auth/me.
   * Renvoie null si la reponse ne respecte pas le contrat attendu, evitant ainsi
   * qu'un objet malforme (backend compromis, schema migrate, MITM en dev) puisse
   * tromper les guards admin via des computed signals derives.
   */
  private static parseUser(data: unknown): User | null {
    if (!data || typeof data !== 'object') return null;
    const u = data as Partial<User> & { role?: Partial<User['role']> };
    if (typeof u.id !== 'number' || typeof u.email !== 'string') return null;
    if (!u.role || typeof u.role.name !== 'string' || !Array.isArray(u.role.permissions)) {
      return null;
    }
    return data as User;
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
