import {
  ADMIN_SHORTCUTS,
  AdminShortcutSection,
  SECTION_LABELS,
  SECTION_ORDER,
} from './admin-shortcuts';

/** Récupère un raccourci par sa clé, ou échoue si absent du registre. */
function shortcut(key: string) {
  const found = ADMIN_SHORTCUTS.find(s => s.key === key);
  if (!found) {
    throw new Error(`Raccourci "${key}" absent du registre`);
  }
  return found;
}

describe('ADMIN_SHORTCUTS — registre des raccourcis admin', () => {
  // ─── Intégrité du registre ────────────────────────────────────────────────

  describe('intégrité', () => {
    it('chaque raccourci porte une section déclarée dans SECTION_ORDER, ou aucune', () => {
      for (const s of ADMIN_SHORTCUTS) {
        if (s.section !== undefined) {
          expect(SECTION_ORDER)
            .withContext(`raccourci "${s.key}"`)
            .toContain(s.section);
        }
      }
    });

    it('les clés sont uniques', () => {
      const keys = ADMIN_SHORTCUTS.map(s => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    it('les routes sont uniques', () => {
      const routes = ADMIN_SHORTCUTS.map(s => s.route);
      expect(new Set(routes).size).toBe(routes.length);
    });
  });

  // ─── SECTION_ORDER / SECTION_LABELS ───────────────────────────────────────

  describe('SECTION_ORDER', () => {
    it('déclare les 5 groupes dans l’ordre d’affichage validé', () => {
      expect(SECTION_ORDER).toEqual([
        'esport',
        'contenu',
        'boutique',
        'structure',
        'admin',
      ]);
    });

    it('ne contient pas de doublon', () => {
      expect(new Set(SECTION_ORDER).size).toBe(SECTION_ORDER.length);
    });
  });

  describe('SECTION_LABELS', () => {
    it('fournit un libellé pour chaque section de SECTION_ORDER', () => {
      for (const section of SECTION_ORDER) {
        expect(SECTION_LABELS[section])
          .withContext(`section "${section}"`)
          .toBeTruthy();
      }
    });

    it('ne déclare aucun libellé orphelin', () => {
      const labelKeys = Object.keys(SECTION_LABELS) as AdminShortcutSection[];
      expect(labelKeys.length).toBe(SECTION_ORDER.length);
    });

    it('porte les libellés validés par le PO', () => {
      expect(SECTION_LABELS.esport).toBe('Compétition');
      expect(SECTION_LABELS.contenu).toBe('Contenu');
      expect(SECTION_LABELS.boutique).toBe('Boutique');
      expect(SECTION_LABELS.structure).toBe('Structure');
      expect(SECTION_LABELS.admin).toBe('Administration');
    });
  });

  // ─── Découpage sémantique validé ──────────────────────────────────────────

  describe('découpage sémantique', () => {
    it('Dashboard et Statistiques sont épinglés (aucune section)', () => {
      expect(shortcut('dashboard').section).toBeUndefined();
      expect(shortcut('analytics').section).toBeUndefined();
    });

    it('le groupe Compétition contient Équipes et Jeux', () => {
      const keys = ADMIN_SHORTCUTS.filter(s => s.section === 'esport').map(s => s.key);
      expect(keys).toEqual(['teams', 'games']);
    });

    it('n’expose aucune entrée dont la route n’existe pas encore sur main', () => {
      const keys = ADMIN_SHORTCUTS.map(s => s.key);
      // Matchs et Palmarès arrivent avec EPIC-37, Boutique et Commandes avec la branche boutique.
      expect(keys).not.toContain('matches');
      expect(keys).not.toContain('trophies');
      expect(keys).not.toContain('boutique');
      expect(keys).not.toContain('commandes');
    });

    it('le groupe Contenu contient Articles, Live Twitch et Sponsors', () => {
      const keys = ADMIN_SHORTCUTS.filter(s => s.section === 'contenu').map(s => s.key);
      expect(keys).toEqual(['articles', 'twitch-channels', 'sponsors']);
    });

    it('le groupe Structure contient Staff et Recrutement', () => {
      const keys = ADMIN_SHORTCUTS.filter(s => s.section === 'structure').map(s => s.key);
      expect(keys).toEqual(['staff', 'recruitment']);
    });

    it('le groupe Administration contient Comptes, Rôles et Paramètres', () => {
      const keys = ADMIN_SHORTCUTS.filter(s => s.section === 'admin').map(s => s.key);
      expect(keys).toEqual(['users', 'roles', 'config']);
    });

    it('le groupe Boutique est déclaré mais vide tant que la branche boutique n’est pas mergée', () => {
      const keys = ADMIN_SHORTCUTS.filter(s => s.section === 'boutique').map(s => s.key);
      expect(keys).toEqual([]);
    });
  });

  // ─── Libellés ─────────────────────────────────────────────────────────────

  describe('libellés', () => {
    it('« Utilisateurs » devient « Comptes »', () => {
      expect(shortcut('users').label).toBe('Comptes');
    });

    it('« Configuration » devient « Paramètres »', () => {
      expect(shortcut('config').label).toBe('Paramètres');
    });

    it('« Twitch » devient « Live Twitch »', () => {
      expect(shortcut('twitch-channels').label).toBe('Live Twitch');
    });

    it('« Analytics » devient « Statistiques »', () => {
      expect(shortcut('analytics').label).toBe('Statistiques');
    });

    it('« Roles » porte son accent circonflexe', () => {
      expect(shortcut('roles').label).toBe('Rôles');
    });

    it('« Equipes » porte son accent aigu', () => {
      expect(shortcut('teams').label).toBe('Équipes');
    });
  });

  // ─── Icônes Material ──────────────────────────────────────────────────────

  describe('icônes Material', () => {
    it('Dashboard utilise une icône de tableau de bord et non d’accueil', () => {
      expect(shortcut('dashboard').icon).toBe('speed');
    });

    it('Équipes utilise une icône de groupe de personnes', () => {
      expect(shortcut('teams').icon).toBe('groups');
    });

    it('Jeux utilise une icône de jeu vidéo et non de casino', () => {
      expect(shortcut('games').icon).toBe('sports_esports');
    });

    it('Comptes utilise une icône de gestion de comptes, distincte de celle du Staff', () => {
      expect(shortcut('users').icon).toBe('manage_accounts');
      expect(shortcut('users').icon).not.toBe(shortcut('staff').icon);
    });

    it('aucune icône Material n’est utilisée deux fois', () => {
      const icons = ADMIN_SHORTCUTS.map(s => s.icon);
      expect(new Set(icons).size).toBe(icons.length);
    });
  });
});
