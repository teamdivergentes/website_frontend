import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RuntimeConfigService } from './runtime-config.service';
import { CookieConsentService } from './cookie-consent.service';

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
  private readonly cookieConsent = inject(CookieConsentService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;
  private initialized = false;

  private get gaId(): string {
    return this.runtimeConfig.googleAnalyticsId;
  }

  setConsent(accepted: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (accepted) {
      this.cookieConsent.accept();
    } else {
      this.cookieConsent.decline();
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied'
        });
      }
    }
    if (accepted && !this.initialized) {
      this.loadGtagScript();
      this.trackPageViews();
      this.initialized = true;
    }
  }

  async init(): Promise<void> {
    // Mesure d'audience : aucun sens au rendu serveur, et l'injection du script
    // ferait planter le SSR (document global absent cote Node).
    if (!isPlatformBrowser(this.platformId)) return;

    // Charger la config runtime d'abord
    await this.runtimeConfig.load();

    if (this.initialized || !this.gaId) {
      return;
    }

    // Only load GA if user already accepted
    if (this.cookieConsent.hasConsent()) {
      this.loadGtagScript();
      this.trackPageViews();
      this.initialized = true;
    }
  }

  private loadGtagScript(): void {
    if (!this.GA_ID_PATTERN.test(this.gaId)) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    script.onerror = () => {
      this.initialized = false;
    };
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
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.pageView(event.urlAfterRedirects);
      });
  }

  pageView(path: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.gaId || typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title
    });
  }

  event(eventName: string, params?: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.gaId || typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, params);
  }
}
