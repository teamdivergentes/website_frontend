import { Injectable, inject } from '@angular/core';
import { ConfigService } from '../../app/shared/services/config.service';

/**
 * Service centralisé de visibilité des pages publiques.
 *
 * Source unique de vérité pour déterminer si une page configurable
 * doit être affichée dans le header ET le footer.
 *
 * Règle par défaut : toute page non répertoriée est visible (permissif).
 *
 * Pages configurables :
 * - /boutique              → config page_shop_visible
 * - /contact               → config page_contact_visible
 * - /structure/equipes     → config page_equipes_visible
 * - /structure/sponsors    → config page_sponsors_visible
 * - /structure/recrutement → config page_recrutement_visible
 * - /articles              → config page_articles_visible
 * - /twitch                → config page_twitch_visible (anticipation EPIC-17)
 * - /structure/palmares    → config page_palmares_visible (masqué par défaut)
 */
@Injectable({
  providedIn: 'root',
})
export class PageVisibilityService {
  private readonly configService = inject(ConfigService);

  /**
   * Indique si une page est visible selon la configuration admin.
   *
   * @param path - Chemin de la page (ex : '/articles', '/boutique')
   * @returns true si la page doit être affichée, false sinon
   */
  isPageVisible(path: string): boolean {
    if (path === '/boutique') {
      return this.configService.pageShopVisible();
    }

    if (path === '/contact') {
      return this.configService.pageContactVisible();
    }

    if (path === '/structure/equipes' || path.startsWith('/structure/equipes/')) {
      return this.configService.pageEquipesVisible();
    }

    if (path === '/structure/sponsors') {
      return this.configService.pageSponsorsVisible();
    }

    if (path === '/structure/recrutement') {
      return this.configService.pageRecrutementVisible();
    }

    if (path === '/articles' || path.startsWith('/articles/')) {
      return this.configService.pageArticlesVisible();
    }

    if (path === '/twitch' || path.startsWith('/twitch/')) {
      return this.configService.pageTwitchVisible();
    }

    if (path === '/structure/palmares') {
      return this.configService.pagePalmaresVisible();
    }

    // Toute page non répertoriée est visible par défaut
    return true;
  }

  /**
   * Indique si le lien parent /structure doit être affiché.
   * Masqué uniquement si TOUTES ses sous-pages configurables sont masquées.
   *
   * @returns true si au moins une sous-page de /structure est visible
   */
  isStructureVisible(): boolean {
    return (
      this.configService.pageEquipesVisible() ||
      this.configService.pageSponsorsVisible() ||
      this.configService.pageRecrutementVisible() ||
      this.configService.pagePalmaresVisible()
    );
  }
}
