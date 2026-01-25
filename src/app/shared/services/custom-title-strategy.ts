import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ConfigService } from './config.service';

/**
 * Stratégie de titre personnalisée
 * Combine le nom du site avec le titre de la page courante
 * Format: "Site Name - Page Title"
 */
@Injectable({ providedIn: 'root' })
export class CustomTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly configService = inject(ConfigService);

  override updateTitle(routerState: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(routerState);
    const siteName = this.configService.siteName();

    if (pageTitle) {
      this.title.setTitle(`${siteName} - ${pageTitle}`);
    } else {
      this.title.setTitle(siteName);
    }
  }
}
