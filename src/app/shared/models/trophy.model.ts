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
  teamId?: number | null;
  teamLabel?: string | null;
  active?: boolean;
}

export type UpdateTrophyDto = Partial<CreateTrophyDto>;
