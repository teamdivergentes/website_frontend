# Bandeaux matchs + bloc palmarès d'équipe — Plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUIS — utiliser superpowers:subagent-driven-development ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`).

**Objectif :** refondre le bandeau matchs en bloc immersif de 900 px avec repli sur le dernier résultat, et remplacer les pastilles de palmarès de la page équipe par un bloc jumeau à teinte dorée.

**Architecture :** trois briques. (1) Un utilitaire pur de formatage d'échéance relative, testable seul. (2) Le composant `match-strip` refondu, qui gagne un état de repli. (3) Un nouveau composant `team-honours`. Aucune modification backend : toutes les données sont déjà chargées par `home.ts` et `team-detail.ts`.

**Tech Stack :** Angular 20 standalone zoneless, Signals, SCSS, Jasmine + Karma.

**Spec :** `docs/superpowers/specs/2026-07-26-bandeaux-matchs-palmares-equipe-design.md`

**Repo / worktree :** `website_frontend` — `/home/tellebma/DEV/DVG/WEB/.worktrees/epic37-frontend`, branche `fix/epic-37-audit-corrections`

## Contraintes globales

- Control flow natif obligatoire : `@if`, `@for (x of y; track x.id)`. Jamais `*ngIf` / `*ngFor`.
- Zoneless : état via Signals uniquement. **Aucun `setInterval` / `setTimeout`** pour rafraîchir l'échéance.
- `ChangeDetectionStrategy.OnPush` sur tout composant.
- Libellés en français, en dur (aucun i18n dans le projet).
- Prettier : `printWidth: 100`, `singleQuote: true`.
- `npm run lint` doit passer avec `--max-warnings=0`.
- Seuils Karma bloquants : statements 65, branches 55, functions 60, lines 65.
- Charte : accent `#32D299`, fond `#0C0D0C`, Bebas Neue (titres) / Athiti (corps).
- Lighthouse SEO ≥ 0.9 en CI : tout `<img>` ajouté doit porter un `alt`.
- **Ne jamais animer une propriété déclenchant un reflow** (`width`, `height`, `top`, `left`, `margin`, `padding`). Les transitions de repaint (`color`, `background-color`, `border-color`) sont autorisées : le projet en utilise déjà largement dans `src/app/shared/components`. Pour les animations décoratives, s'en tenir à `transform` / `opacity`.
- Tests : conventions du repo — `provideZonelessChangeDetection()`, `provideRouter([])`, et `registerLocaleData(localeFr)` dès qu'un `DatePipe` est rendu.

---

## Structure de fichiers

| Fichier | Responsabilité |
|---------|----------------|
| `src/app/shared/utils/match-schedule.ts` | **Créer.** Formatage de l'échéance relative. Fonction pure, sans dépendance Angular. |
| `src/app/shared/utils/match-schedule.spec.ts` | **Créer.** Tests de l'utilitaire. |
| `src/app/shared/utils/opponent-initials.ts` | **Créer.** Repli textuel d'écusson. Fonction pure. |
| `src/app/shared/utils/opponent-initials.spec.ts` | **Créer.** Tests de l'utilitaire. |
| `src/app/shared/components/match-strip/match-strip.ts` | **Modifier.** Ajout des `computed()` d'état, d'échéance et d'initiales. |
| `src/app/shared/components/match-strip/match-strip.html` | **Réécrire.** État nominal + état de repli. |
| `src/app/shared/components/match-strip/match-strip.scss` | **Réécrire.** Traitement immersif, 900 px. |
| `src/app/shared/components/match-strip/match-strip.spec.ts` | **Étendre.** Repli, échéance, initiales. |
| `src/app/shared/components/team-honours/team-honours.ts` | **Créer.** Bloc palmarès d'équipe. |
| `src/app/shared/components/team-honours/team-honours.html` | **Créer.** |
| `src/app/shared/components/team-honours/team-honours.scss` | **Créer.** |
| `src/app/shared/components/team-honours/team-honours.spec.ts` | **Créer.** |
| `src/styles/_variables.scss` | **Modifier.** Ajout du seul token `$match-max-width` (les tokens de rang existent déjà). |
| `src/styles/_containers.scss` | **Modifier.** Ajout de `.match-container`. |
| `src/app/pages/home.html` | **Modifier.** Conteneur du bandeau + skeleton. |
| `src/app/pages/equipes/team-detail/team-detail.html` | **Modifier.** `.team-trophies` → `<app-team-honours>`. |
| `src/app/pages/equipes/team-detail/team-detail.ts` | **Modifier.** Import du nouveau composant, retrait de `placementLabel` devenu inutile. |
| `src/app/pages/equipes/team-detail/team-detail.scss` | **Modifier.** Suppression des styles `.team-trophies` / `.trophy-badge`. |

---

## Task 1 : Tokens et conteneur 900 px

**Fichiers :**
- Modifier : `src/styles/_variables.scss`
- Modifier : `src/styles/_containers.scss`

**Interfaces :**
- Consomme : rien
- Produit : `$match-max-width` et la classe `.match-container`. Les tokens `$rank-gold` / `$rank-silver` / `$rank-bronze` sont **déjà présents** dans `_variables.scss` et restent inchangés — la Task 6 les consomme tels quels.

- [ ] **Étape 1 : Ajouter les tokens**

Dans `src/styles/_variables.scss`, à la suite des tokens existants (après `$radius-xl`) :

```scss
// ---------------------------------------------------------------
// Blocs matchs / palmarès d'équipe
// ---------------------------------------------------------------

/// Largeur maximale des blocs matchs et palmarès d'équipe sur desktop.
/// 900px : au-delà, le contenu utile (~600px) est étiré et laisse un vide central.
$match-max-width: 900px;
```

> **Ne pas créer de tokens de rang.** `$rank-gold` (`#E8C976`), `$rank-silver` (`#C8D0DA`) et `$rank-bronze` (`#D69B6E`) **existent déjà** dans `_variables.scss`, créés par l'US d'assainissement du design system de cette même branche. Leurs valeurs sont volontairement désaturées et leurs contrastes documentés (~12:1, ~12:1, ~8:1 sur `#101111`) sont meilleurs que ceux d'une première rédaction de ce plan. Elles sont déjà consommées par `src/app/pages/structure/palmares/palmares.scss` — les remplacer casserait la cohérence avec la page palmarès, qui est précisément la cible de cette refonte. Les réutiliser telles quelles.

- [ ] **Étape 2 : Ajouter le conteneur**

Dans `src/styles/_containers.scss`, après `.big-container` et **avant** la règle groupée `.small-container, .medium-container, .big-container` :

```scss
// Blocs matchs / palmarès d'équipe. Conteneur dédié : les trois conteneurs
// génériques (1350 / 1475 / 1700) servent partout ailleurs et aucun ne descend
// assez bas — les modifier aurait un effet de bord global.
.match-container {
  max-width: $match-max-width;
  margin-inline: auto;
  width: 100%;
}
```

- [ ] **Étape 3 : Vérifier que la compilation SCSS passe**

Run : `npx ng build --configuration production`
Attendu : build réussi, aucune erreur SCSS.

- [ ] **Étape 4 : Commit**

```bash
git add src/styles/_variables.scss src/styles/_containers.scss
git commit -m "feat(ui): tokens de rang et conteneur 900px pour les blocs matchs"
```

---

## Task 2 : Utilitaire d'échéance relative

**Fichiers :**
- Créer : `src/app/shared/utils/match-schedule.ts`
- Test : `src/app/shared/utils/match-schedule.spec.ts`

