import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { config } from './app/app.config.server';

/**
 * Le `BootstrapContext` est obligatoire depuis Angular 20 : sans lui, le moteur
 * de rendu leve NG0401 « Missing Platform » des l'extraction des routes.
 */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(App, config, context);

export default bootstrap;
