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
    label: 'boutique',
    path: '/boutique',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'contact',
    path: '/contact',
    active: true,
    className: 'button-link-border'
  },
  {
    label: 'stream',
    path: '/twitch',
    active: false,
    className: 'text-primary-hover'
  },
  {
    label: 'articles',
    path: '/articles',
    active: false,
    className: 'primary text-primary-hover'
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
    active: false,
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
    label: 'boutique',
    active: true,
    path: '/boutique'
  },
  {
    label: 'contact',
    active: true,
    path: '/contact'
  },
  {
    label: 'articles',
    active: false,
    path: '/articles'
  }
];
