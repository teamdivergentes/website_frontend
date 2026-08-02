# Module Sponsors

Module complet de gestion des sponsors avec support multi-images, liens multiples et organisation par tiers (Principal, Secondaire, Tertiaire).

## Architecture

### Modèles (`src/app/shared/models/sponsor.model.ts`)
- `SponsorTier`: Enum pour les tiers (PRINCIPAL, SECONDARY, TERTIARY)
- `LinkType`: Enum pour les types de liens (WEBSITE, TWITTER, INSTAGRAM, DISCORD, PROMO_CODE, OTHER)
- `Sponsor`: Interface principale avec images et liens
- `SponsorsGrouped`: Groupement par tier
- DTOs pour la création et mise à jour

### Service (`src/app/shared/services/sponsors.service.ts`)
- Signals pour état réactif (`principal`, `secondary`, `tertiary`)
- CRUD sponsors
- Gestion images (add, remove, setPrimary, reorder)
- Gestion liens (add, update, remove)
- Réordonnancement par tier

### Composants Publics

#### `SponsorComponent` (`src/app/pages/sponsors/`)
- Affiche les sponsors groupés par tier
- 3 sections: Partenaires Principaux, Partenaires, Nos Soutiens
- Responsive avec grilles adaptatives
- Route: `/structure/sponsors`

#### `SponsorCardComponent` (`src/app/pages/sponsors/components/`)
- 3 tailles: large, medium, small
- Carousel d'images auto-rotate (5s)
- Liens supplémentaires pour tier principal
- Lazy loading des images

### Composants Admin

#### `SponsorsComponent` (`src/app/admin/pages/sponsors/`)
- Page principale avec onglets par tier
- Actions: créer, éditer, supprimer, toggle active
- Route: `/admin/sponsors` (permission: `sponsors:read`)

#### `SponsorsTierListComponent`
- Liste drag-drop pour réordonner les sponsors
- Affiche métadonnées (images, liens, dates)
- Actions par sponsor

#### `SponsorFormDialogComponent`
- Création/édition d'un sponsor
- Champs: nom, description, tier, dates début/fin
- Validation formulaire

#### `SponsorImagesPageComponent`
- Page routée `/admin/sponsors/:id/images` (permission : `sponsors:read`)
- Trois emplacements : logo principal, secondaire 1, secondaire 2
- Ajout par téléversement, suppression via `AdminConfirmService`
- Un identifiant inconnu rend `<app-error-state>` avec réessai
- Migré depuis un dialogue `lg` (EPIC-41, feature 3) : une collection éditable
  n'a pas sa place dans une modale

#### `SponsorLinksDialogComponent`
- CRUD des liens d'un sponsor
- Types de liens avec icônes
- Définir lien principal

## Styles

### Variables CSS
```scss
--accent: #18e7b7
--card: rgba(255, 255, 255, 0.03)
--border: #253b36
```

### Grilles Responsive
- **Large** (Principal): `minmax(min(100%, 400px), 1fr)`
- **Medium** (Secondaire): `minmax(min(100%, 280px), 1fr)`
- **Small** (Tertiaire): `minmax(min(100%, 180px), 1fr)`

## Utilisation

### Chargement des sponsors
```typescript
const sponsorsService = inject(SponsorsService);
sponsorsService.loadSponsors().subscribe();

// Accès aux sponsors par tier
const principal = sponsorsService.principal();
const secondary = sponsorsService.secondary();
const tertiary = sponsorsService.tertiary();
```

### Création d'un sponsor
```typescript
const dto: CreateSponsorDto = {
  name: 'Sponsor Name',
  description: 'Description',
  tier: SponsorTier.PRINCIPAL,
  startDate: '2024-01-01T00:00:00Z'
};

sponsorsService.createSponsor(dto).subscribe();
```

### Gestion des images
```typescript
// Ajouter
sponsorsService.addImage(sponsorId, { url: 'https://...', alt: 'Logo' }).subscribe();

// Définir comme principale
sponsorsService.setPrimaryImage(sponsorId, imageId).subscribe();

// Réordonner
sponsorsService.reorderImages(sponsorId, [3, 1, 2]).subscribe();
```

### Gestion des liens
```typescript
// Ajouter
const link: AddLinkDto = {
  url: 'https://twitter.com/...',
  label: 'Twitter',
  type: LinkType.TWITTER,
  isPrimary: false
};
sponsorsService.addLink(sponsorId, link).subscribe();

// Modifier
sponsorsService.updateLink(sponsorId, linkId, { label: 'Nouveau label' }).subscribe();
```

## Permissions
- `sponsors:read`: Accès à la page admin
- Les permissions CRUD sont gérées au niveau backend

## Tests
- Les composants utilisent OnPush change detection
- Signals pour la réactivité
- TrackBy functions pour performances (@for loops)
