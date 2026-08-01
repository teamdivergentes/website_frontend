import { Component, computed, HostListener, inject, input, output } from '@angular/core';
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
import { SECTION_LABELS, SECTION_ORDER } from '../../../shared/config/admin-shortcuts';

/**
 * Mapping clé de raccourci → icone FontAwesome.
 * Maintenu localement car la sidebar utilise FA tandis que le registre
 * central stocke des noms d'icones Material Icons (utilisés par le dashboard).
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
    <aside
      class="sidebar"
      [class.collapsed]="collapsed()"
      [class.mobile-open]="mobileOpen()"
      [attr.inert]="hidden() ? '' : null"
    >
      <div class="sidebar-header">
        @if (!collapsed()) {
          <h2>DVG Admin</h2>
        } @else {
          <h2 class="logo-small">D</h2>
        }
      </div>

      <nav class="sidebar-nav" aria-label="Navigation administration">
        @for (item of pinnedItems(); track item.route) {
          <ng-container *ngTemplateOutlet="navItem; context: { $implicit: item }" />
        }

        @for (group of groups(); track group.section) {
          @if (group.showSeparator) {
            <div class="nav-separator" data-testid="admin-nav-separator" aria-hidden="true"></div>
          }
          @if (group.showHeader) {
            <h3 class="nav-section-title" data-testid="admin-nav-section">{{ group.label }}</h3>
          }
          @for (item of group.items; track item.route) {
            <ng-container *ngTemplateOutlet="navItem; context: { $implicit: item }" />
          }
        }
      </nav>

      <ng-template #navItem let-item>
        <a
          [routerLink]="item.route"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
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
      </ng-template>

      <button
        class="collapse-btn"
        (click)="toggleCollapse.emit()"
        [attr.aria-expanded]="!collapsed()"
        [attr.aria-label]="collapsed() ? 'Déployer la sidebar' : 'Réduire la sidebar'"
      >
        <fa-icon [icon]="collapsed() ? faChevronRight : faChevronLeft" aria-hidden="true" />
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      height: 100dvh;
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

    /*
     * En-tete de groupe.
     * Jamais vert : sur le fond var(--admin-surface-raised), l'accent est le seul point de couleur
     * et doit rester reserve a l'etat actif. La hierarchie passe par la casse,
     * l'interlettrage et un contraste bas.
     */
    .nav-section-title {
      margin: 0;
      padding: 1.25rem 1.25rem 0.375rem;
      font-family: var(--font-bebas-neue, inherit);
      font-size: 0.6875rem;
      font-weight: 400;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.38);
      user-select: none;
      white-space: nowrap;
    }

    /* Remplace l'en-tete en mode replie, et delimite la zone epinglee. */
    .nav-separator {
      height: 1px;
      margin: 0.5rem 1.25rem;
      background: rgba(50, 210, 153, 0.12);
    }

    .sidebar.collapsed .nav-separator {
      margin: 0.5rem auto;
      width: 40%;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      height: 40px;
      padding: 0 1.25rem;
      box-sizing: border-box;
      color: var(--gray);
      text-decoration: none;
      /* Cible explicite : "all" animerait aussi la barre active et ferait pousser le texte. */
      transition: background-color 0.15s ease, color 0.15s ease;
      white-space: nowrap;
      scroll-margin-block: 24px;

      &:hover {
        background: rgba(50, 210, 153, 0.06);
        color: var(--white);
      }

      &.active {
        background: var(--admin-accent-border);
        color: var(--green);
        font-weight: 600;
        /* inset plutot que border-left : evite le decalage de 3px du contenu. */
        box-shadow: inset 3px 0 0 var(--green);
      }

      /* offset negatif : la sidebar est a ras du bord gauche de l'ecran. */
      &:focus-visible {
        outline: 2px solid var(--green);
        outline-offset: -2px;
        border-radius: 4px;
      }
    }

    .collapse-btn:focus-visible {
      outline: 2px solid var(--green);
      outline-offset: -2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .nav-item {
        transition: none;
      }
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 0;
    }

    .nav-icon {
      font-size: 1rem;
      width: 20px;
      flex-shrink: 0;
      text-align: center;
    }

    .nav-label {
      font-size: 0.8125rem;
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

      /*
       * Sans cet override, replier la sidebar en desktop puis passer en mobile
       * donne un drawer de 80px, icones seules et sans tooltip : inutilisable.
       * Le mode replie n'a pas de sens dans un drawer.
       */
      .sidebar.collapsed {
        width: 100%;
        max-width: 280px;
      }

      .sidebar.collapsed .nav-item {
        justify-content: flex-start;
        padding: 0 1.25rem;
      }

      .sidebar.collapsed .nav-separator {
        margin: 0.5rem 1.25rem;
        width: auto;
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
  /** Fourni par le layout, qui observe `ScreenSizeService`. */
  readonly isMobile = input<boolean>(false);
  readonly toggleCollapse = output<void>();
  readonly closeMobile = output<void>();

  /**
   * Vrai quand la sidebar est hors ecran : drawer mobile ferme.
   *
   * `transform: translateX(-100%)` masque visuellement mais ne retire ni du
   * parcours de tabulation ni de l'arbre d'accessibilite. Sans `inert`, Tab
   * depuis le header traverse tous les liens invisibles.
   */
  readonly hidden = computed(() => this.isMobile() && !this.mobileOpen());

  readonly faChevronLeft = faChevronLeft;
  readonly faChevronRight = faChevronRight;

  /** Raccourcis visibles selon les permissions de l'utilisateur courant. */
  readonly visibleMenuItems = this.shortcutsService.availableShortcuts;

  /** Raccourcis de la zone epinglee (section absente) : Dashboard, Statistiques. */
  readonly pinnedItems = computed(() => this.shortcutsService.shortcutsBySection().get(undefined) ?? []);

  /**
   * Groupes a rendre, dans l'ordre de `SECTION_ORDER`.
   *
   * L'ordre vient de `SECTION_ORDER`, jamais de l'iteration de la Map : celle-ci
   * suit l'ordre de declaration du registre, ce qui rendrait l'affichage
   * silencieusement dependant de l'ordre des entrees.
   *
   * Regle de degradation sous permissions :
   * - groupe sans item        -> rien (il est filtre ici)
   * - groupe a un seul item   -> l'item seul, en-tete masque
   * - groupe a deux items ou + -> en-tete + items
   *
   * En mode replie, les en-tetes n'ont plus de texte lisible : ils sont
   * remplaces par un separateur, qui preserve le rythme visuel des groupes.
   */
  readonly groups = computed(() => {
    const bySection = this.shortcutsService.shortcutsBySection();
    const isCollapsed = this.collapsed();
    const hasPinned = this.pinnedItems().length > 0;

    return SECTION_ORDER.map(section => ({
      section,
      label: SECTION_LABELS[section],
      items: bySection.get(section) ?? [],
    }))
      .filter(group => group.items.length > 0)
      .map((group, index) => ({
        ...group,
        showHeader: !isCollapsed && group.items.length > 1,
        showSeparator: isCollapsed ? index > 0 || hasPinned : index === 0 && hasPinned,
      }));
  });

  /** Résout l'icone FontAwesome pour une clé de raccourci. */
  getIcon(key: string): IconDefinition {
    return FA_ICON_MAP[key] ?? faGaugeHigh;
  }

  /** Suivre un lien referme le drawer : la page derriere a change. */
  onNavClick(): void {
    this.closeMobileIfOpen();
  }

  /** Ferme le drawer mobile sur Escape : le backdrop est cliquable mais pas atteignable au clavier. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMobileIfOpen();
  }

  private closeMobileIfOpen(): void {
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }
}
