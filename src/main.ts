import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => {
    // Error handling - in production, this should be replaced with proper logging service
    // For now, we silently handle the error to avoid console warnings
    throw err;
  });
