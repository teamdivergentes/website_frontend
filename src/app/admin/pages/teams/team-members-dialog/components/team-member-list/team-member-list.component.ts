import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TeamMember } from '../../../../../../shared/models';
import { TeamMemberRowComponent } from '../team-member-row/team-member-row.component';
import { MatIconModule } from '@angular/material/icon';

/**
 * Liste éditable des membres d'une équipe avec drag & drop pour réordonner.
 */
@Component({
  selector: 'app-team-member-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule, TeamMemberRowComponent, MatIconModule],
  templateUrl: './team-member-list.component.html',
  styleUrl: './team-member-list.component.scss'
})
export class TeamMemberListComponent {
  readonly members = input.required<TeamMember[]>();

  readonly editMember = output<TeamMember>();
  readonly deleteMember = output<TeamMember>();
  readonly dropped = output<CdkDragDrop<TeamMember[]>>();

  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    this.dropped.emit(event);
  }

  onEdit(member: TeamMember): void {
    this.editMember.emit(member);
  }

  onDelete(member: TeamMember): void {
    this.deleteMember.emit(member);
  }
}
