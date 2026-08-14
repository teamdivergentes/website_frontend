import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TeamMember } from '../../../../../../shared/models';

/**
 * Ligne unique d'un membre d'équipe avec poignée de drag & drop et actions.
 */
@Component({
  selector: 'app-team-member-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './team-member-row.component.html',
  styleUrl: './team-member-row.component.scss'
})
export class TeamMemberRowComponent {
  readonly member = input.required<TeamMember>();

  readonly editClicked = output<TeamMember>();
  readonly deleteClicked = output<TeamMember>();

  onEdit(): void {
    this.editClicked.emit(this.member());
  }

  onDelete(): void {
    this.deleteClicked.emit(this.member());
  }
}
