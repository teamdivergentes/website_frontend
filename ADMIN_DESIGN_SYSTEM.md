# Design System DVG — Panel d'administration

Pendant de [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), qui ne couvre que les pages publiques.

Source unique : [`src/styles/_admin-tokens.scss`](src/styles/_admin-tokens.scss).
Les couleurs de marque viennent de [`src/styles/_variables.scss`](src/styles/_variables.scss) et ne
sont **jamais** redéclarées ici.

---

## Pourquoi ce document existe

Audit du 2026-07-31 sur `src/app/admin/` — 104 fichiers porteurs de style :

| Mesure | Avant |
|--------|-------|
| Occurrences de couleur codée en dur | **525** |
| Valeurs de couleur distinctes | **124** |
| Valeurs de `border-radius` distinctes | **18** |
| Tailles de police distinctes | **28** |
| Valeurs de `padding` distinctes | **72** |
| Taux d'adoption des tokens | **~35 %** |

Le panel n'avait pas de référence. Chaque page redécidait ses valeurs, et le vert de marque
s'écrivait `#32D299` 53 fois et `#32d299` 7 fois — deux graphies qu'aucune recherche ne trouve
ensemble.

---

## Portée

Les tokens sont déclarés sous **`.admin-layout`, `.admin-dialog` et `.cdk-overlay-container`** —
les trois racines où un composant admin peut se rendre — et non sous `:root`.

**Pourquoi pas `:root`.** Les pages publiques ont leur propre système. Surtout : un composant public
qui consommerait un token admin par erreur fonctionnerait en silence avec `:root`, alors qu'il
échoue visiblement avec ce scope. La portée étroite attrape la faute.

**Pourquoi `.cdk-overlay-container`.** Les overlays sont montés hors de `.admin-layout`, et
**onze ouvertures de dialogue court-circuitent `AdminDialogService`** — elles n'ont donc pas la
classe `admin-dialog`. Leur ajouter cette classe corrigerait le scope, mais leur appliquerait du
même coup les styles partagés qu'elle porte déjà : leur rendu changerait.

**Pourquoi c'est sans risque.** Une variable CSS est **inerte tant qu'aucune règle ne la consomme**.
Déclarer largement ne coûte rien ; c'est l'inverse d'une règle de style, où un scope large est
dangereux. C'est précisément ce scoping trop étroit qui avait causé six redéfinitions locales du
bandeau d'erreur, corrigées par l'EPIC-41.

---

## 1. Couleurs

### Accent

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-accent` | `#32D299` | Accent DVG : état actif, icônes, liens |
| `--admin-accent-hover` | `#2ab886` | Survol d'un élément accentué |
| `--admin-accent-bg` | `rgba(50,210,153,.15)` | Fond d'un élément **actif** |
| `--admin-accent-bg-subtle` | `rgba(50,210,153,.08)` | Fond de **survol** |
| `--admin-accent-border` | `rgba(50,210,153,.1)` | Bordure accentuée |

L'audit avait relevé **onze alphas différents** du vert. Ils se ramènent à trois usages : fond
d'actif, fond de survol, bordure. Toute autre valeur doit être justifiée en commentaire.

### Surfaces

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-surface` | `#101111` | Fond de la zone de contenu |
| `--admin-surface-raised` | `#0C0D0C` | Cartes, tableaux, dialogues |
| `--admin-surface-sunken` | `#090909` | Creux, fonds d'entrée |

### Texte

Du plus lisible au plus effacé. Les ratios de contraste sont documentés dans `_variables.scss`.

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-text` | `#FFF` | Titres, valeurs |
| `--admin-text-secondary` | `#D3D3D3` | Corps de texte |
| `--admin-text-muted` | `#B3B7B7` | Libellés secondaires |
| `--admin-text-dim` | `#9A9E9E` | Mentions, horodatages |

> Le panel utilisait `rgba(211,211,211, …)` avec **six alphas** pour couvrir ces quatre rangs.
> Préférer un token nommé : il porte son intention, et son contraste a été vérifié.

### Bordures

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-border` | `rgba(255,255,255,.07)` | Séparateurs, bordures de carte |
| `--admin-border-strong` | `#28413B` | Bordure marquée, contour de section |

### États

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-danger` | `#f44336` | Erreur, suppression |
| `--admin-danger-bg` | `rgba(244,67,54,.15)` | Fond d'un bandeau d'erreur |
| `--admin-warning` | `#D7AA25` | Attente, à compléter |
| `--admin-info` | `#56B7DF` | Information |
| `--admin-success` | `#32D299` | Succès |

> **Cinq rouges** cohabitaient pour dire « erreur » : `#f44336`, `#ef5350`, `#ef4444`, `#e05c5c`,
> `#ff6b6b`, `#ff8a80`. Aucun n'était nommé, aucun ne résultait d'un choix. Un seul subsiste.

