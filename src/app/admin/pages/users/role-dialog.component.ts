import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsersService } from '../../../../shared/services/api/users.service';
import { RolesService } from '../../../../shared/services/api/roles.service';
import type { User, Role } from '../../../../shared/models';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title>Changer le rôle</h2>

    <mat-dialog-content>
      <p>Utilisateur : <strong>{{ data.user.email }}</strong></p>
      <p>Rôle actuel : <strong>{{ data.user.role.name }}</strong></p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nouveau rôle</mat-label>
        <mat-select [(value)]="selectedRoleId">
          @for (role of roles(); track role.id) {
            <mat-option [value]="role.id">
              {{ role.name }}
              @if (role.id === data.user.role.id) {
                (actuel)
              }
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        submitLabel="Confirmer"
        [saving]="saving()"
        [disabled]="selectedRoleId === data.user.role.id"
        (cancelled)="cancel()"
        (submitted)="save()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 350px;
    }

    .full-width {
      width: 100%;
      margin-top: 1rem;
    }

    p {
      margin: 0.5rem 0;
    }
  `]
})
export class RoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RoleDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  readonly data: { user: User } = inject(MAT_DIALOG_DATA);

  readonly roles = signal<Role[]>([]);
  selectedRoleId: number;
  readonly saving = signal(false);

  constructor() {
    this.selectedRoleId = this.data.user.role.id;
    this.loadRoles();
  }

  private loadRoles(): void {
    this.rolesService.getRoles().subscribe(roles => this.roles.set(roles));
  }

  /** Ferme sans enregistrer. Remplace `mat-dialog-close`, que le pied
   * partage ne porte pas : il emet un evenement plutot qu'une directive. */
  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.saving.set(true);
    this.usersService.assignRole(this.data.user.id, this.selectedRoleId).subscribe({
      next: (user) => {
        this.notifier.success('Rôle mis à jour');
        this.dialogRef.close(user);
      },
      error: () => {
        this.saving.set(false);
        this.notifier.error("Erreur lors de l'affectation du rôle");
      }
    });
  }
}