**Interfaces :**
- Consomme : rien
- Produit : `formatRelativeSchedule(scheduledAt: string, now?: Date): string` — retourne le libellé en MAJUSCULES prêt à afficher. `now` est injectable pour les tests (jamais passé en production).

- [ ] **Étape 1 : Écrire les tests qui échouent**

Créer `src/app/shared/utils/match-schedule.spec.ts` :

```ts
import { formatRelativeSchedule } from './match-schedule';

describe('formatRelativeSchedule', () => {
  // Référence fixe : mercredi 5 août 2026, 14:00 heure locale.
  const now = new Date(2026, 7, 5, 14, 0, 0);

  const at = (y: number, m: number, d: number, h: number, min = 0): string =>
    new Date(y, m, d, h, min, 0).toISOString();

  it('affiche « moins d’une heure » sous 60 minutes', () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 14, 30), now)).toBe(
      "DANS MOINS D'UNE HEURE",
    );
  });

  it('affiche l’heure seule le jour même au-delà d’une heure', () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 20), now)).toBe('AUJOURD\'HUI 20:00');
  });

  it('affiche « demain » avec l’heure', () => {
    expect(formatRelativeSchedule(at(2026, 7, 6, 20), now)).toBe('DEMAIN 20:00');
  });

  it('affiche le nombre de jours et le jour abrégé entre 2 et 6 jours', () => {
    expect(formatRelativeSchedule(at(2026, 7, 8, 20), now)).toBe('DANS 3 JOURS — SAM. 20:00');
  });

  it('affiche la date complète à 7 jours ou plus', () => {
    // 15 août 2026 est un samedi (la référence `now` est le mercredi 5 août).
    expect(formatRelativeSchedule(at(2026, 7, 15, 20), now)).toBe('SAM. 15 AOÛT, 20:00');
  });

  it('traite un match déjà commencé comme « moins d’une heure »', () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 13, 30), now)).toBe(
      "DANS MOINS D'UNE HEURE",
    );
  });

  it('compte les jours en jours calendaires, pas en tranches de 24 h', () => {
    // 23:00 demain = moins de 24 h d'écart, mais c'est bien « demain ».
    const tardDemain = formatRelativeSchedule(at(2026, 7, 6, 23), now);
    expect(tardDemain).toBe('DEMAIN 23:00');
  });
});
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npx ng test --include='**/match-schedule.spec.ts' --watch=false`
Attendu : ÉCHEC — le module `./match-schedule` n'existe pas.

- [ ] **Étape 3 : Écrire l'implémentation**

Créer `src/app/shared/utils/match-schedule.ts` :

```ts
/**
 * Formatage de l'échéance d'un match en langage relatif.
 *
 * Le format brut (« Mer. 5 Août, 20:00 ») impose au visiteur de calculer
 * lui-même la proximité du match. Ces libellés la donnent directement.
 *
 * Fonction pure : `now` n'est injecté que par les tests. En production,
 * l'appel se fait sans second argument et la valeur est recalculée à chaque
 * rendu via un `computed()` — pas de timer, la granularité au jour ne le
 * justifie pas (cf. spec §4).
 */

const JOURS_ABREGES = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Minuit du jour de la date fournie, heure locale. */
function debutDeJour(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Écart en jours calendaires (0 = même jour, 1 = demain). */
function ecartEnJours(depuis: Date, vers: Date): number {
  const ms = debutDeJour(vers).getTime() - debutDeJour(depuis).getTime();
  return Math.round(ms / 86_400_000);
}

function heure(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatRelativeSchedule(scheduledAt: string, now: Date = new Date()): string {
  const cible = new Date(scheduledAt);
  const deltaMs = cible.getTime() - now.getTime();

  // Match imminent ou déjà commencé.
  if (deltaMs < 3_600_000) return "DANS MOINS D'UNE HEURE";

  const jours = ecartEnJours(now, cible);

  if (jours === 0) return `AUJOURD'HUI ${heure(cible)}`;
  if (jours === 1) return `DEMAIN ${heure(cible)}`;
  if (jours < 7) {
    return `DANS ${jours} JOURS — ${JOURS_ABREGES[cible.getDay()].toUpperCase()} ${heure(cible)}`;
  }

  const jour = JOURS_ABREGES[cible.getDay()].toUpperCase();
  const mois = MOIS[cible.getMonth()].toUpperCase();
  return `${jour} ${cible.getDate()} ${mois}, ${heure(cible)}`;
}
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils passent**

Run : `npx ng test --include='**/match-schedule.spec.ts' --watch=false`
Attendu : 7 specs PASS.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/shared/utils/match-schedule.ts src/app/shared/utils/match-schedule.spec.ts
git commit -m "feat(matches): formatage relatif de l'echeance d'un match"
```

---

## Task 3 : Utilitaire d'initiales d'adversaire

**Fichiers :**
- Créer : `src/app/shared/utils/opponent-initials.ts`
- Test : `src/app/shared/utils/opponent-initials.spec.ts`

**Interfaces :**
- Consomme : rien
- Produit : `opponentInitials(name: string): string`

- [ ] **Étape 1 : Écrire les tests qui échouent**

Créer `src/app/shared/utils/opponent-initials.spec.ts` :

```ts
import { opponentInitials } from './opponent-initials';

describe('opponentInitials', () => {
  it('prend les initiales de deux mots', () => {
    expect(opponentInitials('Gentle Mates')).toBe('GM');
  });

  it('plafonne à trois caractères', () => {
    expect(opponentInitials('Karmine Corp Blue Academy')).toBe('KCB');
  });

  it('prend les trois premières lettres d’un mot unique', () => {
    expect(opponentInitials('Solary')).toBe('SOL');
  });

  it('prend les initiales quand tous les mots sont significatifs', () => {
    // « Team » fait 4 lettres et « BDS » 3 : les deux comptent, d'où TB.
    expect(opponentInitials('Team BDS')).toBe('TB');
  });

  it('découpe aussi sur les tirets', () => {
    // « Ex-Nihilo » est un adversaire réel : sans cette règle, on obtiendrait « EX- ».
    expect(opponentInitials('Ex-Nihilo')).toBe('NIH');
  });

  it('gère les espaces multiples et superflus', () => {
    expect(opponentInitials('  Vitality   Bee  ')).toBe('VB');
  });

  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(opponentInitials('')).toBe('');
    expect(opponentInitials('   ')).toBe('');
  });

  it('retombe sur le mot court si tous les mots sont courts', () => {
    expect(opponentInitials('G2')).toBe('G2');
  });
});
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npx ng test --include='**/opponent-initials.spec.ts' --watch=false`
Attendu : ÉCHEC — module introuvable.

- [ ] **Étape 3 : Écrire l'implémentation**

Créer `src/app/shared/utils/opponent-initials.ts` :

```ts
/**
 * Repli textuel d'écusson quand `opponentLogo` est absent — ce qui est le cas
 * de tous les adversaires aujourd'hui, aucun logo n'étant saisi en base.
 *
 * Règle, appliquée sans exception ni liste de mots à ignorer :
 *  1. découper le nom sur les espaces et les tirets ;
 *  2. ne garder que les mots de 3 lettres ou plus ;
 *  3. 2 mots retenus ou plus → leurs initiales, plafonnées à 3 caractères ;
 *  4. exactement 1 mot retenu → ses 3 premières lettres ;
 *  5. aucun mot retenu → les 3 premiers caractères alphanumériques (« G2 », « M8 ») ;
 *  6. résultat toujours en majuscules.
 *
 * Le découpage sur les tirets n'est pas cosmétique : « Ex-Nihilo » est un
 * adversaire réel, et sans lui le repli afficherait « EX- » dans la pastille.
 */
