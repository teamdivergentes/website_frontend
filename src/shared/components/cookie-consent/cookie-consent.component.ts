import { Component, inject, signal } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';
import { RuntimeConfigService } from '../../services/runtime-config.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  template: `
    @if (showBanner()) {
      <div class="cookie-banner">
        <div class="cookie-content">
          <p>
            Nous utilisons des cookies pour analyser le trafic de notre site via Google Analytics.
            Ces données nous aident à améliorer votre expérience.
          </p>
          <div class="cookie-actions">
            <button class="btn-decline" (click)="decline()">Refuser</button>
            <button class="btn-accept" (click)="accept()">Accepter</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(16, 17, 17, 0.97);
      border-top: 1px solid rgba(50, 210, 153, 0.3);
      padding: 1rem 1.5rem;
      z-index: 9999;
      backdrop-filter: blur(10px);
    }
    .cookie-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .cookie-content p {
      margin: 0;
      color: #d3d3d3;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    .cookie-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
    }
    .btn-accept {
      padding: 0.5rem 1.25rem;
      background: #32D299;
      color: #101111;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.875rem;
      transition: opacity 0.2s;
    }
    .btn-accept:hover { opacity: 0.9; }
    .btn-decline {
      padding: 0.5rem 1.25rem;
      background: transparent;
      color: #d3d3d3;
      border: 1px solid rgba(211, 211, 211, 0.3);
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .btn-decline:hover {
      border-color: #d3d3d3;
      color: #fff;
    }
    @media (max-width: 768px) {
      .cookie-content {
        flex-direction: column;
        text-align: center;
      }
      .cookie-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class CookieConsentComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  readonly showBanner = signal(false);

  constructor() {
    // Check after runtime config is loaded
    setTimeout(() => {
      this.showBanner.set(
        !!this.runtimeConfig.googleAnalyticsId && !this.analytics.hasResponded()
      );
    }, 0);
  }

  accept(): void {
    this.analytics.setConsent(true);
    this.showBanner.set(false);
  }

  decline(): void {
    this.analytics.setConsent(false);
    this.showBanner.set(false);
  }
}
