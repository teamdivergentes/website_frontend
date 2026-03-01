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
      const escapedName = this.COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + escapedName + '=([^;]*)'));
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
