import { Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faUser, faSignOutAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../shared/services/api/auth.service';
import { buildAdminBreadcrumb } from '../shared/admin-breadcrumb';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-left">
        <button class="menu-toggle" (click)="toggleSidebar.emit()">
          <fa-icon [icon]="faBars" />
        </button>
        <nav class="page-title" aria-label="Fil d'Ariane">
          <ol>
            @for (segment of breadcrumb(); track segment.label; let last = $last) {
              @if (!$first) {
                <li class="breadcrumb-separator" aria-hidden="true">/</li>
              }
              <li>
                @if (segment.route && !last) {
                  <a [routerLink]="segment.route" class="breadcrumb-link">{{ segment.label }}</a>
                } @else if (last) {
                  <span class="breadcrumb-current" aria-current="page">{{ segment.label }}</span>
                } @else {
                  <span class="breadcrumb-prefix">{{ segment.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>
      </div>

      <div class="header-right">
        <div class="user-info">
          <fa-icon [icon]="faUser" class="user-icon" />
          <div class="user-details">
            <span class="user-email">{{ userEmail() }}</span>
            <span class="user-role">{{ userRole() }}</span>
          </div>
        </div>

        <a routerLink="/" class="site-btn" aria-label="Retourner sur le site public">
          <fa-icon [icon]="faExternalLinkAlt" />
          <span>Voir le site</span>
        </a>

        <button class="logout-btn" data-testid="admin-logout" (click)="onLogout()">
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
      background: var(--darkBackground);
      height: 67px;
      padding: 0 1.5rem;
      border-bottom: var(--greenBorder);
      position: sticky;
      top: 0;
      z-index: 50;
      box-sizing: border-box;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-toggle {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--gray);
      padding: 0.5rem;
      transition: color 0.2s;

      &:hover {
        color: var(--green);
      }
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .page-title ol {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .breadcrumb-prefix {
      color: var(--gray);
      font-weight: 400;
    }

    .breadcrumb-separator {
      color: rgba(211, 211, 211, 0.3);
    }

    .breadcrumb-link {
      color: var(--gray);
      font-weight: 400;
      text-decoration: none;

      &:hover,
      &:focus-visible {
        color: var(--white);
        text-decoration: underline;
      }
    }

    .breadcrumb-current {
      color: var(--white);
      font-weight: 600;
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
      color: var(--green);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-email {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--white);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--gray);
    }

    .site-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid var(--darkGreen);
      color: var(--gray);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        border-color: var(--green);
        color: var(--green);
      }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--darkGreen);
      color: var(--white);
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--green);
        color: var(--darkBackground);
      }
    }

    @media (max-width: 640px) {
      .user-details {
        display: none;
      }

      .logout-btn span {
        display: none;
      }

      .site-btn span {
        display: none;
      }

      .breadcrumb-prefix,
      .breadcrumb-separator {
        display: none;
      }

      .breadcrumb-current {
        font-size: 1rem;
      }
    }
  `]
})
export class AdminHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly toggleSidebar = output<void>();

  readonly faBars = faBars;
  readonly faUser = faUser;
  readonly faSignOutAlt = faSignOutAlt;
  readonly faExternalLinkAlt = faExternalLinkAlt;

  readonly userEmail = computed(() => this.authService.user()?.email || 'Utilisateur');
  readonly userRole = computed(() => this.authService.role()?.name || 'Invite');

  /**
   * Fil d'Ariane derive du registre `ADMIN_SHORTCUTS`.
   *
   * Remplace le mapping `routeTitles` maintenu a la main, qui ignorait
   * `twitch-channels`, `trophies` et `matches` : ces trois pages affichaient
   * "Admin" au lieu de leur nom.
   */
  readonly breadcrumb = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => buildAdminBreadcrumb(event.urlAfterRedirects || event.url))
    ),
    { initialValue: buildAdminBreadcrumb(this.router.url) }
  );

  onLogout(): void {
    this.authService.logout();
  }
}
