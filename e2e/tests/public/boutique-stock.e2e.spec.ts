/**
 * Tests E2E — Gestion de stock de la boutique (EPIC-49)
 *
 * Boucle complète admin → public : l'admin règle un stock par taille, le
 * public voit la disponibilité, le panier refuse ce qui dépasse, et le
 * réglage revient à l'illimité en fin de suite (la base de recette est
 * partagée, la suite nettoie derrière elle).
 *
 * Sélecteurs :
 * - admin /admin/boutique : button[aria-label="Modifier <nom>"] → dialog
 *   produit, .size-row (input texte = taille, input number = stock),
 *   bouton « Enregistrer »
 * - fiche produit : .produit__size, .produit__size--soldout,
 *   .produit__size-flag, .produit__add, .produit__soldout-title
 * - liste v1 /boutique : .jersey__badge--soldout
 * - panier : .panier__line, .panier__stock-error, .panier__stock-error-list,
 *   button[aria-label="Augmenter/Diminuer la quantité"], bouton « Payer »
 *
 * Ces tests écrivent en base : ils s'auto-sautent sans backend, comme les
 * autres suites de mutation.
 *
 * Attention aux relances rapprochées en local : les endpoints publics de la
 * boutique sont throttlés (catalogue 20/min, checkout 5/min). Deux exécutions
 * de la suite dans la même minute font apparaître des 429 qui n'ont rien à
 * voir avec une régression — attendre une minute entre deux runs.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

interface PublicSize {
  label: string;
  inStock: boolean;
}

interface PublicProduct {
  id: number;
  slug: string;
  name: string;
  soldOut: boolean;
  sizes: PublicSize[];
}

/** Premier produit du catalogue public — la suite travaille sur lui. */
async function firstProduct(page: Page): Promise<PublicProduct | null> {
  const response = await page.request.get('/api/shop/products');
  if (!response.ok()) return null;
  const body = (await response.json()) as { products?: PublicProduct[] };
  return body.products?.[0] ?? null;
}

/**
 * Ouvre le dialog d'édition du produit dans l'admin et applique `stocks` aux
 * lignes de tailles (null = vider le champ = illimité), puis enregistre.
 * La dernière valeur du tableau se propage aux lignes restantes : `[0]` épuise
 * tout le produit, `[0, null]` n'épuise que la première taille.
 */
async function setStocks(page: Page, productName: string, stocks: (number | null)[]): Promise<void> {
  await page.goto('/admin/boutique', { waitUntil: 'domcontentloaded' });
  const editButton = page.locator(`button[aria-label="Modifier ${productName}"]`);
  await editButton.waitFor({ timeout: 15000 });
  await editButton.click();

  const rows = page.locator('.size-row');
  await rows.first().waitFor({ timeout: 10000 });
  const count = await rows.count();

  for (let i = 0; i < count; i++) {
    const wanted = stocks[Math.min(i, stocks.length - 1)];
    const stockInput = rows.nth(i).locator('input[type="number"]');
    await stockInput.fill(wanted === null ? '' : String(wanted));
  }

  await page.getByRole('button', { name: /^Enregistrer/ }).click();
  await rows.first().waitFor({ state: 'hidden', timeout: 15000 });
}

/**
 * Une seule connexion admin pour toute la suite, rejouée par `storageState` :
 * le backend limite les tentatives de connexion (protection brute-force,
 * EPIC-30), un login par test finit throttlé et fait sauter la fin de la
 * suite — nettoyage compris.
 */
const ADMIN_STATE = 'test-results/.auth-admin-boutique-stock.json';

