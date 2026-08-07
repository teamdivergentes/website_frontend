import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RuntimeConfigService } from './runtime-config.service';

declare global {
  var _paq: unknown[][];
}

@Injectable({
  providedIn: 'root'
})
export class MatomoService {
  private readonly router = inject(Router);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;

  async init(): Promise<void> {
    // Mesure d'audience : aucun sens au rendu serveur, et l'injection du script
    // ferait planter le SSR (document global absent cote Node).
    if (!isPlatformBrowser(this.platformId)) return;

    await this.runtimeConfig.load();

    const matomoUrlRaw = this.runtimeConfig.matomoUrl;
    const matomoSiteId = this.runtimeConfig.matomoSiteId;

    if (!matomoUrlRaw || !matomoSiteId) {
      return;
    }

    const matomoUrl = matomoUrlRaw.endsWith('/') ? matomoUrlRaw : matomoUrlRaw + '/';

    globalThis._paq = globalThis._paq || [];

    // CNIL-exempted : désactiver les cookies avant toute autre instruction
    globalThis._paq.push(
      ['disableCookies'],
      ['setDoNotTrack', true],
      ['setTrackerUrl', matomoUrl + 'matomo.php'],
      ['setSiteId', matomoSiteId],
    );

    const script = document.createElement('script');
    script.async = true;
    script.src = matomoUrl + 'matomo.js';
    document.head.appendChild(script);

    this.initialized = true;
    this.trackPageViews();
  }

  trackPageView(url: string): void {
    if (!this.initialized) return;
    globalThis._paq.push(['setCustomUrl', url], ['trackPageView']);
  }

  private trackPageViews(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }
}
