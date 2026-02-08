/**
 * Catégories de staff
 */
export enum StaffCategory {
  ADMIN = 'ADMIN',
  HEADSTAFF = 'HEADSTAFF',
  AMBASSADOR = 'AMBASSADOR'
}

/**
 * Réseaux sociaux du staff
 */
export interface StaffSocials {
  twitter?: string;
  discord?: string;
  youtube?: string;
  twitch?: string;
}

/**
 * Membre du staff
 */
export interface StaffMember {
  id: number;
  name: string;
  role: string;
  category: StaffCategory;
  image?: string;
  position: number;
  socials?: StaffSocials;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * DTO pour créer un membre du staff
 */
export interface CreateStaffDto {
  name: string;
  role: string;
  category: StaffCategory;
  image?: string;
  position?: number;
  socials?: StaffSocials;
}

/**
 * DTO pour mettre à jour un membre du staff
 */
export interface UpdateStaffDto {
  name?: string;
  role?: string;
  category?: StaffCategory;
  image?: string;
  position?: number;
  socials?: StaffSocials;
}
