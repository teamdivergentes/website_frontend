/**
 * Helper de retry pour les actions UI lentes (debounce, animations, lazy-loading).
 *
 * Remplace les `waitForTimeout` inline qui masquent la vraie cause d'un échec.
 * A utiliser quand une action peut échouer de façon transitoire (ex. : élément
 * qui apparaît avec une animation, réponse API lente).
 */

/**
 * Exécute `action` jusqu'à `maxAttempts` fois.
 * Entre chaque tentative, attend `delay` ms.
 * Relance la dernière erreur si toutes les tentatives échouent.
 *
 * @param action       Fonction async à exécuter (peut lever une erreur)
 * @param maxAttempts  Nombre maximum de tentatives (défaut : 3)
 * @param delay        Délai en ms entre deux tentatives (défaut : 500)
 *
 * @example
 * await waitAndRetry(() => page.locator('[data-testid="toast-success"]').waitFor());
 *
 * @example
 * const visible = await waitAndRetry(
 *   async () => {
 *     await expect(page.locator('.modal')).toBeVisible();
 *   },
 *   5,
 *   300,
 * );
 */
export async function waitAndRetry<T>(
  action: () => Promise<T>,
  maxAttempts = 3,
  delay = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
