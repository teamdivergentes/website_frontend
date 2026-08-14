/**
 * Types d'icônes disponibles dans le projet
 * Centralisé pour éviter la duplication entre les composants
 */
export enum ProjectIconType {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  MENU = 'menu',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TIKTOK = 'tiktok',
  MAIL = 'mail'
}

/**
 * Configuration pour les composants d'icônes
 */
export interface IconConfig {
  iconType: ProjectIconType;
  iconLink?: string | null;
  width?: number;
  height?: number;
  color?: string;
}
