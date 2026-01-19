import {ChangeDetectionStrategy, Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {logoFilePath} from '../../constants';
import {ProjectIconType} from '../../models/icon-types';
import {mobileNavigationPages, navigationPages} from '../../navigation-pages';
import {IconLink} from '../../components/icon-link/icon-link';
import {RouterLink} from '@angular/router';
import {MatDivider} from '@angular/material/divider';

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
  protected readonly logoFileUrl = logoFilePath;
  protected readonly ProjectIconType = ProjectIconType;
  protected readonly currentYear = new Date().getFullYear();

  /**
   * Navigation pour le footer :
   * - Pages principales (sans les dropdowns)
   * - Sous-pages de Structure (children) insérées à la place du dropdown
   */
  protected readonly footerNavigationPages = this.buildFooterNavigation();

  private buildFooterNavigation() {
    const result: typeof navigationPages = [];

    for (const page of navigationPages) {
      if (page.active) {
        if (page.isDropdown) {
          // Ajouter la page structure parent
          const structurePage = mobileNavigationPages.find(p => p.path === '/structure' && p.active);
          if (structurePage) {
            result.push(structurePage);
          }
          // Puis ajouter ses enfants actifs
          const children = mobileNavigationPages.filter(p => p.isChild && p.active);
          result.push(...children);
        } else {
          result.push(page);
        }
      }
    }

    return result;
  }
}
