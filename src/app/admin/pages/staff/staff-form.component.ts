import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory, CreateStaffDto, UpdateStaffDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { FormActionsComponent } from '../../shared/form-actions.component';

export interface StaffFormDialogData {
  member?: StaffMember;
  category: StaffCategory;
}

/**
 * Dialog Material pour créer ou modifier un membre du staff
 */
@Component({
  selector: 'app-staff-form-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ImageUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      {{ data.member ? 'Modifier un membre' : 'Ajouter un membre' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <app-image-upload
          [currentImage]="form.get('image')?.value"
          description="Photo de profil du membre. Un format carré est recommandé."
          (imageUploaded)="onImageUploaded($event)"
          (imageRemoved)="onImageRemoved()">
        </app-image-upload>

        <mat-form-field appearance="outline">
          <mat-label>Nom</mat-label>
          <input matInput formControlName="name" required data-testid="staff-firstname-input" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rôle</mat-label>
          <input matInput formControlName="role" required placeholder="Ex: Président, Directeur Général..." data-testid="staff-lastname-input" />
          @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
            <mat-error>Le rôle est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Catégorie</mat-label>
          <mat-select formControlName="category" data-testid="staff-category-select">
            <mat-option [value]="StaffCategory.ADMIN">Administration</mat-option>
            <mat-option [value]="StaffCategory.HEADSTAFF">Headstaff</mat-option>
            <mat-option [value]="StaffCategory.AMBASSADOR">Ambassadeur</mat-option>
          </mat-select>
          @if (form.get('category')?.hasError('required') && form.get('category')?.touched) {
            <mat-error>La catégorie est requise</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-actions
        [mode]="data.member ? 'edit' : 'create'"
        [saving]="saving()"
        [disabled]="form.invalid"
        submitTestId="staff-save-btn"
        (cancelled)="onCancel()"
        (submitted)="onSave()"
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

      .error-message {
        padding: var(--admin-space-3);
        background: rgba(244, 67, 54, 0.1);
        color: var(--admin-danger);
        border-radius: var(--admin-radius-xs);
        font-size: var(--admin-font-md);
      }
    }
  `]
})
export class StaffFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<StaffFormDialogComponent>);
  readonly data = inject<StaffFormDialogData>(MAT_DIALOG_DATA);
  private readonly staffService = inject(StaffService);
  private readonly snackBar = inject(MatSnackBar);

  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly StaffCategory = StaffCategory;

  readonly form: FormGroup;

  constructor() {
    const member = this.data.member;
    this.form = this.fb.group({
      name: [member?.name ?? '', Validators.required],
      role: [member?.role ?? '', Validators.required],
      category: [member?.category ?? this.data.category, Validators.required],
      image: [member?.image ?? '']
    });
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);

    const formValue = this.form.value;
    const member = this.data.member;

    if (member) {
      const updateDto: UpdateStaffDto = {
        name: formValue.name,
        role: formValue.role,
        category: formValue.category,
        image: formValue.image
      };

      this.staffService.updateMember(member.id, updateDto).subscribe({
        next: () => {
          this.snackBar.open('Membre modifié avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la mise à jour');
          console.error('Update staff error:', err);
        }
      });
    } else {
      const createDto: CreateStaffDto = {
        name: formValue.name,
        role: formValue.role,
        category: formValue.category,
        image: formValue.image
      };

      this.staffService.createMember(createDto).subscribe({
        next: () => {
          this.snackBar.open('Membre créé avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la création');
          console.error('Create staff error:', err);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
