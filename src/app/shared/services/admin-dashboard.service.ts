import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api/api.service';

/** Brouillon affiche par le bloc "Reprendre". */
export interface DashboardDraft {
  id: number;
  title: string;
  slug: string;
  updatedAt: string;
  /** Vrai si le brouillon appartient a l'utilisateur connecte. */
  isMine: boolean;
}

/**
 * Compteurs du bloc "A faire".
 *
 * Chaque champ est optionnel : le backend l'omet quand la permission de lecture
 * manque. Un compteur omis et un compteur a zero doivent produire le meme
 * rendu — la ligne n'apparait pas, sans message d'acces refuse.
 */
export interface DashboardTodo {
  matchesWithoutScore?: number;
  articlesWithoutImage?: number;
  matchesWithoutStream?: number;
  dormantDrafts?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(ApiService);

  getResume(): Observable<{ drafts: DashboardDraft[] }> {
    return this.api.get<{ drafts: DashboardDraft[] }>('/api/admin/dashboard/resume');
  }

  getTodo(): Observable<DashboardTodo> {
    return this.api.get<DashboardTodo>('/api/admin/dashboard/todo');
  }
}
