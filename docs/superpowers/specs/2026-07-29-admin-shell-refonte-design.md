# Refonte du shell admin — Design

**Date** : 2026-07-29
**Branche** : `feat/admin-shell-refonte` (worktree `.claude/worktrees/admin-shell-refonte`)
**Statut** : validé par le PO
**EPIC** : EPIC-43

---

## 1. Problème

La sidebar du panel admin affiche ses entrées **à plat**, sans hiérarchie ni regroupement :
Dashboard, Utilisateurs, Rôles, Staff, Équipes, Jeux, Sponsors, Articles, Recrutement,
Configuration, Analytics, Twitch. La recherche visuelle est linéaire, aucun repère ne se forme à la
lecture, et la liste grossit à chaque EPIC.

### 1.1 Combien d'entrées, exactement

Le compte dépend de la branche de référence. **Ce spec prend `main` comme base** :

| Périmètre | Entrées | Arrive avec |
|-----------|---------|-------------|
| `main` aujourd'hui | **12** | — |
| + Matchs, Palmarès | 14 | EPIC-37 (`feat/epic-37-palmares`, non mergée) |
| + Boutique, Commandes | 16 | `feat/boutique-collection-2026` (non mergée) |

Ni les routes ni les composants de Matchs, Palmarès, Boutique et Commandes n'existent sur `main` :
les ajouter au registre créerait des entrées de navigation pointant vers des 404. Le registre ne
déclare donc que les 12 entrées réelles ; les quatre autres rejoignent leur groupe au merge de leur
branche respective.

### 1.2 Répartition par rôle

Le nombre d'entrées **réellement visibles dépend du rôle**, car la sidebar est perms-aware.
Calculé sur les 12 entrées de `main` croisées avec `backend/prisma/seed.ts` :

| Rôle | Entrées | Détail |
|------|---------|--------|
| Admin | **12** | tout |
| Gestionnaire | **8** | Dashboard, Équipes, Jeux, Articles, Live Twitch, Sponsors, Staff, Recrutement |
| CM | **2** | Dashboard, Articles |

Le CM tombe à 2 parce que ses quatre permissions métier portent sur `articles`, `annonces`,
`trophies` et `matches` — et que les deux dernières n'ont pas encore d'écran sur `main`. Après le
merge d'EPIC-37 il remontera à 4. **C'est le cas dégénéré à traiter en priorité** : une sidebar à
2 entrées ne doit pas afficher d'en-tête de groupe (§3.3).

Toute solution doit rester lisible sur tout ce spectre, de 2 à 16 entrées.

---

## 2. État de l'existant

### 2.1 Ce qui est déjà en place

L'EPIC-28 (Feature 1, livrée le 2026-05-17) a posé l'infrastructure :

- `src/shared/config/admin-shortcuts.ts` — registre central des 12 raccourcis, avec `label`,
  `icon`, `route`, `requiredPermissions` et un champ `section` **déjà déclaré**.
- `src/shared/services/admin-shortcuts.service.ts` — `availableShortcuts()` (Signal computed,
  filtré par permissions) et `shortcutsBySection()` (regroupement en `Map`).

`shortcutsBySection()` **est implémenté et testé mais consommé par personne** : la sidebar boucle à
plat sur `availableShortcuts()`. Le champ `section` a été prévu exactement pour ce chantier.

### 2.2 Pourquoi la taxonomie actuelle est inexploitable

Sur les 12 entrées de `main` :

| `section` | items | Admin | Gestionnaire | CM |
|-----------|-------|-------|--------------|-----|
| `content` | 5 | 5 | 5 | 1 |
| `people` | 2 | 2 | 1 | 0 |
| `config` | 2 | 2 | 0 | 0 |
| `analytics` | 1 | 1 | 0 | 0 |
| `tools` | 1 | 1 | 1 | 0 |

`content` absorbe près de la moitié des entrées et absorberait 7 des 14 après EPIC-37 ;
`analytics` et `tools` sont des groupes à 1 item — un en-tête pour une ligne est du bruit pur. Pour
un Gestionnaire, cette taxonomie produirait 3 groupes dont 2 orphelins. **Le redécoupage précède
l'affichage** : rendre les sections telles quelles empilerait des en-têtes sans gagner de
scanabilité.

Le classement actuel est par ailleurs incohérent avec sa propre logique : `roles` est en `config`
tandis que `users` est en `people`, alors que les deux écrans s'utilisent dans la même minute.

### 2.3 Défauts et bugs constatés

**Bugs fonctionnels (pas cosmétiques) :**

1. Le drawer mobile fermé est masqué par `transform: translateX(-100%)`, qui ne retire ni du
   parcours de tabulation ni de l'arbre d'accessibilité. `Tab` depuis le header envoie l'utilisateur
   dans tous les liens de navigation, invisibles hors écran.
2. `.sidebar.collapsed { width: 80px }` n'a **aucun override** dans la media query `max-width: 768px`
   (`admin-sidebar.component.ts:188-202`). Replier la sidebar en desktop puis passer en mobile
   produit un drawer de 80px, icônes seules, sans tooltip — inutilisable.
