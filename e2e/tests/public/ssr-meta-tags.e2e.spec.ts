/**
 * Tests E2E — rendu serveur et previews sociales (EPIC-29)
 *
 * Ces tests lisent le **HTML brut**, via `request.get()` et non `page.goto()`.
 * C'est délibéré : un scraper de lien — Discord, LinkedIn, Facebook, Slack — ne
 * exécute pas de JavaScript. Passer par un contexte navigateur validerait le
 * rendu client et laisserait passer exactement la régression qu'on veut voir.
 *
 * Deux familles d'assertions, et les deux comptent :
 *
 *  1. Les meta tags — le titre et la description de la page, pas ceux du site.
 *  2. **Le contenu métier** — le titre de l'article dans le corps, le nom de
 *     l'équipe. Sans ce second point, un HTML structurellement correct mais vide
 *     de données passerait au vert. C'est le mode de défaillance le plus
 *     probable du rendu serveur, et il n'émet aucune erreur : il suffit que les
 *     appels API échouent côté Node pour que la page se rende « avec succès »
 *     sans la moindre donnée.
 *
 * Sur un environnement servi en bundle statique, les tests se sautent d'eux-mêmes.
 * Sur preprod et en production, poser `EXPECT_SSR=1` : l'absence de rendu serveur
 * devient alors un échec, ce qui est tout l'intérêt de ces tests.
 */

import { test, expect, APIResponse } from '@playwright/test';

/** User-agent d'un scraper social réel : c'est le trafic qu'on veut couvrir. */
const CRAWLER_UA = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

const CRAWLER_HEADERS = { 'User-Agent': CRAWLER_UA };

/** Extrait le contenu d'une balise meta, par `property` ou par `name`. */
function readMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${key}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) return match[1];
  }
  return null;
}

function readTitle(html: string): string | null {
  return /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? null;
}

