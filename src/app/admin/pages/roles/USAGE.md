# Guide d'Utilisation - Gestion des Rôles

## Accès

1. Se connecter avec un compte ayant la permission `roles:read`
2. Naviguer vers `/admin/roles` ou cliquer sur "Rôles" dans le menu admin

## Liste des Rôles

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│ Gestion des Rôles                        [+ Nouveau rôle]       │
├─────────────────────────────────────────────────────────────────┤
│ Nom           │ Permissions           │ Utilisateurs │ Actions  │
├─────────────────────────────────────────────────────────────────┤
│ Admin         │ [users:read]          │ 2            │ ⋮        │
│ [Système]     │ [users:write]         │              │          │
│               │ [+18]                 │              │          │
├─────────────────────────────────────────────────────────────────┤
│ Gestionnaire  │ [teams:read]          │ 5            │ ⋮        │
│ [Système]     │ [teams:write]         │              │          │
│               │ [+10]                 │              │          │
├─────────────────────────────────────────────────────────────────┤
│ CM            │ [annonces:read]       │ 3            │ ⋮        │
│ [Système]     │ [annonces:write]      │              │          │
│               │ [+4]                  │              │          │
└─────────────────────────────────────────────────────────────────┘
```

### Éléments de l'interface

- **Badge "Système"** : Rôles non supprimables
- **Chips de permissions** : 3 premières permissions affichées
- **Compteur "+N"** : Nombre de permissions supplémentaires (tooltip au survol)
- **Colonne Utilisateurs** : Nombre d'utilisateurs avec ce rôle
- **Menu Actions** : Modifier / Supprimer

## Créer un Rôle

### 1. Cliquer sur "Nouveau rôle"

La page `/admin/roles/new` s'ouvre avec un formulaire vide.

### 2. Remplir le nom du rôle

```
┌────────────────────────────────────────┐
│ Nouveau rôle                      ✕    │
├────────────────────────────────────────┤
│                                        │
│ Nom du rôle                            │
│ ┌────────────────────────────────────┐ │
│ │ Modérateur                         │ │
│ └────────────────────────────────────┘ │
│                                        │
```

### 3. Sélectionner les permissions

```
│ 02  Permissions                   5/31 │
│                                        │
│ ┌ Utilisateurs (2/3) ─┐ ┌ Annonces (3/3) ─┐
│ │ [Tout] [Aucun]      │ │ [Tout] [Aucun]  │
│ │ ☑ users:read        │ │ ☑ annonces:read │
│ │ ☑ users:write       │ │ ☑ annonces:write│
│ │ ☐ users:delete      │ │ ☑ annonces:del. │
│ └─────────────────────┘ └─────────────────┘
│ ┌ Rôles (0/3) ────────┐ ┌ Équipes (0/3) ──┐
│ ...
```

Tous les modules sont visibles d'un coup : la page a remplacé les accordéons du
dialogue, qui n'existaient que pour tenir dans la hauteur d'une modale.

### 4. Valider

```
│ [Annuler]          [Enregistrer]       │
└────────────────────────────────────────┘
```

### Messages de validation

**Erreur - Aucune permission sélectionnée:**
```
┌────────────────────────────────────────┐
│ ⚠ Veuillez sélectionner au moins      │
│   une permission                       │
└────────────────────────────────────────┘
```

**Succès:**
```
✓ Rôle créé avec succès
```

## Modifier un Rôle

### 1. Cliquer sur ⋮ puis "Modifier"

La page `/admin/roles/edit/:id` s'ouvre avec les données du rôle :

```
┌────────────────────────────────────────┐
│ Modifier rôle                     ✕    │
├────────────────────────────────────────┤
│                                        │
│ Nom du rôle                            │
│ ┌────────────────────────────────────┐ │
│ │ Gestionnaire                       │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Permissions                            │
│                                        │
│ ▼ Équipes (3/3)                        │
│   ☑ teams:read                         │
│   ☑ teams:write                        │
│   ☑ teams:delete                       │
│                                        │
│ ▼ Jeux (3/3)                           │
│   ☑ games:read                         │
│   ☑ games:write                        │
│   ☑ games:delete                       │
│                                        │
│ ...                                    │
│                                        │
│ [Annuler]          [Enregistrer]       │
└────────────────────────────────────────┘
```

### 2. Modifier et valider

**Succès:**
```
✓ Rôle modifié avec succès
```

## Supprimer un Rôle

### 1. Cliquer sur ⋮ puis "Supprimer"

**Cas 1 : Rôle avec utilisateurs**
```
┌────────────────────────────────────────┐
│ ⚠ Impossible de supprimer ce rôle,    │
│   5 utilisateur(s) l'utilisent         │
└────────────────────────────────────────┘
```

**Cas 2 : Rôle système**
L'option "Supprimer" n'apparaît pas dans le menu.

**Cas 3 : Rôle sans utilisateurs**
```
┌────────────────────────────────────────┐
│ Voulez-vous vraiment supprimer le      │
│ rôle "Modérateur" ?                    │
│                                        │
│        [Annuler]  [OK]                 │
└────────────────────────────────────────┘
```

**Succès:**
```
✓ Rôle supprimé
```

## Permissions Requises

| Action        | Permission requise |
|---------------|-------------------|
| Voir la page  | `roles:read`      |
| Créer         | `roles:write`     |
| Modifier      | `roles:write`     |
| Supprimer     | `roles:delete`    |

## Cas d'Usage

### Créer un rôle "Éditeur"

Pour un utilisateur qui peut gérer le contenu mais pas les équipes :

1. Nom : "Éditeur"
2. Permissions :
   - Annonces : read, write, delete
   - Articles : read, write, delete
3. Enregistrer

### Créer un rôle "Support"

Pour un utilisateur qui peut voir les utilisateurs mais pas les modifier :

1. Nom : "Support"
2. Permissions :
   - Utilisateurs : read
   - Équipes : read
   - Jeux : read
3. Enregistrer

### Modifier un rôle existant

Pour ajouter une permission à un rôle :

1. Ouvrir le rôle en édition
2. Dérouler le groupe de permissions
3. Cocher la nouvelle permission
4. Enregistrer

## Conseils

1. **Organiser par responsabilité** : Créez des rôles spécifiques pour chaque type d'utilisateur
2. **Principe du moindre privilège** : Donnez uniquement les permissions nécessaires
3. **Rôles système** : Ne modifiez pas les rôles Admin, Gestionnaire et CM
4. **Test** : Testez les nouveaux rôles avec un compte test avant de les assigner
5. **Documentation** : Documentez les rôles personnalisés que vous créez

## Raccourcis Clavier

- **Retour arrière du navigateur** : Revenir à la liste (une confirmation
  s'affiche si des modifications ne sont pas enregistrées)
- **Entrée** : Valider le formulaire (si valide)
- **Tab** : Navigation entre les champs
