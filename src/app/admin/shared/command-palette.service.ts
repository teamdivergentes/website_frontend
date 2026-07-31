import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommandPaletteComponent } from './command-palette.component';

/** Champs de saisie ou le raccourci ne doit pas voler la frappe. */
const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Ouverture de la palette de commandes.
 *
 * Passe par `MatDialog` plutot que par un overlay monte a la main : le piege de
 * focus, la fermeture par `Esc` et la restauration du focus sur l'element
 * declencheur sont son comportement par defaut, il n'y a rien a reimplementer.
 */
@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly dialog = inject(MatDialog);

  private ref: MatDialogRef<CommandPaletteComponent> | null = null;

  /** Vrai si la palette est ouverte. */
  get isOpen(): boolean {
    return this.ref !== null;
  }

  open(): void {
    if (this.ref) return;

    this.ref = this.dialog.open(CommandPaletteComponent, {
      width: '560px',
      maxWidth: '95vw',
      panelClass: ['admin-dialog', 'command-palette-dialog'],
      autoFocus: false, // le composant place le focus dans son champ de recherche
      restoreFocus: true,
    });

    this.ref.afterClosed().subscribe(() => (this.ref = null));
  }

  close(): void {
    this.ref?.close();
  }

  toggle(): void {
    if (this.ref) this.close();
    else this.open();
  }

  /**
   * Decide si un evenement clavier doit ouvrir la palette.
   *
   * Le raccourci ne se declenche pas quand la frappe vise un champ de saisie :
   * `Ctrl+K` y a deja un sens (couper jusqu'a la fin de ligne sur certaines
   * plateformes), et un editeur admin ouvert perdrait la saisie en cours.
   */
  handlesShortcut(event: KeyboardEvent): boolean {
    if (event.key !== 'k' && event.key !== 'K') return false;
    if (!event.metaKey && !event.ctrlKey) return false;

    const target = event.target as HTMLElement | null;
    if (!target) return true;
    if (EDITABLE.has(target.tagName)) return false;
    return !target.isContentEditable;
  }
}
