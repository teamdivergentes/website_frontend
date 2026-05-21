# Tests E2E — Frontend DVG

Suite Playwright pour le frontend Angular de Team Divergentes.

---

## Lancer les tests

```bash
# Contre ng serve local (démarre automatiquement si absent)
npm run e2e

# Lancer sans démarrer le serveur (si déjà actif sur :4200 ou :8080)
npx playwright test

# Mode UI interactif (recommandé pour le debug)
npx playwright test --ui

# Un seul fichier
npx playwright test e2e/tests/smoke/health.spec.ts

# Voir le rapport HTML après une exécution
npx playwright show-report
```

En CI, positionner `BASE_URL=http://localhost:8080` pour cibler le Docker Compose.

---

## Organisation des specs

```
e2e/
├── fixtures/
│   ├── auth.fixture.ts   # Fixtures Playwright (authenticatedPage, loginPage)
│   └── test-data.ts      # Constantes partagées (comptes, routes, timeouts)
├── helpers/
│   ├── auth.ts           # loginAsAdmin(), isBackendAvailable()
│   └── retry.ts          # waitAndRetry() — remplaçant des waitForTimeout inline
├── pages/                # Page Object Model (POM) par écran
└── tests/
    ├── admin/            # CRUD admin (jeux, staff, rôles, etc.)
    ├── auth/             # Formulaire de login
    ├── errors/           # Cas d'erreur (form validation, sécurité, 404)
    ├── public/           # Pages publiques (accueil, équipes, recrutement…)
    ├── responsive/       # Comportements responsive (breakpoints)
    └── smoke/            # Health check et navigation minimale
```

---

## Convention de nommage des specs

| Situation | Suffixe | Exemple |
|-----------|---------|---------|
| Test fonctionnel standard | `.spec.ts` | `games.spec.ts` |
| Parcours utilisateur complet (end-to-end long) | `.e2e.spec.ts` | `auth-cookie-flow.e2e.spec.ts` |

Les deux conventions sont reconnues par `playwright.config.ts` (`testDir: './e2e/tests'`).

---

## Fixtures d'authentification

Importer `test` depuis `fixtures/auth.fixture.ts` (et non depuis `@playwright/test`) pour
les specs qui nécessitent une session admin :

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('accès au dashboard admin', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/admin');
  await expect(authenticatedPage.locator('h1')).toBeVisible();
});
```

La fixture `authenticatedPage` effectue le login via l'UI et attend la redirection vers `/admin`.
La fixture `loginPage` fournit une instance de `LoginPage` sans login préalable.

---

## Convention `data-testid`

Pour tout nouvel élément interactif ou assertion critique, ajouter un attribut `data-testid`
sur le template Angular :

```html
<button data-testid="submit-login">Connexion</button>
<div data-testid="toast-success">Opération réussie</div>
```

Règles :
- Minuscules, tirets (kebab-case)
- Préfixer par la zone fonctionnelle quand utile : `admin-game-form-name`, `public-header-logo`
- Ne pas utiliser de sélecteurs CSS ou de texte visible comme locateur principal

---

## Données de test

Toutes les constantes de test sont centralisées dans `fixtures/test-data.ts` :
`TEST_ADMIN`, `TEST_GAME`, `TEST_STAFF`, `TEST_CONTACT`, `TIMEOUTS`, `PUBLIC_ROUTES`, `ADMIN_ROUTES`.

Préfixer les données créées pendant un test par `e2e-` pour les distinguer des données
de production en cas de base partagée :

```typescript
const name = `e2e-jeu-${Date.now()}`;
```

---

## Helper retry

`helpers/retry.ts` expose `waitAndRetry(action, maxAttempts, delay)` pour absorber
la flakiness des animations ou des réponses API lentes, sans `waitForTimeout` :

```typescript
import { waitAndRetry } from '../../helpers/retry';

await waitAndRetry(() =>
  expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
);
```

---

## Quarantaine des tests flaky

Si un test est identifié comme flaky après plusieurs runs :
1. Marquer `test.fixme('description', ...)` avec un commentaire expliquant la cause suspectée
2. Créer une US dédiée dans le backlog pour corriger la source de flakiness
3. Ne pas supprimer le test — le laisser en `fixme` le temps de la correction
