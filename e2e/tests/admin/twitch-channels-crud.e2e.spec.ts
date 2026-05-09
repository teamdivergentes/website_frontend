/**
 * Tests E2E — Admin Twitch CRUD — EPIC-17 F3
 *
 * Parcours : login admin -> /admin/twitch-channels
 * -> ajouter une chaîne -> editer -> supprimer
 *
 * Sélecteurs basés sur twitch-channels.component.ts :
 * - .twitch-channels-page                    -> conteneur principal
 * - .page-header h1                          -> titre "Chaînes Twitch"
 * - .skeleton-table[role="status"]           -> skeleton loading
 * - .channels-table .channel-row             -> ligne d'une chaîne
 * - .col-pseudo .username                    -> pseudo Twitch
 * - button[aria-label^="Modifier"]           -> bouton modifier
 * - button[aria-label^="Supprimer"]          -> bouton supprimer
 * - .empty-state                             -> état vide
 * - mat-dialog-container h2[mat-dialog-title]-> titre dialog
 * - input[formcontrolname="twitchUsername"]  -> champ pseudo
 * - input[formcontrolname="displayName"]     -> champ nom affiché
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

const TEST_CHANNEL_USERNAME = 'e2etestchan';
const TEST_CHANNEL_DISPLAY = 'E2E Test Channel';
const UPDATED_DISPLAY = 'E2E Channel Updated';

function getChannelRow(page: Page, username: string) {
  return page.locator('.channel-row').filter({
    has: page.locator('.col-pseudo .username', { hasText: username }),
  });
}

async function navigateToTwitchChannels(page: Page): Promise<void> {
  await page.goto('/admin/twitch-channels', { waitUntil: 'domcontentloaded' });
  await page.locator('.skeleton-table[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await Promise.race([
    page.locator('.channels-table').waitFor({ timeout: 10000 }).catch(() => {}),
    page.locator('.empty-state').waitFor({ timeout: 10000 }).catch(() => {}),
  ]);
}

async function cleanupTestChannel(page: Page): Promise<void> {
  await navigateToTwitchChannels(page);
  const row = getChannelRow(page, TEST_CHANNEL_USERNAME);
  if (!(await row.isVisible({ timeout: 5000 }).catch(() => false))) return;

  await row.locator(`button[aria-label="Supprimer ${TEST_CHANNEL_USERNAME}"]`).click();
  const confirmBtn = page.locator('mat-dialog-container').last().locator('button').filter({ hasText: /Confirmer|Supprimer|Oui/ }).last();
  await confirmBtn.waitFor({ timeout: 5000 });
  await confirmBtn.click();
  await expect(row).not.toBeVisible({ timeout: 10000 });
}

test.describe('Admin Twitch Channels — Affichage', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test('la page admin twitch-channels affiche le titre', async ({ page }) => {
    await navigateToTwitchChannels(page);
    await expect(page).toHaveURL(/\/admin\/twitch-channels/);
    await expect(page.locator('.page-header h1')).toContainText('Chaînes Twitch', { timeout: 10000 });
  });

  test('le bouton "Nouvelle chaîne" est visible', async ({ page }) => {
    await navigateToTwitchChannels(page);
    await expect(page.locator('button[mat-raised-button]').filter({ hasText: 'Nouvelle chaîne' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe.serial('Admin Twitch Channels — CRUD complet', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    if (!(await isBackendAvailable(page))) { await page.close(); return; }
    if (!(await loginAsAdmin(page))) { await page.close(); return; }
    await cleanupTestChannel(page);
    await page.close();
  });

  test('creation : ouvrir le dialog et créer une nouvelle chaîne', async ({ page }) => {
    await navigateToTwitchChannels(page);

    const addBtn = page.locator('button[mat-raised-button]').filter({ hasText: 'Nouvelle chaîne' });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    const dialogTitle = page.locator('mat-dialog-container h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Nouvelle chaîne Twitch');

    await page.locator('mat-dialog-container input[formcontrolname="twitchUsername"]').fill(TEST_CHANNEL_USERNAME);
    await page.locator('mat-dialog-container input[formcontrolname="displayName"]').fill(TEST_CHANNEL_DISPLAY);

    const submitBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Enregistrer|Ajouter|Créer/ });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 10000 });

    await navigateToTwitchChannels(page);
    await expect(getChannelRow(page, TEST_CHANNEL_USERNAME)).toBeVisible({ timeout: 10000 });
  });

  test('la chaîne créée affiche le bon pseudo', async ({ page }) => {
    await navigateToTwitchChannels(page);
    const channelRow = getChannelRow(page, TEST_CHANNEL_USERNAME);
    await expect(channelRow).toBeVisible({ timeout: 10000 });
    await expect(channelRow.locator('.col-pseudo .username')).toContainText(TEST_CHANNEL_USERNAME);
  });

  test('edition : modifier le nom affiché de la chaîne', async ({ page }) => {
    await navigateToTwitchChannels(page);
    const channelRow = getChannelRow(page, TEST_CHANNEL_USERNAME);
    await expect(channelRow).toBeVisible({ timeout: 10000 });

    await channelRow.locator(`button[mat-icon-button][aria-label="Modifier ${TEST_CHANNEL_USERNAME}"]`).click();

    const dialogTitle = page.locator('mat-dialog-container h2[mat-dialog-title]');
    await expect(dialogTitle).toContainText('Modifier la chaîne', { timeout: 10000 });

    const displayInput = page.locator('mat-dialog-container input[formcontrolname="displayName"]');
    await displayInput.clear();
    await displayInput.fill(UPDATED_DISPLAY);

    const submitBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Enregistrer|Modifier|Sauvegarder/ });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 10000 });
    await navigateToTwitchChannels(page);
    await expect(getChannelRow(page, TEST_CHANNEL_USERNAME)).toBeVisible({ timeout: 10000 });
  });

  test('suppression : supprimer la chaîne créée', async ({ page }) => {
    await navigateToTwitchChannels(page);
    const channelRow = getChannelRow(page, TEST_CHANNEL_USERNAME);
    if (!(await channelRow.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Chaîne de test introuvable' });
      return;
    }

    await channelRow.locator(`button[mat-icon-button][aria-label="Supprimer ${TEST_CHANNEL_USERNAME}"]`).click();

    const confirmBtn = page.locator('mat-dialog-container').last().locator('button').filter({ hasText: /Confirmer|Supprimer|Oui/ }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    await expect(channelRow).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Twitch Channels — Validation formulaire', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test('le bouton Enregistrer est désactivé si le pseudo est vide', async ({ page }) => {
    await navigateToTwitchChannels(page);
    await page.locator('button[mat-raised-button]').filter({ hasText: 'Nouvelle chaîne' }).click();

    const dialogTitle = page.locator('mat-dialog-container h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });

    const submitBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Enregistrer|Ajouter|Créer/ });
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('une erreur apparaît pour un pseudo trop court', async ({ page }) => {
    await navigateToTwitchChannels(page);
    await page.locator('button[mat-raised-button]').filter({ hasText: 'Nouvelle chaîne' }).click();

    const usernameInput = page.locator('mat-dialog-container input[formcontrolname="twitchUsername"]');
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await usernameInput.fill('ab');
    await usernameInput.blur();

    await expect(page.locator('mat-dialog-container mat-error')).toBeVisible({ timeout: 5000 });
  });

  test('Annuler ferme le dialog sans créer de chaîne', async ({ page }) => {
    await navigateToTwitchChannels(page);
    await page.locator('button[mat-raised-button]').filter({ hasText: 'Nouvelle chaîne' }).click();
    await expect(page.locator('mat-dialog-container h2[mat-dialog-title]')).toBeVisible({ timeout: 10000 });

    await page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' }).click();
    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 5000 });
  });
});
