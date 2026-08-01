import { environment } from '../../../../environments/environment';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { GamesService } from '../../../shared/services/games.service';
import { Game, CreateGameDto, UpdateGameDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface DialogData {
  game?: Game;
}

/**
 * Dialog pour créer ou modifier un jeu
 */
@Component({
  selector: 'app-game-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    ImageUploadComponent
  ,
    FormActionsComponent],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier le jeu' : 'Nouveau jeu' }}</h2>

    <mat-dialog-content>
      @if (error()) {
        <div class="form-error" role="alert">{{ error() }}</div>
      }
      <form [formGroup]="form" class="game-form">
        <mat-form-field appearance="outline">
          <mat-label>Clé unique</mat-label>
          <input matInput formControlName="key" placeholder="lol, valorant, cs..." data-testid="game-key-input" />
          <mat-hint>Id unique pour le jeu (minuscules, sans espaces)</mat-hint>
          @if (form.get('key')?.hasError('required') && form.get('key')?.touched) {
            <mat-error>La clé est requise</mat-error>
          }
          @if (form.get('key')?.hasError('pattern')) {
            <mat-error>La clé doit contenir uniquement des lettres minuscules et chiffres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nom du jeu</mat-label>
          <input matInput formControlName="name" placeholder="League of Legends" data-testid="game-name-input" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>

        <div class="image-field">
          <label>Image du jeu</label>
          <app-image-upload
            [currentImage]="form.get('image')?.value"
            description="Image ou logo du jeu."
            (imageUploaded)="onImageUploaded($event)"
            (imageRemoved)="onImageRemoved()"
          />
        </div>

        <mat-checkbox formControlName="active">
          Jeu actif
        </mat-checkbox>
      </form>
    </mat-dialog-content>

    <app-form-actions
      [saving]="saving()"
      [disabled]="form.invalid"
      submitLabel="Enregistrer"
      savingLabel="Enregistrement..."
      submitTestId="game-save-btn"
      (cancelled)="dialogRef.close()"
      (submitted)="save()"
    />
  `,
  styles: [`
    .form-error {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--admin-radius-sm);
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(244, 67, 54, 0.3);
      color: #ef5350;
      font-size: 0.875rem;
    }

    .game-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 400px;
    }

    mat-form-field {
      width: 100%;
    }

    .image-field {
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--gray, #999);
        font-size: 0.875rem;
      }
    }
  `]
})
export class GameFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  // `protected` et non `private` : le template y accede pour fermer le dialogue.
  protected readonly dialogRef = inject(MatDialogRef<GameFormDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly gamesService = inject(GamesService);

  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isEdit = computed(() => !!this.data?.game);

  form: FormGroup = this.fb.group({
    key: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+$/)]],
    name: ['', Validators.required],
    image: [''],
    active: [true]
  });

  ngOnInit(): void {
    if (this.data?.game) {
      this.form.patchValue({
        key: this.data.game.key,
        name: this.data.game.name,
        image: this.data.game.image || '',
        active: this.data.game.active
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const formValue = this.form.value;

    if (this.isEdit()) {
      const updateData: UpdateGameDto = {
        key: formValue.key,
        name: formValue.name,
        image: formValue.image || null,
        active: formValue.active
      };

      this.gamesService.updateGame(this.data.game!.id, updateData).subscribe({
        next: () => {
          this.saving.set(false);
          this.notifier.saved('Jeu', 'edit');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (!environment.production) {
            console.error('Update game error:', err);
          }
          this.error.set('Erreur lors de la mise à jour du jeu');
        }
      });
    } else {
      const createData: CreateGameDto = {
        key: formValue.key,
        name: formValue.name,
        image: formValue.image || undefined,
        active: formValue.active
      };

      this.gamesService.createGame(createData).subscribe({
        next: () => {
          this.saving.set(false);
          this.notifier.saved('Jeu', 'create');
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (!environment.production) {
            console.error('Create game error:', err);
          }
          this.error.set('Erreur lors de la création du jeu');
        }
      });
    }
  }

  // Gestion des uploads d'images
  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }
}
