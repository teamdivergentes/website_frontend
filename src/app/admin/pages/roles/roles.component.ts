import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { RolesService } from '../../../../shared/services/api/roles.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { RoleFormDialogComponent } from './role-form-dialog.component';
import type { Role } from '../../../../shared/models/user.model';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

/**
 * Page d'administration des rôles
 * Gestion CRUD complète avec permissions
 */
@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ErrorStateComponent
  ,
    EmptyStateComponent,
    PageHeaderComponent],
  template: `
    <div class="roles-admin-page">
      <app-page-header title="Gestion des Rôles">
        @if (hasPermission('roles:write')) {
          <button actions mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Nouveau rôle
          </button>
        }
      </app-page-header>

      @if (error()) {
        <app-error-state
          [message]="error()!"
          [retrying]="loading()"
          (retry)="retryLoad()"
        />
      } @else {
      <!-- Table -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }

        <table mat-table [dataSource]="roles()">

          <!-- Nom Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let role">
              <div class="role-name">
                {{ role.name }}
                @if (role.isSystem) {
                  <mat-chip class="system-badge" [matTooltip]="'Rôle système non supprimable'">
                    Système
                  </mat-chip>
                }
              </div>
            </td>
          </ng-container>

          <!-- Permissions Column -->
          <ng-container matColumnDef="permissions">
            <th mat-header-cell *matHeaderCellDef>Permissions</th>
            <td mat-cell *matCellDef="let role">
              <div class="permissions-chips">
                @for (permission of role.permissions.slice(0, 3); track permission) {
                  <mat-chip>{{ permission }}</mat-chip>
                }
                @if (role.permissions.length > 3) {
                  <mat-chip class="more-chip" [matTooltip]="getRemainingPermissions(role)">
                    +{{ role.permissions.length - 3 }}
                  </mat-chip>
                }
              </div>
            </td>
          </ng-container>

          <!-- Utilisateurs Count Column -->
          <ng-container matColumnDef="users">
            <th mat-header-cell *matHeaderCellDef>Utilisateurs</th>
            <td mat-cell *matCellDef="let role">
              {{ role._count?.users ?? 0 }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let role">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                @if (hasPermission('roles:write')) {
                  <button mat-menu-item (click)="openEditDialog(role)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                }
                @if (hasPermission('roles:delete') && !role.isSystem) {
                  <button mat-menu-item (click)="confirmDelete(role)" class="danger">
                    <mat-icon color="warn">delete</mat-icon>
                    <span>Supprimer</span>
                  </button>
                }
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (roles().length === 0 && !loading()) {
          <app-empty-state
            entity="rôle"
            icon="shield"
            [actionLabel]="hasPermission('roles:write') ? 'Créer un rôle' : ''"
            actionIcon="add_moderator"
            (action)="openCreateDialog()"
          />
        }
      </div>
      }
    </div>
  `,
  styles: [`
    

    .role-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .system-badge {
      font-size: 0.75rem;
      min-height: 20px;
      padding: 2px 8px;
      background: rgba(255, 152, 0, 0.15);
      color: #ff9800;
    }

    .permissions-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      mat-chip {
        font-size: 0.75rem;
        min-height: 24px;
        padding: 2px 8px;
      }

      .more-chip {
        background: rgba(50, 210, 153, 0.15);
        color: var(--green, #32d299);
      }
    }

    .danger {
      color: #ef5350;
    }

    @media (max-width: 768px) {
      .table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      :host ::ng-deep .mat-column-permissions {
        display: none;
      }

      :host ::ng-deep .mat-column-users {
        display: none;
      }
    }
  `]
})
export class RolesComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);

  // State management
  readonly roles = signal<Role[]>([]);
  /** Erreur de chargement persistante. Exclusive de l'etat vide : voir EPIC-41. */
  readonly error = signal<string | null>(null);
  readonly loading = signal<boolean>(false);

  // Table configuration
  readonly displayedColumns = ['name', 'permissions', 'users', 'actions'];

  ngOnInit(): void {
    this.loadRoles();
  }

  /**
   * Charge les rôles depuis l'API
   */
  loadRoles(): void {
    this.loading.set(true);
    this.error.set(null);

    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        if (!environment.production) {
          console.error('Load roles error:', err);
        }
        // Pas de snackbar : il disparaissait au bout de 3 s en laissant
        // "Aucun role cree" a l'ecran, ce qui laissait croire a une base vide.
        this.error.set('Impossible de charger les rôles.');
        this.loading.set(false);
      }
    });
  }

  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadRoles();
  }

  /**
   * Ouvre le dialog de création de rôle
   */
  openCreateDialog(): void {
    const dialogRef = this.adminDialog.open(RoleFormDialogComponent, 'lg');

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles();
        this.snackBar.open('Rôle créé avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Ouvre le dialog d'édition de rôle
   */
  openEditDialog(role: Role): void {
    const dialogRef = this.adminDialog.open(RoleFormDialogComponent, 'lg', { role });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRoles();
        this.snackBar.open('Rôle modifié avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Supprime un rôle avec confirmation
   */
  confirmDelete(role: Role): void {
    const userCount = role._count?.users ?? 0;

    if (userCount > 0) {
      this.snackBar.open(
        `Impossible de supprimer ce rôle, ${userCount} utilisateur(s) l'utilisent`,
        'OK',
        { duration: 4000 }
      );
      return;
    }

    this.confirm.delete('le rôle', role.name).subscribe(confirmed => {
      if (!confirmed) return;

      this.rolesService.deleteRole(role.id).subscribe({
        next: () => {
          this.loadRoles();
          this.snackBar.open('Rôle supprimé', 'OK', { duration: 2000 });
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
        }
      });
    });
  }

  /**
   * Vérifie si l'utilisateur a une permission
   */
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  /**
   * Retourne les permissions restantes pour le tooltip
   */
  getRemainingPermissions(role: Role): string {
    return role.permissions.slice(3).join(', ');
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByRole(_: number, role: Role): number {
    return role.id;
  }
}
