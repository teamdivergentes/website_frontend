import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'COMMUNITY_MANAGER';
  actif: boolean;
}

const TOKEN_KEY = 'dvg_auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);

  // State management avec signals
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());

  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(response => {
        this.setToken(response.access_token);
      })
    );
  }

  logout(): void {
    this.removeToken();
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

  private removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    this.tokenSignal.set(null);
  }
}
