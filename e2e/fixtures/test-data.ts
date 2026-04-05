/**
 * Données de test partagées pour les tests E2E
 *
 * Ces constantes sont utilisées dans les fixtures et les tests.
 * Les credentials sont ceux du compte admin de développement local.
 */

/** Compte administrateur de test */
export const TEST_ADMIN = {
  email: 'admin@teamdivergentes.fr',
  password: 'admin123',
};

/** Jeu de test E2E — utilisé pour les tests CRUD sur la page Admin Jeux */
export const TEST_GAME = {
  key: 'test-e2e',
  name: 'Test Game E2E',
  keyUpdated: 'test-e2e-v2',
  nameUpdated: 'Test Game E2E Updated',
};

/** Membre du staff de test E2E — utilisé pour les tests CRUD sur la page Admin Staff */
export const TEST_STAFF = {
  name: 'Test Staff E2E',
  role: 'Rôle de test E2E',
  category: 'ADMIN' as const,
  nameUpdated: 'Test Staff E2E Updated',
  roleUpdated: 'Rôle de test E2E Updated',
};

/** Message de contact de test */
export const TEST_CONTACT = {
  name: 'Test Nom E2E',
  email: 'test-e2e@example.com',
  message: 'Ceci est un message de test E2E, suffisamment long pour passer la validation.',
  subject: 'Général',
};

/** Sponsor de test */
export const TEST_SPONSOR = {
  name: 'Test Sponsor E2E',
};

/** URLs de base */
export const BASE_URLS = {
  dev: 'http://localhost:4200',
  docker: 'http://localhost:8080',
  api: 'http://localhost:3000',
} as const;

/** Routes publiques */
export const PUBLIC_ROUTES = {
  home: '/',
  contact: '/contact',
  boutique: '/boutique',
  structure: '/structure',
  sponsors: '/structure/sponsors',
  equipes: '/structure/equipes',
  recrutement: '/structure/recrutement',
  notFound: '/404',
} as const;

/** Routes admin */
export const ADMIN_ROUTES = {
  dashboard: '/admin',
  users: '/admin/users',
  roles: '/admin/roles',
  staff: '/admin/staff',
  teams: '/admin/teams',
  games: '/admin/games',
  sponsors: '/admin/sponsors',
  articles: '/admin/articles',
  recruitment: '/admin/recruitment',
  config: '/admin/config',
  analytics: '/admin/analytics',
} as const;

/** Timeouts standardisés */
export const TIMEOUTS = {
  /** Timeout court pour des éléments qui devraient être déjà présents */
  short: 5000,
  /** Timeout normal pour des actions courantes */
  normal: 10000,
  /** Timeout long pour le chargement initial de l'app Angular (APP_INITIALIZER) */
  appInit: 20000,
  /** Timeout pour les opérations API */
  api: 15000,
} as const;
