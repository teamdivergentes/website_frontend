/**
 * Tests E2E — Parcours post-paiement de la boutique (EPIC-40 / EPIC-49)
 *
 * Couvre les deux défauts corrigés le 2026-08-11 :
 * 1. `/boutique/merci` ne vide plus le panier sans preuve de paiement — un
 *    favori, un lien collé ou l'historique ne détruit plus un panier en cours.
 * 2. Une panne du catalogue au panier s'affiche comme une erreur avec
 *    « Réessayer », jamais comme « votre panier est vide ».
 *
 * Le panier est semé directement en localStorage (clé `dvg_cart_v1`, tableau
 * de lignes {productId, size, quantity}) : c'est la forme que `CartService`
 * relit, et la semer évite de dépendre du parcours fiche produit.
 */

import { test, expect, Page } from '@playwright/test';
import { isBackendAvailable } from '../../helpers/auth';

/** Ligne de panier factice mais conforme, pour un produit réel du catalogue. */
async function seedCart(page: Page): Promise<boolean> {
  const response = await page.request.get('/api/shop/products');
  if (!response.ok()) return false;
  const body = (await response.json()) as {
    products?: { id: number; sizes: { label: string; inStock: boolean }[] }[];
  };
  const product = body.products?.[0];
  const size = product?.sizes.find((candidate) => candidate.inStock);
  if (!product || !size) return false;

  await page.addInitScript(
    ([productId, sizeLabel]) => {
      // `flockingText: null` est obligatoire : `isCartLine` (CartService)
      // rejette toute ligne où le champ manque.
      window.localStorage.setItem(
        'dvg_cart_v1',
        JSON.stringify([{ productId, size: sizeLabel, quantity: 1, flockingText: null }]),
      );
    },
    [product.id, size.label] as const,
  );
  return true;
}

/** Le panier tel qu'il est réellement persisté, indépendamment de l'écran. */
async function storedCartLength(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('dvg_cart_v1');
    if (!raw) return 0;
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  });
}

test.describe('Boutique — parcours post-paiement', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await isBackendAvailable(page)), 'Backend indisponible');
  });

  test('merci sans session_id : le panier survit et la page ne confirme rien', async ({ page }) => {
    test.skip(!(await seedCart(page)), 'Catalogue vide ou boutique fermée');

    await page.goto('/boutique/merci', { waitUntil: 'domcontentloaded' });
    await page.locator('.merci').waitFor({ timeout: 15000 });

    // Pas de preuve de paiement : l'écran reste en état d'attente, il
    // n'affirme pas qu'une commande existe.
    await expect(page.locator('.merci__seal--pending')).toBeVisible();

    // Le point central du défaut n° 1 : le panier n'a pas été vidé.
    expect(await storedCartLength(page)).toBe(1);
  });

  test('merci avec un session_id inconnu : même protection', async ({ page }) => {
    test.skip(!(await seedCart(page)), 'Catalogue vide ou boutique fermée');

    await page.goto('/boutique/merci?session_id=cs_test_e2e_inconnu', {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('.merci').waitFor({ timeout: 15000 });

    // La confirmation est introuvable côté serveur : l'état payé ne doit
    // jamais s'afficher, et le panier reste intact.
    await expect(page.locator('.merci__seal--pending')).toBeVisible({ timeout: 15000 });
    expect(await storedCartLength(page)).toBe(1);
  });

  test('panne du catalogue au panier : erreur et « Réessayer », jamais « panier vide »', async ({
    page,
  }) => {
    test.skip(!(await seedCart(page)), 'Catalogue vide ou boutique fermée');

    // Panne simulée : le catalogue ne répond plus.
    await page.route('**/api/shop/products*', (route) => route.abort());

    await page.goto('/boutique/panier', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('La boutique est momentanément indisponible.')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    // Le message trompeur du défaut n° 2 ne doit plus apparaître.
    await expect(page.getByText(/panier est vide/i)).toHaveCount(0);
    // Et le panier réel n'a pas bougé.
    expect(await storedCartLength(page)).toBe(1);

    // La panne cesse : « Réessayer » suffit, sans recharger la page.
    await page.unroute('**/api/shop/products*');
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.locator('.panier__line').first()).toBeVisible({ timeout: 15000 });
  });
});