### La palette des graphiques reste en valeurs littérales

Trois composants des Statistiques passent leurs couleurs à **Chart.js**, qui dessine sur `<canvas>`
et **n'interprète pas `var()`** : une valeur tokenisée y serait rendue comme une couleur invalide.

- `devices-chart.component.ts`
- `traffic-sources-chart.component.ts`
- `visitors-chart.component.ts`

C'est par ailleurs une famille distincte : une palette **catégorielle** doit être discriminante
entre séries, pas cohérente avec le chrome de l'interface. Les deux objectifs s'opposent.

Ces trois fichiers sont donc exclus de la migration, volontairement. Toute évolution de leur palette
se décide sur des critères de lisibilité de données, pas de charte.

---

## 2. Rayons

**Cinq rangs**, et non quatre : `4px` est la deuxième valeur la plus employée du panel
(27 occurrences). L'exclure imposerait 27 changements visibles pour une élégance de façade.

| Token | Valeur | Absorbe | Usage |
|-------|--------|---------|-------|
| `--admin-radius-xs` | `4px` | 2px, 3px | Badges, puces, petits marqueurs |
| `--admin-radius-sm` | `8px` | 6px | Boutons, entrées, petites cartes |
| `--admin-radius-md` | `10px` | — | Cartes standard, tableaux |
| `--admin-radius-lg` | `12px` | 11px | Cartes majeures, dialogues |
| `--admin-radius-xl` | `20px` | 16px | Grands blocs |

`border-radius: 50%` reste tel quel : ce n'est pas un rang d'échelle mais une forme — pastilles,
avatars, indicateurs ronds.

---

## 3. Espacement

Échelle de 4px. Les **72 valeurs de padding** et **21 de gap** relevées à l'audit s'y rangent toutes
à moins de 2px près.

| Token | Valeur | Usage courant |
|-------|--------|---------------|
| `--admin-space-1` | `0.25rem` (4px) | Écart intra-composant |
| `--admin-space-2` | `0.5rem` (8px) | Écart entre icône et libellé |
| `--admin-space-3` | `0.75rem` (12px) | Padding de cellule, gap de liste |
| `--admin-space-4` | `1rem` (16px) | Padding de carte |
| `--admin-space-5` | `1.5rem` (24px) | Padding de section, marge de bloc |
| `--admin-space-6` | `2rem` (32px) | Padding de zone de contenu |
| `--admin-space-7` | `3rem` (48px) | Respiration majeure, états vides |

---

## 4. Typographie

**Sept rangs** pour 28 tailles relevées.

| Token | Valeur | Usage |
|-------|--------|-------|
| `--admin-font-2xs` | `0.6875rem` (11px) | En-têtes de groupe, badges |
| `--admin-font-xs` | `0.75rem` (12px) | Mentions, métadonnées |
| `--admin-font-sm` | `0.8125rem` (13px) | Texte secondaire, cellules denses |
| `--admin-font-md` | `0.875rem` (14px) | **Corps du panel** |
| `--admin-font-lg` | `1rem` (16px) | Texte mis en avant |
| `--admin-font-xl` | `1.25rem` (20px) | Titre de section, de dialogue |
| `--admin-font-2xl` | `1.625rem` (26px) | Titre de page |

> Le panel faisait cohabiter **`0.8rem`, `0.8125rem` et `0.85rem`** — 12,8px, 13px et 13,6px.
> Aucun œil ne les distingue, mais elles rendaient toute reprise ambiguë : impossible de savoir
> laquelle était la bonne. Elles se rangent toutes dans `--admin-font-sm`.

---

## 5. Ce que ce document ne couvre pas

Constats réels de l'audit, laissés **hors périmètre** par décision PO du 2026-07-31 :

- **Deux systèmes de boutons** : Material (105 occurrences, 29 fichiers) et une classe maison `.btn`
  (14 occurrences, 6 fichiers). `date-range-picker` mélange les deux.
- **Trois paradigmes de liste** : `mat-table` (Articles, Rôles, Comptes), tableau écrit à la main
  (Matchs, Palmarès, Twitch, Statistiques, Boutique), grille de cartes (Staff, Sponsors, Jeux,
  Équipes, Recrutement).

Le paradigme de liste sera arbitré sur captures comparatives, pas sur description.

---

## 6. Règle de reprise

Toute nouvelle page admin part de ces tokens. Une valeur hors échelle est possible — elle doit
alors porter un commentaire disant **pourquoi**.

Ce n'est pas une formalité : le panel n'a pas dérivé par négligence, il a dérivé parce qu'aucune
référence n'existait et que chaque page devait donc trancher seule.
