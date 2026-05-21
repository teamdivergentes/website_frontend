/**
 * Fixture de données pour les tests E2E
 *
 * Expose des helpers API (via APIRequestContext Playwright) pour créer des
 * entités de test isolées. Toutes les entités créées sont préfixées « e2e- »
 * et supprimées automatiquement en fin de test (cleanup afterEach).
 *
 * L'authentification API repose sur le cookie HttpOnly `dvg_auth_token`
 * posé par POST /api/auth/login. Playwright stocke ce cookie dans le
 * contexte de requête et le renvoie automatiquement sur les appels suivants.
 *
 * Usage :
 *   import { test } from '../../fixtures';
 *
 *   test('créer une équipe via API', async ({ testData }) => {
 *     const team = await testData.createTeam('ma-super-equipe');
 *     // team.id est disponible pour le test
 *   });
 *
 * Prérequis :
 *   Le compte TEST_ADMIN doit exister en base.
 *
 * Endpoints utilisés (voir controllers backend) :
 *   POST   /api/auth/login
 *   POST   /api/teams          (admin)
 *   DELETE /api/teams/:id      (admin)
 *   POST   /api/users          (admin)
 *   DELETE /api/users/:id      (admin)
 *   POST   /api/sponsors       (admin)
 *   DELETE /api/sponsors/:id   (admin)
 *   POST   /api/games          (admin)
 *   DELETE /api/games/:id      (admin)
 *   POST   /api/articles       (admin, cm)
 *   DELETE /api/articles/:id   (admin)
 */

import { test as base, APIRequestContext } from '@playwright/test';
import { TEST_ADMIN } from './test-data';

/** Entité minimale retournée par le backend (id numérique) */
interface EntityWithId {
  id: number;
  [key: string]: unknown;
}

/** Helpers exposés par la fixture `testData` */
export interface DataHelpers {
  /**
   * Crée une équipe de test.
   * Le nom sera préfixé « e2e- » si ce n'est pas déjà le cas.
   * Champ `game` requis par le backend — utilise « e2e-game » par défaut
   * (doit correspondre à un jeu existant ou être créé via createGame).
   */
  createTeam(name: string, gameKey?: string): Promise<EntityWithId>;

  /**
   * Crée un utilisateur de test.
   * L'email sera préfixé « e2e- » si ce n'est pas déjà le cas.
   */
  createUser(email: string, password: string, roleId?: number): Promise<EntityWithId>;

  /**
   * Crée un sponsor de test.
   * Le nom sera préfixé « e2e- » si ce n'est pas déjà le cas.
   */
  createSponsor(name: string): Promise<EntityWithId>;

  /**
   * Crée un jeu de test.
   * La clé et le nom seront préfixés « e2e- » si ce n'est pas déjà le cas.
   */
  createGame(name: string): Promise<EntityWithId>;

  /**
   * Crée un article de test.
   * Le titre sera préfixé « e2e- » si ce n'est pas déjà le cas.
   * typeId 1 = type article par défaut (à ajuster selon le seed).
   */
  createArticle(title: string, content?: string, typeId?: number): Promise<EntityWithId>;
}

/** Suivi interne des entités créées pendant un test */
interface CreatedEntities {
  teams: EntityWithId[];
  users: EntityWithId[];
  sponsors: EntityWithId[];
  games: EntityWithId[];
  articles: EntityWithId[];
}

type DataFixtures = {
  testData: DataHelpers;
};

/**
 * S'assure qu'une chaîne est préfixée par « e2e- ».
 * Permet d'identifier et de nettoyer les données de test en toute sécurité.
 */
function withE2EPrefix(value: string): string {
  return value.startsWith('e2e-') ? value : `e2e-${value}`;
}

/**
 * Effectue un appel API JSON authentifié et retourne l'entité créée.
 * Lève une erreur explicite si la réponse n'est pas 2xx.
 */