export function opponentInitials(name: string): string {
  const mots = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (mots.length === 0) return '';

  const significatifs = mots.filter(m => m.length >= 3);

  if (significatifs.length === 0) {
    return name.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();
  }

  if (significatifs.length === 1) {
    return significatifs[0].slice(0, 3).toUpperCase();
  }

  return significatifs
    .slice(0, 3)
    .map(m => m[0])
    .join('')
    .toUpperCase();
}
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils passent**

Run : `npx ng test --include='**/opponent-initials.spec.ts' --watch=false`
Attendu : 7 specs PASS.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/shared/utils/opponent-initials.ts src/app/shared/utils/opponent-initials.spec.ts
git commit -m "feat(matches): repli en initiales pour les ecussons adversaires"
```

---

## Task 4 : Logique du composant `match-strip`

**Fichiers :**
- Modifier : `src/app/shared/components/match-strip/match-strip.ts`
- Test : `src/app/shared/components/match-strip/match-strip.spec.ts`

**Interfaces :**
- Consomme : `formatRelativeSchedule()` (Task 2), `opponentInitials()` (Task 3), `matchOutcome()` / `outcomeLabel()` / `outcomeAria()` (existants)
- Produit : sur `MatchStripComponent` —
  - type exporté `MatchStripMode = 'upcoming' | 'last-result' | 'empty'`
  - `mode: Signal<MatchStripMode>` (public, lu par les tests)
  - `lastResult: Signal<Match | null>` (public)
  - `relativeSchedule: Signal<string>` (public)
  - `formResults: Signal<Match[]>` (public) — les 3 derniers résultats, **du plus ancien au plus récent** pour une lecture de gauche à droite
  - méthodes protégées : `hasOutcome(match: Match): boolean`, `getOutcomeLabel(match: Match): string`, `getOutcomeClass(match: Match): string`, `getOutcomeAria(match: Match): string`, `initials(name: string): string`, `formTitle(match: Match): string`, `onLogoError(event: Event): void`

> `initials()` prend **le nom** (`string`), pas le match. `formTitle()` prend le match. Le template de la Task 5 s'appuie sur ces signatures exactes.

**Note :** les entrées `upcoming` et `results` ne changent pas — les deux pages appelantes restent compatibles sans modification de leur binding.

- [ ] **Étape 1 : Écrire les tests qui échouent**

Ajouter à la fin du `describe('MatchStripComponent', ...)` de `match-strip.spec.ts`, avant sa fermeture :

```ts
  describe('mode d’affichage', () => {
    it('est « upcoming » quand un match à venir existe', () => {
      fixture.componentRef.setInput('upcoming', upcomingMatch);
      fixture.componentRef.setInput('results', [resultWin]);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('upcoming');
    });

    it('est « last-result » sans match à venir mais avec des résultats', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', [resultWin, resultLoss]);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('last-result');
      expect(fixture.componentInstance.lastResult()).toEqual(resultWin);
    });

    it('est « empty » sans match à venir ni résultat', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', []);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('empty');
      expect(fixture.componentInstance.lastResult()).toBeNull();
    });

    it('ne rend rien en mode « empty » (non-régression)', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.match-strip')).toBeNull();
    });
  });
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npx ng test --include='**/match-strip.spec.ts' --watch=false`
Attendu : ÉCHEC — `mode` et `lastResult` n'existent pas sur le composant.

- [ ] **Étape 3 : Écrire l'implémentation**

Remplacer intégralement `src/app/shared/components/match-strip/match-strip.ts` :

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/match.model';
import { matchOutcome, outcomeAria, outcomeLabel } from '../../utils/match-outcome';
import { formatRelativeSchedule } from '../../utils/match-schedule';
import { opponentInitials } from '../../utils/opponent-initials';

/**
 * Trois états possibles :
 *  - `upcoming`    : un match est programmé — état nominal.
 *  - `last-result` : aucun match programmé, on met en avant le dernier résultat
 *                    avec sa date en clair, pour que l'ancienneté soit visible.
 *  - `empty`       : aucune donnée — le composant ne rend rien.
 */
export type MatchStripMode = 'upcoming' | 'last-result' | 'empty';

@Component({
  selector: 'app-match-strip',
  standalone: true,
  imports: [CommonModule, DatePipe, NgTemplateOutlet, RouterLink],
  templateUrl: './match-strip.html',
  styleUrls: ['./match-strip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStripComponent {
  readonly upcoming = input<Match | null>(null);
  readonly results = input<Match[]>([]);

  readonly mode = computed<MatchStripMode>(() => {
    if (this.upcoming()) return 'upcoming';
    if (this.results().length > 0) return 'last-result';
    return 'empty';
  });

  /** Résultat le plus récent — les résultats arrivent déjà triés du plus récent au plus ancien. */
  readonly lastResult = computed<Match | null>(() => this.results()[0] ?? null);

  /**
   * Échéance en langage relatif. Recalculée à chaque rendu, sans timer :
   * la granularité au jour ne justifie pas un rafraîchissement, et un
   * `setInterval` casserait le zoneless sans bénéfice (cf. spec §4).
   */
  readonly relativeSchedule = computed<string>(() => {
    const match = this.upcoming();
    return match ? formatRelativeSchedule(match.scheduledAt) : '';
  });

  /** Les 3 résultats affichés en pastilles de forme, du plus ancien au plus récent. */
  readonly formResults = computed<Match[]>(() => this.results().slice(0, 3).reverse());

  protected hasOutcome(match: Match): boolean {
    return matchOutcome(match) !== null;
  }

  protected getOutcomeLabel(match: Match): string {
    const outcome = matchOutcome(match);
    return outcome ? outcomeLabel(outcome) : '';
  }

  protected getOutcomeClass(match: Match): string {
    const outcome = matchOutcome(match);
    return outcome ?? '';
  }

  protected getOutcomeAria(match: Match): string {
    return outcomeAria(match);
  }

  /** Initiales de repli quand l'adversaire n'a pas de logo. */
  protected initials(name: string): string {
    return opponentInitials(name);
  }

  /**
   * Infobulle d'une pastille de forme : adversaire, score et date.
   * Seul endroit où l'obsolescence resterait invisible sans cette mention.
   */
  protected formTitle(match: Match): string {
    const date = new Date(match.scheduledAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${outcomeAria(match)} — ${date}`;
  }

  /** Masque l'image si le logo adversaire est introuvable (URL cassée). */
  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils passent**

