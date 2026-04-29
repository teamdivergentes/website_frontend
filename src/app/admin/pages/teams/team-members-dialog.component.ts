import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
 * Dialog d'orchestration pour la gestion des membres d'une équipe.
 * Délègue le formulaire à TeamMemberFormComponent et la liste à TeamMemberListComponent.
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
        [members]="members()"
        (editMember)="startEdit($event)"
        (deleteMember)="confirmDelete($event)"
        (dropped)="onDrop($event)"
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

  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    const members = [...this.members()];
    moveItemInArray(members, event.previousIndex, event.currentIndex);

    const reorderData = members.map((member, index) => ({ id: member.id, position: index }));

    this.teamsService.reorderMembers(this.team.id, reorderData).subscribe({
      next: () => this.members.set(members),
      error: (err: unknown) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadMembers();
      }
    });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