async function apiPost(
  request: APIRequestContext,
  url: string,
  body: Record<string, unknown>,
): Promise<EntityWithId> {
  const response = await request.post(url, {
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    const texte = await response.text();
    throw new Error(`[data.fixture] POST ${url} a échoué (${response.status()}) : ${texte}`);
  }

  return (await response.json()) as EntityWithId;
}

/**
 * Effectue un appel DELETE API. Ne lève pas d'erreur si la ressource
 * est introuvable (404) — cas où le test l'aurait déjà supprimée.
 */
async function apiDelete(request: APIRequestContext, url: string): Promise<void> {
  const response = await request.delete(url);

  if (!response.ok() && response.status() !== 404) {
    const texte = await response.text();
    console.warn(`[data.fixture] DELETE ${url} a échoué (${response.status()}) : ${texte}`);
  }
}

export const test = base.extend<DataFixtures>({
  /**
   * Fixture `testData` :
   * - Ouvre une session admin via POST /api/auth/login (cookie HttpOnly)
   * - Expose les helpers createTeam, createUser, createSponsor, createGame, createArticle
   * - Supprime toutes les entités créées après le test (cleanup automatique)
   */
  testData: async ({ request }, use) => {
    // --- Authentification initiale ---
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
      headers: { 'Content-Type': 'application/json' },
    });

    if (!loginResponse.ok()) {
      throw new Error(
        `[data.fixture] Échec de l'authentification admin (${loginResponse.status()})`,
      );
    }
    // Le cookie dvg_auth_token est désormais stocké dans le contexte Playwright.
    // Toutes les requêtes suivantes via `request` l'enverront automatiquement.

    // --- Suivi des entités créées ---
    const created: CreatedEntities = {
      teams: [],
      users: [],
      sponsors: [],
      games: [],
      articles: [],
    };

    // --- Helpers ---
    const helpers: DataHelpers = {
      async createTeam(name: string, gameKey = 'e2e-game'): Promise<EntityWithId> {
        const entity = await apiPost(request, '/api/teams', {
          name: withE2EPrefix(name),
          game: withE2EPrefix(gameKey),
        });
        created.teams.push(entity);
        return entity;
      },

      async createUser(
        email: string,
        password: string,
        roleId?: number,
      ): Promise<EntityWithId> {
        const body: Record<string, unknown> = {
          email: withE2EPrefix(email),
          password,
        };
        if (roleId !== undefined) body['roleId'] = roleId;

        const entity = await apiPost(request, '/api/users', body);
        created.users.push(entity);
        return entity;
      },

      async createSponsor(name: string): Promise<EntityWithId> {
        const entity = await apiPost(request, '/api/sponsors', {
          name: withE2EPrefix(name),
        });
        created.sponsors.push(entity);
        return entity;
      },

      async createGame(name: string): Promise<EntityWithId> {
        const entity = await apiPost(request, '/api/games', {
          key: withE2EPrefix(name.toLowerCase().replace(/\s+/g, '-')),
          name: withE2EPrefix(name),
        });
        created.games.push(entity);
        return entity;
      },

      async createArticle(
        title: string,
        content = '<p>Contenu de test E2E</p>',
        typeId = 1,
      ): Promise<EntityWithId> {
        const entity = await apiPost(request, '/api/articles', {
          title: withE2EPrefix(title),
          content,
          typeId,
        });
        created.articles.push(entity);
        return entity;
      },
    };

    // --- Exécution du test ---
    await use(helpers);

    // --- Cleanup automatique (afterEach implicite) ---
    // Les articles sont supprimés en premier car ils peuvent référencer d'autres entités.
    for (const article of created.articles) {
      await apiDelete(request, `/api/articles/${article.id}`);
    }
    for (const team of created.teams) {
      await apiDelete(request, `/api/teams/${team.id}`);
    }
    for (const sponsor of created.sponsors) {
      await apiDelete(request, `/api/sponsors/${sponsor.id}`);
    }
    for (const game of created.games) {
      await apiDelete(request, `/api/games/${game.id}`);
    }
    // Les utilisateurs sont supprimés en dernier (ne pas supprimer l'admin courant).
    for (const user of created.users) {
      await apiDelete(request, `/api/users/${user.id}`);
    }
  },
});

export { expect } from '@playwright/test';
