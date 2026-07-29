/** Contrat public — GET /api/matches (sans active ni timestamps) */
export interface Match {
  id: number;
  teamId: number;
  teamName?: string | null;
  teamSlug?: string | null;
  teamGame?: string | null;
  opponentName: string;
  opponentLogo?: string | null;
  scheduledAt: string;
  competition?: string | null;
  streamUrl?: string | null;
  scoreDvg?: number | null;
  scoreOpponent?: number | null;
  articleId?: number | null;
  articleSlug?: string | null;
}

/** Contrat admin — GET /api/admin/matches, POST, PATCH */
export interface MatchAdmin extends Match {
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMatchDto {
  teamId: number;
  opponentName: string;
  opponentLogo?: string | null;
  scheduledAt: string;
  competition?: string | null;
  streamUrl?: string | null;
  scoreDvg?: number | null;
  scoreOpponent?: number | null;
  articleId?: number | null;
  active?: boolean;
}

export type UpdateMatchDto = Partial<CreateMatchDto>;
