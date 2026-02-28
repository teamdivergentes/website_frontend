/**
 * Interface représentant un jeu
 */
export interface Game {
  id: number;
  key: string;
  name: string;
  image: string | null;
  position: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO pour créer un jeu
 */
export interface CreateGameDto {
  key: string;
  name: string;
  image?: string;
  position?: number;
  active?: boolean;
}

/**
 * DTO pour mettre à jour un jeu
 */
export interface UpdateGameDto {
  key?: string;
  name?: string;
  image?: string;
  position?: number;
  active?: boolean;
}
