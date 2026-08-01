import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TeamsService } from '../../../shared/services';
import { GamesService } from '../../../shared/services/games.service';
import { Team, CreateTeamDto, UpdateTeamDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface DialogData {
  team?: Team;
}

/**
 * Dialog pour créer ou modifier une équipe
 */
@Component({
  selector: 'app-team-form-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier' : 'Créer' }} une équipe</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Nom de l'équipe</mat-label>
          <input matInput formControlName="name" required />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Jeu</mat-label>
          <mat-select formControlName="game" required>
            @for (game of games(); track game.id) {
              <mat-option [value]="game.key">{{ game.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('game')?.hasError('required') && form.get('game')?.touched) {
            <mat-error>Le jeu est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4"></textarea>
        </mat-form-field>

        <div class="image-uploads">
          <div class="image-field">
            <label>Logo de l'équipe</label>
            <app-image-upload
              [currentImage]="form.get('image')?.value"
              description="Logo de l'équipe. Un format carré est recommandé."
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()"
            />
          </div>

          <div class="image-field">
            <label>Bannière</label>
            <app-image-upload
              [currentImage]="form.get('banner')?.value"
              description="Bannière de l'équipe. Un format paysage (16:9) est recommandé."
              (imageUploaded)="onBannerUploaded($event)"
              (imageRemoved)="onBannerRemoved()"
            />
          </div>
        </div>

        <div class="checkbox-field">
          <mat-checkbox formControlName="active">Équipe active</mat-checkbox>
        </div>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        [saving]="saving()"
        [disabled]="!form.valid"
        (cancelled)="cancel()"
        (submitted)="save()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-4);
      padding: var(--admin-space-4) 0;

      mat-form-field {
        width: 100%;
      }

      .image-uploads {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--admin-space-4);
      }

      .image-field {
        label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--gray, #999);
          font-size: 0.875rem;
        }
      }

      .checkbox-field {
        padding: var(--admin-space-2) 0;
      }

      .error-message {
        padding: var(--admin-space-3);
        background: rgba(244, 67, 54, 0.1);
        color: var(--admin-danger);
        border-radius: var(--admin-radius-xs);
        font-size: 0.875rem;
      }
    }
  `]
})
export class TeamFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TeamFormDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly teamsService = inject(TeamsService);
  private readonly gamesService = inject(GamesService);

  readonly form: FormGroup;
  readonly isEdit = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Jeux actifs chargés dynamiquement
  readonly games = this.gamesService.activeGames;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      game: ['', Validators.required],
      description: [''],
      image: [''],
      banner: [''],
      active: [true]
    });
  }

  ngOnInit(): void {
    // Charger les jeux si pas encore chargés
    if (this.games().length === 0) {
      this.gamesService.loadGames().subscribe();
    }

    if (this.data.team) {
      this.isEdit.set(true);
      this.form.patchValue({
        name: this.data.team.name,
        game: this.data.team.game,
        description: this.data.team.description || '',
        image: this.data.team.image || '',
        banner: this.data.team.banner || '',
        active: this.data.team.active
      });
    }
  }

  save(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);

    const formValue = this.form.value;
    const teamData: CreateTeamDto | UpdateTeamDto = {
      name: formValue.name,
      game: formValue.game,
      description: formValue.description || (this.isEdit() ? null : undefined),
      image: formValue.image || (this.isEdit() ? null : undefined),
      banner: formValue.banner || (this.isEdit() ? null : undefined),
      active: formValue.active
    };

    const request$ = this.isEdit()
      ? this.teamsService.updateTeam(this.data.team!.id, teamData as UpdateTeamDto)
      : this.teamsService.createTeam(teamData as CreateTeamDto);

    request$.subscribe({
      next: () => {
        this.notifier.saved('Équipe', this.isEdit() ? 'edit' : 'create', 'f');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        console.error('Save team error:', err);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  // Gestion des uploads d'images
  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  onBannerUploaded(url: string): void {
    this.form.patchValue({ banner: url });
  }

  onBannerRemoved(): void {
    this.form.patchValue({ banner: '' });
  }
}
