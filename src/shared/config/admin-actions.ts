/**
 * Registre des actions de creation exposees par la palette de commandes.
 *
 * Pendant du registre `ADMIN_SHORTCUTS`, qui ne decrit que des destinations.
 * Meme contrat de permissions (mode AND), meme principe : aucune action n'est
 * codee en dur dans un template.
 *
 * Spec : docs/superpowers/specs/2026-07-29-admin-shell-refonte-design.md
 */

/**
 * Parametre d'URL par lequel la palette demande a une page d'ouvrir son
 * formulaire de creation.
 *
 * La plupart des creations admin passent par un dialogue porte par la page de
 * liste, sans route propre : sans ce parametre, la palette ne pourrait que
 * deposer l'utilisateur sur la liste, a lui de retrouver le bouton.
 */
export const CREATE_QUERY_PARAM = 'nouveau';

/** Description d'une action de creation. */
export interface AdminAction {
  /** Identifiant unique en kebab-case. */
  key: string;
  /** Libelle affiche dans la palette. */
  label: string;
  /** Nom d'icone Material Icons. */
  icon: string;
  /** Route a ouvrir. */
  route: string;
  /** Parametres d'URL a joindre, quand la creation n'a pas de route propre. */
  queryParams?: Record<string, string>;
  /** Permissions toutes requises (mode AND). */
  requiredPermissions: string[];
}

/** Les parametres qui declenchent l'ouverture d'un formulaire de creation. */
const CREATE_PARAMS: Record<string, string> = { [CREATE_QUERY_PARAM]: '1' };

export const ADMIN_ACTIONS: AdminAction[] = [
  {
    key: 'article-new',
    label: 'Nouvel article',
    icon: 'post_add',
    // Seule creation admin a disposer de sa propre route.
    route: '/admin/articles/new',
    requiredPermissions: ['articles:write'],
  },
  {
    key: 'match-new',
    label: 'Nouveau match',
    icon: 'add_circle',
    route: '/admin/matches',
    queryParams: CREATE_PARAMS,
    requiredPermissions: ['matches:write'],
  },
  {
    key: 'trophy-new',
    label: 'Nouveau trophée',
    icon: 'add_circle',
    route: '/admin/trophies',
    queryParams: CREATE_PARAMS,
    requiredPermissions: ['trophies:write'],
  },
  {
    key: 'sponsor-new',
    label: 'Nouveau sponsor',
    icon: 'add_circle',
    route: '/admin/sponsors',
    queryParams: CREATE_PARAMS,
    requiredPermissions: ['sponsors:write'],
  },
  {
    key: 'recruitment-new',
    label: 'Nouvelle offre',
    icon: 'add_circle',
    route: '/admin/recruitment',
    queryParams: CREATE_PARAMS,
    requiredPermissions: ['recrutement:write'],
  },
];
