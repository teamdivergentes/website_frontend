/**
 * Tests E2E — Page Préférences vie privée (/privacy-optout) — EPIC-18
 *
 * La page embarque l'iframe d'opt-out Matomo servie par matomo.tellebma.fr.
 * Un bug de production a montré que la Content-Security-Policy de Nginx
 * autorisait matomo.tellebma.fr dans script-src et connect-src mais pas dans
 * frame-src, ce qui bloquait l'iframe. Ces tests verrouillent le correctif :
 * l'iframe doit être présente, pointer sur le bon endpoint Matomo, et ne
 * déclencher aucune violation CSP côté navigateur.
 *
 * Sélecteurs basés sur privacy-optout.html :
 * - section.privacy-optout          -> conteneur principal
 * - h1.privacy-optout__title        -> titre "Préférences vie privée"
 * - section.privacy-optout iframe   -> iframe d'opt-out Matomo
 *
 * Note : en dev (ng serve) aucun en-tête CSP n'est émis, la vérification de
 * l'en-tête HTTP n'est donc faite que lorsque la cible est le Docker Nginx
 * (BASE_URL sur :8080), comme dans errors/security-errors.spec.ts.
 */

import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../fixtures/test-data';

const MATOMO_ORIGIN = 'https://matomo.tellebma.fr';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Branche un collecteur d'erreurs console liées à la CSP.
 * Doit être appelé AVANT la navigation pour ne rien manquer.
 */
function collectCspErrors(page: Page): string[] {
  const cspErrors: string[] = [];

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/content security policy/i.test(text)) {
      cspErrors.push(text);
    }
  });

  return cspErrors;
}

async function navigateToOptoutPage(page: Page): Promise<void> {
  await page.goto('/privacy-optout', { waitUntil: 'domcontentloaded' });
  await page.locator('section.privacy-optout').waitFor({ state: 'visible', timeout: TIMEOUTS.appInit });
}

/** La cible est-elle le Nginx Docker (seul contexte où la CSP est émise) ? */
function isNginxTarget(page: Page): boolean {
  return page.url().includes(':8080') || !!process.env['BASE_URL']?.includes(':8080');
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendu de la page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /privacy-optout — rendu', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToOptoutPage(page);
  });

  test('le titre "Préférences vie privée" est visible', async ({ page }) => {
    await expect(page.locator('h1.privacy-optout__title')).toContainText('Préférences vie privée');
  });

  test("l'iframe d'opt-out Matomo est présente avec le bon src", async ({ page }) => {
    const iframe = page.locator('section.privacy-optout iframe');
    await expect(iframe).toBeVisible({ timeout: TIMEOUTS.normal });

    const src = await iframe.getAttribute('src');
    expect(src).toContain(MATOMO_ORIGIN);
    expect(src).toContain('module=CoreAdminHome');
    expect(src).toContain('action=optOut');
    expect(src).toContain('language=fr');
  });

  test("l'iframe expose un title et un aria-label pour l'accessibilité", async ({ page }) => {
    const iframe = page.locator('section.privacy-optout iframe');
    await expect(iframe).toHaveAttribute('title', /.+/);
    await expect(iframe).toHaveAttribute('aria-label', /.+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Content-Security-Policy — l'iframe Matomo ne doit pas être bloquée
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /privacy-optout — CSP et iframe Matomo', () => {
  test("aucune violation CSP n'est remontée dans la console", async ({ page }) => {
    const cspErrors = collectCspErrors(page);

    await navigateToOptoutPage(page);
    await expect(page.locator('section.privacy-optout iframe')).toBeVisible({ timeout: TIMEOUTS.normal });

    // Laisser au navigateur le temps de tenter le chargement de l'iframe :
    // une violation frame-src est signalée au moment de la requête.
    await page.waitForTimeout(1500);

    expect(cspErrors, `Violations CSP detectees : ${cspErrors.join(' | ')}`).toHaveLength(0);
  });

  test("l'iframe n'est pas bloquée : le document embarqué existe", async ({ page }) => {
    await navigateToOptoutPage(page);

    const iframeElement = page.locator('section.privacy-optout iframe');
    await expect(iframeElement).toBeVisible({ timeout: TIMEOUTS.normal });

    // Une iframe bloquée par frame-src reste dans le DOM mais son contentWindow
    // ne navigue jamais vers l'URL demandée. On vérifie que le navigateur a bien
    // enregistré une frame enfant pour ce document.
    const hasChildFrame = await page.evaluate(() => window.frames.length > 0);
    expect(hasChildFrame).toBe(true);
  });

  test("l'en-tête CSP autorise matomo.tellebma.fr dans frame-src (Nginx uniquement)", async ({ page }) => {
    const response = await page.goto('/privacy-optout', { waitUntil: 'domcontentloaded' });

    if (!response || !isNginxTarget(page)) {
      // En dev (ng serve) aucune CSP n'est émise : on vérifie juste que la page répond.
      expect(response?.status()).toBe(200);
      return;
    }

    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeDefined();

    const frameSrc = csp
      .split(';')
      .map(directive => directive.trim())
      .find(directive => directive.startsWith('frame-src'));

    expect(frameSrc, `Directive frame-src absente de la CSP : ${csp}`).toBeDefined();
    expect(frameSrc).toContain(MATOMO_ORIGIN);
  });
});
