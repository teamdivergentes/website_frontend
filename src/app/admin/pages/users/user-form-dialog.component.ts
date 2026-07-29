import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '../../../../shared/services/api/users.service';
import { RolesService } from '../../../../shared/services/api/roles.service';
import type { User, CreateUserDto, UpdateUserDto, Role } from '../../../../shared/models';
import { AdminNotifier } from '../../shared/admin-notifier.service';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ isEdit() ? 'Modifier' : 'Nouvel' }} utilisateur
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Email invalide</mat-error>
          }
          @if (form.get('email')?.hasError('required')) {
            <mat-error>Email requis</mat-error>
          }
        </mat-form-field>

        @if (!isEdit()) {
          <mat-form-field appearance="outline">
            <mat-label>Mot de passe</mat-label>
            <input matInput formControlName="password" type="password" />
            @if (form.get('password')?.hasError('minlength')) {
              <mat-error>Minimum 8 caractères</mat-error>
            }
            @if (form.get('password')?.hasError('required')) {
              <mat-error>Mot de passe requis</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Rôle</mat-label>
          <mat-select formControlName="roleId">
            @for (role of roles(); track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle formControlName="actif">
          Compte actif
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || saving()"
              (click)="save()">
        {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: min(400px, 90vw);
      padding: 1rem 0;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class UserFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  readonly data: { user?: User } | null = inject(MAT_DIALOG_DATA);

  readonly roles = signal<Role[]>([]);
  readonly saving = signal(false);
  readonly isEdit = computed(() => !!this.data?.user);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', this.data?.user ? [] : [Validators.required, Validators.minLength(8)]),
    roleId: new FormControl<number | null>(null, Validators.required),
    actif: new FormControl(true),
  });

  constructor() {
    this.loadRoles();
    if (this.data?.user) {
      this.form.patchValue({
        email: this.data.user.email,
        roleId: this.data.user.role.id,
        actif: this.data.user.actif,
      });
    }
  }

  private loadRoles(): void {
    this.rolesService.getRoles().subscribe(roles => this.roles.set(roles));
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const value = this.form.value;

    if (this.isEdit()) {
      const dto: UpdateUserDto = {
        email: value.email!,
        roleId: value.roleId!,
        actif: value.actif!,
      };
      this.usersService.updateUser(this.data!.user!.id, dto).subscribe({
        next: (user) => {
          this.notifier.saved('Compte', 'edit');
          this.dialogRef.close(user);
        },
        error: () => {
          this.saving.set(false);
          this.notifier.error("Erreur lors de la mise à jour du compte");
        }
      });
    } else {
      const dto: CreateUserDto = {
        email: value.email!,
        password: value.password!,
        roleId: value.roleId!,
        actif: value.actif!,
      };
      this.usersService.createUser(dto).subscribe({
        next: (user) => {
          this.notifier.saved('Compte', 'create');
          this.dialogRef.close(user);
        },
        error: () => {
          this.saving.set(false);
          this.notifier.error('Erreur lors de la création du compte');
        }
      });
    }
  }
}
