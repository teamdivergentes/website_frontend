import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../../models';

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

  // Computed properties
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly user = computed(() => this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);
  readonly permissions = computed(() => this.userSignal()?.role?.permissions ?? []);
  readonly loading = computed(() => this.loadingSignal());

  constructor() {
    // Charger le profil au démarrage si un token existe
    if (this.tokenSignal()) {
      this.loadProfile();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
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

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
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

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe({
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

  loadProfile(): void {
    this.loadingSignal.set(true);
    this.api.get<User>('/auth/me').pipe(
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    ).subscribe(user => {
      this.userSignal.set(user);
      this.loadingSignal.set(false);
    });
  }

  refreshToken(): Observable<{ access_token: string }> {
    return this.api.post<{ access_token: string }>('/auth/refresh', {}).pipe(
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
