/**
 * Validateurs purs pour les membres d'équipe.
 * Fonctions sans dépendance angulaire, testables unitairement.
 */

export interface MemberFormValues {
  name: string;
  realName: string;
  role: string;
  image: string;
  nationality: string;
  birthDate: string;
  biography: string;
  twitter: string;
  twitch: string;
  instagram: string;
  youtube: string;
}

/**
 * Retourne true si au moins un réseau social est renseigné.
 */
export function hasSocialLinks(values: Pick<MemberFormValues, 'twitter' | 'twitch' | 'instagram' | 'youtube'>): boolean {
  return !!(values.twitter || values.twitch || values.instagram || values.youtube);
}

/**
 * Retourne le nombre de réseaux sociaux renseignés (0-4).
 */
export function socialLinkCount(values: Pick<MemberFormValues, 'twitter' | 'twitch' | 'instagram' | 'youtube'>): number {
  return [values.twitter, values.twitch, values.instagram, values.youtube].filter(Boolean).length;
}

/**
 * Construit un objet de reset pour le formulaire membre.
 * Utilisé après une sauvegarde réussie.
 */
export function buildEmptyFormValues(): MemberFormValues {
  return {
    name: '',
    realName: '',
    role: '',
    image: '',
    nationality: '',
    birthDate: '',
    biography: '',
    twitter: '',
    twitch: '',
    instagram: '',
    youtube: ''
  };
}
