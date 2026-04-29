import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import type { User } from '../../../../../../shared/models/user.model';

export type UserAction = 'edit' | 'changeRole' | 'resetPassword' | 'delete';

/**
 * Composant d'actions par ligne pour la table des utilisateurs.
 * Affiche un menu contextuel avec les actions disponibles selon les permissions.
 */
@Component({
  selector: 'app-user-row-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './user-row-actions.component.html',
  styleUrl: './user-row-actions.component.scss'
})
export class UserRowActionsComponent {
  readonly user = input.required<User>();
  readonly canWrite = input<boolean>(false);
  readonly canDelete = input<boolean>(false);

  readonly actionTriggered = output<{ action: UserAction; user: User }>();

  onEdit(): void {
    this.actionTriggered.emit({ action: 'edit', user: this.user() });
  }

  onChangeRole(): void {
    this.actionTriggered.emit({ action: 'changeRole', user: this.user() });
  }

  onResetPassword(): void {
    this.actionTriggered.emit({ action: 'resetPassword', user: this.user() });
  }

  onDelete(): void {
    this.actionTriggered.emit({ action: 'delete', user: this.user() });
  }
}
