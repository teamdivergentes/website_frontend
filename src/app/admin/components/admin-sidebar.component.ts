import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faGaugeHigh,
  faUsers,
  faShield,
  faGamepad,
  faHandshake,
  faCog,
  faUserTie,
  faChevronLeft,
  faChevronRight,
  faIdBadge,
  faBullhorn,
  faChartLine,
  faNewspaper,
  faTowerBroadcast,
  faTrophy,
  faCalendarDays,
  faStore,
  faReceipt,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';

/**
 * Mapping clé de raccourci → icone FontAwesome.
 * Maintenu localement car la sidebar utilise FA tandis que le registre
 * central stocke des noms d'icones Material Icons (utilisés par le dashboard).
 *
 * Certaines clés n'ont pas encore d'entrée dans `ADMIN_SHORTCUTS` : `matches` et
 * `trophies` arrivent avec EPIC-37, `boutique` et `commandes` avec la branche
 * boutique. Les déclarer ici évite qu'elles retombent silencieusement sur
 * l'icone par defaut au merge.
 */
const FA_ICON_MAP: Record<string, IconDefinition> = {
  dashboard: faGaugeHigh,
  analytics: faChartLine,
  teams: faUsers,
  games: faGamepad,
  matches: faCalendarDays,
  trophies: faTrophy,
  articles: faNewspaper,
  'twitch-channels': faTowerBroadcast,
  sponsors: faHandshake,
  boutique: faStore,
  commandes: faReceipt,
  staff: faUserTie,
  recruitment: faBullhorn,
  users: faIdBadge,
  roles: faShield,
  config: faCog,
};

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  template: `
    @if (mobileOpen()) {
      <div class="sidebar-backdrop" (click)="closeMobile.emit()" aria-hidden="true"></div>
    }
    <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <div class="sidebar-header">
        @if (!collapsed()) {
          <h2>DVG Admin</h2>
        } @else {
          <h2 class="logo-small">D</h2>
        }
      </div>

      <nav class="sidebar-nav">
        @for (item of visibleMenuItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
            class="nav-item"
            [attr.data-testid]="'admin-nav-' + item.key"
            [attr.aria-label]="item.label"
            (click)="onNavClick()"
          >
            <fa-icon [icon]="getIcon(item.key)" class="nav-icon" aria-hidden="true" />
            @if (!collapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <button class="collapse-btn" (click)="toggleCollapse.emit()" [attr.aria-label]="collapsed() ? 'Déployer la sidebar' : 'Réduire la sidebar'">
        <fa-icon [icon]="collapsed() ? faChevronRight : faChevronLeft" aria-hidden="true" />
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
      height: 67px;
      padding: 0 1.5rem;
      border-bottom: var(--greenBorder);
      display: flex;
      align-items: center;
      box-sizing: border-box;
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
        transition: transform 0.3s ease;
        z-index: 200;
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .collapse-btn {
        display: none;
      }
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 199;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class AdminSidebarComponent {
  private readonly shortcutsService = inject(AdminShortcutsService);

  readonly collapsed = input<boolean>(false);
  readonly mobileOpen = input<boolean>(false);
  readonly toggleCollapse = output<void>();
  readonly closeMobile = output<void>();

  readonly faChevronLeft = faChevronLeft;
  readonly faChevronRight = faChevronRight;

  /** Raccourcis visibles selon les permissions de l'utilisateur courant. */
  readonly visibleMenuItems = this.shortcutsService.availableShortcuts;

  /** Résout l'icone FontAwesome pour une clé de raccourci. */
  getIcon(key: string): IconDefinition {
    return FA_ICON_MAP[key] ?? faGaugeHigh;
  }

  onNavClick(): void {
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }
}
