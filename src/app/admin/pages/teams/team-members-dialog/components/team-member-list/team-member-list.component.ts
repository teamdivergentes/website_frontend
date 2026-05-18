import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeamMember } from '../../../../../../shared/models';
import { TeamMemberRowComponent } from '../team-member-row/team-member-row.component';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../../../../shared/utils/a11y-announce';

/**
 * Liste editable des membres d'une equipe avec drag & drop pour reordonner.
 * Accessible au clavier via les boutons Monter / Descendre (WCAG 2.1.1).
 */
@Component({
  selector: 'app-team-member-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule, TeamMemberRowComponent, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './team-member-list.component.html',
  styleUrl: './team-member-list.component.scss'
})
export class TeamMemberListComponent {
  readonly members = input.required<TeamMember[]>();

  readonly editMember = output<TeamMember>();
  readonly deleteMember = output<TeamMember>();
  readonly dropped = output<CdkDragDrop<TeamMember[]>>();
  /** Emis quand un bouton monter/descendre est clique. */
  readonly reorderRequest = output<{ fromIndex: number; toIndex: number }>();

  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');
  /** Guard anti-double-clic : bloque les emissions concurrentes (SEC-PR206-001). */
  protected readonly reordering = signal(false);

  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    this.dropped.emit(event);
  }

  onEdit(member: TeamMember): void {
    this.editMember.emit(member);
  }

  onDelete(member: TeamMember): void {
    this.deleteMember.emit(member);
  }

  /**
   * Appele par les boutons Monter / Descendre.
   * Emet `reorderRequest` puis met a jour liveMessage si le parent confirme via `setLiveMessage`.
   */
  moveUp(index: number): void {
    if (index <= 0) return;
    if (this.reordering()) return;
    this.reordering.set(true);
    this.reorderRequest.emit({ fromIndex: index, toIndex: index - 1 });
  }

  moveDown(index: number): void {
    const list = this.members();
    if (index >= list.length - 1) return;
    if (this.reordering()) return;
    this.reordering.set(true);
    this.reorderRequest.emit({ fromIndex: index, toIndex: index + 1 });
  }

  /** Remet le guard reordering a false ; appele par le parent via finalize (SEC-PR206-001). */
  resetReordering(): void {
    this.reordering.set(false);
  }

  /** Appele par le parent apres reorder reussi pour announcer la nouvelle position. */
  setLiveMessage(name: string, newPosition: number, total: number): void {
    this.liveMessage.set(buildReorderMessage(name, newPosition, total));
  }

  /** Appele par le parent apres une erreur API de reorder. */
  setErrorMessage(name: string): void {
    this.liveMessage.set(buildReorderErrorMessage(name));
  }
}
