# Module de Gestion des Rôles

## Description

Ce module implémente la gestion complète des rôles et permissions pour l'administration de l'application DVG.

## Composants

### RolesComponent
**Fichier:** `roles.component.ts`

Page principale d'administration des rôles.

**Features:**
- Liste des rôles en tableau Material
- Colonnes : Nom, Permissions (chips), Utilisateurs (count), Actions
- Badge "Système" pour les rôles non supprimables
- Bouton "Nouveau rôle" (conditionné par permission `roles:write`)
- Actions CRUD avec vérifications de permissions

**Permissions requises:**
- `roles:read` - Lecture de la page
- `roles:write` - Création et modification
- `roles:delete` - Suppression (sauf rôles système)

### RoleFormPageComponent
**Fichier:** `role-form-page.component.ts`

Page routée de création/édition de rôle avec gestion des permissions.

C'était un dialogue au palier `lg` jusqu'à l'EPIC-41 (feature 3). La règle
inscrite dans `frontend/CLAUDE.md` en fait une page pour deux motifs : plus de
huit contrôles une fois les cases comptées, et une collection éditable dans
l'écran.

**Features:**
- Champ nom du rôle (requis)
- Permissions groupées par module, une carte par module, toutes visibles
- Boutons "Tout sélectionner" / "Tout désélectionner" par groupe
- Compteur de permissions sélectionnées par groupe et total de section
- Validation : nom requis + au moins une permission
- Garde de sortie (`unsavedChangesGuard`) : les cases de la matrice vivent dans
  un `FormRecord` du formulaire, donc `form.dirty` les couvre
- Identifiant inconnu ou permissions indisponibles : `<app-error-state>` avec
  réessai, jamais une matrice vide silencieuse

**Modules de permissions:**
- Utilisateurs (users:read, users:write, users:delete)
- Rôles (roles:read, roles:write, roles:delete)
- Équipes (teams:read, teams:write, teams:delete)
- Jeux (games:read, games:write, games:delete)
- Sponsors (sponsors:read, sponsors:write, sponsors:delete)
- Staff (staff:read, staff:write, staff:delete)
- Configuration (config:read, config:write)
- Annonces (annonces:read, annonces:write, annonces:delete)
- Articles (articles:read, articles:write, articles:delete)

## Service

Le `RolesService` a été étendu avec les méthodes:
- `createRole(data: CreateRoleDto): Observable<Role>`
- `updateRole(id: number, data: UpdateRoleDto): Observable<Role>`
- `deleteRole(id: number): Observable<void>`
- `getPermissions(): Observable<PermissionGroup[]>`

## Modèles

**Role:**
```typescript
interface Role {
  id: number;
  name: string;
  permissions: string[];
  isSystem?: boolean;
  _count?: { users: number };
  createdAt: string;
  updatedAt: string;
}
```

**DTOs:**
```typescript
interface CreateRoleDto {
  name: string;
  permissions: string[];
}

interface UpdateRoleDto {
  name?: string;
  permissions?: string[];
}

interface PermissionGroup {
  module: string;
  permissions: string[];
}
```

## Tests

Tests unitaires disponibles:
- `roles.component.spec.ts` - Tests du composant principal
- `role-form-page.component.spec.ts` - Tests de la page de formulaire

**Exécution:**
```bash
npm test -- --include="**/roles/*.spec.ts"
```

## Règles de Gestion

1. **Rôles système** : Les rôles marqués comme `isSystem: true` ne peuvent pas être supprimés
2. **Rôles avec utilisateurs** : Impossible de supprimer un rôle si des utilisateurs l'utilisent
3. **Permissions** : Au moins une permission doit être sélectionnée lors de la création/édition
4. **Nom du rôle** : Requis et unique

## Routes

- `/admin/roles` - Liste des rôles (nécessite `roles:read`)
- `/admin/roles/new` - Création d'un rôle (nécessite `roles:read`)
- `/admin/roles/edit/:id` - Édition d'un rôle (nécessite `roles:read`)

## Menu Admin

L'entrée "Rôles" apparaît dans la sidebar admin uniquement si l'utilisateur possède la permission `roles:read`.

## Style

Le module utilise:
- Angular Material (table, chips, checkboxes)
- Variables CSS du thème DVG
- OnPush change detection
- Signals pour la gestion d'état

## Accessibilité

- Tooltips sur les badges et actions
- Labels ARIA sur les formulaires
- Navigation clavier sans piège de focus (page routée, pas de modale)
- Messages d'erreur contextuels
