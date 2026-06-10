/**
 * Configuration de la navigation du site
 */
export interface NavigationPage {
  label: string;
  path: string;
  active: boolean;
  className?: string | null;
  isDropdown?: boolean;
  /** Indique si c'est un sous-élément (pour l'indentation mobile) */
  isChild?: boolean;
  /** Supprime le séparateur | qui s'affiche avant cet item */
  noSeparator?: boolean;
}

/**
 * Navigation desktop - utilisée dans le header et le footer
 */
export const navigationPages: NavigationPage[] = [
  {
    label: 'accueil',
    path: '/',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'évènements',
    path: '/evenements',
    active: false,
    className: 'text-primary-hover'
  },
  {
    label: 'structure',
    path: '/structure',
    active: true,
    className: 'text-primary-hover',
    isDropdown: true
  },
  {
    label: 'articles',
    path: '/articles',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'boutique',
    path: '/boutique',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'contact',
    path: '/contact',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'EN LIVE',
    path: '/twitch',
    active: true,
    className: 'text-primary-hover',
    noSeparator: true
  }
];

/**
 * Navigation mobile - affichée dans le menu hamburger
 * Inclut les sous-pages de structure pour une navigation complète
 */
export const mobileNavigationPages: NavigationPage[] = [
  {
    label: 'accueil',
    active: true,
    path: '/'
  },
  {
    label: 'évènements',
    active: false,
    path: '/evenements'
  },
  {
    label: 'structure',
    active: true,
    path: '/structure'
  },
  {
    label: 'palmarès',
    active: true,
    path: '/structure/palmares',
    isChild: true
  },
  {
    label: 'équipes/ambassadeurs',
    active: true,
    path: '/structure/equipes',
    isChild: true
  },
  {
    label: 'nos sponsors',
    active: true,
    path: '/structure/sponsors',
    isChild: true
  },
  {
    label: 'recrutement',
    active: true,
    path: '/structure/recrutement',
    isChild: true
  },
  {
    label: 'articles',
    active: true,
    path: '/articles'
  },
  {
    label: 'boutique',
    active: true,
    path: '/boutique'
  },
  {
    label: 'contact',
    active: true,
    path: '/contact'
  }
  // Note : l'item EN LIVE (/twitch) est rendu séparément dans le menu mobile
  // avec sa LED pulsante (voir header.html + header.ts)
];