3. `admin-header.component.ts` maintient un `routeTitles` codé en dur et **désynchronisé** : il
   manque `/admin/twitch-channels`, `/admin/trophies` et `/admin/matches`. Sur ces 3 pages, le fil
   d'Ariane affiche « Admin » au lieu du nom de la page.

**Accessibilité** — écarts avec ce que `DESIGN_SYSTEM.md` §18 promet :

- Pas de `aria-current="page"` (`routerLinkActive` ne pose qu'une classe CSS).
- Pas de `:focus-visible` sur `.nav-item` : navigation clavier aveugle.
- Pas d'`aria-label` sur `<nav>`, pas d'`aria-expanded` sur le bouton collapse.
- Pas de tooltip en mode replié : le label est retiré du DOM, il ne reste qu'`aria-label` — un
  lecteur d'écran s'en sort, un utilisateur voyant n'a que des pictogrammes muets.
- Pas de piège de focus ni de fermeture par `Escape` sur le drawer ouvert.
- Pas de skip-link vers `<main>`.

**CSS :**

- `.nav-item.active { border-left: 3px solid }` sans compensation de padding décale le contenu de
  3px à droite ; `transition: all 0.2s` anime ce décalage, le texte « pousse » sur 200ms.
- `height: 100vh` déborde sous la barre d'URL mobile.
- Aucun `prefers-reduced-motion`.

**Autres :**

- `sidebarCollapsed` est un `signal(false)` local, remis à zéro à chaque rechargement.
- `onHeaderToggle()` lit `window.innerWidth` directement (`admin-layout.component.ts:87`) : non
  réactif au resize, non SSR-safe, duplique `ScreenSizeService`.
- Icônes interverties : Équipes a une manette (`faGamepad`), Jeux a un dé de casino (`faDice`).
  Invisible en mode déployé, bloquant en mode replié où l'icône est le seul signifiant.
- Coquilles dans le registre : `label: 'Roles'` et `label: 'Equipes'` — accents manquants, alors que
  le header écrit correctement « Rôles » et « Équipes ».

---

## 3. Décisions

### 3.1 Pattern de navigation retenu : sections à en-têtes non cliquables

Les items restent **tous visibles en permanence**. On insère des en-têtes textuels non interactifs
et un espacement vertical. Zéro état, zéro clic supplémentaire.

**Alternatives écartées :**

- **Accordéon** — résout un problème qu'on n'a pas : le plus gros groupe fait 4 items. Coûterait
  un clic supplémentaire sur ~50% des navigations, de l'état persisté à réconcilier avec les
  permissions, et entre en conflit structurel avec le mode replié (un en-tête sans texte n'a plus
  d'affordance). Le profil dominant est l'utilisateur occasionnel : un menu qui cache est un menu
  qu'il faut réapprendre.
- **Rail d'icônes + panneau contextuel** — 3 à 5 jours, réécrit la mécanique collapsed/mobile
  aujourd'hui stable, impose deux modèles de navigation selon le viewport, et s'effondre sur les
  rôles réels : 288px de chrome pour les 2 destinations d'un CM sur `main`. À reconsidérer au-delà de 35-40
  entrées ou si un 3e niveau apparaît.

Le pattern est **réversible** : si la liste atteint ~25 items, passer à l'accordéon consiste à
rendre les en-têtes cliquables. Le découpage sémantique, la densité, les icônes et les correctifs
d'accessibilité restent acquis.

### 3.2 Découpage sémantique

```
── ZONE ÉPINGLÉE (sans en-tête) ──────────────────
   1. Dashboard          /admin                  —
   2. Statistiques       /admin/analytics        analytics:read

── COMPÉTITION ───────────────────────────────────
   3. Équipes            /admin/teams            teams:read
   4. Jeux               /admin/games            games:read
   5. Matchs             /admin/matches          matches:read      (EPIC-37)
   6. Palmarès           /admin/trophies         trophies:read     (EPIC-37)

── CONTENU ───────────────────────────────────────
   7. Articles           /admin/articles         articles:read
   8. Live Twitch        /admin/twitch-channels  twitch_channels:read
   9. Sponsors           /admin/sponsors         sponsors:read

── BOUTIQUE ──────────────────────────── (à venir)
  10. Boutique           /admin/boutique         boutique:read
  11. Commandes          /admin/commandes        commandes:read

── STRUCTURE ─────────────────────────────────────
  12. Staff              /admin/staff            staff:read
  13. Recrutement        /admin/recruitment      recrutement:read

── ADMINISTRATION ────────────────────────────────
  14. Comptes            /admin/users            users:read
  15. Rôles              /admin/roles            roles:read
  16. Paramètres         /admin/config           config:read
```

Équilibre **2 / 4 / 3 / 2 / 2 / 3** — aucun groupe au-delà de 4 items, aucun groupe à 1 item pour
l'Admin.

**Quatre de ces entrées n'existent pas sur `main`.** Matchs et Palmarès arrivent avec EPIC-37,
Boutique et Commandes avec `feat/boutique-collection-2026`. Le registre livré par le lot 1 ne
déclare que les 12 entrées réelles ; le tableau ci-dessus est la cible une fois les deux branches
mergées. Voir §3.4 pour la coordination.

Sur `main`, le découpage effectif est donc **2 / 2 / 0 / 2 / 3** — le groupe BOUTIQUE est déclaré
dans le type mais vide, et COMPÉTITION ne contient qu'Équipes et Jeux.

**Arbitrages :**

- **Rôles avec Comptes, pas avec Paramètres seul.** La taxonomie actuelle sépare deux écrans
  utilisés dans la même minute (créer un compte → lui affecter un rôle → vérifier ses permissions).
  Le critère de regroupement en navigation est l'adjacence de tâche, pas la parenté conceptuelle.
  Comptes, Rôles et Paramètres ont exactement le même profil de permission, ce qui rend le groupe
  atomique : il apparaît entier ou pas du tout.
- **Twitch dans CONTENU, pas dans `tools`.** `tools` était un fourre-tout à 1 item. Gérer les
  chaînes Twitch, c'est décider ce qui s'affiche sur la page publique « En live » — de la
  programmation éditoriale. Validation : le Gestionnaire a `twitch_channels`, `articles` et
  `sponsors` → le groupe lui apparaît d'un bloc.
- **Matchs et Palmarès ensemble.** Les deux décrivent la même chose à deux moments : le match joué,
  le trophée qui en résulte. Même contributeur, même rythme de saison. Cas limite assumé : le seed
  donne `matches:*` et `trophies:*` à Admin et CM uniquement, donc pour le CM, COMPÉTITION =
  {Matchs, Palmarès} sans Équipes ni Jeux — le groupe reste lisible sous ce nom.
- **Sponsors dans CONTENU.** Un groupe « Partenariats » dédié serait un groupe à 1 item. Un sponsor
  est une fiche avec images, liens et ordre d'affichage : du contenu publié, géré par le même profil
  que les articles. Un groupe PARTENARIATS se justifiera si des contrats/factures/contreparties
  apparaissent — pas avant.
- **Recrutement dans STRUCTURE, pas CONTENU.** Une offre est une page publique, mais la tâche réelle
  est RH et le voisin naturel est Staff (on recrute pour étoffer le staff). L'arbitrage se joue sur
  l'intention, pas sur le fait que ça finit en HTML.
- **Statistiques épinglé en haut, pas dans un groupe.** Seul item de son domaine, et seule page en
  lecture seule du panel (aucun CRUD). Dashboard et Statistiques forment une zone « consultation ».
  Bonus : Dashboard n'exigeant aucune permission, la zone épinglée n'est jamais vide — la sidebar ne
  commence donc jamais par un en-tête orphelin.
- **Dashboard épinglé, jamais dans un groupe.** C'est la seule entrée sans permission requise, donc
  l'unique invariant de la sidebar ; c'est un point de retour, pas une destination de même nature ;
  et il ne doit jamais être poussé vers le bas par un en-tête. Position 1 absolue.

### 3.3 Règle de dégradation sous permissions

| Cas | Rendu |
|-----|-------|
| Groupe à **0 item** | Rien — ni en-tête, ni séparateur |
| Groupe à **1 item** | L'item seul, **en-tête masqué** (un titre pour une ligne coûte plus qu'il ne rapporte) |
| Groupe à **≥ 2 items** | En-tête + items |

**Rendu CM sur `main` (2 items)** — le cas dégénéré le plus dur :

```
⌂ Dashboard
──────────────
▤ Articles          ← groupe CONTENU à 1 item : en-tête masqué
```

Aucun en-tête n'est rendu. Sans la règle du groupe à 1 item, on afficherait un titre « CONTENU »
pour une seule ligne, au-dessus d'une sidebar qui n'en compte que deux.

**Rendu CM après EPIC-37 (4 items) :**

```
⌂ Dashboard
──────────────
COMPÉTITION
▦ Matchs
♛ Palmarès
──────────────
▤ Articles          ← toujours à 1 item : en-tête masqué
```

**Rendu Gestionnaire (8 items) :**

```
⌂ Dashboard
──────────────
COMPÉTITION
⚑ Équipes
⛭ Jeux
──────────────
CONTENU
▤ Articles
▶ Live Twitch
⛨ Sponsors
──────────────
STRUCTURE
⚇ Staff
✉ Recrutement
```

Trois groupes cohérents, zéro orphelin. Le groupe ADMINISTRATION disparaît entièrement : le
Gestionnaire n'a aucune des trois permissions.

### 3.4 Coordination avec le chantier boutique

La branche `feat/boutique-collection-2026` (spec
`2026-07-28-boutique-collection-2026-design.md`) ajoute **deux entrées au registre**, aujourd'hui
rangées en `section: 'content'` :

```ts
{ key: 'commandes', label: 'Commandes', icon: 'receipt_long',
  route: '/admin/commandes', requiredPermissions: ['commandes:read'], section: 'content' },
{ key: 'boutique',  label: 'Boutique',  icon: 'storefront',
  route: '/admin/boutique',  requiredPermissions: ['boutique:read'],  section: 'content' },
```

Le seed backend leur accorde déjà `boutique:read/write` et `commandes:read/write` pour le rôle Admin
(`backend/prisma/seed.ts`).

**Conflit de type attendu, et souhaitable.** Le lot 1 supprime la valeur `'content'` du type
`AdminShortcutSection`. Au merge, TypeScript échouera sur ces deux entrées. **Ne pas contourner en
réintroduisant `'content'`** : l'échec force un arbitrage conscient plutôt qu'un rangement
silencieux dans un groupe qui n'existe plus. La résolution est de passer les deux en
`section: 'boutique'`.

**Arbitrage.** Boutique et Commandes forment un groupe propre plutôt que de rejoindre CONTENU. Une
commande est transactionnelle — ce n'est pas du contenu éditorial, et les ranger ensemble
recréerait le fourre-tout que le redécoupage supprime. Le groupe est aussi atomique en permissions :
les deux entrées apparaissent ou disparaissent ensemble.

**Coût assumé.** Les deux entrées et leur en-tête font passer le budget de 775px à **879px**,
au-dessus de la cible de 850px (détail du calcul en §5.1) : un Admin scrollera légèrement en 1080p.
Trois raisons de l'accepter — seul le rôle Admin est
concerné (un CM reste à 4 entrées, un Gestionnaire à 8) ; seul `.sidebar-nav` défile, le header de
marque et le bouton collapse restent fixes ; et la palette Cmd+K (lot 5) rend le scroll rarement
nécessaire. C'est aussi le signal que le seuil de 18 lignes de §5.1 approche : à la prochaine
paire d'entrées, réexaminer le pattern.

**Ordre de merge.** Aucune dépendance forte. Si la boutique arrive en premier, le lot 1 range
directement les deux entrées en `'boutique'`. Si l'EPIC-43 arrive en premier, la branche boutique
corrige ses deux `section` au rebase.

### 3.5 Renommages

| Actuel | Nouveau | Motif |
|--------|---------|-------|
| `Roles` | `Rôles` | Accent manquant dans le registre (bug) |
| `Equipes` | `Équipes` | Accent manquant dans le registre (bug) |
| Utilisateurs | **Comptes** | Lève l'ambiguïté à trois voies Utilisateurs/Staff/Équipes. « Comptes » dit sans détour : accès au back-office |
| Configuration | **Paramètres** | « Configuration » se confond avec Rôles et Comptes — tous « configurent » quelque chose |
| Twitch | **Live Twitch** | Une marque seule n'est pas un libellé de destination |
| Analytics | **Statistiques** | Cohérence French-first avec le reste du panel |

### 3.6 Icônes

| Entrée | Actuel (FA) | Nouveau (FA) | Actuel (Material) | Nouveau (Material) |
|--------|-------------|--------------|-------------------|--------------------|
| Dashboard | `faHome` | `faGaugeHigh` | `dashboard` | `speed` |
| Comptes | `faUsers` | `faIdBadge` | `group` | `badge` |
| Équipes | `faGamepad` | `faUsers` | `sports_esports` | `groups` |
| Jeux | `faDice` | `faGamepad` | `casino` | `sports_esports` |
| Live Twitch | `faTv` | `faTowerBroadcast` | `live_tv` | `live_tv` |

Les autres restent inchangées.

---

## 4. Architecture

### 4.1 Modèle de données

`src/shared/config/admin-shortcuts.ts` :

```ts
// remplacé
export type AdminShortcutSection = 'content' | 'people' | 'config' | 'analytics' | 'tools';
// par
export type AdminShortcutSection = 'esport' | 'contenu' | 'boutique' | 'structure' | 'admin';
// section absente (undefined) = zone épinglée haute
```

Nouveau const exporté, source unique de l'ordre et des libellés de groupe :

```ts
export const SECTION_ORDER: readonly AdminShortcutSection[] = [
  'esport', 'contenu', 'boutique', 'structure', 'admin',
] as const;

export const SECTION_LABELS: Record<AdminShortcutSection, string> = {
  esport: 'Compétition',
  contenu: 'Contenu',
  boutique: 'Boutique',
  structure: 'Structure',
  admin: 'Administration',
};
```

`'boutique'` est déclaré dès le lot 1 bien qu'aucune entrée ne le porte encore sur `main`. La règle
de dégradation (§3.3) fait qu'un groupe sans item ne rend rien : le groupe reste donc invisible
jusqu'au merge de la branche boutique, sans code mort ni condition spéciale.

**Contrainte d'implémentation.** `shortcutsBySection()` renvoie une `Map`, dont l'ordre d'itération
est l'ordre d'insertion, c'est-à-dire l'ordre de `ADMIN_SHORTCUTS`. **Ne pas itérer sur la Map dans
le template.** Boucler sur `SECTION_ORDER` et lire la Map par clé, sinon l'ordre d'affichage des
groupes dépend silencieusement de l'ordre de déclaration du registre.

### 4.2 Composants

| Composant | Responsabilité | Dépendances |
|-----------|----------------|-------------|
| `AdminSidebarComponent` | Rendu des groupes et items, modes replié/mobile | `AdminShortcutsService`, `SECTION_ORDER`, `SECTION_LABELS` |
| `AdminHeaderComponent` | Fil d'Ariane dérivé du registre, déclencheur de la palette | `AdminShortcutsService`, `Router` |
| `AdminCommandPaletteComponent` *(nouveau)* | Overlay de recherche destinations + actions | `AdminShortcutsService`, CDK `Overlay` |
| `AdminLayoutComponent` | Orchestration, état replié persisté, détection de viewport | `ScreenSizeService` |
| `DashboardResumeComponent` *(nouveau)* | Blocs « Reprendre » et « À faire » | `DashboardService` *(nouveau)* |

Chaque composant reste consommateur du registre : **aucune permission n'est codée en dur dans un
template**, tout passe par `availableShortcuts()`.

### 4.3 Fil d'Ariane

Le `routeTitles` codé en dur de `AdminHeaderComponent` est supprimé. Le titre est dérivé de
`ADMIN_SHORTCUTS` par correspondance de route, et le groupe est ajouté comme niveau intermédiaire :

```
Admin / Contenu / Articles
```

Cela corrige mécaniquement les 3 fils d'Ariane cassés (Twitch, Palmarès, Matchs) et supprime la
source de vérité dupliquée.

### 4.4 Palette de commandes (⌘K)

- Overlay CDK, ouvert par `Cmd/Ctrl+K` ou par le champ de recherche du header.
- Index = `availableShortcuts()` → **immunisé aux permissions par construction**, aucune destination
  interdite ne peut apparaître. Aucun filtrage supplémentaire à écrire ni à tester.
- Deux catégories : **Aller à** (toutes les destinations du registre) et **Actions** (création : nouvel article,
  nouveau match, nouveau trophée, nouveau sponsor, nouvelle offre) — chaque action n'apparaît que si
  la permission `:write` correspondante est présente.
- Clavier : `⇅` navigation, `↵` ouverture, `Esc` fermeture. Piège de focus actif ; à la fermeture,
  le focus retourne à l'élément déclencheur.
- Le CDK Material déjà installé fournit `Overlay`, `cdkTrapFocus` et `ListKeyManager` (roving
  tabindex clavier).

Cette brique est le remède au mode replié : plus besoin de deviner un pictogramme.

### 4.5 Dashboard

La grille des liens rapides de `DashboardStatsComponent` est remplacée par deux blocs dérivés de
l'état réel de la base. `DashboardTrafficComponent` (métriques GA) et `DashboardRecentComponent`
(état du site) sont conservés inchangés.

**Bloc « Reprendre »** — répond à *où j'en étais* :

| Élément | Requête |
|---------|---------|
| Brouillons récents | `Article.published = false` ET `updatedAt >= now() - 30j`, tri `updatedAt desc`, ceux de l'utilisateur courant (`userId`) en premier, limite 5 |

**Bloc « À faire »** — répond à *ce qui cloche* :

| Alerte | Requête |
|--------|---------|
| Matchs sans score | `scheduledAt < now()` ET (`scoreDvg IS NULL` OU `scoreOpponent IS NULL`) ET `active = true` |
| Articles publiés sans image | `published = true` ET `imageUrl IS NULL` |
| Matchs à venir sans stream | `scheduledAt > now()` ET `streamUrl IS NULL` ET `active = true` |
| Brouillons dormants | `published = false` ET `updatedAt < now() - 30j` |

**Non-chevauchement.** Le seuil de 30 jours est le même dans les deux blocs : un brouillon est soit
dans « Reprendre » (modifié il y a moins de 30j), soit dans « À faire » (dormant), **jamais dans les
deux**. « Reprendre » répond à *où j'en étais*, « À faire » à *ce qui cloche*.

**État vide.** Chaque ligne de « À faire » n'est rendue que si son compteur est > 0. Si les quatre
compteurs sont à 0, le bloc entier disparaît au lieu d'afficher quatre zéros. Idem pour
« Reprendre » s'il n'y a aucun brouillon récent.

**Écarté du périmètre.** L'alerte « Palmarès non renseigné » envisagée initialement n'est pas
dérivable : la table `trophies` ne contient que les trophées déjà saisis, et il n'existe aucun
référentiel des compétitions auxquelles DVG participe ni de dates de fin de saison. Rien ne permet
de déduire qu'un palmarès *manque*. La rendre possible exigerait un modèle `Competition`/`Season` —
chantier backend hors périmètre.

### 4.6 Endpoints backend

Deux endpoints, tous deux protégés par `authGuard` et filtrés par permissions :

| Endpoint | Retour | Permission |
|----------|--------|------------|
| `GET /api/admin/dashboard/resume` | `{ drafts: ArticleSummary[] }` | `articles:read` |
| `GET /api/admin/dashboard/todo` | `{ matchesWithoutScore: number, articlesWithoutImage: number, matchesWithoutStream: number, dormantDrafts: number }` | agrégat, chaque compteur omis si la permission de lecture correspondante manque |

Le second retourne des **compteurs seuls** (pas les entités), avec les routes de destination
calculées côté frontend. Cela évite de charger des listes complètes pour afficher un nombre.

**Compteur absent vs compteur à zéro.** Un compteur omis (permission manquante) et un compteur à 0
(rien à signaler) produisent le même rendu : la ligne n'est pas affichée. Le frontend ne distingue
pas les deux cas et n'affiche aucun message d'accès refusé — une alerte qu'on ne peut pas traiter
n'a pas à être montrée. Conséquence pour un CM (qui n'a ni `articles:write` sur les images ni accès
aux sponsors) : son bloc « À faire » ne contient que les alertes de son périmètre.

