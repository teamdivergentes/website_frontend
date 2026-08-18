/**
 * Tests E2E — Remboursement d'une commande depuis l'admin (EPIC-49)
 *
 * S'appuie sur deux commandes fixtures présentes en base de recette :
 * - `E2E-REFUND-CANCELLED` (annulée) → bouton désactivé + explication
 * - `E2E-REFUND-PAID` (payée, payment intent factice) → confirmation avec le
 *   montant, puis erreur restituée proprement quand Stripe n'est pas
 *   configuré en local — le statut ne bouge pas.
 *
 * Le cas PENDING n'est pas exerçable par l'UI : la liste admin est servie
 * sans les PENDING et le filtre de statut est purement client — défaut
 * tracé au backlog (EPIC-40) le 2026-08-12.
 *
 * Le nominal complet (remboursement Stripe réel) n'est pas exerçable sans
 * clé : il relève de la recette préprod, où la clé de test du vault permet un
 * remboursement de bout en bout.
 *
 * Les tests s'auto-sautent si les fixtures ou le backend manquent (cas CI).
 *
 * Sélecteurs (order-dialog.component.ts) :
 * - liste : tr.order-row[aria-label="Ouvrir la commande <ref>"]
 * - dialog : .refund, bouton « Rembourser », .refund__hint,
 *   .refund__confirm (role alertdialog), « Confirmer le remboursement »,
 *   .error-banner
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

/**
 * `statusFilterLabel` : la liste exclut volontairement les `PENDING` par
 * défaut (« des sessions abandonnées, pas des commandes ») — les atteindre
 * demande le filtre de statut explicite, comme pour un humain.
 */
async function openOrder(page: Page, reference: string, statusFilterLabel?: string): Promise<boolean> {
  await page.goto('/admin/commandes', { waitUntil: 'domcontentloaded' });

  if (statusFilterLabel) {
    await page.locator('.status-filter mat-select').click();
    await page.locator('mat-option', { hasText: statusFilterLabel }).click();
  }

  const row = page.locator(`tr.order-row[aria-label="Ouvrir la commande ${reference}"]`);
  const found = await row
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!found) return false;
  await row.click();
  await page.locator('.refund').waitFor({ timeout: 10000 });
  return true;
}

test.describe('Admin — remboursement de commande', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await isBackendAvailable(page)), 'Backend indisponible');
    test.skip(!(await loginAsAdmin(page)), 'Connexion admin impossible');
  });

  test('une commande annulée ne se rembourse pas : bouton désactivé et expliqué', async ({
    page,
  }) => {
    test.skip(
      !(await openOrder(page, 'E2E-REFUND-CANCELLED')),
      'Fixture E2E-REFUND-CANCELLED absente de la base',
    );

    await expect(page.getByRole('button', { name: 'Rembourser' })).toBeDisabled();
    await expect(page.locator('.refund__hint')).toContainText('pas remboursable');
  });

  test('commande payée : confirmation avec montant, et un échec Stripe est restitué sans rien casser', async ({
    page,
  }) => {
    test.skip(
      !(await openOrder(page, 'E2E-REFUND-PAID')),
      'Fixture E2E-REFUND-PAID absente de la base',
    );

    const refundButton = page.getByRole('button', { name: 'Rembourser' });
    await expect(refundButton).toBeEnabled();
    await refundButton.click();

    // La confirmation engage : elle doit annoncer le montant exact.
    const confirm = page.locator('.refund__confirm');
    await expect(confirm).toBeVisible();
    await expect(confirm).toContainText('45,00');

    // « Annuler » referme la confirmation sans rien déclencher.
    await confirm.getByRole('button', { name: 'Annuler' }).click();
    await expect(confirm).toBeHidden();
    await expect(page.locator('.error-banner')).toHaveCount(0);

    // On confirme pour de vrai : sans Stripe configuré en local, l'erreur
    // doit s'afficher dans le dialog — pas d'écran cassé, pas de statut
    // modifié.
    await refundButton.click();
    await page
      .locator('.refund__confirm')
      .getByRole('button', { name: 'Confirmer le remboursement' })
      .click();

    await expect(page.locator('.error-banner')).toBeVisible({ timeout: 15000 });

    // L'échec laisse la confirmation ouverte, prête pour une nouvelle
    // tentative : rien n'a été acté, le bouton de confirmation est
    // redevenu actionnable (le spinner « Remboursement… » est retombé).
    await expect(confirm).toBeVisible();
    await expect(
      confirm.getByRole('button', { name: 'Confirmer le remboursement' }),
    ).toBeEnabled();
  });
});
