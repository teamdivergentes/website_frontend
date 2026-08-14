import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TeamMember } from '../../../../../../shared/models';
import { TeamMemberRowComponent } from '../team-member-row/team-member-row.component';
import { EmptyStateComponent } from '../../../../../shared/empty-state.component';

/**
 * Liste editable des membres d'une equipe avec drag & drop pour reordonner.
 * Accessible au clavier par les boutons Monter / Descendre et par la poignee
 * en grab & move ARIA (WCAG 2.1.1).
 *
 * Ce composant ne porte plus d'etat de reordonnancement : la garde de
 * concurrence, l'annonce accessible et le deplacement au clavier vivent dans
 * `createReorder()`, cote page. Il n'emet plus que des intentions.
 */
@Component({
  selector: 'app-team-member-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule, TeamMemberRowComponent, MatButtonModule, MatIconModule, MatTooltipModule,
    EmptyStateComponent],
  templateUrl: './team-member-list.component.html',
  styleUrl: './team-member-list.component.scss'
})
export class TeamMemberListComponent {
  readonly members = input.required<TeamMember[]>();
  /** Vrai pendant la persistance d'un ordre : desactive les fleches. */
  readonly reordering = input<boolean>(false);
  /** Index de la ligne saisie au clavier, `-1` si aucune. */
  readonly grabbedIndex = input<number>(-1);

  readonly editMember = output<TeamMember>();
  readonly deleteMember = output<TeamMember>();
  readonly dropped = output<CdkDragDrop<TeamMember[]>>();
  /** Emis quand un bouton Monter / Descendre est clique. */
  readonly reorderRequest = output<{ fromIndex: number; toIndex: number }>();
  /** Touche pressee sur une poignee ; la page arbitre le grab & move. */
  readonly handleKeydown = output<{ event: KeyboardEvent; index: number }>();

  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    this.dropped.emit(event);
  }

  onEdit(member: TeamMember): void {
    this.editMember.emit(member);
  }

  onDelete(member: TeamMember): void {
    this.deleteMember.emit(member);
  }

  /** Appele par le bouton Monter ; les bornes restent verifiees ici. */
  moveUp(index: number): void {
    if (index <= 0) return;
    this.reorderRequest.emit({ fromIndex: index, toIndex: index - 1 });
  }

  moveDown(index: number): void {
    if (index >= this.members().length - 1) return;
    this.reorderRequest.emit({ fromIndex: index, toIndex: index + 1 });
  }

  onHandleKeydown(event: KeyboardEvent, index: number): void {
    this.handleKeydown.emit({ event, index });
  }
}
