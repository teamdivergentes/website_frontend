/** Contrat public — GET /api/trophies (sans active ni timestamps) */
export interface Trophy {
  id: number;
  competition: string;
  placement: number;
  description?: string | null;
  date: string;
  image?: string | null;
  featured: boolean;
  teamId?: number | null;
  teamName?: string | null;
  teamSlug?: string | null;
  /** Clé du jeu de l'équipe liée (ex : 'lol') — null si pas d'équipe ou équipe sans jeu */
  teamGame?: string | null;
}

/** Contrat admin — GET /api/admin/trophies, POST, PATCH */
export interface TrophyAdmin extends Trophy {
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTrophyDto {
  competition: string;
  placement: number;
  description?: string | null;
  date: string;
  image?: string | null;
  featured?: boolean;
  /**
   * Association du trophée à une équipe. Deux modes mutuellement exclusifs,
   * alignés sur le backend (matches/trophies) :
   *  - `teamId` : rattachement à une équipe EXISTANTE (relation forte). Le backend
   *    dérive alors `teamName`, `teamSlug` et `teamGame` depuis l'entité liée.
   *  - `teamLabel` : libellé TEXTE LIBRE pour une équipe non référencée (équipe
   *    historique, dissoute, ou externe). Aucun lien relationnel, sert d'affichage.
   * Renseigner `teamId` OU `teamLabel`, jamais les deux.
   */
  teamId?: number | null;
  teamLabel?: string | null;
  active?: boolean;
}

export type UpdateTrophyDto = Partial<CreateTrophyDto>;
