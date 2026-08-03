import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../shared/services/api/auth.service';
import { ProfileService } from '../../../shared/services/api/profile.service';
import { PageComponent } from '../../shared/components/layout/page.component';

/**
 * Page de profil utilisateur
 * Permet de modifier son email et son mot de passe
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    PageComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dvg-page container="xs">
    <div class="profile-page">
      <h1 class="visually-hidden">Mon profil</h1>

      <mat-card>
        <mat-card-header>
          <h2 mat-card-title>Mon Profil</h2>
        </mat-card-header>

        <mat-card-content>
          <div class="profile-info">
            <div class="info-item">
              <span class="label">Email</span>
              <span class="value">{{ user()?.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">Rôle</span>
              <span class="value">{{ user()?.role?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">Membre depuis</span>
              <span class="value">{{ user()?.createdAt | date:'dd MMMM yyyy' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <h2 mat-card-title>Modifier mon email</h2>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="emailForm" (ngSubmit)="updateEmail()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nouvel email</mat-label>
              <input matInput formControlName="email" type="email" />
              @if (emailForm.get('email')?.hasError('email')) {
                <mat-error>Email invalide</mat-error>
              }
              @if (emailForm.get('email')?.hasError('required')) {
                <mat-error>Email requis</mat-error>
              }
            </mat-form-field>

            <button mat-raised-button color="primary"
                    type="submit"
                    [disabled]="emailForm.invalid || savingEmail()">
              {{ savingEmail() ? 'Enregistrement...' : 'Modifier' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <h2 mat-card-title>Changer mon mot de passe</h2>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mot de passe actuel</mat-label>
              <input matInput formControlName="currentPassword" type="password" />
              @if (passwordForm.get('currentPassword')?.hasError('required')) {
                <mat-error>Mot de passe actuel requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nouveau mot de passe</mat-label>
              <input matInput formControlName="newPassword" type="password" />
              @if (passwordForm.get('newPassword')?.hasError('minlength')) {
                <mat-error>Minimum 8 caractères</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmer le nouveau mot de passe</mat-label>
              <input matInput formControlName="confirmPassword" type="password" />
              @if (passwordForm.hasError('passwordMismatch')) {
                <mat-error>Les mots de passe ne correspondent pas</mat-error>
              }
            </mat-form-field>

            <button mat-raised-button color="primary"
                    type="submit"
                    [disabled]="passwordForm.invalid || savingPassword()">
              {{ savingPassword() ? 'Modification...' : 'Changer le mot de passe' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
    </dvg-page>
  `,
  styles: [`
    // max-width, marge et centrage venaient d'ici (800px) : portes desormais
    // par \`<dvg-page container="xs">\` (960px). Seul l'empilement des cartes
    // reste propre a la page.
    .profile-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    mat-card {
      background: var(--card-bg);
      color: var(--text);
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-md) 0;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-xs) 0;
      // --border n'est pas promu au socle (valeur non unifiee entre pages) et
      // n'est declare nulle part ici : cette regle retombe donc toujours sur
      // #333, une valeur propre a cette page.
      border-bottom: 1px solid var(--border, #333);

      .label {
        font-weight: 600;
        color: var(--gray, #999);
      }

      .value {
        color: var(--text);
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-md) 0;

      .full-width {
        width: 100%;
      }
    }
  `]
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);

  readonly user = this.authService.user;
  readonly savingEmail = signal(false);
  readonly savingPassword = signal(false);

  readonly emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.emailForm.patchValue({ email: this.user()?.email ?? '' });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirm = control.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  updateEmail(): void {
    if (this.emailForm.invalid) return;

    this.savingEmail.set(true);
    this.profileService.updateProfile({ email: this.emailForm.value.email! }).subscribe({
      next: () => {
        this.snackBar.open('Email modifié avec succès', 'OK', { duration: 3000 });
        this.savingEmail.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la modification de l\'email', 'OK', { duration: 3000 });
        this.savingEmail.set(false);
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.savingPassword.set(true);
    this.profileService.changePassword({
      currentPassword: this.passwordForm.value.currentPassword!,
      newPassword: this.passwordForm.value.newPassword!
    }).subscribe({
      next: () => {
        this.snackBar.open('Mot de passe modifié avec succès', 'OK', { duration: 3000 });
        this.passwordForm.reset();
        this.savingPassword.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors du changement de mot de passe', 'OK', { duration: 3000 });
        this.savingPassword.set(false);
      }
    });
  }
}