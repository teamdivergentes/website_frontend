import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly COOKIE_NAME = 'dvg_cookie_consent';
  private readonly MAX_AGE = 33696000; // ~13 months in seconds (CNIL requirement)

  readonly showBanner = signal(false);

  hasConsent(): boolean {
    return this.getCookieValue() === 'accepted';
  }

  hasDeclined(): boolean {
    return this.getCookieValue() === 'declined';
  }

  hasResponded(): boolean {
    return this.getCookieValue() !== null;
  }

  accept(): void {
    this.setCookie('accepted');
    this.showBanner.set(false);
  }

  decline(): void {
    this.setCookie('declined');
    this.showBanner.set(false);
  }

  reopen(): void {
    this.showBanner.set(true);
  }

  /**
   * Repli serveur explicite : aucun cookie lisible au rendu serveur, donc aucun
   * consentement. Le bandeau et les traceurs sont decides a l'hydratation.
   */
  private getCookieValue(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    // Lecture par découpage plutôt que par expression régulière construite à la
    // volée. `develop` avait rendu cette regex plus lisible avec `String.raw` et
    // `exec` ; la supprimer répond au même signalement statique et retire la
    // question de l'échappement du nom. Le découpage sur « ; » est la structure
    // exacte de document.cookie.
    //
    // L'accès passe par `DOCUMENT` injecté et non par le global : le service est
    // instancié au rendu serveur, où ce global n'existe pas.
    const prefix = `${this.COOKIE_NAME}=`;

    for (const part of this.document.cookie.split(';')) {
      const entry = part.trim();
      if (!entry.startsWith(prefix)) continue;

      try {
        return decodeURIComponent(entry.slice(prefix.length));
      } catch {
        // Valeur mal encodée : traitée comme absente, pas comme un consentement.
        return null;
      }
    }

    return null;
  }

  private setCookie(value: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const secure = this.document.location.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(value)}; max-age=${this.MAX_AGE}; path=/; SameSite=Lax${secure}`;
  }
}
