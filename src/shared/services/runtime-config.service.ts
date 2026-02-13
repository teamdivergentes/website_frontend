import { Injectable } from '@angular/core';

export interface RuntimeConfig {
  googleAnalyticsId: string;
  buildDate: string;
  frontendVersion: string;
}

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {
  private config: RuntimeConfig = {
    googleAnalyticsId: '',
    buildDate: '',
    frontendVersion: ''
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

  get buildDate(): string {
    return this.config.buildDate;
  }

  get frontendVersion(): string {
    return this.config.frontendVersion;
  }
}
