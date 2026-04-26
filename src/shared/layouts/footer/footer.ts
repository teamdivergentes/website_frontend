import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { logoFilePath } from '../../constants';
import { ProjectIconType } from '../../models/icon-types';
import { mobileNavigationPages, navigationPages, NavigationPage } from '../../navigation-pages';
import { IconLink } from '../../components/icon-link/icon-link';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { PageVisibilityService } from '../../services/page-visibility.service';

@Component({
  selector: 'app-footer',
  imports: [IconLink, NgOptimizedImage, RouterLink, MatDivider],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  private readonly pageVisibilityService = inject(PageVisibilityService);
  protected readonly cookieConsentService = inject(CookieConsentService);

  protected readonly logoFileUrl = logoFilePath;
  protected readonly ProjectIconType = ProjectIconType;
  protected readonly currentYear = new Date().getFullYear();

  /**
   * Navigation pour le footer :
   * - Pages principales (sans les dropdowns)
   * - Sous-pages de Structure (children) insérées à la place du dropdown
   * - Filtrée selon la visibilité configurée via PageVisibilityService
   */
  protected readonly footerNavigationPages = computed(() => {
    const result: NavigationPage[] = [];

    for (const page of navigationPages) {
      if (!page.active) continue;

      if (page.isDropdown) {
        // Le lien parent /structure n'est ajouté que si au moins une sous-page est visible
        if (!this.pageVisibilityService.isStructureVisible()) continue;

        const structurePage = mobileNavigationPages.find(p => p.path === '/structure' && p.active);
        if (structurePage) {
          result.push(structurePage);
        }

        // Sous-pages actives et visibles
        const children = mobileNavigationPages.filter(
          p => p.isChild && p.active && this.pageVisibilityService.isPageVisible(p.path)
        );
        result.push(...children);
      } else if (this.pageVisibilityService.isPageVisible(page.path)) {
        result.push(page);
      }
    }

    return result;
  });
}
