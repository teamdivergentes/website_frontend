import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game, CreateGameDto, UpdateGameDto } from '../models';

/**
 * Service de gestion des jeux
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/games`;

  // Signal contenant tous les jeux
  private readonly gamesSignal = signal<Game[]>([]);

  // Computed signal pour les jeux actifs triés par position
  readonly activeGames = computed(() =>
    this.gamesSignal()
      .filter(game => game.active)
      .sort((a, b) => a.position - b.position)
  );

  // Computed signal pour tous les jeux triés par position
  readonly allGames = computed(() =>
    this.gamesSignal().sort((a, b) => a.position - b.position)
  );

  /**
   * Charge tous les jeux depuis l'API
   */
  loadGames(): Observable<Game[]> {
    return this.http.get<Game[]>(this.apiUrl).pipe(
      tap(games => this.gamesSignal.set(games))
    );
  }

  /**
   * Charge uniquement les jeux actifs
   */
  loadActiveGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/active`).pipe(
      tap(games => this.gamesSignal.set(games))
    );
  }

  /**
   * Récupère un jeu par sa clé
   * @param key - Clé du jeu
   */
  getGameByKey(key: string): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${key}`);
  }

  /**
   * Crée un nouveau jeu
   * @param data - Données du jeu
   */
  createGame(data: CreateGameDto): Observable<Game> {
    return this.http.post<Game>(this.apiUrl, data).pipe(
      tap(newGame => {
        this.gamesSignal.set([...this.gamesSignal(), newGame]);
      })
    );
  }

  /**
   * Met à jour un jeu
   * @param id - ID du jeu
   * @param data - Données de mise à jour
   */
  updateGame(id: number, data: UpdateGameDto): Observable<Game> {
    return this.http.put<Game>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedGame => {
        const games = this.gamesSignal();
        const index = games.findIndex(g => g.id === id);
        if (index !== -1) {
          const newGames = [...games];
          newGames[index] = updatedGame;
          this.gamesSignal.set(newGames);
        }
      })
    );
  }

  /**
   * Supprime un jeu
   * @param id - ID du jeu
   */
  deleteGame(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const games = this.gamesSignal();
        this.gamesSignal.set(games.filter(g => g.id !== id));
      })
    );
  }

  /**
   * Réordonne les jeux
   * @param items - Tableau des jeux avec leur nouvelle position
   */
  reorderGames(items: { id: number; position: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { items }).pipe(
      tap(() => {
        const games = this.gamesSignal();
        const updatedGames = games.map(game => {
          const reorder = items.find(o => o.id === game.id);
          return reorder ? { ...game, position: reorder.position } : game;
        });
        this.gamesSignal.set(updatedGames);
      })
    );
  }

  /**
   * Active/désactive un jeu
   * @param id - ID du jeu
   */
  toggleGameActive(id: number): Observable<Game> {
    return this.http.patch<Game>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedGame => {
        const games = this.gamesSignal();
        const index = games.findIndex(g => g.id === id);
        if (index !== -1) {
          const newGames = [...games];
          newGames[index] = updatedGame;
          this.gamesSignal.set(newGames);
        }
      })
    );
  }

  /**
   * Seed les jeux initiaux (utile pour le setup initial)
   */
  seedGames(): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.apiUrl}/seed`, {});
  }
}
