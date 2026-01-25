import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime } from 'rxjs';
import { UsersService } from '../../../../shared/services/api/users.service';
import { RolesService } from '../../../../shared/services/api/roles.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { RoleDialogComponent } from './role-dialog.component';
import { PasswordDialogComponent } from './password-dialog.component';
import type { User, UserSearchParams, Role } from '../../../../shared/models/user.model';

/**
 * Page d'administration des utilisateurs
 * Gestion CRUD complète avec pagination, filtres et permissions
 */
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="users-admin-page">
      <div class="page-header">
        <h1>Gestion des Utilisateurs</h1>
        @if (hasPermission('users:write')) {
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Nouvel utilisateur
          </button>
        }
      </div>

      <!-- Filtres -->
      <div class="filters-bar">
        <mat-form-field appearance="outline">
          <mat-label>Rechercher</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Email..." />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rôle</mat-label>
          <mat-select [formControl]="roleFilterControl">
            <mat-option [value]="null">Tous</mat-option>
            @for (role of availableRoles(); track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Statut</mat-label>
          <mat-select [formControl]="statusFilterControl">
            <mat-option [value]="null">Tous</mat-option>
            <mat-option [value]="true">Actif</mat-option>
            <mat-option [value]="false">Inactif</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="table-container">
        @if (loading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        }

        <table mat-table [dataSource]="users()" matSort (matSortChange)="onSort($event)">

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [color]="getRoleColor(user.role.name)">
                {{ user.role.name }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="actif">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
            <td mat-cell *matCellDef="let user">
              <mat-slide-toggle
                [checked]="user.actif"
                [disabled]="!hasPermission('users:write')"
                (change)="toggleActive(user)">
              </mat-slide-toggle>
            </td>
          </ng-container>

          <!-- Created Column -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Créé le</th>
            <td mat-cell *matCellDef="let user">
              {{ user.createdAt | date:'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                @if (hasPermission('users:write')) {
                  <button mat-menu-item (click)="openEditDialog(user)">
                    <mat-icon>edit</mat-icon>
                    <span>Modifier</span>
                  </button>
                }
                @if (hasPermission('users:write')) {
                  <button mat-menu-item (click)="openRoleDialog(user)">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>Changer rôle</span>
                  </button>
                }
                @if (hasPermission('users:write')) {
                  <button mat-menu-item (click)="openPasswordDialog(user)">
                    <mat-icon>vpn_key</mat-icon>
                    <span>Réinitialiser MDP</span>
                  </button>
                }
                @if (hasPermission('users:delete')) {
                  <button mat-menu-item (click)="confirmDelete(user)" class="danger">
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

        @if (users().length === 0 && !loading()) {
          <div class="empty-state">
            <p>Aucun utilisateur trouvé</p>
          </div>
        }
      </div>

      <!-- Pagination -->
      <mat-paginator
        [length]="totalUsers()"
        [pageSize]="pageSize()"
        [pageSizeOptions]="[10, 20, 50, 100]"
        (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .users-admin-page {
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        color: var(--white, #fff);
      }
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;

      mat-form-field {
        min-width: 200px;
      }
    }

    .table-container {
      position: relative;
      background: var(--card-bg, #1e1e1e);
      border-radius: 8px;
      border: 1px solid var(--border, #333);
      overflow: hidden;

      table {
        width: 100%;

        th {
          background: var(--bg-dark, #121212);
          color: var(--white, #fff);
          font-weight: 600;
        }

        td, th {
          padding: 1rem;
          border-bottom: 1px solid var(--border, #333);
        }

        td {
          color: var(--gray, #999);
        }

        tr:hover {
          background: rgba(50, 210, 153, 0.05);
        }
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--gray, #999);
      }
    }

    mat-paginator {
      background: var(--card-bg, #1e1e1e);
      border-radius: 0 0 8px 8px;
      color: var(--white, #fff);
    }

    .danger {
      color: #f44336;
    }
  `]
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // State management
  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalUsers = signal<number>(0);
  readonly pageSize = signal<number>(20);
  readonly currentPage = signal<number>(1);
  readonly sortBy = signal<'email' | 'createdAt' | 'updatedAt'>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  // Filters
  readonly searchControl = new FormControl('');
  readonly roleFilterControl = new FormControl<number | null>(null);
  readonly statusFilterControl = new FormControl<boolean | null>(null);

  // Available roles (will be loaded from RolesService when implemented)
  readonly availableRoles = signal<Array<{ id: number; name: string }>>([]);

  // Table configuration
  readonly displayedColumns = ['email', 'role', 'actif', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.setupFilters();
    this.loadUsers();
    this.loadRoles();
  }

  /**
   * Charge les rôles disponibles
   */
  private loadRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (roles) => this.availableRoles.set(roles),
      error: (err) => console.error('Load roles error:', err)
    });
  }

  /**
   * Configure les filtres avec debounce pour la recherche
   */
  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadUsers();
      });

    this.roleFilterControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadUsers();
    });

    this.statusFilterControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  /**
   * Charge les utilisateurs depuis l'API
   */
  loadUsers(): void {
    this.loading.set(true);

    const params: UserSearchParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder()
    };

    const search = this.searchControl.value;
    if (search) params.search = search;

    const roleId = this.roleFilterControl.value;
    if (roleId !== null) params.roleId = roleId;

    const actif = this.statusFilterControl.value;
    if (actif !== null) params.actif = actif;

    this.usersService.getUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalUsers.set(response.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Load users error:', err);
        this.snackBar.open('Erreur lors du chargement des utilisateurs', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  /**
   * Gère le changement de page
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  /**
   * Gère le tri
   */
  onSort(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sortBy.set('createdAt');
      this.sortOrder.set('desc');
    } else {
      this.sortBy.set(sort.active as 'email' | 'createdAt' | 'updatedAt');
      this.sortOrder.set(sort.direction as 'asc' | 'desc');
    }
    this.loadUsers();
  }

  /**
   * Active/désactive un utilisateur
   */
  toggleActive(user: User): void {
    this.usersService.toggleActive(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.snackBar.open(`Utilisateur ${user.actif ? 'désactivé' : 'activé'}`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error('Toggle error:', err);
        this.snackBar.open('Erreur lors du changement de statut', 'OK', { duration: 3000 });
      }
    });
  }

  /**
   * Ouvre le dialog de création d'utilisateur
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Utilisateur créé avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Ouvre le dialog d'édition d'utilisateur
   */
  openEditDialog(user: User): void {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      maxHeight: '90vh',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Utilisateur modifié avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Ouvre le dialog de changement de rôle
   */
  openRoleDialog(user: User): void {
    const dialogRef = this.dialog.open(RoleDialogComponent, {
      width: '450px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('Rôle modifié avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Ouvre le dialog de réinitialisation de mot de passe
   */
  openPasswordDialog(user: User): void {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '450px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Mot de passe réinitialisé avec succès', 'OK', { duration: 2000 });
      }
    });
  }

  /**
   * Supprime un utilisateur avec confirmation
   */
  confirmDelete(user: User): void {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.email} ?`)) {
      return;
    }

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.snackBar.open('Utilisateur supprimé', 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error('Delete error:', err);
        this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
      }
    });
  }

  /**
   * Vérifie si l'utilisateur a une permission
   */
  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  /**
   * Retourne la couleur du chip pour un rôle
   */
  getRoleColor(roleName: string): 'primary' | 'accent' | 'warn' | undefined {
    const lowerName = roleName.toLowerCase();
    if (lowerName.includes('admin')) return 'warn';
    if (lowerName.includes('manager')) return 'accent';
    return 'primary';
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByUser(index: number, user: User): number {
    return user.id;
  }
}