Run : `npx ng test --include='**/match-strip.spec.ts' --watch=false`
Attendu : les 4 nouvelles specs PASS. **Des specs existantes vont échouer** — elles assertent l'ancien markup, que la Task 5 va remplacer. C'est attendu : ne pas les corriger ici, la Task 5 s'en charge.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/shared/components/match-strip/match-strip.ts src/app/shared/components/match-strip/match-strip.spec.ts
git commit -m "feat(matches): trois etats d'affichage pour le bandeau matchs"
```

---

## Task 5 : Template et styles de `match-strip`

**Fichiers :**
- Réécrire : `src/app/shared/components/match-strip/match-strip.html`
- Réécrire : `src/app/shared/components/match-strip/match-strip.scss`
- Test : `src/app/shared/components/match-strip/match-strip.spec.ts`

**Interfaces :**
- Consomme : `mode()`, `lastResult()`, `relativeSchedule()`, `formResults()`, `initials()`, `formTitle()` (Task 4) ; `$match-max-width`, `$border-subtle`, `$radius-lg`, `$result-win/loss/draw` (Task 1 et existants)
- Produit : classes `.match-strip`, `.match-strip__next`, `.match-strip__last`, `.match-strip__crest`, `.match-strip__form-pill`

- [ ] **Étape 1 : Écrire les tests qui échouent**

Ajouter dans `match-strip.spec.ts`, à la fin du `describe` principal :

```ts
  describe('rendu de l’état nominal', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('upcoming', upcomingMatch);
      fixture.componentRef.setInput('results', [resultWin, resultLoss, resultDraw]);
      fixture.detectChanges();
    });

    it('affiche l’affiche du prochain match', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__next')).not.toBeNull();
      expect(el.textContent).toContain('Team Rivale');
    });

    it('affiche l’échéance relative et non la date brute', () => {
      const el = fixture.nativeElement as HTMLElement;
      const echeance = el.querySelector('.match-strip__schedule')?.textContent ?? '';
      expect(echeance.length).toBeGreaterThan(0);
      expect(echeance).toMatch(/AUJOURD'HUI|DEMAIN|DANS |,/);
    });

    it('affiche trois pastilles de forme, chacune avec une date en infobulle', () => {
      const pastilles = fixture.nativeElement.querySelectorAll('.match-strip__form-pill');
      expect(pastilles.length).toBe(3);
      pastilles.forEach((p: HTMLElement) => {
        expect(p.getAttribute('title')).toMatch(/\d{4}/);
      });
    });

    it('utilise le logo adversaire quand il existe', () => {
      const img = fixture.nativeElement.querySelector('.match-strip__crest img');
      expect(img).not.toBeNull();
      expect(img.getAttribute('alt')).toBe('Team Rivale');
    });

    it('retombe sur les initiales quand le logo est absent', () => {
      fixture.componentRef.setInput('upcoming', { ...upcomingMatch, opponentLogo: null });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__crest img')).toBeNull();
      expect(el.querySelector('.match-strip__crest--opponent')?.textContent?.trim()).toBe('TR');
    });
  });

  describe('rendu du repli sur dernier résultat', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', [resultWin, resultLoss]);
      fixture.detectChanges();
    });

    it('affiche le bloc de repli et pas l’affiche du prochain match', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__last')).not.toBeNull();
      expect(el.querySelector('.match-strip__next')).toBeNull();
    });

    it('affiche la date du dernier résultat en clair', () => {
      const label = fixture.nativeElement.querySelector('.match-strip__last-label')?.textContent ?? '';
      expect(label).toContain('2025');
    });

    it('affiche les deux scores dans leurs éléments dédiés', () => {
      const el = fixture.nativeElement as HTMLElement;
      // Cibler les éléments précis : une assertion sur textContent entier
      // passerait grâce à l'année affichée dans le label (« 2025 »).
      expect(el.querySelector('.match-strip__score')?.textContent?.trim()).toBe('2');
      expect(el.querySelector('.match-strip__score-opponent')?.textContent?.trim()).toBe('1');
      expect(el.querySelector('.match-strip__matchup')?.textContent).toContain('Team Alpha');
    });

    it('teinte le score DVG selon l’issue du match', () => {
      const score = fixture.nativeElement.querySelector('.match-strip__score') as HTMLElement;
      expect(score.classList).toContain('win');
      expect(score.classList).not.toContain('loss');
    });

    it('affiche le lien vers le résumé quand articleSlug existe', () => {
      const lien = fixture.nativeElement.querySelector('.match-strip__recap');
      expect(lien).not.toBeNull();
      expect(lien.getAttribute('href')).toContain('victoire-finale');
    });

    it('masque le lien vers le résumé sans articleSlug', () => {
      fixture.componentRef.setInput('results', [resultLoss]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.match-strip__recap')).toBeNull();
    });

    it('mentionne que le calendrier n’est pas communiqué', () => {
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('calendrier');
    });
  });
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npx ng test --include='**/match-strip.spec.ts' --watch=false`
Attendu : ÉCHEC sur les nouvelles specs — les classes `.match-strip__next`, `.match-strip__last`, etc. n'existent pas encore.

- [ ] **Étape 3 : Écrire le template**

Remplacer intégralement `src/app/shared/components/match-strip/match-strip.html` :

**L'écusson adversaire est défini une seule fois** dans un `ng-template` réutilisé par les deux états via `ngTemplateOutlet` — le dupliquer serait un défaut que la revue rejetterait.

```html
<!--
  Écusson adversaire, partagé par les deux états.
  Logo si disponible, sinon repli sur les initiales : aucun adversaire n'a
  de logo en base aujourd'hui, ce repli est donc le cas courant.
-->
<ng-template #opponentCrest let-match>
  <span class="match-strip__crest match-strip__crest--opponent">
    @if (match.opponentLogo) {
      <img [src]="match.opponentLogo" [alt]="match.opponentName" width="32" height="32"
           (error)="onLogoError($event)" />
    } @else {
      {{ initials(match.opponentName) }}
    }
  </span>
</ng-template>

