import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { TeamsService } from '../../../shared/services';
import { Team, TeamMember, CreateMemberDto, UpdateMemberDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

interface DialogData {
  team: Team;
}

/**
 * Dialog pour gérer les membres d'une équipe
 */
@Component({
  selector: 'app-team-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>Membres de {{ team.name }}</h2>

    <mat-dialog-content>
      <!-- Formulaire d'ajout/édition -->
      <div class="member-form">
        <h3>{{ editingMember() ? 'Modifier' : 'Ajouter' }} un membre</h3>
        <form [formGroup]="memberForm">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Pseudo</mat-label>
              <input matInput formControlName="name" required />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nom réel</mat-label>
              <input matInput formControlName="realName" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Rôle</mat-label>
            <input matInput formControlName="role" required />
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nationalité</mat-label>
              <input matInput formControlName="nationality" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date de naissance</mat-label>
              <input matInput formControlName="birthDate" type="date" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Biographie</mat-label>
            <textarea matInput formControlName="biography" rows="4"></textarea>
          </mat-form-field>

          <div class="image-field">
            <label>Photo du membre</label>
            <app-image-upload
              [currentImage]="memberForm.get('image')?.value"
              description="Photo du joueur. Un format carré est recommandé."
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()"
            />
          </div>

          <mat-expansion-panel class="social-panel" [expanded]="hasSocialLinks()">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Réseaux sociaux
                @if (socialLinkCount(); as count) {
                  <span class="social-badge">{{ count }}</span>
                }
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Twitter</mat-label>
                <input matInput formControlName="twitter" type="url" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Twitch</mat-label>
                <input matInput formControlName="twitch" type="url" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Instagram</mat-label>
                <input matInput formControlName="instagram" type="url" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>YouTube</mat-label>
                <input matInput formControlName="youtube" type="url" />
              </mat-form-field>
            </div>
          </mat-expansion-panel>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <div class="form-actions">
            @if (editingMember()) {
              <button mat-button type="button" (click)="cancelEdit()">Annuler</button>
            }
            <button mat-raised-button color="primary" type="button" (click)="saveMember()" [disabled]="!memberForm.valid || saving()">
              {{ saving() ? 'Enregistrement...' : (editingMember() ? 'Mettre à jour' : 'Ajouter') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Liste des membres -->
      <div class="members-list">
        <h3>Membres actuels ({{ members().length }})</h3>

        @if (members().length === 0) {
          <p class="empty-state">Aucun membre dans cette équipe.</p>
        } @else {
          <div cdkDropList (cdkDropListDropped)="onDrop($event)">
            @for (member of members(); track member.id) {
              <div class="member-item" cdkDrag>
                <div class="drag-handle" cdkDragHandle>
                  <mat-icon>drag_indicator</mat-icon>
                </div>

                @if (member.image) {
                  <img [src]="member.image" [alt]="member.name" class="member-image" />
                } @else {
                  <div class="member-image no-image">
                    <mat-icon>person</mat-icon>
                  </div>
                }

                <div class="member-info">
                  <strong>{{ member.name }}</strong>
                  @if (member.realName) {
                    <span class="real-name">{{ member.realName }}</span>
                  }
                  <span class="role">{{ member.role }}</span>
                </div>

                <div class="member-actions">
                  <button mat-icon-button (click)="editMember(member)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteMember(member)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
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

    .member-form {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
      height: fit-content;

      h3 {
        margin: 0 0 1rem 0;
        color: var(--white, #fff);
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;

        mat-form-field {
          width: 100%;
        }
      }

      .full-width {
        width: 100%;
      }

      .image-field {
        margin: 1rem 0;
        max-width: 180px;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--gray, #999);
          font-size: 0.875rem;
        }

        app-image-upload {
          display: block;
          width: 180px;
          height: 180px;

          ::ng-deep {
            .image-upload-container, .drop-zone {
              width: 180px;
              height: 180px;
              min-height: unset;
            }

            .drop-zone.has-image {
              height: 180px;
            }

            .image-preview img {
              width: 180px;
              height: 180px;
              object-fit: cover;
            }

            .placeholder {
              padding: 1rem;

              svg { width: 32px; height: 32px; }
              .title { font-size: 0.8125rem; }
              .subtitle { font-size: 0.75rem; }
            }
          }
        }
      }

      .social-panel {
        margin: 1rem 0;
        background: transparent;
        border: 1px solid var(--darkGreen, #28413b);
        border-radius: 8px;
        box-shadow: none;

        .social-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          margin-left: 8px;
          border-radius: 10px;
          background: var(--green, #32D299);
          color: var(--black, #101111);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;

          mat-form-field {
            width: 100%;
          }
        }
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .error-message {
        padding: 0.75rem;
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
        border-radius: 4px;
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
    }

    .members-list {
      max-height: 80vh;
      overflow-y: auto;

      h3 {
        margin: 0 0 1rem 0;
        color: var(--white, #fff);
        position: sticky;
        top: 0;
        background: var(--darkBackground, #0C0D0C);
        padding: 0.5rem 0;
        z-index: 1;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--gray, #999);
      }

      .member-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: var(--lightBlack, #101111);
        border-radius: 8px;
        border: 1px solid var(--darkGreen, #28413B);
        margin-bottom: 0.5rem;
        transition: all 0.2s;

        &:hover {
          border-color: var(--primary, #32D299);
        }

        .drag-handle {
          cursor: move;
          color: var(--gray, #999);
        }

        .member-image {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;

          &.no-image {
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--darkBackground, #0C0D0C);
            color: var(--gray, #999);
          }
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          strong {
            color: var(--white, #fff);
          }

          .real-name {
            color: var(--gray, #999);
            font-size: 0.875rem;
          }

          .role {
            color: var(--primary, #32D299);
            font-size: 0.75rem;
            text-transform: uppercase;
          }
        }

        .member-actions {
          display: flex;
          gap: 0.25rem;
        }
      }

      .cdk-drag-preview {
        opacity: 0.8;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    }
  `]
})
export class TeamMembersDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TeamMembersDialogComponent>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly teamsService = inject(TeamsService);
  private readonly dialog = inject(MatDialog);

  readonly team: Team = this.data.team;
  readonly memberForm: FormGroup;
  readonly members = signal<TeamMember[]>([]);
  readonly editingMember = signal<TeamMember | undefined>(undefined);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  constructor() {
    this.memberForm = this.fb.group({
      name: ['', Validators.required],
      realName: [''],
      role: ['', Validators.required],
      image: [''],
      nationality: [''],
      birthDate: [''],
      biography: [''],
      twitter: [''],
      twitch: [''],
      instagram: [''],
      youtube: ['']
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  private loadMembers(): void {
    this.teamsService.getTeamBySlug(this.team.slug).subscribe({
      next: (team) => {
        this.members.set(team.members.sort((a, b) => a.position - b.position));
      },
      error: (err) => {
        console.error('Load members error:', err);
        this.error.set('Erreur lors du chargement des membres');
      }
    });
  }

  saveMember(): void {
    if (!this.memberForm.valid) return;

    this.saving.set(true);
    this.error.set(undefined);

    const formValue = this.memberForm.value;
    const memberData: CreateMemberDto | UpdateMemberDto = {
      name: formValue.name,
      realName: formValue.realName || undefined,
      role: formValue.role,
      image: formValue.image || undefined,
      nationality: formValue.nationality || undefined,
      birthDate: formValue.birthDate || undefined,
      biography: formValue.biography || undefined,
      socials: {
        twitter: formValue.twitter || undefined,
        twitch: formValue.twitch || undefined,
        instagram: formValue.instagram || undefined,
        youtube: formValue.youtube || undefined
      }
    };

    const request$ = this.editingMember()
      ? this.teamsService.updateMember(this.team.id, this.editingMember()!.id, memberData as UpdateMemberDto)
      : this.teamsService.addMember(this.team.id, memberData as CreateMemberDto);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.memberForm.reset({ name: '', realName: '', role: '', image: '', nationality: '', birthDate: '', biography: '', twitter: '', twitch: '', instagram: '', youtube: '' });
        this.editingMember.set(undefined);
        this.loadMembers();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        console.error('Save member error:', err);
      }
    });
  }

  editMember(member: TeamMember): void {
    this.editingMember.set(member);
    this.memberForm.patchValue({
      name: member.name,
      realName: member.realName || '',
      role: member.role,
      image: member.image || '',
      nationality: member.nationality || '',
      birthDate: member.birthDate || '',
      biography: member.biography || '',
      twitter: member.socials?.twitter || '',
      twitch: member.socials?.twitch || '',
      instagram: member.socials?.instagram || '',
      youtube: member.socials?.youtube || ''
    });
  }

  cancelEdit(): void {
    this.editingMember.set(undefined);
    this.memberForm.reset();
  }

  deleteMember(member: TeamMember): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer ${member.name} ?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.teamsService.deleteMember(this.team.id, member.id).subscribe({
        next: () => {
          this.loadMembers();
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          console.error('Delete member error:', err);
        }
      });
    });
  }

  onDrop(event: CdkDragDrop<TeamMember[]>): void {
    const members = [...this.members()];
    moveItemInArray(members, event.previousIndex, event.currentIndex);

    // Met à jour les positions
    const reorderData = members.map((member, index) => ({
      id: member.id,
      position: index
    }));

    this.teamsService.reorderMembers(this.team.id, reorderData).subscribe({
      next: () => {
        this.members.set(members);
      },
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadMembers();
      }
    });
  }

  close(): void {
    this.dialogRef.close(true);
  }

  hasSocialLinks(): boolean {
    const v = this.memberForm.value;
    return !!(v.twitter || v.twitch || v.instagram || v.youtube);
  }

  socialLinkCount(): number {
    const v = this.memberForm.value;
    return [v.twitter, v.twitch, v.instagram, v.youtube].filter(Boolean).length;
  }

  // Gestion des uploads d'images
  onImageUploaded(url: string): void {
    this.memberForm.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.memberForm.patchValue({ image: '' });
  }
}
