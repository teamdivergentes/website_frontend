import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { isPlatformBrowser, registerLocaleData, ViewportScroller } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';

registerLocaleData(localeFr);
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { AuthService } from '../shared/services/api/auth.service';
import { AnalyticsService } from '../shared/services/analytics.service';
import { MatomoService } from '../shared/services/matomo.service';
import { RuntimeConfigService } from '../shared/services/runtime-config.service';
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
    // Doit figurer dans la configuration client comme dans la configuration
    // serveur, sinon NG0505 au runtime. `withHttpTransferCache` est actif par
    // defaut : le navigateur reutilise les reponses deja obtenues au rendu
    // serveur au lieu de refaire les memes appels.
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    { provide: LOCALE_ID, useValue: 'fr' },
    // Le routeur defile vers une ancre avec `window.scrollTo`, qui ignore
    // `scroll-margin-top`. Sans cet offset, la cible se retrouve sous le header
    // fixe. La fonction est reevaluee a chaque defilement, donc elle suit le
    // passage mobile / tablette.
    //
    // La garde de plateforme est indispensable : cet initialiseur s'execute au
    // demarrage du rendu serveur, ou `window` n'existe pas. Le defilement vers
    // une ancre n'a de toute facon aucun sens sans navigateur.
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
      const scroller = inject(ViewportScroller);
      scroller.setOffset(() => [0, window.innerWidth >= 600 ? 132 : 92]);
    }),
    // La config runtime doit etre chargee independamment des traceurs : ceux-ci
    // sortent immediatement au rendu serveur, et c'etaient jusqu'ici les seuls
    // appelants de load(). Sans cet initialiseur, `siteUrl` retomberait sur sa
    // valeur codee en dur cote serveur et la preprod emettrait des og:url
    // pointant vers la production.
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
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