De même, `/resume` retourne une liste vide plutôt qu'un 403 si `articles:read` manque — le bloc
« Reprendre » disparaît alors comme s'il n'y avait aucun brouillon.

---

## 5. Design visuel

### 5.1 Densité

| Élément | Actuel | Nouveau |
|---------|--------|---------|
| Hauteur d'item | ~46px (`padding: 0.875rem 1.5rem`) | **40px** (`height: 40px; padding: 0 1.25rem`) |
| Gap icône–label | `margin-right: 1rem` | `gap: 0.75rem` (flex) |
| Taille d'icône | `1.25rem` | `1rem`, `width: 20px` fixe (alignement des labels) |
| Label | 0.875rem / 500 | 0.8125rem / Athiti 500 |
| En-tête de groupe | — | 24px, `padding: 1.25rem 1.25rem 0.375rem` |

| Périmètre | Calcul | Sidebar totale |
|-----------|--------|----------------|
| `main` aujourd'hui (12 entrées, 4 groupes) | 12×40 + 4×24 = 576px | **695px** |
| Après EPIC-37 (14 entrées, 4 groupes) | 14×40 + 4×24 = 656px | **775px** |
| Après boutique (16 entrées, 5 groupes) | 16×40 + 5×24 = 760px | **879px** |

Cible : **pas de scroll jusqu'à 850px de viewport** (couvre 1080p et 1440p ; 768p scrollera, cas
minoritaire accepté).

