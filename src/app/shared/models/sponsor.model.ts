/**
 * Modèles pour la gestion des sponsors
 */

export enum LinkType {
  WEBSITE = 'WEBSITE',
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  DISCORD = 'DISCORD',
  PROMO_CODE = 'PROMO_CODE',
  OTHER = 'OTHER'
}

/**
 * Layout des images du sponsor
 * Définit la position des images secondaires autour de l'image principale
 */
export enum ImageLayout {
  LAYOUT_1 = 'LAYOUT_1', // Secondaire 1 bas-gauche, Secondaire 2 haut-droite (comme Pulsar)
  LAYOUT_2 = 'LAYOUT_2', // Secondaire 1 haut-gauche, Secondaire 2 bas-droite (comme Monster)
  LAYOUT_3 = 'LAYOUT_3'  // Secondaire 1 haut-droite, Secondaire 2 bas-gauche (comme SecretLab)
}

export interface SponsorImage {
  id: number;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  position: number;
}

export interface SponsorLink {
  id: number;
  url: string;
  label: string;
  type: LinkType;
  isPrimary: boolean;
}

export interface Sponsor {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  active: boolean;
  imageLayout: ImageLayout;
  images: SponsorImage[];
  links: SponsorLink[];
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// DTOs
export interface CreateSponsorDto {
  name: string;
  description?: string;
  imageLayout?: ImageLayout;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSponsorDto {
  name?: string;
  description?: string;
  imageLayout?: ImageLayout;
  startDate?: string;
  endDate?: string;
}

export interface AddImageDto {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface AddLinkDto {
  url: string;
  label: string;
  type: LinkType;
  isPrimary?: boolean;
}

export interface UpdateLinkDto {
  url?: string;
  label?: string;
  type?: LinkType;
  isPrimary?: boolean;
}