test.describe.serial('Boutique — gestion de stock (EPIC-49)', () => {
  let product: PublicProduct | null = null;
  let backendReady = false;
  let adminReady = false;

  test.beforeAll(async ({ browser }) => {
    // Contexte explicitement vierge : `browser.newPage()` hériterait du
    // `storageState` déclaré plus bas… qui n'existe pas encore à ce stade.
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    backendReady = await isBackendAvailable(page);
    if (backendReady) {
      product = await firstProduct(page);
      adminReady = product !== null && (await loginAsAdmin(page));
    }
    // Le fichier doit exister même si la connexion a échoué : la fixture
    // storageState le lit avant que les skips ne se prononcent.
    await context.storageState({ path: ADMIN_STATE });
    await context.close();
  });

  test.use({ storageState: ADMIN_STATE });

  test.beforeEach(() => {
    test.skip(!backendReady, 'Backend indisponible : suite de mutation sautée');
    test.skip(!product, 'Catalogue vide ou boutique fermée');
    test.skip(!adminReady, 'Connexion admin impossible');
  });

  test('admin : le stock par taille se saisit et se persiste', async ({ page }) => {
    await setStocks(page, product!.name, [1]);

    // La persistance se vérifie sur l'API publique : la taille limitée à 1
    // reste disponible (1 > 0), le produit n'est pas épuisé.
    const fresh = await firstProduct(page);
    expect(fresh?.sizes[0].inStock).toBe(true);
    expect(fresh?.soldOut).toBe(false);
  });

  test('panier : demander plus que le stock affiche le refus ligne par ligne, sans vider le panier', async ({
    page,
  }) => {
    // Panier semé directement : 2 exemplaires de la taille limitée à 1.
    await page.addInitScript(
      ([productId, size]) => {
        // `flockingText: null` est obligatoire : `isCartLine` (CartService)
        // rejette toute ligne où le champ manque.
        window.localStorage.setItem(
          'dvg_cart_v1',
          JSON.stringify([{ productId, size, quantity: 2, flockingText: null }]),
        );
      },
      [product!.id, product!.sizes[0].label] as const,
    );

    await page.goto('/boutique/panier', { waitUntil: 'domcontentloaded' });
    await page.locator('.panier__line').first().waitFor({ timeout: 15000 });

    // CGV puis paiement : le refus de stock doit partir AVANT tout appel à
    // Stripe — c'est ce qui rend ce test exerçable sans clé de paiement.
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: 'Payer' }).click();

    const stockError = page.locator('.panier__stock-error');
    await expect(stockError).toBeVisible({ timeout: 15000 });
    const line = page.locator('.panier__stock-error-list li').first();
    await expect(line).toContainText(product!.name);
    await expect(line).toContainText(`taille ${product!.sizes[0].label}`);
    await expect(line).toContainText('demandé 2');
    await expect(line).toContainText('disponible 1');

    // Le panier n'a pas bougé : la ligne est toujours là, avec sa quantité.
    await expect(page.locator('.panier__line')).toHaveCount(1);
    await expect(page.locator('.panier__qty-value')).toHaveText('2');

    // Ajuster la quantité efface le refus : le client peut retenter.
    await page.locator('button[aria-label="Diminuer la quantité"]').click();
    await expect(stockError).toBeHidden();
    await expect(page.locator('.panier__qty-value')).toHaveText('1');
  });

  test('fiche produit : une taille à stock 0 est marquée épuisée et refuse la sélection', async ({
    page,
  }) => {
    await setStocks(page, product!.name, [0, null]);

    await page.goto(`/boutique/${product!.slug}`, { waitUntil: 'domcontentloaded' });
    const firstSize = page.locator('.produit__size').first();
    await firstSize.waitFor({ timeout: 15000 });

    await expect(firstSize).toBeDisabled();
    await expect(firstSize).toHaveClass(/produit__size--soldout/);
    await expect(firstSize.locator('.produit__size-flag')).toHaveText(/épuisé/);

    // Les autres tailles restent achetables : l'épuisement est bien par
    // taille, pas par produit.
    const secondSize = page.locator('.produit__size').nth(1);
    await expect(secondSize).toBeEnabled();
  });

  test('produit intégralement épuisé : badge sur la liste, panneau dédié sur la fiche', async ({
    page,
  }) => {
    await setStocks(page, product!.name, [0]);

    await page.goto('/boutique', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.jersey__badge--soldout').first()).toBeVisible({ timeout: 15000 });

    await page.goto(`/boutique/${product!.slug}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.produit__soldout-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.produit__soldout-title')).toContainText(/épuisé/);
    // Le panneau d'achat a cédé la place : plus de bouton d'ajout.
    await expect(page.locator('.produit__add')).toHaveCount(0);
  });

  test('nettoyage : retour à l’illimité, le produit redevient achetable', async ({ page }) => {
    await setStocks(page, product!.name, [null]);

    const fresh = await firstProduct(page);
    expect(fresh?.soldOut).toBe(false);
    expect(fresh?.sizes.every((size) => size.inStock)).toBe(true);

    await page.goto('/boutique', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.jersey__badge--soldout')).toHaveCount(0);
  });
});
