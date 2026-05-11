import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  googleAnalyticsId: string;
  matomoUrl: string;
  matomoSiteId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private config: RuntimeConfig = {
    googleAnalyticsId: '',
    matomoUrl: '',
    matomoSiteId: ''
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
}
