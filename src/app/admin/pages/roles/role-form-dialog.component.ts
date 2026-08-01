import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { RolesService } from '../../../../shared/services/api/roles.service';
import type { Role, CreateRoleDto, UpdateRoleDto } from '../../../../shared/models/user.model';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface PermissionGroupControl {
  module: string;
  permissions: Array<{ key: string; control: FormControl<boolean> }>;
}

/**
 * Dialog de création/édition de rôle avec gestion des permissions
 */
@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      {{ isEdit() ? 'Modifier' : 'Nouveau' }} rôle
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="role-form">
        <!-- Nom du rôle -->
        <mat-form-field appearance="outline">
          <mat-label>Nom du rôle</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Community Manager" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>

        <!-- Permissions par groupe -->
        <div class="permissions-section">
          <h3>Permissions</h3>
          
          @if (!hasAnyPermissionSelected()) {
            <div class="validation-error">
              <mat-icon>warning</mat-icon>
              <span>Veuillez sélectionner au moins une permission</span>
            </div>
          }

          <mat-accordion multi>
            @for (group of permissionGroups(); track group.module) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <div class="group-header">
                      <span>{{ group.module }}</span>
                      <span class="selected-count">
                        ({{ getSelectedCount(group) }}/{{ group.permissions.length }})
                      </span>
                    </div>
                  </mat-panel-title>
                </mat-expansion-panel-header>

                <div class="group-actions">
                  <button type="button" mat-button (click)="selectAll(group)">
                    <mat-icon>check_circle</mat-icon>
                    Tout sélectionner
                  </button>
                  <button type="button" mat-button (click)="deselectAll(group)">
                    <mat-icon>cancel</mat-icon>
                    Tout désélectionner
                  </button>
                </div>

                <div class="permissions-list">
                  @for (perm of group.permissions; track perm.key) {
                    <mat-checkbox [formControl]="perm.control">
                      {{ perm.key }}
                    </mat-checkbox>
                  }
                </div>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        [saving]="saving()"
        [disabled]="!isFormValid()"
        (cancelled)="cancel()"
        (submitted)="save()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    h2[mat-dialog-title] {
      color: var(--admin-text) !important;
      margin: 0;
      padding: var(--admin-space-6) var(--admin-space-6) 0;
    }

    .role-form {
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-6);
      width: min(500px, 90vw);
      padding: var(--admin-space-4) 0;
    }

    .permissions-section {
      h3 {
        margin: 0 0 1rem 0;
        color: var(--admin-text);
        font-size: 1rem;
      }
    }

    .validation-error {
      display: flex;
      align-items: center;
      gap: var(--admin-space-2);
      padding: var(--admin-space-3);
      background: var(--admin-danger-bg);
      border: 1px solid rgba(244, 67, 54, 0.4);
      border-radius: var(--admin-radius-xs);
      color: var(--admin-danger);
      margin-bottom: 1rem;

      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    mat-accordion {
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-2);
    }

    .group-header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      align-items: center;

      .selected-count {
        color: var(--admin-accent);
        font-size: 0.875rem;
        font-weight: 500;
        margin-left: auto;
        padding-right: var(--admin-space-4);
      }
    }

    .group-actions {
      display: flex;
      gap: var(--admin-space-2);
      margin-bottom: 1rem;
      padding-bottom: var(--admin-space-2);
      border-bottom: 1px solid var(--darkGreen, #444);

      button {
        color: #999;

        mat-icon {
          font-size: 1.125rem;
          width: 1.125rem;
          height: 1.125rem;
          margin-right: 0.25rem;
        }
      }
    }

    .permissions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--admin-space-3);
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: var(--admin-space-4) var(--admin-space-6) var(--admin-space-6);

      button[mat-button] {
        color: #999;
      }
    }
  `]
})
export class RoleFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RoleFormDialogComponent>);
  private readonly rolesService = inject(RolesService);
  readonly data: { role?: Role } | null = inject(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly isEdit = computed(() => !!this.data?.role);
  readonly permissionGroups = signal<PermissionGroupControl[]>([]);

  readonly form = new FormGroup({
    name: new FormControl('', [Validators.required])
  });

  constructor() {
    this.loadPermissions();
    
    if (this.data?.role) {
      this.form.patchValue({
        name: this.data.role.name
      });
    }
  }

  private loadPermissions(): void {
    this.rolesService.getPermissions().subscribe(groups => {
      const rolePermissions = this.data?.role?.permissions ?? [];

      const permissionGroupControls: PermissionGroupControl[] = groups.map(group => ({
        module: group.module,
        permissions: group.permissions.map(perm => ({
          key: perm,
          control: new FormControl<boolean>(rolePermissions.includes(perm), { nonNullable: true })
        }))
      }));

      this.permissionGroups.set(permissionGroupControls);
    });
  }

  /**
   * Sélectionne toutes les permissions d'un groupe
   */
  selectAll(group: PermissionGroupControl): void {
    group.permissions.forEach(perm => perm.control.setValue(true));
  }

  /**
   * Désélectionne toutes les permissions d'un groupe
   */
  deselectAll(group: PermissionGroupControl): void {
    group.permissions.forEach(perm => perm.control.setValue(false));
  }

  /**
   * Retourne le nombre de permissions sélectionnées dans un groupe
   */
  getSelectedCount(group: PermissionGroupControl): number {
    return group.permissions.filter(perm => perm.control.value).length;
  }

  /**
   * Vérifie si au moins une permission est sélectionnée
   */
  hasAnyPermissionSelected(): boolean {
    return this.permissionGroups().some(group =>
      group.permissions.some(perm => perm.control.value)
    );
  }

  /**
   * Vérifie si le formulaire est valide
   */
  isFormValid(): boolean {
    return this.form.valid && this.hasAnyPermissionSelected();
  }

  /**
   * Récupère toutes les permissions sélectionnées
   */
  private getSelectedPermissions(): string[] {
    const permissions: string[] = [];
    
    this.permissionGroups().forEach(group => {
      group.permissions.forEach(perm => {
        if (perm.control.value) {
          permissions.push(perm.key);
        }
      });
    });

    return permissions;
  }

  /** Ferme sans enregistrer. Remplace `mat-dialog-close`, que le pied
   * partage ne porte pas : il emet un evenement plutot qu'une directive. */
  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (!this.isFormValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const name = this.form.value.name!;
    const permissions = this.getSelectedPermissions();

    if (this.isEdit()) {
      const dto: UpdateRoleDto = { name, permissions };
      this.rolesService.updateRole(this.data!.role!.id, dto).subscribe({
        next: (role) => this.dialogRef.close(role),
        error: (err) => {
          console.error('Update error:', err);
          this.saving.set(false);
        }
      });
    } else {
      const dto: CreateRoleDto = { name, permissions };
      this.rolesService.createRole(dto).subscribe({
        next: (role) => this.dialogRef.close(role),
        error: (err) => {
          console.error('Create error:', err);
          this.saving.set(false);
        }
      });
    }
  }
}
