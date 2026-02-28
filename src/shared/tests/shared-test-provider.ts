import {EnvironmentProviders, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from '../../app/app.routes';
import {provideHttpClient} from '@angular/common/http';

export const sharedTestProvider: EnvironmentProviders[] = [
  provideZonelessChangeDetection(),
  provideRouter(routes),
  provideHttpClient()
];