/** Corps de la page, meta et scripts exclus — pour chercher du contenu réel. */
function readBodyText(html: string): string {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Le rendu serveur est-il actif ? Un placeholder `__OG_` intact signale un
 * environnement servi en statique, ou un rendu serveur qui a échoué en
 * répondant tout de même 200.
 */
function isServerRendered(html: string): boolean {
  return !html.includes('__OG_TITLE__') && !html.includes('__OG_DESCRIPTION__');
}

/**
 * Sur un environnement où le rendu serveur doit être actif — preprod, prod — le
 * job pose `EXPECT_SSR=1`. Son absence devient alors un **échec**, et non un
 * saut de test.
 *
 * Sans ce garde-fou, ces tests auraient été inutiles là où ils comptent le
 * plus : une régression désactivant le rendu serveur les aurait tous fait
 * sauter, et la suite serait restée verte. C'est précisément le scénario qu'ils
 * doivent attraper.
 */
const EXPECT_SSR = process.env.EXPECT_SSR === '1';

function requireServerRendering(html: string): void {
  if (isServerRendered(html)) return;

  if (EXPECT_SSR) {
    throw new Error(
      'Rendu serveur inactif : la réponse contient encore les placeholders __OG_*__. ' +
        'La page a été servie en rendu client, donc sans contenu pour les scrapers, ' +
        'et en répondant HTTP 200 — rien ne le signale côté appelant. ' +
        'Causes probables : allowedHosts vide, ou route publique passée en RenderMode.Client.'
    );
  }

  test.skip(true, 'rendu serveur inactif sur cet environnement (poser EXPECT_SSR=1 pour l’exiger)');
}

async function fetchHtml(request: { get(url: string, options?: object): Promise<APIResponse> }, path: string) {
  const response = await request.get(path, { headers: CRAWLER_HEADERS });
  return { response, html: await response.text() };
}

test.describe('Rendu serveur — meta tags lus par les scrapers sociaux', () => {
  test('la home est rendue côté serveur avec son titre et sa description', async ({ request }) => {
    const { response, html } = await fetchHtml(request, '/');

    expect(response.status()).toBe(200);
    requireServerRendering(html);

    expect(readTitle(html)).toContain('Team Divergentes');
    expect(readMeta(html, 'og:title')).toContain('Team Divergentes');

    const description = readMeta(html, 'description');
    expect(description).toBeTruthy();
    expect(description).not.toContain('__OG_');
  });

  test('chaque page publique porte un titre distinct, pas celui du site', async ({ request }) => {
    const routes = ['/', '/articles', '/boutique', '/structure/equipes', '/contact'];
    const titles = new Map<string, string>();

    for (const route of routes) {
      const { response, html } = await fetchHtml(request, route);
      expect(response.status(), `HTTP sur ${route}`).toBe(200);
      requireServerRendering(html);

      const title = readTitle(html);
      expect(title, `titre manquant sur ${route}`).toBeTruthy();
      titles.set(route, title as string);
    }

    // C'est le défaut d'origine de l'EPIC-29 : les cinq routes renvoyaient le
    // même titre, donc la même carte au partage.
    expect(new Set(titles.values()).size, `titres identiques : ${[...titles.values()].join(' | ')}`).toBe(
      routes.length
    );
  });

  test('un article expose ses propres meta ET son contenu', async ({ request }) => {
    const { html: listHtml } = await fetchHtml(request, '/articles');
    requireServerRendering(listHtml);

    const slug = /href="\/articles\/([a-z0-9-]+)"/i.exec(listHtml)?.[1];
    test.skip(!slug, 'aucun article publié sur cet environnement');

    const { response, html } = await fetchHtml(request, `/articles/${slug}`);
    expect(response.status()).toBe(200);

    const title = readTitle(html);
    expect(title).toBeTruthy();
    expect(title).not.toContain('__OG_');

    // og:title doit refléter l'article, pas le site.
    expect(readMeta(html, 'og:title')).toBe(title);
    expect(readMeta(html, 'og:url')).toContain(`/articles/${slug}`);

    const image = readMeta(html, 'og:image');
    expect(image, 'og:image absent').toBeTruthy();
    expect(image, 'og:image doit être une URL absolue').toMatch(/^https?:\/\//);
    // Régression déjà rencontrée : origine et chemin collés faute de séparateur.
    expect(image).not.toMatch(/[a-z]{2}assets\//);

    // Le point décisif : la page contient-elle réellement l'article ?
    // Sans cette assertion, un HTML vide de données passerait au vert.
    const bodyText = readBodyText(html);
    const articleTitle = (title as string).split('|')[0].trim();
    expect(bodyText.length, 'corps de page quasi vide').toBeGreaterThan(500);
    expect(bodyText, "le titre de l'article est absent du corps").toContain(articleTitle);
  });

  test("le canonical et le JSON-LD sont dans le HTML brut", async ({ request }) => {
    const { html } = await fetchHtml(request, '/articles');
    requireServerRendering(html);

    const canonical = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1];
    expect(canonical, 'lien canonique absent').toBeTruthy();
    expect(canonical).toMatch(/^https?:\/\//);

    // Une garde isPlatformBrowser sur setJsonLd suffirait à faire disparaître
    // tout le JSON-LD du HTML envoyé aux bots, sans autre symptôme.
    expect(html, 'aucun bloc JSON-LD').toContain('application/ld+json');
  });

  test('une fiche équipe expose le nom de son équipe', async ({ request }) => {
    const { html: listHtml } = await fetchHtml(request, '/structure/equipes');
    requireServerRendering(listHtml);

    const slug = /href="\/structure\/equipes\/([a-z0-9-]+)"/i.exec(listHtml)?.[1];
    test.skip(!slug, 'aucune équipe publiée sur cet environnement');

    const { response, html } = await fetchHtml(request, `/structure/equipes/${slug}`);
    expect(response.status()).toBe(200);

    const title = readTitle(html);
    expect(title).toBeTruthy();
    expect(title).not.toContain('__OG_');

    const teamName = (title as string).split('|')[0].trim();
    expect(readBodyText(html), "le nom de l'équipe est absent du corps").toContain(teamName);
  });
});

test.describe('Rendu serveur — périmètre et fichiers servis depuis le disque', () => {
  test('les routes privées ne sont pas rendues côté serveur', async ({ request }) => {
    for (const route of ['/admin/users', '/profile']) {
      const response = await request.get(route, { headers: CRAWLER_HEADERS });
      expect(response.status(), `HTTP sur ${route}`).toBe(200);

      const html = await response.text();
      const title = readTitle(html);

      // Le shell client est servi tel quel. Deux défauts sont possibles : un
      // titre de page réel (la route serait rendue côté serveur), ou un
      // placeholder brut (le shell du bundle serveur, que rien ne substitue).
      expect(title, `placeholder non substitué sur ${route}`).not.toContain('__OG_');
      expect(readBodyText(html).length, `${route} semble rendue côté serveur`).toBeLessThan(2000);
    }
  });

  test('robots.txt et la config runtime restent servis depuis le disque', async ({ request }) => {
    // Régression rencontrée : le proxy vers le serveur de rendu happait ces deux
    // fichiers et renvoyait une page HTML « Page non trouvée », en HTTP 200.
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const robotsBody = await robots.text();
    expect(robotsBody, 'robots.txt renvoie du HTML').not.toContain('<!DOCTYPE html>');
    expect(robotsBody).toContain('User-agent');

    const config = await request.get('/assets/config.json');
    expect(config.status()).toBe(200);
    const configBody = await config.text();
    expect(configBody, 'config.json renvoie du HTML').not.toContain('<!DOCTYPE html>');
    expect(() => JSON.parse(configBody)).not.toThrow();
  });

  test('les headers de sécurité sont présents sur une page publique', async ({ request }) => {
    const response = await request.get('/articles', { headers: CRAWLER_HEADERS });
    const headers = response.headers();

    // Un add_header oublié dans le bloc location du site public retirerait la
    // CSP de tout le site, sans que rien ne le montre sur une page.
    for (const header of [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
    ]) {
      expect(headers[header], `header ${header} absent`).toBeTruthy();
    }
  });
});
