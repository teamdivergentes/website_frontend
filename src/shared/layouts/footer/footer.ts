import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { logoFilePath } from '../../constants';
import { ProjectIconType } from '../../models/icon-types';
import { mobileNavigationPages, NavigationPage } from '../../navigation-pages';
import { IconLink } from '../../components/icon-link/icon-link';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../services/cookie-consent.service';
import { PageVisibilityService } from '../../services/page-visibility.service';

/**
 * Libellés raccourcis pour la colonne du footer.
 *
 * La colonne fait 230px et le texte y est en capitales interlettrées :
 * « équipes/ambassadeurs » y déborde. Le header et le menu mobile gardent les
 * libellés complets, où la place ne manque pas.
 */
const FOOTER_LABELS: Record<string, string> = {
  '/structure/equipes': 'équipes',
  '/structure/sponsors': 'sponsors',
};

@Component({
  selector: 'app-footer',
  imports: [IconLink, NgOptimizedImage, RouterLink],
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
   * Navigation pour le footer : les sous-pages de Structure, et elles seules.
   *
   * Accueil, articles, boutique, contact et EN LIVE ne sont plus listés : le
   * header les porte en permanence, les répéter n'apportait ni parcours ni
   * maillage interne. Les sous-pages de Structure, elles, ne vivent que
   * derrière un dropdown — le footer est leur unique lien présent dans le DOM
   * initial. Le logo hashtag remplace le lien « accueil ».
   *
   * Filtrée selon la visibilité configurée via PageVisibilityService.
   */
  protected readonly footerNavigationPages = computed<NavigationPage[]>(() => {
    if (!this.pageVisibilityService.isStructureVisible()) return [];

    return mobileNavigationPages
      .filter(p => p.isChild && p.active && this.pageVisibilityService.isPageVisible(p.path))
      .map(p => ({ ...p, label: FOOTER_LABELS[p.path] ?? p.label }));
  });
}
