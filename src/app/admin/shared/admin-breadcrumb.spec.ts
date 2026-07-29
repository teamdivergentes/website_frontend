import { ADMIN_SHORTCUTS } from '../../../shared/config/admin-shortcuts';
import { buildAdminBreadcrumb } from './admin-breadcrumb';

/** Raccourci de lecture : la suite des libelles, separateurs implicites. */
function labels(url: string): string[] {
  return buildAdminBreadcrumb(url).map((segment) => segment.label);
}

describe('buildAdminBreadcrumb', () => {
  // ─── Zone epinglee : pas de niveau intermediaire ───────────────────────────

  it('n’insère pas de groupe pour le Dashboard', () => {
    expect(labels('/admin')).toEqual(['Admin', 'Dashboard']);
  });

  it('n’insère pas de groupe pour les Statistiques', () => {
    expect(labels('/admin/analytics')).toEqual(['Admin', 'Statistiques']);
  });

  // ─── Groupe intermediaire ─────────────────────────────────────────────────

  it('insère le groupe entre la racine et la page', () => {
    expect(labels('/admin/articles')).toEqual(['Admin', 'Contenu', 'Articles']);
  });

  it('couvre les quatre groupes du registre', () => {
    expect(labels('/admin/teams')).toEqual(['Admin', 'Compétition', 'Équipes']);
    expect(labels('/admin/commandes')).toEqual(['Admin', 'Boutique', 'Commandes']);
    expect(labels('/admin/staff')).toEqual(['Admin', 'Structure', 'Staff']);
    expect(labels('/admin/users')).toEqual(['Admin', 'Administration', 'Comptes']);
  });

  // ─── Regression du bug : trois pages affichaient "Admin" ──────────────────

  it('nomme les trois pages que le mapping code en dur ignorait', () => {
    // `routeTitles` ne connaissait ni twitch-channels, ni trophies, ni matches :
    // le fil d'Ariane y affichait "Admin" tout court.
    expect(labels('/admin/twitch-channels')).toEqual(['Admin', 'Contenu', 'Live Twitch']);
    expect(labels('/admin/trophies')).toEqual(['Admin', 'Compétition', 'Palmarès']);
    expect(labels('/admin/matches')).toEqual(['Admin', 'Compétition', 'Matchs']);
  });

  it('nomme toutes les routes du registre, sans exception', () => {
    // Verrou : toute entree ajoutee au registre doit etre nommee par le fil
    // d'Ariane. C'est precisement ce que la desynchronisation avait casse.
    for (const shortcut of ADMIN_SHORTCUTS) {
      const trail = labels(shortcut.route);
      expect(trail[trail.length - 1])
        .withContext(`route ${shortcut.route}`)
        .toBe(shortcut.label);
    }
  });

  // ─── Sous-pages ───────────────────────────────────────────────────────────

  it('rattache la création d’article à sa page parente', () => {
    expect(labels('/admin/articles/new')).toEqual([
      'Admin',
      'Contenu',
      'Articles',
      'Nouvel article',
    ]);
  });

  it('rattache l’édition d’article à sa page parente', () => {
    expect(labels('/admin/articles/edit/42')).toEqual([
      'Admin',
      'Contenu',
      'Articles',
      "Modifier l'article",
    ]);
  });

  it('rend la page parente cliquable depuis une sous-page', () => {
    const trail = buildAdminBreadcrumb('/admin/articles/edit/42');
    expect(trail[2]).toEqual({ label: 'Articles', route: '/admin/articles' });
  });

  it('ne rend pas cliquable le dernier niveau, qui est la page courante', () => {
    const trail = buildAdminBreadcrumb('/admin/articles');
    expect(trail[trail.length - 1].route).toBeUndefined();
  });

  it('retombe sur le libellé de la page parente pour une sous-page inconnue', () => {
    expect(labels('/admin/teams/7/membres')).toEqual(['Admin', 'Compétition', 'Équipes']);
  });

  // ─── Robustesse ───────────────────────────────────────────────────────────

  it('ignore la query string et le fragment', () => {
    expect(labels('/admin/articles?page=2#haut')).toEqual(['Admin', 'Contenu', 'Articles']);
  });

  it('tolère une barre oblique finale', () => {
    expect(labels('/admin/articles/')).toEqual(['Admin', 'Contenu', 'Articles']);
  });

  it('n’affiche que la racine pour une route admin inconnue', () => {
    // Ne jamais retomber sur "Dashboard" : `/admin` prefixe toutes les routes
    // admin, une correspondance par prefixe naive nommerait mal chaque page.
    expect(labels('/admin/inexistant')).toEqual(['Admin']);
  });

  it('n’affiche que la racine hors de l’espace admin', () => {
    expect(labels('/structure/equipes')).toEqual(['Admin']);
  });
});
