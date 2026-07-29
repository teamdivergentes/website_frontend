import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatchesService } from '../../../shared/services/matches.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { MatchAdmin, CreateMatchDto } from '../../../shared/models/match.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

interface MatchDialogData {
  match?: MatchAdmin;
}

/**
 * Validator de groupe : les deux scores doivent être renseignés ou aucun.
 * Si exactement l'un est rempli, l'erreur `scoresPaired` est posée sur le groupe.
 */
export function scoresPairedValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dvg = group.get('scoreDvg')?.value;
    const opp = group.get('scoreOpponent')?.value;
    const dvgFilled = dvg !== null && dvg !== '' && dvg !== undefined;
    const oppFilled = opp !== null && opp !== '' && opp !== undefined;
    if (dvgFilled !== oppFilled) {
      return { scoresPaired: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-match-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier le match' : 'Nouveau match' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="match-form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Équipe DVG</mat-label>
          <mat-select formControlName="teamId">
            @for (team of teams(); track team.id) {
              <mat-option [value]="team.id">{{ team.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('teamId')?.hasError('required') && form.get('teamId')?.touched) {
            <mat-error>L'équipe est obligatoire</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Adversaire</mat-label>
          <input matInput formControlName="opponentName" placeholder="ex: Team Vitality" />
          @if (form.get('opponentName')?.hasError('required') && form.get('opponentName')?.touched) {
            <mat-error>Le nom de l'adversaire est obligatoire</mat-error>
          }
          @if (form.get('opponentName')?.hasError('maxlength') && form.get('opponentName')?.touched) {
            <mat-error>100 caractères maximum</mat-error>
          }
        </mat-form-field>

        <app-image-upload
          [currentImage]="form.get('opponentLogo')?.value"
          description="Logo de l'adversaire (optionnel)."
          (imageUploaded)="onLogoUploaded($event)"
          (imageRemoved)="onLogoRemoved()">
        </app-image-upload>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date et heure</mat-label>
          <input matInput formControlName="scheduledAt" type="datetime-local" />
          @if (form.get('scheduledAt')?.hasError('required') && form.get('scheduledAt')?.touched) {
            <mat-error>La date est obligatoire</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Compétition (optionnel)</mat-label>
          <input matInput formControlName="competition" placeholder="ex: LFL Division 2 — Saison 2025" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Lien stream (optionnel)</mat-label>
          <input matInput formControlName="streamUrl" placeholder="https://twitch.tv/..." />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ID article Match Report (optionnel)</mat-label>
          <input matInput formControlName="articleId" type="number" min="1" />
          <mat-hint>Identifiant numérique d'un article existant lié à ce match</mat-hint>
        </mat-form-field>

        <div class="scores-section">
          <div class="scores-label">Scores (renseignez les deux ou aucun)</div>
          <div class="two-col">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Score DVG</mat-label>
              <input matInput formControlName="scoreDvg" type="number" min="0" max="999" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Score adversaire</mat-label>
              <input matInput formControlName="scoreOpponent" type="number" min="0" max="999" />
            </mat-form-field>
          </div>
          @if (form.hasError('scoresPaired') && (form.get('scoreDvg')?.touched || form.get('scoreOpponent')?.touched)) {
            <div class="scores-error">Renseignez les deux scores ou aucun</div>
          }
        </div>

        <div class="checkbox-field">
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
      <button mat-button type="button" (click)="cancel()">Annuler</button>
      <button mat-raised-button color="primary" type="button" (click)="save()"
        [disabled]="form.invalid || saving()">
        {{ saving() ? 'Enregistrement…' : (isEdit() ? 'Mettre à jour' : 'Créer') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .match-form {
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

    .scores-section {
      margin-bottom: 0.5rem;
    }

    .scores-label {
      font-size: 0.75rem;
      color: var(--gray, #999);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .scores-error {
      color: #e05c5c;
      font-size: 0.8rem;
      margin-top: -0.5rem;
      margin-bottom: 0.5rem;
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
      min-width: min(560px, 92vw);
    }
  `],
})
export class MatchDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<MatchDialogComponent>);
  private readonly data = inject<MatchDialogData>(MAT_DIALOG_DATA);
  private readonly matchesService = inject(MatchesService);
  private readonly teamsService = inject(TeamsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEdit = signal(!!this.data.match);
  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly teams = this.teamsService.allTeams;

  readonly form: FormGroup = this.fb.group(
    {
      teamId: [this.data.match?.teamId ?? null, Validators.required],
      opponentName: [
        this.data.match?.opponentName ?? '',
        [Validators.required, Validators.maxLength(100)],
      ],
      opponentLogo: [this.data.match?.opponentLogo ?? ''],
      scheduledAt: [
        this.data.match ? this.data.match.scheduledAt.slice(0, 16) : '',
        Validators.required,
      ],
      competition: [this.data.match?.competition ?? ''],
      streamUrl: [this.data.match?.streamUrl ?? ''],
      articleId: [this.data.match?.articleId ?? null],
      scoreDvg: [this.data.match?.scoreDvg ?? null, [Validators.min(0), Validators.max(999)]],
      scoreOpponent: [
        this.data.match?.scoreOpponent ?? null,
        [Validators.min(0), Validators.max(999)],
      ],
      active: [this.data.match?.active ?? true],
    },
    { validators: scoresPairedValidator() },
  );

  ngOnInit(): void {
    this.teamsService.loadTeams().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onLogoUploaded(url: string): void {
    this.form.patchValue({ opponentLogo: url });
  }

  onLogoRemoved(): void {
    this.form.patchValue({ opponentLogo: null });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const raw = this.form.value;

    const dvgRaw = raw.scoreDvg;
    const oppRaw = raw.scoreOpponent;
    const dvgFilled = dvgRaw !== null && dvgRaw !== '' && dvgRaw !== undefined;
    const oppFilled = oppRaw !== null && oppRaw !== '' && oppRaw !== undefined;

    const dto: CreateMatchDto = {
      teamId: raw.teamId,
      opponentName: raw.opponentName,
      // Jamais de chaîne vide pour opponentLogo (regex backend) → null
      opponentLogo: raw.opponentLogo || null,
      // Conversion datetime-local → ISO string
      scheduledAt: new Date(raw.scheduledAt).toISOString(),
      competition: raw.competition || null,
      streamUrl: raw.streamUrl || null,
      articleId: raw.articleId ? Number(raw.articleId) : null,
      // Si les deux sont remplis → Number ; si aucun → null explicite
      scoreDvg: dvgFilled && oppFilled ? Number(dvgRaw) : null,
      scoreOpponent: dvgFilled && oppFilled ? Number(oppRaw) : null,
      active: raw.active ?? true,
    };

    const request$ = this.isEdit()
      ? this.matchesService.updateMatch(this.data.match!.id, dto)
      : this.matchesService.createMatch(dto);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: MatchAdmin) => {
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
