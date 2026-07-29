import { ChangeDetectionStrategy, Component, OnInit, Type, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { environment } from '../../../../environments/environment';
import { UsersService } from '../../../../shared/services/api/users.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { UserFormDialogComponent } from './user-form-dialog.component';
import { RoleDialogComponent } from './role-dialog.component';
import { PasswordDialogComponent } from './password-dialog.component';
import { UserFiltersComponent, UserFiltersValue } from './components/user-filters/user-filters.component';
import { UserTableComponent, UserTableActionEvent } from './components/user-table/user-table.component';
import type { User, UserSearchParams } from '../../../../shared/models/user.model';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { AdminDialogService } from '../../shared/admin-dialog.service';

/**
 * Page d'administration des utilisateurs.
 * Orchestre les composants de filtres et de table.
 */
@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    UserFiltersComponent,
    UserTableComponent,
    ErrorStateComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);

  readonly users = signal<User[]>([]);
  readonly loading = signal<boolean>(false);
  /** Erreur de chargement persistante, exclusive de l'etat vide (EPIC-41). */
  readonly error = signal<string | null>(null);
  readonly totalUsers = signal<number>(0);
  readonly pageSize = signal<number>(20);

  private currentPage = 1;
  private sortBy: 'email' | 'createdAt' | 'updatedAt' = 'createdAt';
  private sortOrder: 'asc' | 'desc' = 'desc';
  private currentFilters: UserFiltersValue = { search: null, roleId: null, actif: null };

  ngOnInit(): void {
    this.loadUsers();
  }

  onFiltersChange(filters: UserFiltersValue): void {
    this.currentFilters = filters;
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.active && sort.direction ? (sort.active as 'email' | 'createdAt' | 'updatedAt') : 'createdAt';
    this.sortOrder = sort.direction ? (sort.direction as 'asc' | 'desc') : 'desc';
    this.loadUsers();
  }

  onTableAction(event: UserTableActionEvent): void {
    const actions: Record<string, () => void> = {
      edit: () => this.openFormDialog(event.user, 'edit'),
      changeRole: () => this.openSimpleDialog(RoleDialogComponent, event.user, 'Rôle modifié'),
      resetPassword: () => this.openSimpleDialog(PasswordDialogComponent, event.user, 'Mot de passe réinitialisé', false),
      delete: () => this.confirmDelete(event.user)
    };
    actions[event.action]?.();
  }

  onToggleActive(user: User): void {
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

  openCreateDialog(): void {
    this.openFormDialog(undefined, 'create');
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: UserSearchParams = {
      page: this.currentPage,
      limit: this.pageSize(),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };
    if (this.currentFilters.search) params.search = this.currentFilters.search;
    if (this.currentFilters.roleId !== null) params.roleId = this.currentFilters.roleId;
    if (this.currentFilters.actif !== null) params.actif = this.currentFilters.actif;

    this.usersService.getUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalUsers.set(response.meta.total);
        this.loading.set(false);
      },
      error: (err) => {
        if (!environment.production) {
          console.error('Load users error:', err);
        }
        // Pas de snackbar : il disparaissait en laissant "Aucun resultat pour
        // cette recherche" a l'ecran, ce qui laissait croire a une base vide.
        this.error.set('Impossible de charger les utilisateurs.');
        this.loading.set(false);
      }
    });
  }

  private openFormDialog(user: User | undefined, mode: 'create' | 'edit'): void {
    this.adminDialog
      .open(UserFormDialogComponent, 'md', user ? { user } : {})
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.loadUsers();
          this.notifier.saved('Compte', mode);
        }
      });
  }

  private openSimpleDialog(
    component: Type<unknown>,
    user: User,
    successMessage: string,
    reloadOnSuccess = true
  ): void {
    this.adminDialog
      .open(component, 'sm', { user })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          if (reloadOnSuccess) this.loadUsers();
          this.notifier.success(successMessage);
        }
      });
  }

  private confirmDelete(user: User): void {
    this.confirm.delete('le compte', user.email).subscribe(confirmed => {
      if (!confirmed) return;
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.notifier.deleted('Compte');
        },
        error: (err) => {
          if (!environment.production) {
            console.error('Delete error:', err);
          }
          this.notifier.error('Erreur lors de la suppression du compte');
        }
      });
    });
  }
}
