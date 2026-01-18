
export interface NavigationPage {
  label: string,
  path: string,
  active: boolean,
  className?: string|null,
  isDropdown?: boolean,
}

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
    path: '#',
    active: true,
    className: null,
    isDropdown: true
  },
  {
    label: 'boutique',
    path: '/shop',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'contact',
    path: '/contact',
    active: true,
    className: 'button-link-border',
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
    active: false,
    path: '/structure',
  },
  {
    label: 'palmarès',
    active: false,
    path: '/structure/palmares',
  },
  {
    label: 'équipes/ambassadeurs',
    active: false,
    path: '/structure/equipes',
  },
  {
    label: 'nos sponsors',
    active: true,
    path: '/structure/sponsors',
  },
  {
    label: 'recrutement',
    active: true,
    path: '/structure/recrutement',
  },
  {
    label: 'boutique',
    active: true,
    path: '/shop'
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
