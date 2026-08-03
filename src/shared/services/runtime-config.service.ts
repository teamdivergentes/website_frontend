import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface RuntimeConfig {
  googleAnalyticsId: string;
  matomoUrl: string;
  matomoSiteId: string;
  siteUrl: string;
}

/**
 * Lit la config runtime depuis l'environnement du process, cote rendu serveur
 * uniquement. Memes variables que celles consommees par `entrypoint.sh` pour
 * generer `assets/config.json`.
 */
export function readConfigFromEnv(): Partial<RuntimeConfig> {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  if (!env) return {};

  const config: Partial<RuntimeConfig> = {};
  if (env['GOOGLE_ANALYTICS_ID']) config.googleAnalyticsId = env['GOOGLE_ANALYTICS_ID'];
  if (env['MATOMO_URL']) config.matomoUrl = env['MATOMO_URL'];
  if (env['MATOMO_SITE_ID']) config.matomoSiteId = env['MATOMO_SITE_ID'];
  if (env['SITE_URL']) config.siteUrl = env['SITE_URL'];
  return config;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private readonly platformId = inject(PLATFORM_ID);

  private config: RuntimeConfig = {
    googleAnalyticsId: '',
    matomoUrl: '',
    matomoSiteId: '',
    siteUrl: ''
  };

  async load(): Promise<void> {
    // Cote serveur, `fetch('/assets/config.json')` echoue : une URL relative n'a
    // pas d'origine sous Node. Les memes valeurs sont deja dans l'environnement
    // du conteneur — `entrypoint.sh` s'en sert pour generer config.json.
    if (!isPlatformBrowser(this.platformId)) {
      this.config = { ...this.config, ...readConfigFromEnv() };
      return;
    }

    try {
      const response = await fetch('/assets/config.json');
      if (response.ok) {
        const config = await response.json();
        this.config = { ...this.config, ...config };
      }
    } catch {
      console.warn('Could not load runtime config, using defaults');
    }
  }

  get googleAnalyticsId(): string {
    return this.config.googleAnalyticsId;
  }

  get matomoUrl(): string {
    return this.config.matomoUrl;
  }

  get matomoSiteId(): string {
    return this.config.matomoSiteId;
  }

  /**
   * Retourne l'URL de base du site :
   *  1. La valeur injectée dans config.json (via SITE_URL env var)  — env-aware
   *  2. window.location.origin si on est côté browser                — fallback développement
   *  3. 'https://teamdivergentes.fr'                                  — fallback SSR / test
   */
  get siteUrl(): string {
    if (this.config.siteUrl) {
      return this.config.siteUrl;
    }
    if (isPlatformBrowser(this.platformId) && globalThis.window !== undefined) {
      return globalThis.window.location.origin;
    }
    return 'https://teamdivergentes.fr';
  }
}
