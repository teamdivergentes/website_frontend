import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Creation ou modification, pour choisir le libelle de validation. */
export type FormMode = 'create' | 'edit';

/**
 * Pied de formulaire des dialogues et pages d'administration.
 *
 * L'audit du 2026-07-29 a releve 15 pieds recopies. L'ordre Annuler puis
 * valider etait respecte partout — c'etait le seul point homogene — mais :
 *
 * - le libelle d'annulation etait `Annuler` 10 fois et `Fermer` 5 fois ;
 * - le libelle pendant soumission s'ecrivait `Enregistrement...` (3 points),
 *   `Enregistrement…` (caractere ellipse) ou `Sauvegarde...` selon le fichier ;
 * - **aucun des 13 dialogues Material n'affichait d'indicateur de progression**,
 *   seul le libelle changeait ;
 * - le bouton Annuler n'etait desactive que dans 1 cas sur 15 : partout ailleurs
 *   on pouvait annuler en pleine requete, qui aboutissait alors sans retour.
 */
@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-actions" align="end">
      <button
        mat-button
        type="button"
        data-testid="form-cancel"
        [disabled]="saving()"
        (click)="cancel.emit()"
      >
        {{ cancelLabel() }}
      </button>

      <button
        mat-raised-button
        color="primary"
        type="button"
        data-testid="form-submit"
        [disabled]="saving() || disabled()"
        (click)="submit.emit()"
      >
        @if (saving()) {
          <mat-spinner diameter="18" aria-hidden="true" />
        }
        {{ resolvedSubmitLabel() }}
      </button>
    </div>
  `,
  styles: [`
    .form-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.75rem;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 0.5rem;
    }
  `],
})
export class FormActionsComponent {
  readonly mode = input<FormMode>('edit');
  /** Vrai pendant la soumission : desactive les deux boutons et montre le spinner. */
  readonly saving = input<boolean>(false);
  /** Vrai quand le formulaire est invalide. */
  readonly disabled = input<boolean>(false);
  readonly cancelLabel = input<string>('Annuler');
  /** Ecrase le libelle derive de `mode`. */
  readonly submitLabel = input<string>('');
  readonly savingLabel = input<string>('Enregistrement…');

  readonly cancel = output<void>();
  readonly submit = output<void>();

  readonly resolvedSubmitLabel = computed(() => {
    if (this.saving()) return this.savingLabel();
    const custom = this.submitLabel().trim();
    if (custom) return custom;
    return this.mode() === 'create' ? 'Créer' : 'Enregistrer';
  });
}
