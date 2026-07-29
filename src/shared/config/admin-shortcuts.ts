/**
 * Registre central des raccourcis admin.
 *
 * Convention de nommage :
 * - `key`     : identifiant unique en kebab-case, correspondant au dernier segment
 *               de la route admin (ex. "users", "twitch-channels"). "dashboard" pour la racine.
 * - `section` : groupe d'affichage dans la sidebar. Absent = zone epinglee haute.
 *
 * Chaque entree de `requiredPermissions` doit etre satisfaite (mode AND).
 * Si `requiredPermissions` est vide, le raccourci est visible pour tout utilisateur authentifie.
 *
 * Spec : docs/superpowers/specs/2026-07-29-admin-shell-refonte-design.md
 */

/** Groupes d'affichage de la sidebar admin. `undefined` = zone epinglee. */
export type AdminShortcutSection = 'esport' | 'contenu' | 'boutique' | 'structure' | 'admin';

/**
 * Ordre d'affichage des groupes dans la sidebar.
 *
 * Source unique de l'ordre. Ne jamais iterer sur la `Map` retournee par
 * `AdminShortcutsService.shortcutsBySection()` : son ordre d'iteration est celui
 * d'insertion, donc celui de `ADMIN_SHORTCUTS`. Boucler sur cette constante et
 * lire la Map par cle.
 */
export const SECTION_ORDER: readonly AdminShortcutSection[] = [
  'esport',
  'contenu',
  'boutique',
  'structure',
  'admin',
] as const;

/** Libelles affiches en en-tete de groupe. */
export const SECTION_LABELS: Record<AdminShortcutSection, string> = {
  esport: 'Compétition',
  contenu: 'Contenu',
  boutique: 'Boutique',
  structure: 'Structure',
  admin: 'Administration',
};

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
  /** Groupe d'affichage. Absent = zone epinglee haute (Dashboard, Statistiques). */
  section?: AdminShortcutSection;
}

/**
 * Liste exhaustive des raccourcis admin.
 *
 * L'ordre reflete l'ordre d'affichage de la sidebar : zone epinglee d'abord,
 * puis les groupes dans l'ordre de `SECTION_ORDER`.
 *
 * Le groupe `boutique` est declare dans le type mais ne porte encore aucune entree :
 * Boutique et Commandes arrivent avec la branche `feat/boutique-collection-2026`.
 * La regle de degradation (groupe sans item -> rien rendu) le laisse invisible
 * jusqu'au merge, sans code mort ni condition speciale.
 */
export const ADMIN_SHORTCUTS: AdminShortcut[] = [
  // ─── Zone epinglee ────────────────────────────────────────────────────────
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'speed',
    route: '/admin',
    requiredPermissions: [],
    section: undefined,
  },
  {
    key: 'analytics',
    label: 'Statistiques',
    icon: 'bar_chart',
    route: '/admin/analytics',
    requiredPermissions: ['analytics:read'],
    section: undefined,
  },

  // ─── Competition ──────────────────────────────────────────────────────────
  {
    key: 'teams',
    label: 'Équipes',
    icon: 'groups',
    route: '/admin/teams',
    requiredPermissions: ['teams:read'],
    section: 'esport',
  },
  {
    key: 'games',
    label: 'Jeux',
    icon: 'sports_esports',
    route: '/admin/games',
    requiredPermissions: ['games:read'],
    section: 'esport',
  },
  // Matchs et Palmarès rejoindront ce groupe au merge d'EPIC-37
  // (`feat/epic-37-palmares`) : leurs routes et composants n'existent pas sur `main`.

  // ─── Contenu ──────────────────────────────────────────────────────────────
  {
    key: 'articles',
    label: 'Articles',
    icon: 'article',
    route: '/admin/articles',
    requiredPermissions: ['articles:read'],
    section: 'contenu',
  },
  {
    key: 'twitch-channels',
    label: 'Live Twitch',
    icon: 'live_tv',
    route: '/admin/twitch-channels',
    requiredPermissions: ['twitch_channels:read'],
    section: 'contenu',
  },
  {
    key: 'sponsors',
    label: 'Sponsors',
    icon: 'handshake',
    route: '/admin/sponsors',
    requiredPermissions: ['sponsors:read'],
    section: 'contenu',
  },

  // ─── Structure ────────────────────────────────────────────────────────────
  {
    key: 'staff',
    label: 'Staff',
    icon: 'badge',
    route: '/admin/staff',
    requiredPermissions: ['staff:read'],
    section: 'structure',
  },
  {
    key: 'recruitment',
    label: 'Recrutement',
    icon: 'campaign',
    route: '/admin/recruitment',
    requiredPermissions: ['recrutement:read'],
    section: 'structure',
  },

  // ─── Administration ───────────────────────────────────────────────────────
  {
    key: 'users',
    label: 'Comptes',
    icon: 'manage_accounts',
    route: '/admin/users',
    requiredPermissions: ['users:read'],
    section: 'admin',
  },
  {
    key: 'roles',
    label: 'Rôles',
    icon: 'shield',
    route: '/admin/roles',
    requiredPermissions: ['roles:read'],
    section: 'admin',
  },
  {
    key: 'config',
    label: 'Paramètres',
    icon: 'settings',
    route: '/admin/config',
    requiredPermissions: ['config:read'],
    section: 'admin',
  },
];
