
interface NavigationPage {
  label: string,
  path: string,
  active: boolean,
  className?: string|null,
}

export const navigationPages: NavigationPage[] = [
  {
    label: 'accueil',
    path: '/',
    active: true,
    className: 'text-primary-hover'
  },
  {
    label: 'nos sponsors',
    active: true,
    path: '/sponsors',
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
    active: false,
    className: null
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
    active: false,
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
    active: false,
    path: '/structure/recrutement',
  },
  {
    label: 'boutique',
    active: false,
    path: '/shop'
  },
  {
    label: 'contact',
    active: false,
    path: '/contact'
  },
  {
    label: 'articles',
    active: false,
    path: '/articles'
  }
];
