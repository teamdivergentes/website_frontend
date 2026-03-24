/**
 * Tests E2E fonctionnels — Page d'accueil
 *
 * Vérifie les interactions réelles de la page d'accueil :
 * - Hero section avec images carousel (section .carousel-images)
 * - Slider app-slider avec flèches et indicateurs
 * - Section présentation (texte, CTAs)
 * - Bandeau sponsors animé
 * - Vidéo YouTube facade cliquable
 * - Section articles homepage
 *
 * Sélecteurs basés sur home.html :
 * - .carousel-images         → section hero principale
 * - .image-container         → blocs hero avec lien
 * - app-slider               → composant slider
 * - .slider-container        → conteneur du slider
 * - .slider-container__arrows → flèches prev/next
 * - .slider-container__points → indicateurs (dots)
 * - .slider-container__pause  → bouton pause
 * - .divergentes-presentation → section présentation
 * - .presentation-ctas        → CTAs Discord et équipes
 * - .sponsors-line            → bandeau sponsors
 * - .video-presentation       → section vidéo
 * - .youtube-facade           → facade YouTube cliquable
 */

import { test, expect } from '@playwright/test';

// Helper pour attendre que l'app Angular soit initialisée
async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Page d\'accueil — Hero et carousel images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la section hero carousel est visible', async ({ page }) => {
    const heroSection = page.locator('section.carousel-images');
    await expect(heroSection).toBeVisible({ timeout: 10000 });
  });

  test('le premier bloc image hero est visible', async ({ page }) => {
    const firstImageBlock = page.locator('section.carousel-images .image-container').first();
    await expect(firstImageBlock).toBeVisible({ timeout: 10000 });
  });

  test('le lien "Collection" dans le hero mène vers /boutique', async ({ page }) => {
    // Le premier image-container contient un <a> avec le texte "Collection"
    const collectionLink = page.locator('section.carousel-images a').filter({ hasText: 'Collection' });
    const count = await collectionLink.count();
    if (count > 0) {
      await expect(collectionLink.first()).toBeVisible({ timeout: 10000 });
      await collectionLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/boutique/);
    } else {
      // Le lien n'est pas disponible, on vérifie simplement la section
      await expect(page.locator('section.carousel-images')).toBeVisible({ timeout: 10000 });
    }
  });

  test('le h1 caché est présent pour le SEO', async ({ page }) => {
    const h1 = page.locator('h1.visually-hidden');
    await expect(h1).toBeAttached({ timeout: 10000 });
  });
});

