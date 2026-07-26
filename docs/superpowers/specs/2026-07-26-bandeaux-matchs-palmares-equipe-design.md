# Refonte des bandeaux matchs + bloc palmarès d'équipe — Spec de design

**Date** : 2026-07-26
**Périmètre** : `website_frontend` uniquement — aucune évolution d'API ni de schéma
**Origine** : recette visuelle EPIC-37 sur l'instance Docker isolée `dvg37`. Le PO n'est pas convaincu par le rendu des bandeaux matchs (home + page équipe).
**EPIC** : EPIC-37 — Palmarès & Matchs

---

## 1. Contexte et diagnostic

Le composant `match-strip` est utilisé à deux endroits : la home (`src/app/pages/home.html`) et la page équipe (`src/app/pages/equipes/team-detail/team-detail.html`). Cinq défauts ont été constatés sur l'instance de recette :

| # | Constat | Preuve |
|---|---------|--------|
| D1 | Le prochain match et les résultats passés se partagent l'espace ~60/40 : aucune hiérarchie | capture `01-accueil` |
| D2 | Le label « PROCHAIN » est écrit **à la verticale en 11 px** — symptôme d'un manque de place | `match-strip.html` |
| D3 | **Les résultats n'affichent aucune date** : un score de février est indistinguable d'un score de la semaine | `match-strip.html` — seuls `opponentName` et le badge score sont rendus |
| D4 | Aucun écusson ni logo : tout est textuel, d'où un rendu plat | `opponentLogo` existe mais n'est jamais alimenté |
| D5 | Sur la page équipe le bandeau est tassé à ~75 px, entre les badges palmarès et le roster | capture `06-equipe-lol` |
| D6 | La largeur est celle de `.medium-container` (**max-width 1475 px**), donc jamais contrainte sur un écran 1440 : le bloc est réellement pleine largeur alors que son contenu utile mesure ~600 px | `_containers.scss:10` |

Un sixième point, relevé pendant le cadrage : le palmarès de l'équipe est réduit à une rangée de pastilles de 9 px (`.trophy-badge`) juste au-dessus du bandeau matchs. Embellir le bandeau sans y toucher aurait accentué le déséquilibre — le palmarès est l'information la plus durable de la page, et la moins visible.

---

## 2. Décisions validées

Quatre arbitrages, chacun validé par le PO sur maquette :

| # | Décision |
|---|----------|
| **A** | Le bandeau matchs adopte un traitement **immersif** : fond dégradé radial vert + trame diagonale, écussons, nom des équipes en Bebas Neue, échéance **relative**, CTA, forme sur 3 pastilles |
| **B** | **Largeur maximale 900 px, centrée**, sur desktop — au lieu des 1475 px actuels |
| **C** | Sans match à venir, le bloc **bascule sur le dernier résultat**, avec sa date en clair |
| **D** | Sur la page équipe : **deux blocs jumeaux de 900 px empilés** — palmarès au-dessus (teinte dorée), matchs en dessous (teinte verte) |

---

## 3. Périmètre

**Inclus**

- Refonte visuelle de `match-strip` (les deux usages)
- Nouveau composant `team-honours` : le bloc palmarès de la page équipe
- Nouveau conteneur de largeur dédié
- Nouveaux tokens de rang (or / argent / bronze)
- Simplification du hero de la page équipe : il ne porte plus que l'identité

**Exclu**

- Toute évolution backend : les données nécessaires sont **déjà** exposées et consommées (cf. §7)
- Le design de la page `/structure/palmares` elle-même, qui reste inchangé
- L'alimentation de `opponentLogo` (aucun logo d'adversaire n'est saisi en base aujourd'hui) — le composant doit dégrader proprement, l'alimentation viendra plus tard
- Le back-office matchs et palmarès

---

## 4. Composant `match-strip` — état nominal

**Conteneur** : `max-width: $match-max-width` (900 px), `margin-inline: auto`.

**Fond** (deux couches superposées) :

```scss
background:
  radial-gradient(120% 150% at 78% 15%, rgba(50, 210, 153, 0.22), transparent 55%),
  linear-gradient(115deg, #12201C, #0A0B0A 62%);
border: 1px solid $border-subtle;
border-radius: $radius-lg; // 12px
```

