import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { TrophyAdmin, CreateTrophyDto } from '../../../shared/models/trophy.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface TrophyDialogData {
  trophy?: TrophyAdmin;
}

@Component({
  selector: 'app-trophy-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    ImageUploadComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier le trophée' : 'Nouveau trophée' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="trophy-form">
        <app-image-upload
          [currentImage]="form.get('image')?.value"
          description="Visuel de la compétition ou du trophée (optionnel)."
          (imageUploaded)="onImageUploaded($event)"
          (imageRemoved)="onImageRemoved()">
        </app-image-upload>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Compétition</mat-label>
          <input matInput formControlName="competition"
            placeholder="ex: LFL Division 2 — Saison 2025" />
          @if (form.get('competition')?.hasError('required') && form.get('competition')?.touched) {
            <mat-error>La compétition est obligatoire</mat-error>
          }
          @if (form.get('competition')?.hasError('maxlength') && form.get('competition')?.touched) {
            <mat-error>200 caractères maximum</mat-error>
          }
        </mat-form-field>

        <div class="two-col">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Placement</mat-label>
            <input matInput formControlName="placement" type="number" min="1" max="999" />
            <mat-hint>1 = 1re place, 2 = 2e place, 3 = 3e place, au-delà = « Top n »</mat-hint>
            @if (form.get('placement')?.invalid && form.get('placement')?.touched) {
              <mat-error>Entier entre 1 et 999 requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Date d'obtention</mat-label>
            <input matInput formControlName="date" type="date" />
            @if (form.get('date')?.hasError('required') && form.get('date')?.touched) {
              <mat-error>La date est obligatoire</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Équipe (optionnel)</mat-label>
          <mat-select formControlName="teamId">
            <mat-option [value]="null">— aucune (utiliser le libellé libre) —</mat-option>
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Libellé d'équipe libre (si pas d'équipe liée)</mat-label>
          <input matInput formControlName="teamLabel"
            placeholder="ex: Roster LoL 2024" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (affichée sur la carte à la une)</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="500"></textarea>
        </mat-form-field>

        <div class="checkbox-field">
          <mat-checkbox formControlName="featured" color="primary">
            À la une (rail du palmarès)
          </mat-checkbox>
          <mat-checkbox formControlName="active" color="primary">
            Actif (visible sur le site)
          </mat-checkbox>
        </div>

        @if (error()) {
          <div class="error-banner" role="alert">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        [mode]="isEdit() ? 'edit' : 'create'"
        [saving]="saving()"
        [disabled]="form.invalid"
        (cancelled)="cancel()"
        (submitted)="save()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    .trophy-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-top: 0.5rem;
    }

    .full-width {
      width: 100%;
    }

    .two-col {
      display: flex;
      gap: 1rem;
    }

    .half-width {
      flex: 1;
    }

    .checkbox-field {
      display: flex;
      gap: 1.5rem;
      margin: 0.5rem 0;
      flex-wrap: wrap;
    }

    .error-banner {
      color: #e05c5c;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: rgba(224, 92, 92, 0.1);
      border-radius: 4px;
      font-size: 0.875rem;
    }

    mat-dialog-content {
      min-width: min(500px, 92vw);
    }
  `],
})
export class TrophyDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TrophyDialogComponent>);
  private readonly data = inject<TrophyDialogData>(MAT_DIALOG_DATA);
  private readonly trophiesService = inject(TrophiesService);
  private readonly teamsService = inject(TeamsService);

  readonly isEdit = signal(!!this.data.trophy);
  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly teams = this.teamsService.allTeams;

  readonly form: FormGroup = this.fb.group({
    competition: [
      this.data.trophy?.competition ?? '',
      [Validators.required, Validators.maxLength(200)],
    ],
    placement: [
      this.data.trophy?.placement ?? 1,
      [Validators.required, Validators.min(1), Validators.max(999)],
    ],
    date: [this.data.trophy?.date?.slice(0, 10) ?? '', Validators.required],
    teamId: [this.data.trophy?.teamId ?? null],
    // Si le trophée n'a pas de teamId mais a un teamName, c'est un libellé libre
    teamLabel: [
      this.data.trophy && !this.data.trophy.teamId ? (this.data.trophy.teamName ?? null) : null,
    ],
    description: [this.data.trophy?.description ?? ''],
    image: [this.data.trophy?.image ?? ''],
    featured: [this.data.trophy?.featured ?? false],
    active: [this.data.trophy?.active ?? true],
  });

  ngOnInit(): void {
    this.teamsService.loadTeams().subscribe();
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const raw = this.form.value;

    // En édition (PATCH partiel) : toujours inclure les champs optionnels avec null quand
    // ils sont vidés — le backend utilise `dto.x !== undefined` comme garde, donc null
    // écrase la valeur en base alors qu'une clé absente la laisse inchangée.
    // L'image ne peut jamais être une chaîne vide (regex backend la rejetterait) → null.
    // En création : même comportement pour la cohérence ; @IsOptional accepte null.
    const dto: CreateTrophyDto = {
      competition: raw.competition,
      placement: Number(raw.placement),
      date: raw.date,
      featured: raw.featured ?? false,
      active: raw.active ?? true,
      // null si vide → efface le champ existant en édition ; ignoré à la création (Prisma ?? null)
      image: raw.image || null,
      description: raw.description || null,
      teamId: raw.teamId ?? null,
      teamLabel: raw.teamLabel || null,
    };

    const request$ = this.isEdit()
      ? this.trophiesService.updateTrophy(this.data.trophy!.id, dto)
      : this.trophiesService.createTrophy(dto);

    request$.subscribe({
      next: (result: TrophyAdmin) => {
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: err => {
        this.saving.set(false);
        const message = err?.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(' — ')
            : (message ?? "Erreur lors de l'enregistrement."),
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
