import { Component, Inject, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor, ImageLayout } from '../../../shared/models';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface DialogData {
  sponsor?: Sponsor;
}

/**
 * Dialog pour créer ou éditer un sponsor
 */
@Component({
  selector: 'app-sponsor-form-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      {{ data.sponsor ? 'Modifier le sponsor' : 'Nouveau sponsor' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Nom</mat-label>
          <input matInput formControlName="name" required />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Position des images</mat-label>
          <mat-select formControlName="imageLayout">
            <mat-option [value]="ImageLayout.LAYOUT_1">Layout 1 (Secondaire: bas-gauche / haut-droite)</mat-option>
            <mat-option [value]="ImageLayout.LAYOUT_2">Layout 2 (Secondaire: haut-gauche / bas-droite)</mat-option>
            <mat-option [value]="ImageLayout.LAYOUT_3">Layout 3 (Secondaire: haut-droite / bas-gauche)</mat-option>
          </mat-select>
          <mat-hint>Position des images secondaires autour de l'image principale</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date de début</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date de fin</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        [saving]="loading()"
        [disabled]="form.invalid"
        (cancel)="onCancel()"
        (submit)="onSave()"
      />
    </mat-dialog-actions>
  `,
  styles: [`
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }

    mat-form-field {
      width: 100%;
    }
  `]
})
export class SponsorFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sponsorsService = inject(SponsorsService);
  private readonly dialogRef = inject(MatDialogRef<SponsorFormDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly snackBar = inject(MatSnackBar);

  readonly ImageLayout = ImageLayout;
  readonly loading = signal<boolean>(false);
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) readonly data: DialogData) {
    this.form = this.fb.group({
      name: [data.sponsor?.name || '', Validators.required],
      description: [data.sponsor?.description || ''],
      imageLayout: [data.sponsor?.imageLayout || ImageLayout.LAYOUT_1],
      startDate: [data.sponsor?.startDate ? new Date(data.sponsor.startDate) : null],
      endDate: [data.sponsor?.endDate ? new Date(data.sponsor.endDate) : null]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    // Convertir les dates en ISO string si définies
    const dto = {
      ...formValue,
      startDate: formValue.startDate ? formValue.startDate.toISOString() : undefined,
      endDate: formValue.endDate ? formValue.endDate.toISOString() : undefined
    };

    const request = this.data.sponsor
      ? this.sponsorsService.updateSponsor(this.data.sponsor.id, dto)
      : this.sponsorsService.createSponsor(dto);

    request.subscribe({
      next: () => {
        this.notifier.saved('Sponsor', this.data.sponsor ? 'edit' : 'create');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Save sponsor error:', err);
        this.loading.set(false);
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 5000 });
      }
    });
  }
}