**Trame** : pseudo-élément `::before` en `repeating-linear-gradient(115deg, rgba(255,255,255,.022) 0 2px, transparent 2px 9px)`, `inset: 0`, `pointer-events: none`.

**Contenu, de haut en bas**

1. **Label** — `PROCHAIN · {competition}` : 10 px, `letter-spacing: .16em`, uppercase, `$green`.
2. **Affiche** — écusson DVG (32 px) + `DIVERGENTES / {opponentName}` en Bebas ~22 px + écusson adversaire. Le séparateur `/` est en `$green` à `opacity: .6`.
3. **Ligne d'action** — CTA « Regarder » (`$green`, `$radius-sm`) + échéance relative en Bebas `$green` + les 3 pastilles de forme alignées à droite.

**Écussons** — `opponentLogo` si présent, sinon un repli textuel sur fond `rgba(255,255,255,.06)`. L'écusson DVG utilise `rgba(50,210,153,.16)` avec bordure `rgba(50,210,153,.4)`.

Règle de repli textuel, à implémenter sans ambiguïté : prendre les initiales des mots de `opponentName` en ignorant les mots de moins de 3 lettres, limitées à 3 caractères, en majuscules. Si le nom est un seul mot, prendre ses 3 premières lettres. Exemples : `Gentle Mates` → `GM`, `Karmine Corp Blue` → `KCB`, `Solary` → `SOL`, `Team BDS` → `BDS`. Le `alt` / `aria-label` porte toujours le nom complet, jamais les initiales.

**À 900 px le label « FORME » est supprimé** (décision prise sur maquette) : les 3 pastilles se suffisent, et leur `aria-label` porte le sens pour les lecteurs d'écran.

### Échéance relative

Le format brut actuel (« Mer. 5 Août, 20:00 ») impose un calcul mental. Règles retenues :

