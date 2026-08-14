import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserRowActionsComponent, UserAction } from '../user-row-actions/user-row-actions.component';
import type { User } from '../../../../../../shared/models/user.model';
import { EmptyStateComponent } from '../../../../shared/empty-state.component';

export interface UserTableActionEvent {
  action: UserAction;
  user: User;
}

/**
 * Composant table pour la liste des utilisateurs.
 * Gère l'affichage, le tri et la pagination.
 */
@Component({
  selector: 'app-user-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    UserRowActionsComponent
  ,
    EmptyStateComponent],
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.scss'
})
export class UserTableComponent {
  readonly users = input.required<User[]>();
  readonly loading = input<boolean>(false);
  readonly totalUsers = input<number>(0);
  readonly pageSize = input<number>(20);
  readonly canWrite = input<boolean>(false);
  readonly canDelete = input<boolean>(false);
  readonly canCreate = input<boolean>(false);

  readonly sortChange = output<Sort>();
  readonly pageChange = output<PageEvent>();
  readonly toggleActive = output<User>();
  readonly actionTriggered = output<UserTableActionEvent>();
  readonly createClicked = output<void>();

  readonly displayedColumns = ['email', 'role', 'actif', 'createdAt', 'actions'];

  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  onToggleActive(user: User): void {
    this.toggleActive.emit(user);
  }

  onRowAction(event: { action: UserAction; user: User }): void {
    this.actionTriggered.emit(event);
  }

  onCreateClicked(): void {
    this.createClicked.emit();
  }

  /**
   * Retourne la couleur du chip pour un rôle donné
   */
  getRoleColor(roleName: string): 'primary' | 'accent' | 'warn' | undefined {
    const lowerName = roleName.toLowerCase();
    if (lowerName.includes('admin')) return 'warn';
    if (lowerName.includes('manager')) return 'accent';
    return 'primary';
  }

  /**
   * TrackBy pour optimiser le rendu de la liste
   */
  trackByUser(index: number, user: User): number {
    return user.id;
  }
}
