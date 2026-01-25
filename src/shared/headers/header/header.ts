import {ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, inject, signal, ViewChild, computed} from '@angular/core';
import {MatToolbar} from "@angular/material/toolbar";
import {NgOptimizedImage, UpperCasePipe} from "@angular/common";
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {mobileNavigationPages, navigationPages} from '../../navigation-pages';
import {LogoWithHover} from '../../components/logo-with-hover/logo-with-hover';
import {IconLink} from '../../components/icon-link/icon-link';
import {IconSvg} from '../../components/icon-svg/icon-svg';
import {structureMenuItems} from '../../../app/data/structure-menu';
import {ProjectIconType} from '../../models/icon-types';
import {ConfigService} from '../../../app/shared/services/config.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    NgOptimizedImage,
    UpperCasePipe,
    RouterLink,
    RouterLinkActive,
    LogoWithHover,
    IconLink,
    IconSvg
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly configService = inject(ConfigService);

  showStructureBlock = signal(false);
  showMobileMenu = signal(false);

  @ViewChild('structureBlock') structureBlockRef!: ElementRef;

  protected readonly IconType = ProjectIconType;

  /** Navigation filtrée selon la visibilité configurée */
  protected readonly navigationPages = computed(() => {
    return navigationPages.map(page => ({
      ...page,
      active: page.active && this.isPageVisible(page.path)
    }));
  });

  protected readonly mobileNavigationPages = computed(() => {
    return mobileNavigationPages.map(page => ({
      ...page,
      active: page.active && this.isPageVisible(page.path)
    }));
  });

  /** Données du menu structure filtrées */
  protected readonly structureImgs = computed(() => {
    return structureMenuItems.map(item => ({
      ...item,
      active: item.active && this.isPageVisible(item.path)
    }));
  });

  /** Vérifie si une page est visible selon la config */
  private isPageVisible(path: string): boolean {
    if (path === '/shop') return this.configService.pageShopVisible();
    if (path === '/contact') return this.configService.pageContactVisible();
    if (path === '/structure/equipes' || path.startsWith('/structure/equipes/')) return this.configService.pageEquipesVisible();
    if (path === '/structure/sponsors') return this.configService.pageSponsorsVisible();
    if (path === '/structure/recrutement') return this.configService.pageRecrutementVisible();
    return true;
  }

  /** Ferme le dropdown au clic à l'extérieur */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.structureBlockRef?.nativeElement?.contains(event.target);
    if (!clickedInside && this.showStructureBlock()) {
      this.showStructureBlock.set(false);
    }
  }

  /** Ferme le dropdown et le menu mobile à l'appui sur Échap */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.showStructureBlock.set(false);
    this.showMobileMenu.set(false);
  }

  /** Ferme le menu mobile après navigation */
  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
}
