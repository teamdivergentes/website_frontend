import {
  ApplicationConfig,
  APP_INITIALIZER,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';

registerLocaleData(localeFr);
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { AuthService } from '../shared/services/api/auth.service';
import { AnalyticsService } from '../shared/services/analytics.service';
import { ConfigService } from './shared/services/config.service';
import { CustomTitleStrategy } from './shared/services/custom-title-strategy';

function initializeAnalytics(analyticsService: AnalyticsService) {
  return () => analyticsService.init();
}

function initializeConfigs(configService: ConfigService) {
  return () => firstValueFrom(configService.loadConfigs());
}

/** Rehydrate la session auth au demarrage via le cookie HttpOnly. */
function initializeAuth(authService: AuthService) {
  return () => authService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAnalytics,
      deps: [AnalyticsService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeConfigs,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    }
  ]
};
