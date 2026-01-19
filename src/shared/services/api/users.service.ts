import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'ADMIN' | 'COMMUNITY_MANAGER';
}

export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'COMMUNITY_MANAGER';
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly api = inject(ApiService);

  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  create(user: CreateUserRequest): Observable<User> {
    return this.api.post<User>('/users', user);
  }
}
