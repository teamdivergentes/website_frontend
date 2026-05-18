import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TeamsService } from '../../../shared/services';
import { Team, TeamMember, CreateMemberDto, UpdateMemberDto } from '../../../shared/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { TeamMemberFormComponent, MemberSaveEvent } from './team-members-dialog/components/team-member-form/team-member-form.component';
import { TeamMemberListComponent } from './team-members-dialog/components/team-member-list/team-member-list.component';

interface DialogData {
  team: Team;
}

/**
 * Dialog d'orchestration pour la gestion des membres d'une equipe.
 * Delegue le formulaire a TeamMemberFormComponent et la liste a TeamMemberListComponent.
 */
@Component({
  selector: 'app-team-members-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    TeamMemberFormComponent,
    TeamMemberListComponent
  ],
  template: `
    <h2 mat-dialog-title>Membres de {{ team.name }}</h2>

    <mat-dialog-content>
      <app-team-member-form
        [editingMember]="editingMember()"
        [saving]="saving()"
        [error]="error()"
        (memberSaved)="onMemberSaved($event)"
        (editCancelled)="onEditCancelled()"
      />

      <app-team-member-list
        #memberList
        [members]="members()"
        (editMember)="startEdit($event)"
        (deleteMember)="confirmDelete($event)"
        (dropped)="onDrop($event)"
        (reorderRequest)="onReorderRequest($event)"
      />
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: min(1000px, 90vw);
      max-height: 80vh;
      padding: 1.5rem !important;
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2rem;
      overflow-y: auto;
    }

    @media (max-width: 1100px) {
      mat-dialog-content {
        grid-template-columns: 1fr;
        min-width: auto;
      }
    }
  `]
})
export class TeamMembersDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<TeamMembersDialogComponent>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly teamsService = inject(TeamsService);
  private readonly dialog = inject(MatDialog);

  /** Reference au composant enfant pour pouvoir appeler setLiveMessage / setErrorMessage */
  readonly memberListRef = viewChild<TeamMemberListComponent>('memberList');

  readonly team: Team = this.data.team;
  readonly members = signal<TeamMember[]>([]);
  readonly editingMember = signal<TeamMember | undefined>(undefined);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.teamsService.getTeamBySlug(this.team.slug).subscribe({
      next: (team) => {
        this.members.set(team.members.sort((a, b) => a.position - b.position));
      },
      error: (err: unknown) => {
        console.error('Load members error:', err);
        this.error.set('Erreur lors du chargement des membres');
      }
    });
  }

  onMemberSaved(event: MemberSaveEvent): void {
    this.saving.set(true);
    this.error.set(undefined);

    const request$ = event.editingMember
      ? this.teamsService.updateMember(this.team.id, event.editingMember.id, event.data as UpdateMemberDto)
      : this.teamsService.addMember(this.team.id, event.data as CreateMemberDto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingMember.set(undefined);
        this.loadMembers();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        console.error('Save member error:', err);
      }
    });
  }

  onEditCancelled(): void {
    this.editingMember.set(undefined);
  }

  startEdit(member: TeamMember): void {
    this.editingMember.set(member);
  }

  confirmDelete(member: TeamMember): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer ${member.name} ?`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.teamsService.deleteMember(this.team.id, member.id).subscribe({
        next: () => this.loadMembers(),
        error: (err: unknown) => {
          this.error.set('Erreur lors de la suppression');
          console.error('Delete member error:', err);
        }
      });
    });
  }

  /**
   * Reorder declenche par drag-drop CDK.
   */
  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.onReorder(event.previousIndex, event.currentIndex);
  }

  /**
   * Reorder declenche par les boutons Monter / Descendre.
   */
  onReorderRequest(event: { fromIndex: number; toIndex: number }): void {
    this.onReorder(event.fromIndex, event.toIndex);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;

    const members = [...this.members()];
    moveItemInArray(members, fromIndex, toIndex);
    this.members.set(members);

    const movedMember = members[toIndex];
    const reorderData = members.map((member, index) => ({ id: member.id, position: index }));

    this.teamsService.reorderMembers(this.team.id, reorderData).subscribe({
      next: () => {
        const listRef = this.memberListRef();
        if (listRef && movedMember) {
          listRef.setLiveMessage(movedMember.name, toIndex + 1, members.length);
        }
      },
      error: (err: unknown) => {
        this.error.set('Erreur lors de la reorganisation');
        console.error('Reorder error:', err);
        const listRef = this.memberListRef();
        if (listRef && movedMember) {
          listRef.setErrorMessage(movedMember.name);
        }
        this.loadMembers();
      }
    });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
