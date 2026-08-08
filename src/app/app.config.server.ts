import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { authInterceptor } from '../shared/interceptors/auth.interceptor';
import { serverApiBaseUrlInterceptor } from '../shared/interceptors/server-api-base-url.interceptor';
import { ssrHttpTimeoutInterceptor } from '../shared/interceptors/ssr-http-timeout.interceptor';

/**
 * Configuration propre au rendu serveur.
 *
 * `provideHttpClient` est redeclare pour ajouter deux intercepteurs qui ne
 * doivent jamais etre enregistres cote navigateur — c'est pour cela qu'ils
 * n'apparaissent pas dans `app.config.ts`.
 *
 * L'ordre compte. `serverApiBaseUrlInterceptor` vient en dernier : il doit voir
 * l'URL telle que les services l'ont produite, apres passage de
 * `authInterceptor`. `ssrHttpTimeoutInterceptor` est place avant lui, donc au
 * plus pres de l'appelant : le delai couvre ainsi toute la chaine, y compris ce
 * que les intercepteurs suivants ajouteraient.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(
      withInterceptors([authInterceptor, ssrHttpTimeoutInterceptor, serverApiBaseUrlInterceptor])
    ),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
