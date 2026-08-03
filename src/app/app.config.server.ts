import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { serverApiBaseUrlInterceptor } from '../shared/interceptors/server-api-base-url.interceptor';

/**
 * Configuration propre au rendu serveur.
 *
 * `provideHttpClient` est redeclare pour ajouter `serverApiBaseUrlInterceptor`
 * en **dernier** de la chaine : il doit voir l'URL telle que les services l'ont
 * produite, apres passage de `authInterceptor`. Cet intercepteur ne doit jamais
 * etre enregistre cote navigateur — c'est pour cela qu'il n'apparait pas dans
 * `app.config.ts`.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([authInterceptor, serverApiBaseUrlInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
