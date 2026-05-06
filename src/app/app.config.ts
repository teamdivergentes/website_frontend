import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    provideAppInitializer(() => inject(AnalyticsService).init()),
    provideAppInitializer(() => firstValueFrom(inject(ConfigService).loadConfigs())),
    // Rehydrate la session auth au demarrage via le cookie HttpOnly.
    // L'API moderne provideAppInitializer evite le piege de circular DI
    // qui peut faire silencieusement echouer APP_INITIALIZER + deps en build AOT prod.
    provideAppInitializer(() => inject(AuthService).initialize())
  ]
};
