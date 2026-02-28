import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faUsers,
  faShield,
  faGamepad,
  faHandshake,
  faCog,
  faUserTie,
  faChevronLeft,
  faChevronRight,
  faDice,
  faBullhorn,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../shared/services/api/auth.service';

interface MenuItem {
  path: string;
  label: string;
  icon: IconDefinition;
  permission?: string;
}

const ADMIN_MENU: MenuItem[] = [
  { path: '/admin', label: 'Dashboard', icon: faHome },
  { path: '/admin/users', label: 'Utilisateurs', icon: faUsers, permission: 'users:read' },
  { path: '/admin/roles', label: 'Roles', icon: faShield, permission: 'roles:read' },
  { path: '/admin/staff', label: 'Staff', icon: faUserTie, permission: 'staff:read' },
  { path: '/admin/teams', label: 'Equipes', icon: faGamepad, permission: 'teams:read' },
  { path: '/admin/games', label: 'Jeux', icon: faDice, permission: 'games:read' },
  { path: '/admin/sponsors', label: 'Sponsors', icon: faHandshake, permission: 'sponsors:read' },
  { path: '/admin/recruitment', label: 'Recrutement', icon: faBullhorn, permission: 'recrutement:read' },
  { path: '/admin/config', label: 'Configuration', icon: faCog, permission: 'config:read' },
];

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="sidebar-header">
        @if (!collapsed()) {
          <h2>DVG Admin</h2>
        } @else {
          <h2 class="logo-small">D</h2>
        }
      </div>

      <nav class="sidebar-nav">
        @for (item of visibleMenuItems(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
            class="nav-item"
          >
            <fa-icon [icon]="item.icon" class="nav-icon" />
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <button class="collapse-btn" (click)="toggleCollapse.emit()">
        <fa-icon [icon]="collapsed() ? faChevronRight : faChevronLeft" />
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 260px;
      background: var(--darkBackground);
      color: var(--white);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      z-index: 100;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: var(--greenBorder);
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .logo-small {
      text-align: center;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.875rem 1.5rem;
      color: var(--gray);
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover {
        background: var(--darkGreen);
        color: var(--white);
      }

      &.active {
        background: var(--darkGreen);
        color: var(--green);
        border-left: 3px solid var(--green);
      }
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0.875rem;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      margin-right: 1rem;
    }

    .sidebar.collapsed .nav-icon {
      margin-right: 0;
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .collapse-btn {
      background: var(--darkGreen);
      border: none;
      color: var(--white);
      padding: 1rem;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--green);
        color: var(--darkBackground);
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.collapsed {
        transform: translateX(0);
        width: 80px;
      }
    }
  `]
})
export class AdminSidebarComponent {
  private readonly authService = inject(AuthService);

  readonly collapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();

  readonly faChevronLeft = faChevronLeft;
  readonly faChevronRight = faChevronRight;

  readonly visibleMenuItems = computed(() => {
    return ADMIN_MENU.filter(item => {
      if (!item.permission) return true;
      return this.authService.hasPermission(item.permission);
    });
  });
}
