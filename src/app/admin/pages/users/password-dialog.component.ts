import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from '../../../../shared/services/api/users.service';
import type { User } from '../../../../shared/models';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

@Component({
  selector: 'app-password-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Réinitialiser le mot de passe</h2>

    <mat-dialog-content>
      <p>Utilisateur : <strong>{{ data.user.email }}</strong></p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nouveau mot de passe</mat-label>
          <input matInput formControlName="newPassword" type="password" />
          @if (form.get('newPassword')?.hasError('minlength')) {
            <mat-error>Minimum 8 caractères</mat-error>
          }
          @if (form.get('newPassword')?.hasError('required')) {
            <mat-error>Mot de passe requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Confirmer le mot de passe</mat-label>
          <input matInput formControlName="confirmPassword" type="password" />
          @if (form.hasError('passwordMismatch')) {
            <mat-error>Les mots de passe ne correspondent pas</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        color="warn"
        submitLabel="Réinitialiser"
        savingLabel="Réinitialisation…"
        [saving]="saving()"
        [disabled]="form.invalid"
        (cancelled)="cancel()"
        (submitted)="save()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      width: min(350px, 90vw);
    }

    .full-width {
      width: 100%;
      margin-top: 1rem;
    }

    p {
      margin-bottom: 1rem;
    }
  `]
})
export class PasswordDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PasswordDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly usersService = inject(UsersService);
  readonly data: { user: User } = inject(MAT_DIALOG_DATA);

  readonly saving = signal(false);

  readonly form = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  /** Ferme sans enregistrer. Remplace `mat-dialog-close`, que le pied
   * partage ne porte pas : il emet un evenement plutot qu'une directive. */
  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      // Sans cela, cliquer sur le bouton de validation sur un formulaire
      // invalide ne produisait aucun retour visible.
      this.form.markAllAsTouched();
      return;
    }

    const newPassword = this.form.value.newPassword;
    if (!newPassword) return;

    this.saving.set(true);
    this.usersService.resetPassword(this.data.user.id, newPassword).subscribe({
      next: () => {
        this.notifier.success('Mot de passe réinitialisé');
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.notifier.error('Erreur lors de la réinitialisation du mot de passe');
      }
    });
  }
}
