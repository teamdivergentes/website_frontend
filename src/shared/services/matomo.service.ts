import { DestroyRef, Injectable, inject } from '@angular/core';
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
  private initialized = false;

  async init(): Promise<void> {
    await this.runtimeConfig.load();

    const matomoUrl = this.runtimeConfig.matomoUrl;
    const matomoSiteId = this.runtimeConfig.matomoSiteId;

    if (!matomoUrl || !matomoSiteId) {
      return;
    }

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
