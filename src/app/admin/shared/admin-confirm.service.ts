import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';
import { ConfirmDialogComponent } from './confirm-dialog.component';

/**
 * Confirmation des actions destructives du panel d'administration.
 *
 * Surcouche fine du `ConfirmDialogComponent` existant, qui reste inchange.
 *
 * L'audit du 2026-07-29 a releve 17 appels recopiant le meme bloc
 * `dialog.open(ConfirmDialogComponent, { maxWidth, data })`. Le titre etait
 * heureusement identique partout, mais les messages divergeaient :
 * - trois sans nom d'entite ("Voulez-vous vraiment supprimer {nom} ?") ;
 * - un sans guillemets autour du nom ;
 * - un formule "Etes-vous sur de vouloir" ;
 * - la mention "Cette action est irreversible" n'apparaissait que 2 fois sur 17,
 *   alors que **toutes** les suppressions le sont ;
 * - `maxWidth: '95vw'` manquait sur les 4 dialogues imbriques, qui debordaient
 *   donc sur petit ecran.
 */
@Injectable({ providedIn: 'root' })
export class AdminConfirmService {
  private readonly dialog = inject(MatDialog);

  /**
   * Demande confirmation avant une suppression.
   *
   * @param entity - Designation avec son article, en minuscules
   *                 (ex. "le jeu", "l'équipe", "cette image").
   * @param name   - Nom de l'element, affiche entre guillemets. Omis quand
   *                 l'element n'a pas de nom parlant.
   * @returns `true` si l'utilisateur confirme, `false` s'il ferme le dialogue.
   */
  delete(entity: string, name?: string): Observable<boolean> {
    const target = name ? `${entity} "${name}"` : entity;

    return this.dialog
      .open(ConfirmDialogComponent, {
        maxWidth: '95vw',
        data: {
          title: 'Confirmer la suppression',
          message: `Voulez-vous vraiment supprimer ${target} ? Cette action est irréversible.`,
        },
      })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
