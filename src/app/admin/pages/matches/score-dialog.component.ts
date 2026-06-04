import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatchesService } from '../../../shared/services/matches.service';
import { MatchAdmin } from '../../../shared/models/match.model';

interface ScoreDialogData {
  match: MatchAdmin;
}

@Component({
  selector: 'app-score-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Résultat — DVG vs {{ data.match.opponentName }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="score-form">
        <div class="scores-row">
          <mat-form-field appearance="outline" class="score-field">
            <mat-label>Score DVG</mat-label>
            <input matInput formControlName="scoreDvg" type="number" min="0" max="999" />
            @if (form.get('scoreDvg')?.hasError('required') && form.get('scoreDvg')?.touched) {
              <mat-error>Obligatoire</mat-error>
            }
            @if (form.get('scoreDvg')?.hasError('min') || form.get('scoreDvg')?.hasError('max')) {
              <mat-error>Valeur entre 0 et 999</mat-error>
            }
          </mat-form-field>

          <div class="scores-separator">–</div>

          <mat-form-field appearance="outline" class="score-field">
            <mat-label>Score {{ data.match.opponentName }}</mat-label>
            <input matInput formControlName="scoreOpponent" type="number" min="0" max="999" />
            @if (form.get('scoreOpponent')?.hasError('required') && form.get('scoreOpponent')?.touched) {
              <mat-error>Obligatoire</mat-error>
            }
            @if (form.get('scoreOpponent')?.hasError('min') || form.get('scoreOpponent')?.hasError('max')) {
              <mat-error>Valeur entre 0 et 999</mat-error>
            }
          </mat-form-field>
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
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .score-form {
      padding-top: 0.5rem;
    }

    .scores-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .score-field {
      flex: 1;
    }

    .scores-separator {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gray, #999);
      padding-bottom: 1.25rem;
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
      min-width: min(360px, 92vw);
    }
  `],
})
export class ScoreDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ScoreDialogComponent>);
  readonly data = inject<ScoreDialogData>(MAT_DIALOG_DATA);
  private readonly matchesService = inject(MatchesService);

  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form: FormGroup = this.fb.group({
    scoreDvg: [
      this.data.match.scoreDvg != null ? this.data.match.scoreDvg : null,
      [Validators.required, Validators.min(0), Validators.max(999)],
    ],
    scoreOpponent: [
      this.data.match.scoreOpponent != null ? this.data.match.scoreOpponent : null,
      [Validators.required, Validators.min(0), Validators.max(999)],
    ],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const raw = this.form.value;

    this.matchesService
      .updateMatch(this.data.match.id, {
        scoreDvg: Number(raw.scoreDvg),
        scoreOpponent: Number(raw.scoreOpponent),
      })
      .subscribe({
        next: result => {
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