| Écart | Rendu |
|-------|-------|
| < 1 h | `DANS MOINS D'UNE HEURE` |
| aujourd'hui | `AUJOURD'HUI 20:00` |
| demain | `DEMAIN 20:00` |
| 2 à 6 jours | `DANS 3 JOURS — MER. 20:00` |
| ≥ 7 jours | `MER. 5 AOÛT, 20:00` |

Calculé à l'affichage via un `computed()`. **Pas de timer** : la granularité au jour ne justifie pas un rafraîchissement, et un `setInterval` casserait le zoneless sans bénéfice. Conséquence assumée : sur un onglet laissé ouvert plusieurs heures, la mention peut vieillir jusqu'au prochain chargement.

---

## 5. Composant `match-strip` — repli sans match à venir

Déclenché quand `upcoming()` est `null` et que `results()` n'est pas vide.

- **Fond désaturé** : le vert du radial descend à `0.14` et la base passe à `linear-gradient(115deg, #151A18, #0A0B0A 62%)` — le bloc signale ainsi qu'il ne présente plus de l'actualité chaude.
- **Label** : `DERNIER RÉSULTAT · {competition} · {date en clair}` — la date **en clair est le cœur de la décision C** : elle rend l'ancienneté immédiatement lisible, ce qui corrige D3.
- **Affiche** : `DIVERGENTES {scoreDvg} – {scoreOpponent} {opponentName}`, le score DVG teinté `$result-win` / `$result-loss` / `$result-draw`.
- **CTA** : « Lire le résumé » (style fantôme) **uniquement si `articleSlug` est présent** ; sinon aucun bouton.
- **Mention secondaire** : `PROCHAIN MATCH À VENIR — CALENDRIER NON COMMUNIQUÉ`.

**Si `upcoming()` est `null` ET `results()` est vide, le bloc ne s'affiche pas** — c'est déjà le comportement (`@if (upcoming() || results().length)`) et il est conservé.

> **Limite connue et acceptée** : les 3 pastilles de forme de l'état nominal ne sont pas datées. C'est le seul endroit où l'obsolescence reste invisible. Mitigation retenue : un `title`/`aria-label` par pastille contenant l'adversaire et la date.

---

## 6. Nouveau composant `team-honours`

Emplacement : `src/app/shared/components/team-honours/`.

**Entrée** : `trophies = input<Trophy[]>([])`.

**Rendu** : bloc de même largeur (900 px), même bordure et même rayon que `match-strip`, mais **teinte dorée** pour distinguer l'archive de l'actualité :

```scss
background:
  radial-gradient(110% 150% at 20% 12%, rgba(201, 162, 39, 0.13), transparent 58%),
  linear-gradient(115deg, #1A1712, #0A0B0A 62%);
```

- **Label** : `PALMARÈS DE L'ÉQUIPE · {n} TITRES`, en `$rank-gold`.
- **Lignes** : pastille de rang + compétition en Bebas ~15 px + date (mois + année) alignée à droite, séparateurs `border-top: 1px solid $border-subtle`.
- **Plafond de 4 lignes.** Au-delà, une ligne `Voir tout le palmarès →` pointe vers `/structure/palmares`. Sans ce plafond, une équipe historique ferait descendre le roster indéfiniment.
- Tri par date décroissante.
- Si `trophies` est vide, le bloc ne s'affiche pas.

**Pastilles de rang** — réutilisent `placementLabel()` / `placementAria()` de `src/app/shared/utils/trophy-placement.ts`, déjà écrits pour la page palmarès. La teinte dépend du placement : 1 → or, 2 → argent, 3 → bronze, au-delà → neutre (`$text-muted`).

Ce composant **remplace** les `.trophy-badge` de `team-detail.html:64-67`.

---

## 7. Données — rien à faire

Vérifié dans le code : tout est déjà chargé.

| Page | Source existante |
|------|------------------|
| Home | `home.ts` — `nextMatch`, `lastResults`, `matchesLoading` |
| Page équipe | `team-detail.ts:93-108` — `trophiesService.getTeamTrophies(id)`, `matchesService.getUpcoming(1, id)`, `matchesService.getResults(3, id)` |

Le modèle `Match` expose déjà `teamNameSnapshot`, `opponentName`, `opponentLogo`, `scheduledAt`, `competition`, `streamUrl`, `scoreDvg`, `scoreOpponent`, `articleSlug`. `Trophy` expose `placement`, `competition`, `date`, `teamLabel`, `featured`.

**Aucune modification de service, de DTO, de contrôleur ou de schéma Prisma.**

---

## 8. Mise en page des deux pages

**Home** (`home.html`) — le bandeau reste à sa place actuelle, sous le carrousel. Seul le conteneur change : `.medium-container` → le nouveau conteneur 900 px. Le skeleton de chargement doit adopter la même largeur, sinon un saut de mise en page apparaît (CLS).

**Page équipe** (`team-detail.html`) — nouvel ordre :

```
hero d'équipe        (identité seule : nom + libellé du jeu)
bloc team-honours    (900 px, doré)
bloc match-strip     (900 px, vert)
NOS JOUEURS
NOTRE COACHING STAFF
description + image
```

> Le hero se limite au nom et au libellé du jeu. Les maquettes de cadrage affichaient une ligne « League of Legends · LFL Division 2 » : **la compétition n'existe pas sur le modèle `Team`** (champs disponibles : `name`, `slug`, `game`, `image`, `banner`, `description`). Ne pas l'implémenter sans ajouter le champ au préalable, ce qui est hors périmètre.

Le hero perd la rangée de `.trophy-badge`. Le roster descend d'environ 120 px — coût accepté en échange d'un palmarès qui pèse enfin son poids.

---

## 9. Styles et tokens

Nouveaux tokens dans `_variables.scss` :

```scss
// Largeur des blocs matchs / palmarès d'équipe (desktop)
$match-max-width: 900px;

// Teintes de rang (palmarès)
$rank-gold:   #C9A227;
$rank-silver: #AFB6BA;
$rank-bronze: #A9713B;
```

**Un conteneur dédié plutôt qu'un conteneur existant** : `.small-container` (1350) / `.medium-container` (1475) / `.big-container` (1700) servent partout ailleurs sur le site, et aucun ne descend assez bas. Les modifier aurait un effet de bord global. On ajoute donc `.match-container` (`max-width: $match-max-width; margin-inline: auto`) sans toucher aux trois autres.

**Contrastes** — calculés sur `#0A0B0A` : or 8.2:1, argent 9.6:1, bronze 4.8:1. Les trois passent AA. Le bronze étant le plus juste, **le ratio devra être revalidé sur le fond composé de la pastille** (`rgba(169,113,59,.16)` par-dessus le dégradé), qui est légèrement plus clair que le fond nu.

**Responsive** — en dessous de `$breakpoint-desktop`, les blocs repassent en pleine largeur du conteneur parent et l'affiche s'empile verticalement (écussons au-dessus du nom). Le comportement mobile actuel, qui fonctionne, sert de base.

**Mouvement** — aucune animation décorative. Les seules transitions concernent le survol du CTA. `prefers-reduced-motion` reste respecté puisqu'il n'y a rien d'animé à désactiver.

---

## 10. Tests

**Unitaires** — `match-strip.spec.ts` (à étendre) :

- état nominal : le bloc rend le prochain match, l'échéance relative et les pastilles de forme
- les 5 formats d'échéance relative (< 1 h, aujourd'hui, demain, 2–6 j, ≥ 7 j)
- repli : `upcoming = null` + `results` non vide → le dernier résultat est rendu **avec sa date**
- repli : le CTA « Lire le résumé » n'apparaît que si `articleSlug` est présent
- vide : `upcoming = null` + `results = []` → aucun rendu (non-régression)
- écussons : `opponentLogo` absent → repli sur les initiales

