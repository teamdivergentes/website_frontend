/**
 * Réseaux sociaux d'une équipe ou d'un membre
 */
export interface TeamSocials {
  twitter?: string;
  twitch?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  website?: string;
}

/**
 * Membre d'une équipe
 */
export interface TeamMember {
  id: number;
  name: string;
  realName?: string;
  role: string;
  image?: string;
  position: number;
  socials?: TeamSocials;
  joinedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Équipe
 */
export interface Team {
  id: number;
  name: string;
  slug: string;
  game: string;
  image?: string;
  banner?: string;
  description?: string;
  active: boolean;
  position: number;
  socials?: TeamSocials;
  membersCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Équipe avec ses membres
 */
export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

/**
 * DTO pour créer une équipe
 */
export interface CreateTeamDto {
  name: string;
  game: string;
  image?: string;
  banner?: string;
  description?: string;
  active?: boolean;
  socials?: TeamSocials;
}

/**
 * DTO pour mettre à jour une équipe
 */
export interface UpdateTeamDto {
  name?: string;
  game?: string;
  image?: string;
  banner?: string;
  description?: string;
  active?: boolean;
  socials?: TeamSocials;
}

/**
 * DTO pour créer un membre d'équipe
 */
export interface CreateMemberDto {
  name: string;
  role: string;
  realName?: string;
  image?: string;
  socials?: TeamSocials;
}

/**
 * DTO pour mettre à jour un membre d'équipe
 */
export interface UpdateMemberDto {
  name?: string;
  role?: string;
  realName?: string;
  image?: string;
  socials?: TeamSocials;
}
