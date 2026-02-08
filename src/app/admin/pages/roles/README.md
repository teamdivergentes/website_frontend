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

### RoleFormDialogComponent
**Fichier:** `role-form-dialog.component.ts`

Dialog de création/édition de rôle avec gestion des permissions.

**Features:**
- Champ nom du rôle (requis)
- Permissions groupées par module avec checkboxes
- Expansion panels Material pour organiser les permissions
- Boutons "Tout sélectionner" / "Tout désélectionner" par groupe
- Compteur de permissions sélectionnées par groupe
- Validation : nom requis + au moins une permission

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
- `role-form-dialog.component.spec.ts` - Tests du dialog de formulaire

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

## Menu Admin

L'entrée "Rôles" apparaît dans la sidebar admin uniquement si l'utilisateur possède la permission `roles:read`.

## Style

Le module utilise:
- Angular Material (table, dialog, chips, expansion panels)
- Variables CSS du thème DVG
- OnPush change detection
- Signals pour la gestion d'état

## Accessibilité

- Tooltips sur les badges et actions
- Labels ARIA sur les formulaires
- Navigation clavier dans les dialogs
- Messages d'erreur contextuels
