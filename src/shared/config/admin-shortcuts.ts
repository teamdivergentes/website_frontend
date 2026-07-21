/**
 * Registre central des raccourcis admin.
 *
 * Convention de nommage :
 * - `key`     : identifiant unique en kebab-case, correspondant au dernier segment
 *               de la route admin (ex. "users", "twitch-channels"). "dashboard" pour la racine.
 * - `section` : groupe logique de la section dans la future navbar reorganisee.
 *               Valeurs possibles : 'content' | 'people' | 'config' | 'analytics' | 'tools'
 *
 * Chaque entree de `requiredPermissions` doit etre satisfaite (mode AND).
 * Si `requiredPermissions` est vide, le raccourci est visible pour tout utilisateur authentifie.
 */

/** Sections disponibles pour la future organisation navbar (Feature 2). */
export type AdminShortcutSection = 'content' | 'people' | 'config' | 'analytics' | 'tools';

/** Description d'un raccourci admin. */
export interface AdminShortcut {
  /** Identifiant unique en kebab-case (ex. "users", "twitch-channels"). */
  key: string;
  /** Libelle affiche dans l'interface. */
  label: string;
  /** Nom d'icone Material Icons (pour le dashboard) ou cle SVG (pour la sidebar FA). */
  icon: string;
  /** Chemin complet de la route admin (ex. "/admin/users"). */
  route: string;
  /**
   * Liste des permissions toutes requises (mode AND) pour afficher ce raccourci.
   * Tableau vide = visible pour tout utilisateur authentifie.
   */
  requiredPermissions: string[];
  /**
   * Section de regroupement pour la future reorganisation navbar (Feature 2 EPIC-28).
   * Optionnel ; peut etre absent si le raccourci ne s'y prete pas.
   */
  section?: AdminShortcutSection;
}

/**
 * Liste exhaustive des raccourcis admin.
 * Ordre : reflete l'ordre actuel de la sidebar (priorite metier decroissante).
 *
 * Sources auditees :
 * - `admin-sidebar.component.ts`   : ADMIN_MENU (12 entrees)
 * - `dashboard-stats.component.html` : quick-links (6 entrees)
 * - `header.html`                  : bouton "Administration" (1 entree unique, hors registre)
 */
export const ADMIN_SHORTCUTS: AdminShortcut[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/admin',
    requiredPermissions: [],
    section: undefined,
  },
  {
    key: 'users',
    label: 'Utilisateurs',
    icon: 'group',
    route: '/admin/users',
    requiredPermissions: ['users:read'],
    section: 'people',
  },
  {
    key: 'roles',
    label: 'Roles',
    icon: 'shield',
    route: '/admin/roles',
    requiredPermissions: ['roles:read'],
    section: 'config',
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: 'badge',
    route: '/admin/staff',
    requiredPermissions: ['staff:read'],
    section: 'people',
  },
  {
    key: 'teams',
    label: 'Equipes',
    icon: 'sports_esports',
    route: '/admin/teams',
    requiredPermissions: ['teams:read'],
    section: 'content',
  },
  {
    key: 'games',
    label: 'Jeux',
    icon: 'casino',
    route: '/admin/games',
    requiredPermissions: ['games:read'],
    section: 'content',
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
    icon: 'handshake',
    route: '/admin/sponsors',
    requiredPermissions: ['sponsors:read'],
    section: 'content',
  },
  {
    key: 'articles',
    label: 'Articles',
    icon: 'article',
    route: '/admin/articles',
    requiredPermissions: ['articles:read'],
    section: 'content',
  },
  {
    key: 'recruitment',
    label: 'Recrutement',
    icon: 'campaign',
    route: '/admin/recruitment',
    requiredPermissions: ['recrutement:read'],
    section: 'content',
  },
  {
    key: 'config',
    label: 'Configuration',
    icon: 'settings',
    route: '/admin/config',
    requiredPermissions: ['config:read'],
    section: 'config',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: 'bar_chart',
    route: '/admin/analytics',
    requiredPermissions: ['analytics:read'],
    section: 'analytics',
  },
  {
    key: 'twitch-channels',
    label: 'Twitch',
    icon: 'live_tv',
    route: '/admin/twitch-channels',
    requiredPermissions: ['twitch_channels:read'],
    section: 'tools',
  },
  {
    key: 'trophies',
    label: 'Palmarès',
    icon: 'emoji_events',
    route: '/admin/trophies',
    requiredPermissions: ['trophies:read'],
    section: 'content',
  },
  {
    key: 'matches',
    label: 'Matchs',
    icon: 'scoreboard',
    route: '/admin/matches',
    requiredPermissions: ['matches:read'],
    section: 'content',
  },
  {
    key: 'commandes',
    label: 'Commandes',
    icon: 'receipt_long',
    route: '/admin/commandes',
    requiredPermissions: ['commandes:read'],
    section: 'content',
  },
];