`team-honours.spec.ts` (nouveau) :

- rend une ligne par trophée, triées par date décroissante
- au-delà de 4 trophées : 4 lignes + le lien « Voir tout le palmarès »
- `trophies = []` → aucun rendu
- la teinte de pastille suit le placement (1/2/3/au-delà)
- non-régression : aucun emoji de médaille dans le rendu (contrat de l'US design system)

**E2E Playwright** — étendre les specs `matches` existantes :

- la home affiche le bloc à la bonne largeur et le CTA pointe vers `streamUrl`
- la page équipe affiche les deux blocs dans l'ordre palmarès → matchs
- parcours dégradé : équipe sans trophée et sans match → ni l'un ni l'autre des blocs

Seuils de couverture Karma inchangés (statements 65, branches 55, functions 60, lines 65).

---

## 11. Risques et points ouverts

| Risque | Traitement |
|--------|------------|
| **Effet d'écho** : deux blocs au traitement graphique proche s'enchaînent sur la page équipe | La teinte (doré vs vert) et le poids du label les distinguent. À valider visuellement sur l'instance de recette avant merge — c'est le principal point à vérifier de visu. |
| `opponentLogo` jamais alimenté | Repli sur les initiales, testé. Le rendu ne dépend donc pas d'une donnée absente. |
| Le roster descend de ~120 px sur la page équipe | Accepté. Contrepartie assumée de la décision D. |
| Pastilles de forme non datées | `title` + `aria-label` avec adversaire et date. Limite documentée en §5. |

**Question de séquencement à arbitrer par le PO** — la PR **#232** (frontend, EPIC-37 corrections d'audit) est ouverte et touche déjà `match-strip`. Deux options :

1. **Intégrer ce travail à #232** : une seule PR, un seul passage de CI, pas de conflit sur `match-strip`. Mais #232 grossit et sa revue devient plus lourde.
2. **Livrer #232 d'abord**, puis cette refonte dans une PR dédiée. Revue plus claire, mais un rebase sur `match-strip` sera nécessaire.

Recommandation : **option 1** — #232 est déjà rebasée sur `develop` et vérifiée (901 tests backend verts, lint front propre), et les deux travaux modifient les mêmes fichiers SCSS. Les séparer garantit un conflit.

**Hors périmètre mais lié** : la question de fond posée par le PO sur l'intérêt même d'afficher les matchs (coût de saisie récurrent d'environ 20 entrées par mois pour 5 équipes, sans source externe). Les décisions B et C réduisent l'exposition et rendent l'obsolescence visible, mais elles ne remplacent pas la désignation d'un responsable de saisie. À traiter séparément dans l'EPIC-37.
