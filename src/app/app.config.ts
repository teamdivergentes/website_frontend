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
import { registerLocaleData, ViewportScroller } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';

registerLocaleData(localeFr);
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { AuthService } from '../shared/services/api/auth.service';
import { AnalyticsService } from '../shared/services/analytics.service';
import { MatomoService } from '../shared/services/matomo.service';
import { ConfigService } from './shared/services/config.service';
import { CustomTitleStrategy } from './shared/services/custom-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // `anchorScrolling` : sans lui, un lien d'ancre interne ne defile nulle part.
    // Un `href="#cible"` brut est en plus resolu contre le `<base href="/">` de
    // index.html et renvoie sur l'accueil : les ancres passent donc par
    // `routerLink` + `fragment`, que le routeur sait honorer.
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    // Le routeur defile vers une ancre avec `window.scrollTo`, qui ignore
    // `scroll-margin-top`. Sans cet offset, la cible se retrouve sous le header
    // fixe. La fonction est reevaluee a chaque defilement, donc elle suit le
    // passage mobile / tablette.
    provideAppInitializer(() => {
      const scroller = inject(ViewportScroller);
      scroller.setOffset(() => [0, window.innerWidth >= 600 ? 132 : 92]);
    }),
    provideAppInitializer(() => inject(AnalyticsService).init()),
    provideAppInitializer(() => inject(MatomoService).init()),
    // Si /api/config n'est pas joignable (backend down, CI sans backend, ou
    // serveur statique sans proxy /api), l'app doit demarrer quand meme avec
    // une config vide. Sans ce catchError, l'APP_INITIALIZER rejette et
    // Angular ne rend pas l'app (NO_FCP cote Lighthouse, ecran noir cote
    // utilisateur).
    provideAppInitializer(() =>
      firstValueFrom(
        inject(ConfigService).loadConfigs().pipe(
          catchError((err) => {
            console.error('[AppInit] Failed to load /api/config — starting with empty config', err);
            return of([]);
          })
        )
      )
    ),
    // Rehydrate la session auth au demarrage via le cookie HttpOnly.
    // L'API moderne provideAppInitializer evite le piege de circular DI
    // qui peut faire silencieusement echouer APP_INITIALIZER + deps en build AOT prod.
    // .catch garantit que l'app demarre meme si le backend ne repond pas.
    provideAppInitializer(() =>
      inject(AuthService).initialize().catch((err) => {
        console.error('[AppInit] Auth initialization failed — user starts unauthenticated', err);
        return false;
      })
    )
  ]
};
