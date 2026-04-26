import {ChangeDetectionStrategy, Component, inject, computed} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {logoFilePath} from '../../constants';
import {ProjectIconType} from '../../models/icon-types';
import {mobileNavigationPages, navigationPages, NavigationPage} from '../../navigation-pages';
import {IconLink} from '../../components/icon-link/icon-link';
import {RouterLink} from '@angular/router';
import {MatDivider} from '@angular/material/divider';
import {ConfigService} from '../../../app/shared/services/config.service';
import {CookieConsentService} from '../../services/cookie-consent.service';

@Component({
  selector: 'app-footer',
  imports: [
    IconLink,
    NgOptimizedImage,
    RouterLink,
    MatDivider
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Footer {
  private readonly configService = inject(ConfigService);
  protected readonly cookieConsentService = inject(CookieConsentService);

  protected readonly logoFileUrl = logoFilePath;
  protected readonly ProjectIconType = ProjectIconType;
  protected readonly currentYear = new Date().getFullYear();

  /**
   * Navigation pour le footer :
   * - Pages principales (sans les dropdowns)
   * - Sous-pages de Structure (children) insérées à la place du dropdown
   * - Filtrée selon la visibilité configurée
   */
  protected readonly footerNavigationPages = computed(() => {
    const result: NavigationPage[] = [];

    for (const page of navigationPages) {
      if (page.active && this.isPageVisible(page.path)) {
        if (page.isDropdown) {
          // Ajouter la page structure parent
          const structurePage = mobileNavigationPages.find(p => p.path === '/structure' && p.active);
          if (structurePage) {
            result.push(structurePage);
          }
          // Puis ajouter ses enfants actifs et visibles
          const children = mobileNavigationPages.filter(p => p.isChild && p.active && this.isPageVisible(p.path));
          result.push(...children);
        } else {
          result.push(page);
        }
      }
    }

    return result;
  });

  /** Vérifie si une page est visible selon la config */
  private isPageVisible(path: string): boolean {
    if (path === '/boutique') return this.configService.pageShopVisible();
    if (path === '/contact') return this.configService.pageContactVisible();
    if (path === '/structure/equipes' || path.startsWith('/structure/equipes/')) return this.configService.pageEquipesVisible();
    if (path === '/structure/sponsors') return this.configService.pageSponsorsVisible();
    if (path === '/structure/recrutement') return this.configService.pageRecrutementVisible();
    if (path === '/twitch') return this.configService.pageTwitchVisible();
    return true;
  }
}
