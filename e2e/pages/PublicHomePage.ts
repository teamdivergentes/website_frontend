/**
 * Page Object Model — Page d'accueil publique
 *
 * Sélecteurs basés sur home.html :
 * - section.carousel-images         → section hero principale
 * - .image-container                → blocs hero (x2)
 * - app-slider                      → composant slider
 * - .slider-container               → conteneur du slider
 * - .slider-container__arrows       → zone des flèches prev/next
 * - [aria-label="Slide précédente"] → flèche slide précédente
 * - [aria-label="Slide suivante"]   → flèche slide suivante
 * - .slider-container__points       → indicateurs (dots)
 * - .slider-container__pause        → bouton pause
 * - .sponsors-line                  → bandeau sponsors animé
 * - .divergentes-presentation       → section présentation
 * - .presentation-ctas__discord     → CTA Discord
 * - .presentation-ctas__equipes     → CTA Nos équipes
 * - section.video-presentation      → section vidéo YouTube
 * - .youtube-facade                 → facade YouTube cliquable
 * - h1.visually-hidden              → H1 caché pour SEO
 */

import { Page, Locator } from '@playwright/test';

export class PublicHomePage {
  readonly page: Page;

  // Hero carousel
  readonly heroSection: Locator;
  readonly heroImageBlocks: Locator;

  // Slider
  readonly slider: Locator;
  readonly sliderContainer: Locator;
  readonly sliderArrowPrev: Locator;
  readonly sliderArrowNext: Locator;
  readonly sliderDots: Locator;
  readonly sliderPauseBtn: Locator;

  // Bandeau sponsors
  readonly sponsorsLine: Locator;

  // Section présentation
  readonly presentationSection: Locator;
  readonly discordCta: Locator;
  readonly equipesCta: Locator;

  // Section vidéo
  readonly videoSection: Locator;
  readonly youtubeFacade: Locator;

  // SEO
  readonly seoH1: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heroSection = page.locator('section.carousel-images');
    this.heroImageBlocks = page.locator('section.carousel-images .image-container');

    this.slider = page.locator('app-slider');
    this.sliderContainer = page.locator('.slider-container');
    this.sliderArrowPrev = page.locator('[aria-label="Slide précédente"]');
    this.sliderArrowNext = page.locator('[aria-label="Slide suivante"]');
    this.sliderDots = page.locator('.slider-container__points');
    this.sliderPauseBtn = page.locator('.slider-container__pause');

    this.sponsorsLine = page.locator('.sponsors-line');

    this.presentationSection = page.locator('.divergentes-presentation');
    this.discordCta = page.locator('.presentation-ctas__discord');
    this.equipesCta = page.locator('.presentation-ctas__equipes');

    this.videoSection = page.locator('section.video-presentation');
    this.youtubeFacade = page.locator('.youtube-facade');

    this.seoH1 = page.locator('h1.visually-hidden');
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.waitForLoad();
  }

  async waitForLoad(): Promise<void> {
    await this.page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickYoutubeFacade(): Promise<void> {
    await this.youtubeFacade.click();
  }

  /** Retourne l'iframe YouTube chargée après clic sur la facade */
  getYoutubeIframe(): Locator {
    return this.page.locator('iframe[title*="vidéo"], iframe[title*="Vidéo"]');
  }

  /** Retourne le lien héro par texte */
  getHeroLink(text: string): Locator {
    return this.heroSection.locator('a').filter({ hasText: text });
  }
}