Le périmètre boutique **dépasse la cible de 29px** : un Admin scrollera légèrement en 1080p.
Accepté sciemment (§3.4) — seul le rôle Admin est concerné, seul `.sidebar-nav` défile, et la
palette Cmd+K rend le scroll rarement nécessaire.

**Seuil d'alerte : 18 lignes visibles** (items + en-têtes). Le périmètre boutique en compte **21**
— le seuil est donc déjà franchi. À la prochaine paire d'entrées, réexaminer le pattern plutôt que
de continuer à empiler (l'accordéon devient pertinent, cf. §3.1).

Quand le scroll survient : seul `.sidebar-nav` défile (le header de marque et le bouton collapse
restent fixes — comportement actuel à préserver), masques de dégradé haut/bas pour signaler la
coupe, `scrollbar-width: thin`, et `scroll-margin-block: 24px` sur `.nav-item` pour qu'un item actif
révélé au chargement ne colle pas au bord.

### 5.2 En-têtes de groupe

```scss
.nav-section-title {
  font-family: var(--font-bebas-neue);
  font-size: 0.6875rem;              // 11px
  letter-spacing: 0.14em;            // Bebas est étroite : indispensable
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);  // ratio ~4.6:1 sur #0C0D0C
  padding: 1.25rem 1.25rem 0.375rem;
  user-select: none;
}
```

**Règle non négociable : les en-têtes ne sont jamais verts.** Sur un fond `#0C0D0C`, le `#32D299`
est le seul point de couleur — il doit **exclusivement** signaler l'état actif. Quatre en-têtes
verts créeraient quatre faux positifs et détruiraient la fonction de repérage. La distinction se
fait par la casse, la graisse, l'interlettrage et un contraste bas — pas par la teinte.

Si Bebas Neue paraît trop compressé à 11px en test, basculer sur Athiti 600 à la même taille sans
rien changer d'autre.

### 5.3 État actif

```scss
.nav-item {
  position: relative;
  transition: background-color .15s ease, color .15s ease;  // pas `all`

  &:hover { background: rgba(50,210,153,.06); color: var(--white); }

  &.active {
    background: rgba(50,210,153,.10);
    color: var(--green);
    font-weight: 600;
    box-shadow: inset 3px 0 0 var(--green);  // remplace border-left : pas de reflow
    .nav-icon { color: var(--green); }
  }

  &:focus-visible {
    outline: 2px solid var(--green);
    outline-offset: -2px;   // inset : la sidebar est à ras du bord gauche
    border-radius: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nav-item { transition: none; }
}
```

Quatre signaux redondants sur l'actif (fond, couleur, barre, graisse) : la couleur seule est
indistinguable pour un deutéranope sur ce fond.

Côté template, `aria-current="page"` se livre en une ligne :

```html
<a routerLinkActive="active" ariaCurrentWhenActive="page" ...>
```

### 5.4 Mode replié (80px)

- Les en-têtes disparaissent, remplacés par un séparateur 1px `rgba(50,210,153,.12)` sur 40% de la
  largeur, centré. Le rythme de groupe survit sans texte.
- **Tooltips `matTooltip` obligatoires**, position `right`, `showDelay: 400`, `hideDelay: 0`. Sans
  eux, le mode replié reste une colonne de pictogrammes muets.
- Transition : conserver `width .3s ease` sur `.sidebar` et `margin-left .3s ease` sur
  `.main-content` (déjà synchronisés). Faire apparaître les labels en `opacity` sur 120ms avec un
  délai de 150ms plutôt qu'un `@if` sec, pour éviter le flash de texte compressé pendant
  l'animation.

### 5.5 Mobile

- Rendu identique au mode déployé dans le drawer. Le groupement aide **davantage** sur mobile
  (hauteur contrainte, on repère un groupe en périphérie sans lire).
- Pas de `translateX` au survol, pas de lift : c'est de la navigation dense, pas une carte.
- À la fermeture du drawer, le focus retourne au bouton burger du header.

---

## 6. Correctifs embarqués

| # | Correctif | Nature |
|---|-----------|--------|
| 1 | `inert` (ou `visibility: hidden`) sur le drawer fermé en mobile | **Bug** |
| 2 | Override `.sidebar.collapsed { width: 100%; max-width: 280px }` sous 768px | **Bug** |
| 3 | Fil d'Ariane dérivé de `ADMIN_SHORTCUTS` | **Bug** |
| 4 | `Escape` + piège de focus sur le drawer ouvert | A11y |
| 5 | `ariaCurrentWhenActive="page"` sur les items | A11y |
| 6 | `:focus-visible` conforme à `DESIGN_SYSTEM.md` §18 | A11y |
| 7 | `<nav aria-label="Navigation administration">` + `aria-expanded` sur le bouton collapse | A11y |
| 8 | Tooltips en mode replié | A11y |
| 9 | Skip-link « Aller au contenu » vers `<main>` | A11y |
| 10 | `box-shadow: inset` au lieu de `border-left` (supprime le décalage de 3px) | CSS |
| 11 | `100dvh` au lieu de `100vh` | CSS |
| 12 | `prefers-reduced-motion` sur les transitions | CSS |
| 13 | Persistance de `sidebarCollapsed` en `localStorage` | UX |
| 14 | `ScreenSizeService` au lieu de `window.innerWidth` dans `onHeaderToggle()` | Dette |
| 15 | Accents `'Roles'` → `'Rôles'`, `'Equipes'` → `'Équipes'` | **Bug** |
| 16 | Icônes Équipes / Jeux / Dashboard / Comptes / Live Twitch | UX |

---

## 7. Stratégie de tests

### 7.1 Tests unitaires

| Cible | Assertions |
|-------|------------|
| `admin-shortcuts.ts` | Chaque raccourci a une `section` valide ou `undefined` ; `SECTION_ORDER` couvre toutes les valeurs du type ; `SECTION_LABELS` est exhaustif |
| `AdminSidebarComponent` | Rendu pour 4 rôles sur le périmètre `main` (Admin 12, Gestionnaire 8, CM 2, anonyme 0) : sections attendues, ordre des groupes conforme à `SECTION_ORDER`, items attendus par groupe |
| `AdminSidebarComponent` | CM (2 items) ne rend **aucun** en-tête de groupe — cas dégénéré le plus dur |
| `AdminSidebarComponent` | Le groupe `boutique`, déclaré mais sans item sur `main`, ne rend rien — garantit que le merge de la branche boutique n'introduira pas de régression d'affichage |
| `AdminSidebarComponent` | Groupe à 0 item → aucun en-tête ni séparateur rendu |
| `AdminSidebarComponent` | Groupe à 1 item → item rendu, en-tête absent |
| `AdminSidebarComponent` | `aria-current="page"` présent sur l'item actif et sur lui seul |
| `AdminHeaderComponent` | Fil d'Ariane correct pour chaque route du registre, **y compris** twitch-channels (régression du bug 3) ; trophies et matches à couvrir au merge d'EPIC-37 |
| `AdminCommandPaletteComponent` | L'index ne contient jamais de destination hors `availableShortcuts()` ; navigation clavier ⇅/↵/Esc ; focus restauré à la fermeture |
| `AdminLayoutComponent` | `sidebarCollapsed` relu depuis `localStorage` à l'init |
| `DashboardResumeComponent` | Bloc masqué si compteurs à 0 ; skeletons pendant le chargement |
| `DashboardService` | Mapping des réponses API, gestion d'erreur |
| Backend `DashboardService` | Chaque requête d'alerte sur jeu de données fixture ; seuil 30j exclusif entre les deux blocs |

Le seuil de non-chevauchement à 30 jours doit avoir un test dédié : un brouillon à exactement 30
jours ne doit apparaître que dans un seul bloc.

### 7.2 Tests E2E (Playwright)

| Scénario | Couverture |
|----------|------------|
| Matrice permissions × sections, 3 rôles | Admin voit 4 groupes ; Gestionnaire 3 ; CM 2 dont un sans en-tête |
| Navigation clavier complète dans la sidebar | Focus visible, `Tab` traverse tous les items |
| Drawer mobile fermé | Les items **ne sont pas** atteignables au `Tab` (régression du bug 1) |
| Replier en desktop puis passer en mobile | Le drawer occupe la largeur attendue, pas 80px (régression du bug 2) |
| Palette ⌘K | Ouverture au raccourci, filtrage, `↵` navigue, `Esc` ferme et restaure le focus |
| Fil d'Ariane sur `/admin/matches` | Affiche « Admin / Compétition / Matchs », pas « Admin » (régression du bug 3) |

Cette matrice satisfait aussi l'US #629 restée ouverte en EPIC-28.

### 7.3 Accessibilité

Audit manuel au clavier seul et au lecteur d'écran sur les 4 rôles, plus vérification des ratios de
contraste des en-têtes (~4.6:1) et de l'état actif.

---

## 8. Découpage en lots

| Lot | Contenu | Dépôt | Couche | Dépend de |
|-----|---------|-------|--------|-----------|
| 1 | Redécoupage `section` + `SECTION_ORDER`/`SECTION_LABELS` + renommages + accents + icônes | `frontend` | Frontend | — |
| 2 | Pattern A dans la sidebar : groupes, en-têtes, zone épinglée, densité, règle de dégradation | `frontend` | Frontend + UI/UX | 1 |
| 3 | A11y et correctifs 1-16 | `frontend` | Frontend + UI/UX | 2 |
| 4 | Fil d'Ariane dérivé du registre | `frontend` | Frontend | 1 |
| 5 | Palette ⌘K | `frontend` | Frontend | 1 |
| 6 | Endpoints `/admin/dashboard/resume` et `/todo` | `backend` | Backend | — |
| 7 | Blocs « Reprendre » / « À faire » + skeletons | `frontend` | Frontend | 6 |

Les lots 1 et 6 sont parallélisables d'entrée. Les lots 4 et 5 ne dépendent que du lot 1 et peuvent
avancer pendant les lots 2-3.

Chaque lot est commité séparément, en conventional commits, avec ses tests unitaires.

**Deux dépôts git distincts.** `frontend/` et `backend/` sont des dépôts indépendants (pas de
sous-modules) ; `WEB/` n'est pas versionné, donc le `BACKLOG/` ne l'est pas non plus. Conséquences :

- Le lot 6 vit dans son propre dépôt, sur sa propre branche `feat/admin-dashboard-endpoints`, avec
  sa propre PR. Il ne peut pas être commité avec les lots frontend.
- Les lots 6 et 7 forment un contrat d'API à figer avant de démarrer : le lot 7 consomme ce que le
  lot 6 expose. Le contrat est spécifié en §4.6 — s'y tenir permet de développer les deux en
  parallèle plutôt qu'en séquence.
- Le frontend travaille dans le worktree `frontend/.claude/worktrees/admin-shell-refonte` sur
  `feat/admin-shell-refonte`, isolé du chantier boutique en cours sur `feat/boutique-collection-2026`.
- Le backend est actuellement sur `feat/boutique-commandes` : y créer une branche dédiée avant de
  démarrer le lot 6.

---

## 9. Périmètre exclu

- Les pages CRUD elles-mêmes (`src/app/admin/pages/*`) — inchangées.
- Le modèle de permissions backend — déjà en place.
- Un référentiel `Competition`/`Season` — nécessaire à l'alerte « palmarès manquant », reporté.
- Épinglés / récents personnalisables dans la sidebar — ajouteraient de l'état persisté et une nav
  qui bouge sous les doigts ; à reconsidérer après retour d'usage sur la palette ⌘K.
- Le pattern accordéon — à ressortir uniquement si un groupe dépasse 8 items ou le total 22.

---

## 10. Critères de validation

- La sidebar affiche les groupes ordonnés selon `SECTION_ORDER` (4 sur `main`, 5 après le merge
  boutique), plus une zone épinglée sans en-tête.
- Un groupe vide ne rend rien ; un groupe à 1 item rend l'item sans en-tête.
- Aucune permission n'est codée en dur dans un template : tout dérive de `availableShortcuts()`.
- Le fil d'Ariane est correct sur toutes les routes admin du registre.
- La palette ⌘K n'expose jamais une destination hors permissions.
- Les 3 bugs fonctionnels (tabulation drawer, largeur collapsed mobile, fil d'Ariane) sont couverts
  par un test de régression chacun.
- Aucune régression sur les modes replié et mobile.
- Tests unitaires pour 4 rôles, matrice E2E pour 3 rôles.
- VQO ≥ 9.5/10 sur tous les domaines.

---

## 11. Traçabilité

- **EPIC-43** (à créer) — porte ce chantier.
- **EPIC-28**, `FEATURES/admin-navbar-reorg/us-audit-and-brainstorm-navbar.md` — satisfaite par ce
  document (audit écrit, 4 options comparées, option retenue documentée, maquettes ASCII, validation
  PO). À passer `Fait`.
- **EPIC-28**, `FEATURES/admin-navbar-reorg/us-implement-navbar-reorg.md` — absorbée par les lots
  1-3 de l'EPIC-43. À marquer comme reprise dans l'EPIC-43.
- **EPIC-28**, US #629 (matrice E2E permissions) — couverte par §7.2.
- **Chantier boutique** (`feat/boutique-collection-2026`, spec
  `2026-07-28-boutique-collection-2026-design.md`) — ajoute les entrées Boutique et Commandes.
  Coordination en §3.4 : conflit de type attendu au merge, résolution en `section: 'boutique'`.
