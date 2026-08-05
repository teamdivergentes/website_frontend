import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieConsentService {
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

  private getCookieValue(): string | null {
    try {
      // `String.raw` plutot que des echappements doubles : la chaine produite
      // est identique (`\$&`, `(?:^|;\s*)`), mais elle se lit telle qu'elle
      // sera interpretee par l'expression reguliere.
      const escapedName = this.COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
      // `exec` et non `String.match` : sans indicateur `g`, les deux rendent la
      // meme chose, mais `match` fait porter la recherche par la chaine alors
      // que le sujet est le motif.
      const pattern = new RegExp(String.raw`(?:^|;\s*)` + escapedName + '=([^;]*)');
      const match = pattern.exec(document.cookie);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  private setCookie(value: string): void {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${this.COOKIE_NAME}=${encodeURIComponent(value)}; max-age=${this.MAX_AGE}; path=/; SameSite=Lax${secure}`;
  }
}
