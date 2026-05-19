import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
  computed,
  effect,
  DOCUMENT,
} from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { NgOptimizedImage, NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { mobileNavigationPages, navigationPages } from '../../navigation-pages';
import { LogoWithHover } from '../../components/logo-with-hover/logo-with-hover';
import { IconLink } from '../../components/icon-link/icon-link';
import { IconSvg } from '../../components/icon-svg/icon-svg';
import { structureMenuItems } from '../../../app/data/structure-menu';
import { ProjectIconType } from '../../models/icon-types';
import { PageVisibilityService } from '../../services/page-visibility.service';
import { LiveStatusService } from '../../services/live-status.service';
import { AuthService } from '../../services/api/auth.service';
import { AdminShortcutsService } from '../../services/admin-shortcuts.service';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    NgOptimizedImage,
    NgTemplateOutlet,
    UpperCasePipe,
    RouterLink,
    RouterLinkActive,
    LogoWithHover,
    IconLink,
    IconSvg,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly pageVisibilityService = inject(PageVisibilityService);
  private readonly document = inject(DOCUMENT);
  protected readonly liveStatus = inject(LiveStatusService);
  protected readonly authService = inject(AuthService);
  protected readonly shortcutsService = inject(AdminShortcutsService);

  showStructureBlock = signal(false);
  showMobileMenu = signal(false);
  headerHidden = signal(false);

  private lastScrollY = 0;
  private ticking = false;

  @ViewChild('structureBlock') structureBlockRef!: ElementRef;

  protected readonly IconType = ProjectIconType;

  /** Navigation desktop filtrée selon la visibilité configurée */
  protected readonly navigationPages = computed(() => {
    return navigationPages.map(page => ({
      ...page,
      active: page.active && this.pageVisibilityService.isPageVisible(page.path),
    }));
  });

  /** Navigation mobile filtrée selon la visibilité configurée */
  protected readonly mobileNavigationPages = computed(() => {
    return mobileNavigationPages.map(page => ({
      ...page,
      active: page.active && this.pageVisibilityService.isPageVisible(page.path),
    }));
  });

  /** Données du menu structure filtrées */
  protected readonly structureImgs = computed(() => {
    return structureMenuItems.map(item => ({
      ...item,
      active: item.active && this.pageVisibilityService.isPageVisible(item.path),
    }));
  });

  /** Indique si le lien EN LIVE doit être affiché (config page_twitch_visible) */
  protected readonly showLiveItem = computed(() =>
    this.pageVisibilityService.isPageVisible('/twitch')
  );

  /** true si au moins un streamer est en direct */
  protected readonly isLive = this.liveStatus.isLive;

  /**
   * Affiche le raccourci "Administration" dans le header si l'utilisateur
   * est authentifié et a au moins un raccourci disponible (dashboard inclus).
   * Source unique de vérité : AdminShortcutsService.
   */
  protected readonly showAdminShortcut = computed(() =>
    this.shortcutsService.availableShortcuts().length > 0
  );

  constructor() {
    // Scroll lock quand le menu mobile est ouvert
    effect(() => {
      if (this.showMobileMenu()) {
        this.document.body.style.overflow = 'hidden';
      } else {
        this.document.body.style.overflow = '';
      }
    });

    // Restaurer le scroll si le composant est détruit
    this.destroyRef.onDestroy(() => {
      this.document.body.style.overflow = '';
    });
  }

  /** Auto-hide header au scroll (mobile uniquement) */
  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateHeaderVisibility();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private updateHeaderVisibility(): void {
    if (window.innerWidth >= 800) {
      this.headerHidden.set(false);
      return;
    }
    if (this.showMobileMenu()) {
      this.headerHidden.set(false);
      return;
    }

    const scrollY = window.scrollY;
    const delta = scrollY - this.lastScrollY;
    const threshold = 10;

    if (scrollY <= 77) {
      this.headerHidden.set(false);
    } else if (delta > threshold) {
      this.headerHidden.set(true);
    } else if (delta < -threshold) {
      this.headerHidden.set(false);
    }

    this.lastScrollY = scrollY;
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

  /** Réaffiche le header quand un élément reçoit le focus */
  @HostListener('focusin')
  onFocusIn(): void {
    this.headerHidden.set(false);
  }

  /** Ferme le menu mobile après navigation */
  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }
}
