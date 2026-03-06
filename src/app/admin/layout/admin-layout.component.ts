import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminSidebarComponent } from '../components/admin-sidebar.component';
import { AdminHeaderComponent } from '../components/admin-header.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminSidebarComponent, AdminHeaderComponent],
  template: `
    <div class="admin-layout mat-app" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-admin-sidebar
        [collapsed]="sidebarCollapsed()"
        [mobileOpen]="mobileMenuOpen()"
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
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onHeaderToggle(): void {
    if (window.innerWidth <= 768) {
      this.mobileMenuOpen.update(v => !v);
    } else {
      this.sidebarCollapsed.update(v => !v);
    }
  }
}
