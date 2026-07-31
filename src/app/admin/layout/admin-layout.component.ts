import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';
import { AdminHeaderComponent } from '../components/admin-header.component';
import { CommandPaletteService } from '../shared/command-palette.service';

/**
 * Seuil du drawer mobile. Doit rester aligne sur la media query de la sidebar :
 * c'est elle qui sort la sidebar du flux et la transforme en drawer.
 */
const MOBILE_QUERY = '(max-width: 768px)';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="admin-layout mat-app" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-admin-sidebar
        [collapsed]="sidebarCollapsed()"
        [mobileOpen]="mobileMenuOpen()"
        [isMobile]="isMobile()"
        (toggleCollapse)="toggleSidebar()"
        (closeMobile)="closeMobileMenu()"
      />

      <div class="main-content">
        <app-admin-header (toggleSidebar)="onHeaderToggle()" />

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: var(--lightBlack);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }

    .admin-layout.sidebar-collapsed .main-content {
      margin-left: 80px;
    }

    .content-area {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      overflow-x: hidden;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }

      .admin-layout.sidebar-collapsed .main-content {
        margin-left: 0;
      }

      .content-area {
        padding: 1rem;
      }
    }
  `]
})
export class AdminLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly palette = inject(CommandPaletteService);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  /**
   * Vrai quand la sidebar est rendue en drawer.
   *
   * La sidebar en a besoin pour se retirer du parcours de tabulation quand le
   * drawer est ferme : sans cette information, `Tab` menait dans des liens
   * invisibles, hors ecran.
   */
  readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_QUERY).pipe(map(state => state.matches)),
    { initialValue: false }
  );

  constructor() {
    // Repasser en desktop avec le drawer ouvert laissait `mobileMenuOpen` a true,
    // et le backdrop reapparaissait au retour en mobile sans action de l'utilisateur.
    effect(() => {
      if (!this.isMobile()) this.mobileMenuOpen.set(false);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * Ouvre la palette au raccourci. Ecoute posee sur le layout admin et non
   * globalement : le raccourci n'a pas de sens sur le site public.
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.palette.handlesShortcut(event)) return;
    event.preventDefault();
    this.palette.open();
  }

  onHeaderToggle(): void {
    if (this.isMobile()) {
      this.mobileMenuOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }
}
