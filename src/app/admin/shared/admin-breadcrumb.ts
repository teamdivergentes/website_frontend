import {
  ADMIN_SHORTCUTS,
  AdminShortcut,
  SECTION_LABELS,
} from '../../../shared/config/admin-shortcuts';

/** Un niveau du fil d'Ariane admin. */
export interface AdminBreadcrumbSegment {
  label: string;
  /**
   * Route cliquable. Absente pour les niveaux non navigables — la racine, les
   * en-tetes de groupe (non cliquables dans la sidebar aussi) et la page courante.
   */
  route?: string;
}

/** Racine de l'espace admin, toujours en tete du fil. */
const ROOT_LABEL = 'Admin';

/** Route du dashboard, exclue de la correspondance par prefixe (voir plus bas). */
const DASHBOARD_ROUTE = '/admin';

/**
 * Libelle d'une sous-page, designee soit par un debut d'URL fixe, soit par un
 * motif quand un identifiant precede le segment final.
 */
type SubpageLabel = { label: string } & ({ prefix: string } | { pattern: RegExp });

/**
 * Libelles des sous-pages, qui n'ont pas d'entree dans le registre parce
 * qu'elles ne sont pas des destinations de la sidebar.
 *
 * Ce n'est pas la duplication que cette US supprime : le registre ne porte
 * aucune donnee sur ces routes, c'est donc la seule source possible.
 */
const SUBPAGE_LABELS: SubpageLabel[] = [
  { prefix: '/admin/articles/new', label: 'Nouvel article' },
  { prefix: '/admin/articles/edit/', label: "Modifier l'article" },
  { prefix: '/admin/recruitment/new', label: 'Nouvelle offre' },
  { prefix: '/admin/recruitment/edit/', label: "Modifier l'offre" },
  { prefix: '/admin/roles/new', label: 'Nouveau rôle' },
  { prefix: '/admin/roles/edit/', label: 'Modifier le rôle' },
  // L'identifiant est au milieu du chemin : un prefixe ne peut pas le decrire
  // sans que les deux sous-pages d'une equipe se confondent.
  { pattern: /^\/admin\/teams\/\d+\/members$/, label: 'Membres' },
  { pattern: /^\/admin\/teams\/\d+\/coaching$/, label: 'Staff de coaching' },
];

function matchesSubpage(entry: SubpageLabel, path: string): boolean {
  return 'prefix' in entry ? path.startsWith(entry.prefix) : entry.pattern.test(path);
}

/** Retire query string, fragment et barre oblique finale. */
function normalize(url: string): string {
  const path = url.split(/[?#]/)[0];
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * Entree du registre correspondant a l'URL : correspondance exacte, sinon la
 * route la plus longue dont l'URL est une sous-page.
 *
 * `/admin` est exclu de la correspondance par prefixe : il prefixe *toutes* les
 * routes admin, et une correspondance naive nommerait donc "Dashboard" chaque
 * page inconnue.
 */
function findShortcut(path: string): AdminShortcut | undefined {
  let best: AdminShortcut | undefined;

  for (const shortcut of ADMIN_SHORTCUTS) {
    if (shortcut.route === path) return shortcut;
    if (shortcut.route === DASHBOARD_ROUTE) continue;
    if (!path.startsWith(`${shortcut.route}/`)) continue;
    if (!best || shortcut.route.length > best.route.length) best = shortcut;
  }

  return best;
}

/**
 * Construit le fil d'Ariane d'une route admin a partir du registre.
 *
 * Remplace le mapping `routeTitles` qu'`admin-header` maintenait a la main :
 * il ignorait `twitch-channels`, `trophies` et `matches`, ou le fil affichait
 * "Admin" tout court. Le registre porte deja `label`, `route` et `section`.
 */
export function buildAdminBreadcrumb(url: string): AdminBreadcrumbSegment[] {
  const path = normalize(url);
  const trail: AdminBreadcrumbSegment[] = [{ label: ROOT_LABEL }];

  const shortcut = findShortcut(path);
  if (!shortcut) return trail;

  if (shortcut.section) {
    trail.push({ label: SECTION_LABELS[shortcut.section] });
  }

  const isSubpage = path !== shortcut.route;
  trail.push(
    isSubpage ? { label: shortcut.label, route: shortcut.route } : { label: shortcut.label },
  );

  if (isSubpage) {
    const subpage = SUBPAGE_LABELS.find((entry) => matchesSubpage(entry, path));
    if (subpage) trail.push({ label: subpage.label });
  }

  return trail;
}
