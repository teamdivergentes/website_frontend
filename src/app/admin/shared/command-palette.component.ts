import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';
import { AdminAction } from '../../../shared/config/admin-actions';
import { AdminShortcut } from '../../../shared/config/admin-shortcuts';

/** Une entrée navigable de la palette, quelle que soit sa catégorie. */
export interface PaletteEntry {
  key: string;
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
}

/** Rend une chaîne comparable : sans accent, sans casse. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function toEntry(item: AdminShortcut | AdminAction): PaletteEntry {
  return {
    key: item.key,
    label: item.label,
    icon: item.icon,
    route: item.route,
    queryParams: 'queryParams' in item ? item.queryParams : undefined,
  };
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="palette" (keydown)="onKeydown($event)">
      <div class="palette-search">
        <mat-icon aria-hidden="true">search</mat-icon>
        <input
          #search
          type="text"
          class="palette-input"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          [attr.aria-activedescendant]="activeId()"
          aria-label="Rechercher une page ou une action"
          placeholder="Rechercher une page ou une action…"
          [value]="query()"
          (input)="onInput($event)"
        />
      </div>

      <div class="palette-results" id="palette-results" role="listbox" aria-label="Résultats">
        @if (destinations().length) {
          <p class="palette-group" id="palette-group-go">Aller à</p>
          @for (entry of destinations(); track entry.key) {
            <button
              type="button"
              role="option"
              class="palette-entry"
              [id]="'palette-' + entry.key"
              [class.active]="entry === active()"
              [attr.aria-selected]="entry === active()"
              (click)="run(entry)"
              (mouseenter)="focusEntry(entry)"
            >
              <mat-icon aria-hidden="true">{{ entry.icon }}</mat-icon>
              <span class="palette-label">{{ entry.label }}</span>
            </button>
          }
        }

        @if (actions().length) {
          <p class="palette-group" id="palette-group-actions">Actions</p>
          @for (entry of actions(); track entry.key) {
            <button
              type="button"
              role="option"
              class="palette-entry"
              [id]="'palette-' + entry.key"
              [class.active]="entry === active()"
              [attr.aria-selected]="entry === active()"
              (click)="run(entry)"
              (mouseenter)="focusEntry(entry)"
            >
              <mat-icon aria-hidden="true">{{ entry.icon }}</mat-icon>
              <span class="palette-label">{{ entry.label }}</span>
            </button>
          }
        }

        @if (!entries().length) {
          <p class="palette-empty" role="status">Aucun résultat pour « {{ query() }} »</p>
        }
      </div>

      <div class="palette-footer" aria-hidden="true">
        <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> ouvrir</span>
        <span><kbd>esc</kbd> fermer</span>
      </div>
    </div>
  `,
  styles: [`
    .palette {
      display: flex;
      flex-direction: column;
      max-height: 60vh;
      background: var(--lightBlack, var(--admin-surface));
      color: var(--white, var(--admin-text));
    }

    .palette-search {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(211, 211, 211, 0.12);

      mat-icon {
        color: var(--gray, #9e9e9e);
        flex-shrink: 0;
      }
    }

    .palette-input {
      flex: 1;
      min-width: 0;
      background: none;
      border: none;
      outline: none;
      color: inherit;
      font-family: inherit;
      font-size: 1rem;

      &::placeholder {
        color: var(--gray, #9e9e9e);
      }
    }

    .palette-results {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
    }

    .palette-group {
      margin: 0.5rem 0 0.25rem;
      padding: 0 1.25rem;
      color: var(--gray, #9e9e9e);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .palette-entry {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 1.25rem;
      background: none;
      border: none;
      color: inherit;
      font-family: inherit;
      font-size: 0.9375rem;
      text-align: left;
      cursor: pointer;

      mat-icon {
        color: var(--gray, #9e9e9e);
        flex-shrink: 0;
      }

      &.active {
        background: rgba(50, 210, 153, 0.12);
        box-shadow: inset 3px 0 0 var(--green, var(--admin-accent));

        mat-icon {
          color: var(--green, var(--admin-accent));
        }
      }
    }

    .palette-empty {
      margin: 0;
      padding: 1.5rem 1.25rem;
      color: var(--gray, #9e9e9e);
      text-align: center;
    }

    .palette-footer {
      display: flex;
      gap: 1.25rem;
      padding: 0.625rem 1.25rem;
      border-top: 1px solid rgba(211, 211, 211, 0.12);
      color: var(--gray, #9e9e9e);
      font-size: 0.75rem;

      kbd {
        display: inline-block;
        min-width: 1.25rem;
        margin-right: 0.25rem;
        padding: 0.0625rem 0.25rem;
        border: 1px solid rgba(211, 211, 211, 0.25);
        border-radius: 3px;
        font-family: inherit;
        text-align: center;
      }
    }
  `],
})
export class CommandPaletteComponent implements AfterViewInit {
  private readonly shortcutsService = inject(AdminShortcutsService);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<CommandPaletteComponent>);

  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('search');

  readonly query = signal('');

  /**
   * Index derive de `availableShortcuts()` et `availableActions()` : la palette
   * ne peut pas exposer une destination interdite, il n'y a aucun filtrage de
   * permissions a ecrire ici.
   */
  readonly destinations = computed(() =>
    this.shortcutsService.availableShortcuts().map(toEntry).filter(this.matches)
  );

  readonly actions = computed(() =>
    this.shortcutsService.availableActions().map(toEntry).filter(this.matches)
  );

  /** Les deux categories a plat, dans l'ordre de parcours au clavier. */
  readonly entries = computed(() => [...this.destinations(), ...this.actions()]);

  private readonly activeKey = signal<string | null>(null);

  /**
   * Entree active : celle explicitement selectionnee si elle survit au filtrage,
   * la premiere sinon. Sans ce repli, filtrer laissait la selection sur une
   * entree disparue et `↵` n'ouvrait rien.
   */
  readonly active = computed(() => {
    const entries = this.entries();
    const key = this.activeKey();
    return entries.find(entry => entry.key === key) ?? entries[0];
  });

  readonly activeId = computed(() => {
    const active = this.active();
    return active ? `palette-${active.key}` : null;
  });

  private readonly matches = (entry: PaletteEntry): boolean => {
    const needle = fold(this.query().trim());
    return needle === '' || fold(entry.label).includes(needle);
  };

  ngAfterViewInit(): void {
    this.searchInput().nativeElement.focus();
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    // La selection repart en tete : la precedente n'a plus de sens sur un autre jeu.
    this.activeKey.set(null);
  }

  focusEntry(entry: PaletteEntry): void {
    this.activeKey.set(entry.key);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.move(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.move(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const active = this.active();
      if (active) this.run(active);
    }
  }

  /** Deplace la selection, en bouclant aux extremites. */
  private move(delta: number): void {
    const entries = this.entries();
    if (!entries.length) return;

    const current = entries.indexOf(this.active());
    const next = (current + delta + entries.length) % entries.length;
    this.activeKey.set(entries[next].key);
  }

  run(entry: PaletteEntry): void {
    this.dialogRef.close();
    // Le `.catch` suffit a traiter la promesse : une navigation refusee par un
    // garde n'a rien de plus a signaler depuis la palette.
    this.router.navigate([entry.route], { queryParams: entry.queryParams }).catch(() => undefined);
  }
}
