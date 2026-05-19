import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface RuntimeConfig {
  googleAnalyticsId: string;
  matomoUrl: string;
  matomoSiteId: string;
  siteUrl: string;
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
