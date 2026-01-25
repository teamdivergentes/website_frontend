import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RuntimeConfigService } from './runtime-config.service';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly router = inject(Router);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private initialized = false;

  private get gaId(): string {
    return this.runtimeConfig.googleAnalyticsId;
  }

  async init(): Promise<void> {
    // Charger la config runtime d'abord
    await this.runtimeConfig.load();

    if (this.initialized || !this.gaId) {
      return;
    }

    this.loadGtagScript();
    this.trackPageViews();
    this.initialized = true;
  }

  private loadGtagScript(): void {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.gaId, {
      send_page_view: false // On gère manuellement pour les SPA
    });
  }

  private trackPageViews(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.pageView(event.urlAfterRedirects);
      });
  }

  pageView(path: string): void {
    if (!this.gaId) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title
    });
  }

  event(eventName: string, params?: Record<string, unknown>): void {
    if (!this.gaId) return;

    window.gtag('event', eventName, params);
  }
}
