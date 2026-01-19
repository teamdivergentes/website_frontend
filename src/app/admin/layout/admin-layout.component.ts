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
    <div class="admin-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-admin-sidebar
        [collapsed]="sidebarCollapsed()"
        (toggleCollapse)="toggleSidebar()"
      />

      <div class="main-content">
        <app-admin-header (toggleSidebar)="toggleSidebar()" />

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
      background: #f5f5f5;
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
    }

    @media (max-width: 768px) {
      .main-content {
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

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
