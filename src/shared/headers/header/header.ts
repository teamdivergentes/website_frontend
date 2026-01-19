import {ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {MatToolbar} from "@angular/material/toolbar";
import {NgOptimizedImage, UpperCasePipe} from "@angular/common";
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {mobileNavigationPages, navigationPages} from '../../navigation-pages';
import {LogoWithHover} from '../../components/logo-with-hover/logo-with-hover';
import {IconLink} from '../../components/icon-link/icon-link';
import {IconSvg} from '../../components/icon-svg/icon-svg';
import {structureMenuItems, StructureMenuItem} from '../../../app/data/structure-menu';
import {ProjectIconType} from '../../models/icon-types';

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

  showStructureBlock = signal(false);
  showMobileMenu = signal(false);

  @ViewChild('structureBlock') structureBlockRef!: ElementRef;

  protected readonly navigationPages = navigationPages;
  protected readonly mobileNavigationPages = mobileNavigationPages;
  protected readonly IconType = ProjectIconType;

  /** Données du menu structure externalisées */
  protected readonly structureImgs: StructureMenuItem[] = structureMenuItems;

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