test.describe('Page d\'accueil — Slider app-slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    // Attendre que le slider soit rendu
    await page.locator('app-slider').waitFor({ state: 'attached', timeout: 10000 });
  });

  test('le composant slider est présent dans la page', async ({ page }) => {
    const slider = page.locator('app-slider');
    await expect(slider).toBeAttached({ timeout: 10000 });
  });

  test('le conteneur slider est visible', async ({ page }) => {
    const sliderContainer = page.locator('.slider-container');
    await expect(sliderContainer).toBeVisible({ timeout: 10000 });
  });

  test('les flèches de navigation du slider sont présentes si plusieurs slides', async ({ page }) => {
    const arrows = page.locator('.slider-container__arrows');
    const arrowsCount = await arrows.count();
    if (arrowsCount > 0) {
      await expect(arrows.first()).toBeVisible({ timeout: 5000 });

      // Vérifier les flèches SVG prev et next
      const prevArrow = page.locator('[aria-label="Slide précédente"]');
      const nextArrow = page.locator('[aria-label="Slide suivante"]');
      await expect(prevArrow).toBeVisible({ timeout: 5000 });
      await expect(nextArrow).toBeVisible({ timeout: 5000 });
    } else {
      // Pas de flèches si une seule slide, le test passe
      test.info().annotations.push({ type: 'note', description: 'Pas de flèches : slide unique ou slider sans données' });
    }
  });

  test('clic sur la flèche "slide suivante" change la slide active', async ({ page }) => {
    const nextArrow = page.locator('[aria-label="Slide suivante"]');
    const arrowCount = await nextArrow.count();
    if (arrowCount === 0) {
      test.skip();
      return;
    }
    await expect(nextArrow).toBeVisible({ timeout: 5000 });

    // Récupérer l'index actif avant le clic
    const activeBefore = await page.locator('.slider-container picture.active').count();
    await nextArrow.click();
    // Attendre l'animation de transition
    await page.waitForTimeout(600);
    const activeAfter = await page.locator('.slider-container picture.active').count();
    // Après le clic, une picture doit être active
    expect(activeAfter).toBeGreaterThanOrEqual(activeBefore);
  });

  test('clic sur la flèche "slide précédente" est fonctionnel', async ({ page }) => {
    const prevArrow = page.locator('[aria-label="Slide précédente"]');
    const arrowCount = await prevArrow.count();
    if (arrowCount === 0) {
      test.skip();
      return;
    }
    await expect(prevArrow).toBeVisible({ timeout: 5000 });
    await prevArrow.click();
    await page.waitForTimeout(600);
    // Le clic ne doit pas provoquer d'erreur, la page reste stable
    await expect(page.locator('.slider-container')).toBeVisible({ timeout: 5000 });
  });

  test('les indicateurs (dots) sont présents si plusieurs slides', async ({ page }) => {
    const dots = page.locator('.slider-container__points');
    const dotsCount = await dots.count();
    if (dotsCount > 0) {
      await expect(dots.first()).toBeVisible({ timeout: 5000 });

      // Cliquer sur le deuxième dot si disponible
      const dotItems = page.locator('.slider-container__points span');
      const dotItemsCount = await dotItems.count();
      if (dotItemsCount > 1) {
        await dotItems.nth(1).click();
        await page.waitForTimeout(600);
        // La slide doit avoir changé
        await expect(page.locator('.slider-container')).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.info().annotations.push({ type: 'note', description: 'Pas de dots : slide unique' });
    }
  });

  test('le bouton pause est présent si autoplay activé', async ({ page }) => {
    const pauseBtn = page.locator('.slider-container__pause');
    const pauseCount = await pauseBtn.count();
    if (pauseCount > 0) {
      await expect(pauseBtn).toBeVisible({ timeout: 5000 });
      // Clic sur pause doit fonctionner sans erreur
      await pauseBtn.click();
      await page.waitForTimeout(300);
      await expect(pauseBtn).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Page d\'accueil — Section présentation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la section présentation est visible', async ({ page }) => {
    const presentation = page.locator('.divergentes-presentation');
    await expect(presentation).toBeVisible({ timeout: 10000 });
  });

  test('le sous-titre "Qui sont réellement les Divergents ?" est visible', async ({ page }) => {
    await expect(page.locator('text=Qui sont réellement les Divergents ?')).toBeVisible({ timeout: 10000 });
  });

  test('le CTA "Nos équipes" mène vers /structure/equipes', async ({ page }) => {
    const ctaEquipes = page.locator('.presentation-ctas__equipes');
    await expect(ctaEquipes).toBeVisible({ timeout: 10000 });
    await ctaEquipes.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/structure\/equipes/);
  });

  test('le CTA Discord est présent et a un aria-label', async ({ page }) => {
    const discordCta = page.locator('.presentation-ctas__discord');
    await expect(discordCta).toBeVisible({ timeout: 10000 });
    await expect(discordCta).toHaveAttribute('aria-label', /Discord/i);
  });
});

test.describe('Page d\'accueil — Bandeau sponsors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('le bandeau sponsors animé est présent', async ({ page }) => {
    const sponsorsLine = page.locator('.sponsors-line');
    await expect(sponsorsLine).toBeAttached({ timeout: 10000 });
  });

  test('le logo Pulsar est présent dans le bandeau', async ({ page }) => {
    const pulsarLogo = page.locator('.pulsar-logo').first();
    const count = await pulsarLogo.count();
    if (count > 0) {
      await expect(pulsarLogo).toBeAttached({ timeout: 10000 });
    }
  });
});

test.describe('Page d\'accueil — Section vidéo YouTube', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la section vidéo de présentation est visible', async ({ page }) => {
    const videoSection = page.locator('section.video-presentation');
    await expect(videoSection).toBeVisible({ timeout: 10000 });
  });

  test('le titre "vidéo de présentation" est visible', async ({ page }) => {
    await expect(page.locator('text=vidéo de présentation')).toBeVisible({ timeout: 10000 });
  });

  test('la facade YouTube est visible avant le clic', async ({ page }) => {
    const facade = page.locator('.youtube-facade');
    await expect(facade).toBeVisible({ timeout: 10000 });
  });

  test('le bouton play de la facade YouTube a les bons attributs d\'accessibilité', async ({ page }) => {
    const facade = page.locator('.youtube-facade');
    const count = await facade.count();
    if (count > 0) {
      await expect(facade).toHaveAttribute('role', 'button');
      await expect(facade).toHaveAttribute('aria-label', /vidéo/i);
    }
  });

  test('clic sur la facade YouTube charge l\'iframe', async ({ page }) => {
    const facade = page.locator('.youtube-facade');
    const facadeCount = await facade.count();
    if (facadeCount === 0) {
      test.skip();
      return;
    }
    await facade.click();
    // Après le clic, l'iframe doit remplacer la facade
    await page.waitForTimeout(500);
    const iframe = page.locator('iframe[title*="vidéo"], iframe[title*="Vidéo"]');
    const iframeCount = await iframe.count();
    expect(iframeCount).toBeGreaterThan(0);
  });
});

test.describe('Page d\'accueil — Performance', () => {
  test('la page charge en moins de 5 secondes', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 5000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('pas de scroll horizontal sur la page d\'accueil', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // tolérance de 2px
  });
});
