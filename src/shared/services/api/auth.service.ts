import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, of, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import type { User, AuthResponse, LoginRequest } from '../../models';

const TOKEN_KEY = 'dvg_auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  // State management avec signals
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());
  private readonly userSignal = signal<User | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly initializedSignal = signal<boolean>(false);
  private initPromise: Promise<boolean> | null = null;

  // Computed properties
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly isTokenPresent = computed(() => !!this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);
  readonly permissions = computed(() => this.userSignal()?.role?.permissions ?? []);
  readonly loading = computed(() => this.loadingSignal());
  readonly initialized = computed(() => this.initializedSignal());

  constructor() {
    // Initialiser l'authentification au démarrage
    this.initialize();
  }

  /**
   * Initialise l'authentification en chargeant le profil si un token existe.
   * Retourne une Promise qui se résout quand l'initialisation est terminée.
   */
  initialize(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    const token = this.tokenSignal();
    if (!token) {
      this.initializedSignal.set(true);
      this.initPromise = Promise.resolve(false);
      return this.initPromise;
    }

    this.initPromise = firstValueFrom(this.loadProfile()).then(
      user => {
        this.initializedSignal.set(true);
        // Si on a un user, on est authentifié
        // Si on n'a pas de user mais on a toujours un token,
        // c'était probablement une erreur réseau - on garde le token
        return !!user;
      },
      () => {
        this.initializedSignal.set(true);
        // En cas d'erreur, on vérifie si on a toujours un token
        // (le token ne sera effacé que sur 401)
        return !!this.tokenSignal();
      }
    );

    return this.initPromise;
  }

  /**
   * Attend que l'authentification soit initialisée.
   * Utile pour les guards qui doivent attendre le chargement du profil.
   */
  async waitForInitialization(): Promise<boolean> {
    return this.initialize();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.setToken(response.access_token);
        this.userSignal.set(response.user);
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  // register(data: RegisterRequest): Observable<AuthResponse> {
  //   this.loadingSignal.set(true);
  //   return this.api.post<AuthResponse>('/auth/register', data).pipe(
  //     tap(response => {
  //       this.setToken(response.access_token);
  //       this.userSignal.set(response.user);
  //       this.loadingSignal.set(false);
  //     }),
  //     catchError(error => {
  //       this.loadingSignal.set(false);
  //       throw error;
  //     })
  //   );
  // }

  logout(): void {
    this.api.post('/api/auth/logout', {}).subscribe({
      complete: () => {
        this.clearSession();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.clearSession();
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
        // Seul un 401 signifie que le token est invalide et doit être supprimé
        // Les autres erreurs (réseau, 500, etc.) ne doivent pas déconnecter l'utilisateur
        if (error.status === 401) {
          this.clearSession();
        }
        return of(null);
      })
    );
  }

  refreshToken(): Observable<{ access_token: string }> {
    return this.api.post<{ access_token: string }>('/api/auth/refresh', {}).pipe(
      tap(response => {
        this.setToken(response.access_token);
      })
    );
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

  getToken(): string | null {
    return this.tokenSignal();
  }

  private getStoredToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this.tokenSignal.set(token);
  }

  private clearSession(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}
