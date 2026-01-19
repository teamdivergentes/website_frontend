import { Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../shared/services/api/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <header class="header">
      <button class="menu-toggle" (click)="toggleSidebar.emit()">
        <fa-icon [icon]="faBars" />
      </button>

      <div class="header-right">
        <div class="user-info">
          <fa-icon [icon]="faUser" class="user-icon" />
          <div class="user-details">
            <span class="user-email">{{ userEmail() }}</span>
            <span class="user-role">{{ userRole() }}</span>
          </div>
        </div>

        <button class="logout-btn" (click)="onLogout()">
          <fa-icon [icon]="faSignOutAlt" />
          <span>Deconnexion</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .menu-toggle {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #64748b;
      padding: 0.5rem;
      transition: color 0.2s;

      &:hover {
        color: #334155;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-icon {
      font-size: 1.5rem;
      color: #6366f1;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-email {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .user-role {
      font-size: 0.75rem;
      color: #64748b;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ef4444;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #dc2626;
      }
    }

    @media (max-width: 640px) {
      .user-details {
        display: none;
      }

      .logout-btn span {
        display: none;
      }
    }
  `]
})
export class AdminHeaderComponent {
  private readonly authService = inject(AuthService);

  readonly toggleSidebar = output<void>();

  readonly faBars = faBars;
  readonly faUser = faUser;
  readonly faSignOutAlt = faSignOutAlt;

  readonly userEmail = computed(() => this.authService.user()?.email || 'Utilisateur');
  readonly userRole = computed(() => this.authService.role()?.name || 'Invite');

  onLogout(): void {
    this.authService.logout();
  }
}
