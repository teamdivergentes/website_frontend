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
  nationality?: string;
  birthDate?: string;
  biography?: string;
  customFields?: Record<string, unknown>;
  slug?: string;
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
  membersCount?: number;
  memberFieldsConfig?: Array<{ key: string; label: string; type: string }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Membre du coaching staff d'une équipe
 */
export interface CoachingStaffMember {
  id: number;
  name: string;
  realName?: string;
  role: string;
  image?: string;
  biography?: string;
  position: number;
  teamId: number;
  slug?: string;
  socials?: TeamSocials;
  nationality?: string;
  birthDate?: string;
  customFields?: Record<string, unknown>;
  /** Équipe associée (présente sur la route by-slug) */
  team?: {
    id: number;
    slug: string;
    name: string;
    game: string;
    image?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * DTO pour créer un membre du coaching staff
 */
export interface CreateCoachingStaffDto {
  name: string;
  role: string;
  realName?: string;
  image?: string;
  biography?: string;
  position?: number;
  slug?: string;
  socials?: TeamSocials;
}

/**
 * DTO pour mettre à jour un membre du coaching staff
 */
export interface UpdateCoachingStaffDto {
  name?: string;
  role?: string;
  realName?: string | null;
  image?: string | null;
  biography?: string | null;
  position?: number;
  slug?: string;
  socials?: TeamSocials | null;
}

/**
 * DTO pour réordonner le coaching staff
 */
export interface ReorderCoachingStaffDto {
  items: Array<{ id: number; position: number }>;
}

/**
 * Équipe avec ses membres
 */
export interface TeamWithMembers extends Team {
  members: TeamMember[];
  coachingStaff?: CoachingStaffMember[];
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
}

/**
 * DTO pour mettre à jour une équipe
 */
export interface UpdateTeamDto {
  name?: string;
  game?: string;
  image?: string | null;
  banner?: string | null;
  description?: string | null;
  active?: boolean;
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
  nationality?: string;
  birthDate?: string;
  biography?: string;
  customFields?: Record<string, unknown>;
  slug?: string;
}

/**
 * DTO pour mettre à jour un membre d'équipe
 */
export interface UpdateMemberDto {
  name?: string;
  role?: string;
  realName?: string | null;
  image?: string | null;
  socials?: TeamSocials;
  nationality?: string | null;
  birthDate?: string | null;
  biography?: string | null;
  customFields?: Record<string, unknown>;
  slug?: string;
}
