import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

/**
 * Paliers de largeur des dialogues d'administration.
 *
 * `lg` est **transitoire** : selon la regle inscrite dans `frontend/CLAUDE.md`,
 * tout dialogue au-dela de 600px est le signal qu'il aurait du etre une page
 * routee. Il ne reste plus qu'a `roles` et `sponsors`, et disparaitra avec eux.
 *
 * `xl` (1200px) est parti avec la migration du staff de coaching, son dernier
 * appelant : ne pas le reintroduire — un ecran qui le reclamerait est une page.
 */
export type AdminDialogSize = 'sm' | 'md' | 'lg';

const WIDTHS: Record<AdminDialogSize, string> = {
  sm: '440px',
  md: '600px',
  lg: '920px',
};

/**
 * Ouverture des dialogues d'administration.
 *
 * L'audit du 2026-07-29 a releve 26 litteraux de configuration recopies, avec
 * **dix largeurs distinctes** (350, 400, 440, 500, 600, 700, 800, 920, 1000,
 * 1200px) et `maxHeight` present sur cinq ouvertures sur treize — les huit
 * autres debordaient sur un ecran de 768px de haut.
 */
@Injectable({ providedIn: 'root' })
export class AdminDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * @param component - Composant de dialogue a monter.
   * @param size - Palier de largeur. `md` par defaut.
   * @param data - Donnees injectees via `MAT_DIALOG_DATA`.
   */
  open<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    size: AdminDialogSize = 'md',
    data?: D,
  ): MatDialogRef<T, R> {
    return this.dialog.open<T, D, R>(component, {
      width: WIDTHS[size],
      maxWidth: '95vw',
      maxHeight: '90vh',
      // Les overlays CDK sont montes hors de `.admin-layout` : sans cette
      // classe, les styles partages scopes sous ce conteneur ne les atteignent
      // pas. C'est ce scoping qui avait cause six redefinitions locales du
      // bandeau d'erreur.
      panelClass: 'admin-dialog',
      autoFocus: 'first-tabbable',
      data,
    });
  }
}
