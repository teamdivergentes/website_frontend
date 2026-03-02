import { ApplicationConfig, APP_INITIALIZER, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { AnalyticsService } from '../shared/services/analytics.service';
import { ConfigService } from './shared/services/config.service';
import { CustomTitleStrategy } from './shared/services/custom-title-strategy';

function initializeAnalytics(analyticsService: AnalyticsService) {
  return () => analyticsService.init();
}

function initializeConfigs(configService: ConfigService) {
  return () => firstValueFrom(configService.loadConfigs());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
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
    }
  ]
};