@if (mode() !== 'empty') {
  <div class="match-strip" [class.match-strip--past]="mode() === 'last-result'">

    <!-- ÉTAT NOMINAL : un match est programmé -->
    @if (mode() === 'upcoming' && upcoming(); as next) {
      <div class="match-strip__next">
        <p class="match-strip__label">
          Prochain@if (next.competition) { · {{ next.competition }} }
        </p>

        <div class="match-strip__fixture">
          <span class="match-strip__crest match-strip__crest--dvg" aria-hidden="true">DVG</span>
          <span class="match-strip__matchup">
            {{ next.teamName || 'Divergentes' }}
            <span class="match-strip__sep" aria-hidden="true">/</span>
            {{ next.opponentName }}
          </span>
          <ng-container *ngTemplateOutlet="opponentCrest; context: { $implicit: next }" />
        </div>

        <div class="match-strip__actions">
          @if (next.streamUrl) {
            <a class="match-strip__cta" [href]="next.streamUrl" target="_blank" rel="noopener noreferrer">
              Regarder
            </a>
          }
          <span class="match-strip__schedule">{{ relativeSchedule() }}</span>

          @if (formResults().length) {
            <ul class="match-strip__form" aria-label="Forme récente de l'équipe">
              @for (match of formResults(); track match.id) {
                <li>
                  <span class="match-strip__form-pill"
                        [class.win]="getOutcomeClass(match) === 'win'"
                        [class.loss]="getOutcomeClass(match) === 'loss'"
                        [class.draw]="getOutcomeClass(match) === 'draw'"
                        [title]="formTitle(match)"
                        [attr.aria-label]="formTitle(match)">
                    {{ getOutcomeLabel(match) }}
                  </span>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    }

    <!-- REPLI : aucun match programmé, on met en avant le dernier résultat -->
    @if (mode() === 'last-result' && lastResult(); as last) {
      <div class="match-strip__last">
        <p class="match-strip__label match-strip__last-label">
          Dernier résultat@if (last.competition) { · {{ last.competition }} }
          · {{ last.scheduledAt | date: 'd MMMM y' : undefined : 'fr' }}
        </p>

        <div class="match-strip__fixture">
          <span class="match-strip__crest match-strip__crest--dvg" aria-hidden="true">DVG</span>
          <span class="match-strip__matchup" [attr.aria-label]="getOutcomeAria(last)">
            {{ last.teamName || 'Divergentes' }}
            @if (hasOutcome(last)) {
              <span class="match-strip__score"
                    [class.win]="getOutcomeClass(last) === 'win'"
                    [class.loss]="getOutcomeClass(last) === 'loss'"
                    [class.draw]="getOutcomeClass(last) === 'draw'"
                    aria-hidden="true">{{ last.scoreDvg }}</span>
              <span class="match-strip__sep" aria-hidden="true">–</span>
              <span class="match-strip__score-opponent" aria-hidden="true">{{ last.scoreOpponent }}</span>
            }
            {{ last.opponentName }}
          </span>
          <ng-container *ngTemplateOutlet="opponentCrest; context: { $implicit: last }" />
        </div>

        <div class="match-strip__actions">
          @if (last.articleSlug) {
            <a class="match-strip__recap" [routerLink]="['/articles', last.articleSlug]">Lire le résumé</a>
          }
          <span class="match-strip__note">Prochain match à venir — calendrier non communiqué</span>
        </div>
      </div>
    }

  </div>
}
```

- [ ] **Étape 4 : Écrire les styles**

Remplacer intégralement `src/app/shared/components/match-strip/match-strip.scss` :

```scss
@use '../../../../styles/variables' as *;

.match-strip {
  position: relative;
  max-width: $match-max-width;
  margin-inline: auto;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background:
    radial-gradient(120% 150% at 78% 15%, rgba(50, 210, 153, 0.22), transparent 55%),
    linear-gradient(115deg, #12201c, #0a0b0a 62%);

  // Trame diagonale : donne de la matière au fond sans image.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      115deg,
      rgba(255, 255, 255, 0.022) 0 2px,
      transparent 2px 9px
    );
  }

  // Repli : fond désaturé pour signaler qu'il ne s'agit plus d'actualité chaude.
  &--past {
    background:
      radial-gradient(120% 150% at 78% 15%, rgba(50, 210, 153, 0.14), transparent 55%),
      linear-gradient(115deg, #151a18, #0a0b0a 62%);
  }
}

.match-strip__next,
.match-strip__last {
  position: relative;
  padding: 18px 20px 15px;
}

.match-strip__label {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $green;
}

.match-strip__last-label {
  color: $text-dim;
}

.match-strip__fixture {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.match-strip__matchup {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 22px;
  line-height: 1.05;
  letter-spacing: 0.02em;
  color: #fff;
}

.match-strip__sep {
  color: $green;
  opacity: 0.6;
}

.match-strip__score {
  &.win { color: $result-win; }
  &.loss { color: $result-loss; }
  &.draw { color: $result-draw; }
}

.match-strip__score-opponent {
  color: $text-muted;
}

.match-strip__crest {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 12px;
  letter-spacing: 0.04em;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &--dvg {
    color: $green;
    background: rgba(50, 210, 153, 0.16);
    border: 1px solid rgba(50, 210, 153, 0.4);
  }

  &--opponent {
    color: $text-muted;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid $border-subtle;
  }
}

.match-strip__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.match-strip__cta {
  padding: 7px 18px;
  border-radius: $radius-sm;
  background: $green;
  color: #062018;
  font-weight: 700;
  font-size: 12.5px;
  text-decoration: none;
  transition: background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: $green-hover;
  }
}

.match-strip__recap {
  padding: 6px 15px;
  border: 1px solid rgba(50, 210, 153, 0.45);
  border-radius: $radius-sm;
  color: $green;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: $green-subtle;
  }
}

.match-strip__schedule {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 15px;
  letter-spacing: 0.05em;
  color: $green;
}

.match-strip__note {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: $text-dim;
}

// Pastilles de forme. Le libellé « FORME » est volontairement absent :
// à 900px l'espace ne le justifie pas, l'aria-label de chaque pastille
// porte le sens (cf. spec §4).
.match-strip__form {
  display: flex;
  gap: 5px;
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}

.match-strip__form-pill {
  display: inline-block;
  padding: 1px 9px;
  border: 1px solid $border-subtle;
  border-radius: 999px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 11px;
  letter-spacing: 0.06em;
  cursor: default;

  &.win {
    color: $result-win;
    background: rgba(50, 210, 153, 0.1);
    border-color: rgba(50, 210, 153, 0.35);
  }

  &.loss {
    color: $result-loss;
    background: rgba(234, 106, 106, 0.1);
    border-color: rgba(234, 106, 106, 0.32);
  }

  &.draw {
    color: $result-draw;
    background: rgba(255, 255, 255, 0.05);
  }
}

// Mobile / tablette : l'affiche s'empile, les actions se réalignent.
@media screen and (max-width: $breakpoint-desktop) {
  .match-strip__fixture {
    flex-direction: column;
    text-align: center;
    gap: 9px;
  }

  .match-strip__matchup {
    font-size: 20px;
  }

  .match-strip__actions {
    justify-content: center;
  }

  .match-strip__form {
    margin-inline: auto;
  }
}
```

- [ ] **Étape 5 : Retirer les specs devenues obsolètes**

Les specs de l'ancien markup (celles qui interrogent `.match-strip__next-label`, `.match-strip__result-row`, `.match-strip__result-badge` ou `.match-strip__results`) portent sur une structure qui n'existe plus. Les supprimer une par une — **ne supprimer aucune assertion couvrant un comportement encore valide** (le cas vide, les libellés V/D/N, les `aria-label` de résultat sont couverts par les nouvelles specs).

Run : `npx ng test --include='**/match-strip.spec.ts' --watch=false`
Attendu : toutes les specs PASS.

- [ ] **Étape 6 : Vérifier lint et build**

Run : `npm run lint && npx ng build --configuration production`
Attendu : `0 problems`, build réussi.

- [ ] **Étape 7 : Commit**

```bash
git add src/app/shared/components/match-strip/match-strip.html src/app/shared/components/match-strip/match-strip.scss src/app/shared/components/match-strip/match-strip.spec.ts
git commit -m "feat(ui): bandeau matchs immersif 900px avec repli sur dernier resultat"
```

---

## Task 6 : Composant `team-honours`

**Fichiers :**
- Créer : `src/app/shared/components/team-honours/team-honours.ts`
- Créer : `src/app/shared/components/team-honours/team-honours.html`
- Créer : `src/app/shared/components/team-honours/team-honours.scss`
- Test : `src/app/shared/components/team-honours/team-honours.spec.ts`

**Interfaces :**
- Consomme : `Trophy` (`src/app/shared/models/trophy.model.ts`), `placementLabel()` / `placementAria()` (`src/app/shared/utils/trophy-placement.ts`), tokens `$rank-gold/silver/bronze` et `$match-max-width` (Task 1)
- Produit : `<app-team-honours [trophies]="…" />`, sélecteur `app-team-honours`, classes `.team-honours`, `.team-honours__row`, `.team-honours__rank`, `.team-honours__more`

- [ ] **Étape 1 : Écrire les tests qui échouent**

Créer `src/app/shared/components/team-honours/team-honours.spec.ts` :

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TeamHonoursComponent } from './team-honours';
import { Trophy } from '../../models/trophy.model';

registerLocaleData(localeFr);

describe('TeamHonoursComponent', () => {
  let fixture: ComponentFixture<TeamHonoursComponent>;

  const trophy = (id: number, placement: number, date: string, competition: string): Trophy => ({
    id,
    competition,
    placement,
    date,
    featured: false,
    teamId: 1,
    teamName: 'DVG LoL Academy',
  });

  const or = trophy(1, 1, '2025-08-15T00:00:00.000Z', 'LFL D2 Summer Split');
  const argent = trophy(2, 2, '2023-04-15T00:00:00.000Z', 'LFL D2 Spring Split');
  const bronze = trophy(3, 3, '2024-10-15T00:00:00.000Z', 'Coupe de France Esport');
  const quatrieme = trophy(4, 4, '2022-06-15T00:00:00.000Z', 'Trackmania Cup Off');
  const cinquieme = trophy(5, 5, '2021-05-15T00:00:00.000Z', 'Grassroots Cup');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamHonoursComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamHonoursComponent);
  });

  it('ne rend rien sans trophée', () => {
    fixture.componentRef.setInput('trophies', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-honours')).toBeNull();
  });

  it('rend une ligne par trophée', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.team-honours__row').length).toBe(3);
  });

  it('trie par date décroissante', () => {
    fixture.componentRef.setInput('trophies', [argent, or, bronze]);
    fixture.detectChanges();
    const lignes = fixture.nativeElement.querySelectorAll('.team-honours__row');
    expect(lignes[0].textContent).toContain('Summer Split');
    expect(lignes[1].textContent).toContain('Coupe de France');
    expect(lignes[2].textContent).toContain('Spring Split');
  });

  it('plafonne à 4 lignes et affiche le lien vers le palmarès complet', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme, cinquieme]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.team-honours__row').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.team-honours__more')).not.toBeNull();
  });

  it('masque le lien quand tous les trophées sont affichés', () => {
    fixture.componentRef.setInput('trophies', [or, argent]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-honours__more')).toBeNull();
  });

  it('applique la teinte de rang selon le placement', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme]);
    fixture.detectChanges();
    const rangs = fixture.nativeElement.querySelectorAll('.team-honours__rank');
    expect(rangs[0].classList).toContain('gold');
    expect(rangs[1].classList).toContain('bronze');
    expect(rangs[2].classList).toContain('silver');
    expect(rangs[3].classList).toContain('neutral');
  });

  it('affiche le nombre total de titres', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme, cinquieme]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('5');
  });

  it('n’utilise aucun emoji de médaille', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze]);
    fixture.detectChanges();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).not.toContain('🥇');
    expect(texte).not.toContain('🥈');
    expect(texte).not.toContain('🥉');
    expect(texte).not.toContain('🏆');
  });
});
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

Run : `npx ng test --include='**/team-honours.spec.ts' --watch=false`
Attendu : ÉCHEC — le composant n'existe pas.

- [ ] **Étape 3 : Écrire le composant**

Créer `src/app/shared/components/team-honours/team-honours.ts` :

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Trophy } from '../../models/trophy.model';
import { placementAria, placementLabel } from '../../utils/trophy-placement';

/** Au-delà de ce seuil, on tronque et on renvoie vers la page palmarès. */
const MAX_LIGNES = 4;

@Component({
  selector: 'app-team-honours',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './team-honours.html',
  styleUrls: ['./team-honours.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamHonoursComponent {
  readonly trophies = input<Trophy[]>([]);

  /** Trophées triés du plus récent au plus ancien, tronqués à MAX_LIGNES. */
  readonly visibles = computed<Trophy[]>(() =>
    [...this.trophies()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_LIGNES),
  );

  readonly total = computed<number>(() => this.trophies().length);

  readonly tronque = computed<boolean>(() => this.total() > MAX_LIGNES);

  protected label(placement: number): string {
    return placementLabel(placement);
  }

  protected aria(placement: number): string {
    return placementAria(placement);
  }

  /** Teinte de la pastille de rang. Au-delà du podium, neutre. */
  protected rankClass(placement: number): 'gold' | 'silver' | 'bronze' | 'neutral' {
    if (placement === 1) return 'gold';
    if (placement === 2) return 'silver';
    if (placement === 3) return 'bronze';
    return 'neutral';
  }
}
```

- [ ] **Étape 4 : Écrire le template**

Créer `src/app/shared/components/team-honours/team-honours.html` :

```html
@if (total() > 0) {
  <section class="team-honours" aria-label="Palmarès de l'équipe">
    <p class="team-honours__label">
      Palmarès de l'équipe · {{ total() }} {{ total() > 1 ? 'titres' : 'titre' }}
    </p>

    <ul class="team-honours__list">
      @for (trophy of visibles(); track trophy.id) {
        <li class="team-honours__row">
          <span class="team-honours__rank" [class]="'team-honours__rank ' + rankClass(trophy.placement)"
                [attr.aria-label]="aria(trophy.placement)">
            {{ label(trophy.placement) }}
          </span>
          <span class="team-honours__competition">{{ trophy.competition }}</span>
          <span class="team-honours__date">{{ trophy.date | date: 'MMM y' : undefined : 'fr' }}</span>
        </li>
      }
    </ul>

    @if (tronque()) {
      <a class="team-honours__more" routerLink="/structure/palmares">
        Voir tout le palmarès →
      </a>
    }
  </section>
}
```

- [ ] **Étape 5 : Écrire les styles**

Créer `src/app/shared/components/team-honours/team-honours.scss` :

```scss
@use '../../../../styles/variables' as *;

.team-honours {
  position: relative;
  max-width: $match-max-width;
  margin-inline: auto;
  padding: 16px 20px;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  // Teinte dorée : distingue l'archive (palmarès) de l'actualité (matchs),
  // qui utilise la même géométrie mais un fond vert.
  background:
    radial-gradient(110% 150% at 20% 12%, rgba($rank-gold, 0.1), transparent 58%),
    linear-gradient(115deg, #1a1712, #0a0b0a 62%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      115deg,
      rgba(255, 255, 255, 0.022) 0 2px,
      transparent 2px 9px
    );
  }
}

.team-honours__label {
  position: relative;
  margin: 0 0 8px;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: $rank-gold;
}

.team-honours__list {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}

.team-honours__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;

  & + & {
    border-top: 1px solid $border-subtle;
  }
}

.team-honours__rank {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 10px;
  letter-spacing: 0.03em;

  // Opacités reprises telles quelles de `pages/structure/palmares/palmares.scss`
  // (lignes 66-82) : les pastilles de rang doivent être identiques à celles de
  // la page palmarès, c'est l'objet même de cette refonte.
  &.gold {
    color: $rank-gold;
    background: rgba($rank-gold, 0.14);
    border: 1px solid rgba($rank-gold, 0.42);
  }

  &.silver {
    color: $rank-silver;
    background: rgba($rank-silver, 0.12);
    border: 1px solid rgba($rank-silver, 0.38);
  }

  &.bronze {
    color: $rank-bronze;
    background: rgba($rank-bronze, 0.14);
    border: 1px solid rgba($rank-bronze, 0.42);
  }

  &.neutral {
    color: $text-muted;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid $border-subtle;
  }
}

.team-honours__competition {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 15px;
  letter-spacing: 0.02em;
  color: #fff;
}

.team-honours__date {
  margin-left: auto;
  font-size: 10px;
  color: $text-dim;
  text-transform: capitalize;
  white-space: nowrap;
}

.team-honours__more {
  position: relative;
  display: inline-block;
  margin-top: 9px;
  font-size: 12px;
  color: $green;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

@media screen and (max-width: $breakpoint-desktop) {
  .team-honours__competition {
    font-size: 14px;
  }

  .team-honours__date {
    font-size: 9.5px;
  }
}
```

- [ ] **Étape 6 : Lancer les tests pour vérifier qu'ils passent**

Run : `npx ng test --include='**/team-honours.spec.ts' --watch=false`
Attendu : les 8 specs PASS.

- [ ] **Étape 7 : Commit**

```bash
git add src/app/shared/components/team-honours/
git commit -m "feat(ui): bloc palmares d'equipe a teinte doree"
```

---

## Task 7 : Intégration dans les deux pages

**Fichiers :**
- Modifier : `src/app/pages/home.html:74-81`
- Modifier : `src/app/pages/equipes/team-detail/team-detail.html:61-78`
- Modifier : `src/app/pages/equipes/team-detail/team-detail.ts`
- Modifier : `src/app/pages/equipes/team-detail/team-detail.scss`

**Interfaces :**
- Consomme : `<app-team-honours [trophies]>` (Task 6), `.match-container` (Task 1)
- Produit : rien pour les tâches suivantes

- [ ] **Étape 1 : Corriger le conteneur sur la home**

Dans `src/app/pages/home.html`, remplacer le bloc existant :

```html
<!-- Bandeau matchs : prochain match + derniers résultats -->
<div class="medium-container">
  @if (matchesLoading()) {
    <output class="match-strip-skeleton skeleton" aria-label="Chargement des matchs" aria-live="polite"></output>
  } @else {
    <app-match-strip [upcoming]="nextMatch()" [results]="lastResults()" />
  }
</div>
```

par :

```html
<!-- Bandeau matchs : prochain match + derniers résultats -->
<div class="match-container">
  @if (matchesLoading()) {
    <output class="match-strip-skeleton skeleton" aria-label="Chargement des matchs" aria-live="polite"></output>
  } @else {
    <app-match-strip [upcoming]="nextMatch()" [results]="lastResults()" />
  }
</div>
```

- [ ] **Étape 2 : Aligner la largeur du skeleton**

Dans `src/app/pages/home.scss`, trouver `.match-strip-skeleton` et lui ajouter la même contrainte, sinon un saut de mise en page apparaît au chargement (CLS) :

```scss
.match-strip-skeleton {
  max-width: $match-max-width;
  margin-inline: auto;
}
```

Si `home.scss` n'importe pas encore les variables, ajouter `@use '../../styles/variables' as *;` en tête de fichier — vérifier avant, pour ne pas dupliquer l'import.

- [ ] **Étape 3 : Remplacer les badges par le nouveau bloc sur la page équipe**

Dans `src/app/pages/equipes/team-detail/team-detail.html`, remplacer les lignes 61-78 :

```html
    <!-- Badges palmarès (discrets, sous le titre) -->
    @if (teamTrophies().length > 0) {
      <section class="team-trophies" aria-label="Palmarès de l'équipe">
        @for (trophy of teamTrophies(); track trophy.id) {
          <a class="trophy-badge" [routerLink]="['/structure/palmares']">
            <span aria-hidden="true">{{ placementLabel(trophy.placement) }}</span>
            {{ trophy.competition }} {{ trophy.date | date: 'yyyy' }}
          </a>
        }
      </section>
    }

    <!-- Bandeau matchs : prochain match + derniers résultats -->
    @if (teamMatchesLoading()) {
      <output class="match-strip-skeleton skeleton" aria-label="Chargement des matchs" aria-live="polite"></output>
    } @else {
      <app-match-strip [upcoming]="teamNextMatch()" [results]="teamLastResults()" />
    }
```

par :

```html
    <!-- Palmarès de l'équipe, puis matchs : deux blocs jumeaux de 900px -->
    <app-team-honours [trophies]="teamTrophies()" />

    @if (teamMatchesLoading()) {
      <output class="match-strip-skeleton skeleton" aria-label="Chargement des matchs" aria-live="polite"></output>
    } @else {
      <app-match-strip [upcoming]="teamNextMatch()" [results]="teamLastResults()" />
    }
```

- [ ] **Étape 4 : Mettre à jour le composant**

Dans `src/app/pages/equipes/team-detail/team-detail.ts` :

1. Ajouter l'import : `import { TeamHonoursComponent } from '../../../shared/components/team-honours/team-honours';`
2. Ajouter `TeamHonoursComponent` au tableau `imports` du décorateur.
3. Supprimer la méthode ou la propriété exposant `placementLabel` **uniquement si elle n'est plus référencée** dans `team-detail.html` — le vérifier avec :

```bash
grep -n "placementLabel" src/app/pages/equipes/team-detail/team-detail.html
```

Si la commande ne retourne rien, retirer aussi l'import de `placementLabel` en tête de fichier. Si elle retourne des lignes, tout laisser en place.

- [ ] **Étape 5 : Nettoyer les styles devenus morts**

Dans `src/app/pages/equipes/team-detail/team-detail.scss`, supprimer les règles `.team-trophies` et `.trophy-badge` (y compris leurs variantes `:hover` et media queries). Vérifier au préalable qu'elles ne servent nulle part ailleurs :

```bash
grep -rn "trophy-badge\|team-trophies" src/ --include=*.html --include=*.ts
```

Attendu : aucun résultat hors du SCSS à nettoyer. Ajouter aussi `max-width: $match-max-width; margin-inline: auto;` à `.match-strip-skeleton` de ce fichier s'il y est défini.

- [ ] **Étape 6 : Lancer la suite complète**

Run : `npm run lint && npx ng build --configuration production && npm run test`
Attendu : `0 problems`, build réussi, toutes les specs PASS avec les seuils de couverture tenus.

- [ ] **Étape 7 : Commit**

```bash
git add src/app/pages/home.html src/app/pages/home.scss src/app/pages/equipes/team-detail/team-detail.html src/app/pages/equipes/team-detail/team-detail.ts src/app/pages/equipes/team-detail/team-detail.scss
git commit -m "feat(ui): integrer le bloc palmares et le bandeau 900px dans les pages"
```

---

## Task 8 : Tests E2E Playwright

**Fichiers :**
- Créer : `e2e/tests/public/match-strip.e2e.spec.ts`

**Interfaces :**
- Consomme : le rendu livré par les tâches 5, 6 et 7
- Produit : rien pour les tâches suivantes

**Contexte :** il n'existe aujourd'hui aucune spec E2E **publique** pour les matchs — seulement `e2e/tests/admin/matches.spec.ts` et `e2e/tests/admin/palmares.spec.ts`, qui couvrent le back-office. Cette tâche crée la couverture publique exigée par la spec §10. Convention du repo : un en-tête de commentaire listant les sélecteurs utilisés (cf. `e2e/tests/public/teams.spec.ts`).

- [ ] **Étape 1 : Écrire la spec E2E**

Créer `e2e/tests/public/match-strip.e2e.spec.ts` :

```ts
/**
 * Tests E2E fonctionnels — Bandeau matchs et palmarès d'équipe
 *
 * Sélecteurs basés sur match-strip.html et team-honours.html :
 *
 * match-strip.html :
 * - .match-strip                       → conteneur du bandeau
 * - .match-strip--past                 → variante « dernier résultat »
 * - .match-strip__next                 → bloc prochain match
 * - .match-strip__last                 → bloc de repli
 * - .match-strip__schedule             → échéance relative
 * - .match-strip__cta                  → lien « Regarder » (streamUrl)
 * - .match-strip__form-pill            → pastille de forme (title = date)
 *
 * team-honours.html :
 * - .team-honours                      → conteneur du bloc palmarès
 * - .team-honours__row                 → ligne de trophée
 * - .team-honours__rank                → pastille de rang
 * - .team-honours__more                → lien vers le palmarès complet
 */

import { test, expect } from '@playwright/test';

const EQUIPE = '/structure/equipes/dvg-lol-academy';

test.describe('Bandeau matchs — page d’accueil', () => {
  test('affiche le bandeau et le contraint à 900 px maximum', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const strip = page.locator('.match-strip');
    await expect(strip).toBeVisible();

    const box = await strip.boundingBox();
    expect(box).not.toBeNull();
    // Tolérance de 2 px pour les bordures et l'arrondi de rendu.
    expect(box!.width).toBeLessThanOrEqual(902);
  });

  test('affiche une échéance relative, pas une date brute', async ({ page }) => {
    await page.goto('/');

    const echeance = page.locator('.match-strip__schedule');
    await expect(echeance).toBeVisible();
    await expect(echeance).toHaveText(/AUJOURD'HUI|DEMAIN|DANS |MOINS D'UNE HEURE|,/);
  });

  test('chaque pastille de forme porte une date en infobulle', async ({ page }) => {
    await page.goto('/');

    const pastilles = page.locator('.match-strip__form-pill');
    const total = await pastilles.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      await expect(pastilles.nth(i)).toHaveAttribute('title', /\d{4}/);
    }
  });
});

test.describe('Page équipe — palmarès puis matchs', () => {
  test('affiche le bloc palmarès avant le bloc matchs', async ({ page }) => {
    await page.goto(EQUIPE);

    const honours = page.locator('.team-honours');
    const strip = page.locator('.match-strip');
    await expect(honours).toBeVisible();
    await expect(strip).toBeVisible();

    const boxHonours = await honours.boundingBox();
    const boxStrip = await strip.boundingBox();
    expect(boxHonours!.y).toBeLessThan(boxStrip!.y);
  });

  test('les deux blocs partagent la même largeur maximale', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(EQUIPE);

    const boxHonours = await page.locator('.team-honours').boundingBox();
    const boxStrip = await page.locator('.match-strip').boundingBox();
    expect(Math.abs(boxHonours!.width - boxStrip!.width)).toBeLessThanOrEqual(2);
    expect(boxHonours!.width).toBeLessThanOrEqual(902);
  });

  test('les lignes de palmarès affichent une pastille de rang sans emoji', async ({ page }) => {
    await page.goto(EQUIPE);

    const lignes = page.locator('.team-honours__row');
    expect(await lignes.count()).toBeGreaterThan(0);
    await expect(page.locator('.team-honours__rank').first()).toBeVisible();

    const texte = (await page.locator('.team-honours').innerText()) ?? '';
    expect(texte).not.toMatch(/[🥇🥈🥉🏆]/u);
  });

  test('ne dépasse jamais quatre lignes de palmarès', async ({ page }) => {
    await page.goto(EQUIPE);
    expect(await page.locator('.team-honours__row').count()).toBeLessThanOrEqual(4);
  });
});

test.describe('Page équipe — parcours dégradé', () => {
  test('aucun bloc résiduel sur une équipe sans trophée ni match', async ({ page }) => {
    // Une équipe inexistante rend l'état d'erreur : ni palmarès ni bandeau.
    await page.goto('/structure/equipes/equipe-qui-nexiste-pas');

    await expect(page.locator('.team-honours')).toHaveCount(0);
    await expect(page.locator('.match-strip')).toHaveCount(0);
  });
});

test.describe('Responsive', () => {
  test('aucun défilement horizontal à 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EQUIPE);

    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(debordement).toBe(false);
  });
});
```

- [ ] **Étape 2 : Lancer la spec**

L'instance Docker de la Task 9 doit tourner, ou le serveur de dev sur le port attendu par `playwright.config.ts` — le vérifier avant :

```bash
grep -nE "baseURL|webServer" playwright.config.ts
```

Puis :

```bash
npx playwright test e2e/tests/public/match-strip.e2e.spec.ts
```

Attendu : toutes les specs PASS.

> Si Docker est indisponible, l'étape E2E est **différable** (règle du CLAUDE.md projet) : marquer l'US comme E2E différé dans le backlog plutôt que de supprimer la spec. Le fichier doit être commité dans tous les cas.

- [ ] **Étape 3 : Commit**

```bash
git add e2e/tests/public/match-strip.e2e.spec.ts
git commit -m "test(e2e): couvrir le bandeau matchs et le bloc palmares d'equipe"
```

---

## Task 9 : Vérification visuelle sur l'instance Docker

**Fichiers :** aucun (vérification)

**Interfaces :**
- Consomme : le travail des tâches 1 à 8
- Produit : la validation du risque « effet d'écho » identifié en spec §11

- [ ] **Étape 1 : Reconstruire l'instance de recette**

```bash
cd /home/tellebma/DEV/DVG/WEB/.worktrees
docker compose -f docker-compose.audit.yml up -d --build
```

Attendu : les trois conteneurs `dvg37-*` recréés et sains.

- [ ] **Étape 2 : Contrôler l'état nominal**

Ouvrir `http://localhost:8090/` puis `http://localhost:8090/structure/equipes/dvg-lol-academy`.

Checklist à 1440 px de large :

- le bandeau matchs est centré et large de 900 px, pas plus
- l'échéance est relative (« DANS 3 JOURS — … »), pas une date brute
- les écussons affichent `DVG` et les initiales de l'adversaire
- les 3 pastilles de forme sont présentes, et le survol révèle une date
- sur la page équipe, le bloc doré (palmarès) précède le bloc vert (matchs), tous deux à 900 px
- **le point à trancher visuellement :** les deux blocs se distinguent-ils bien, ou produisent-ils un effet d'écho ? Si l'écho gêne, la piste retenue est de baisser l'opacité du radial doré de `0.13` à `0.09`.

- [ ] **Étape 3 : Contrôler le repli**

Rendre les matchs à venir invisibles pour forcer le repli, puis recharger la home :

```bash
docker exec dvg37-postgres psql -U teamdivergente -d teamdivergente -c \
  "UPDATE matches SET active = false WHERE \"scheduledAt\" > now();"
```

Attendu : le bloc bascule sur le dernier résultat, avec sa **date en clair**, le score teinté, et la mention « calendrier non communiqué ».

Puis rétablir :

```bash
docker exec dvg37-postgres psql -U teamdivergente -d teamdivergente -c \
  "UPDATE matches SET active = true;"
```

- [ ] **Étape 4 : Contrôler le cas totalement vide**

Sur une équipe sans trophée ni match (en créer une depuis `/admin/teams` si nécessaire) : ni le bloc doré ni le bloc vert ne doivent apparaître, et la page ne doit pas laisser d'espace vide à leur place.

- [ ] **Étape 5 : Contrôler le mobile**

Émuler 390 px : l'affiche est empilée verticalement, les blocs occupent la largeur du conteneur parent, aucun défilement horizontal.

- [ ] **Étape 6 : Capturer les rendus**

```bash
node /tmp/claude-1000/-home-tellebma-DEV-DVG/704c7168-8dcc-4ec4-a9df-c0f6db33a50a/scratchpad/capture.mjs \
  /home/tellebma/DEV/DVG/.playwright-mcp/recette-v2
```

Attendu : 38 pages, `imgKO=0`, aucune page en échec. Comparer `01-accueil` et `06-equipe-lol` avec le lot précédent.

- [ ] **Étape 7 : Mettre à jour le backlog**

Dans `BACKLOG/EPIC-37-palmares-matchs/ENABLERS/audit-corrections/README.md`, ajouter une ligne d'US pour cette refonte avec la colonne Claude à `Fait`, et une note de livraison renvoyant à la spec et à ce plan. Le backlog n'est pas versionné (le dossier `WEB/` n'est pas un dépôt git) : il n'y a donc rien à commiter pour cette étape.

---

## Notes de séquencement

Ce travail s'ajoute à la branche `fix/epic-37-audit-corrections`, déjà rebasée sur `develop` et porteuse de la PR **#232**. Décision du PO : intégrer ici plutôt que d'ouvrir une PR dédiée, les deux modifiant `match-strip.scss` — les séparer garantirait un conflit.

Conséquence : la PR #232 devra être force-pushée après ces commits, et sa description mise à jour pour mentionner la refonte. **Ne pas pousser sans l'accord explicite du PO** (« go push »), conformément au CLAUDE.md du projet.

`npm run test` doit être relancé en entier avant le push : les tâches 4 et 5 modifient des specs existantes, et seule la suite complète confirme que les seuils de couverture Karma tiennent toujours.
