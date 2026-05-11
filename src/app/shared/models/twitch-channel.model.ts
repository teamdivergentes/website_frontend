/**
 * Modèle d'une chaîne Twitch configurée dans l'admin DVG
 */
export interface TwitchChannelTeamMember {
  id: number;
  name: string;
  role: string;
  team: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface TwitchChannel {
  id: number;
  twitchUsername: string;
  displayName?: string;
  gameLabel?: string;
  description?: string;
  teamMemberId?: number;
  teamMember?: TwitchChannelTeamMember;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO pour créer une chaîne Twitch
 */
export interface CreateTwitchChannelDto {
  twitchUsername: string;
  displayName?: string;
  gameLabel?: string;
  description?: string;
  teamMemberId?: number | null;
  position?: number;
  isActive?: boolean;
}

/**
 * DTO pour mettre à jour une chaîne Twitch (partiel)
 */
export interface UpdateTwitchChannelDto {
  twitchUsername?: string;
  displayName?: string | null;
  gameLabel?: string | null;
  description?: string | null;
  teamMemberId?: number | null;
  position?: number;
  isActive?: boolean;
}

/**
 * Statut live d'un streamer (endpoint GET /api/twitch/live)
 */
export interface TwitchLiveStream {
  twitchUsername: string;
  isLive: boolean;
  title?: string;
  viewerCount?: number;
  gameName?: string;
  thumbnailUrl?: string;
}
