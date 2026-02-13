import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost, CreateRecruitmentDto, UpdateRecruitmentDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

interface DialogData {
  post?: RecruitmentPost;
}

/**
 * Dialog pour créer ou modifier une offre de recrutement
 */
@Component({
  selector: 'app-recruitment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier' : 'Créer' }} une offre</h2>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Titre du poste</mat-label>
          <input matInput formControlName="title" required />
          @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
            <mat-error>Le titre est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type de contrat</mat-label>
          <input matInput formControlName="type" required placeholder="Ex: Bénévole, CDI, Stage..." />
          @if (form.get('type')?.hasError('required') && form.get('type')?.touched) {
            <mat-error>Le type est requis</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="6" required></textarea>
          @if (form.get('description')?.hasError('required') && form.get('description')?.touched) {
            <mat-error>La description est requise</mat-error>
          }
        </mat-form-field>

        <div class="image-field">
          <label>Image de l'offre</label>
          <app-image-upload
            [currentImage]="form.get('image')?.value"
            (imageUploaded)="onImageUploaded($event)"
            (imageRemoved)="onImageRemoved()"
          />
        </div>

        <div class="checkbox-field">
          <mat-checkbox formControlName="active">Offre active</mat-checkbox>
        </div>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!form.valid || saving()">
        {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;

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

      .checkbox-field {
        padding: 0.5rem 0;
      }

      .error-message {
        padding: 0.75rem;
        background: rgba(244, 67, 54, 0.1);
        color: #f44336;
        border-radius: 4px;
        font-size: 0.875rem;
      }
    }
  `]
})
export class RecruitmentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RecruitmentFormDialogComponent>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly recruitmentService = inject(RecruitmentService);

  readonly form: FormGroup;
  readonly isEdit = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      description: ['', Validators.required],
      image: [''],
      active: [true]
    });
  }

  ngOnInit(): void {
    if (this.data.post) {
      this.isEdit.set(true);
      this.form.patchValue({
        title: this.data.post.title,
        type: this.data.post.type,
        description: this.data.post.description,
        image: this.data.post.image || '',
        active: this.data.post.active
      });
    }
  }

  save(): void {
    if (!this.form.valid) return;

    this.saving.set(true);
    this.error.set(undefined);

    const formValue = this.form.value;
    const postData: CreateRecruitmentDto | UpdateRecruitmentDto = {
      title: formValue.title,
      type: formValue.type,
      description: formValue.description,
      image: formValue.image || undefined,
      active: formValue.active
    };

    const request$ = this.isEdit()
      ? this.recruitmentService.updatePost(this.data.post!.id, postData as UpdateRecruitmentDto)
      : this.recruitmentService.createPost(postData as CreateRecruitmentDto);

    request$.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        console.error('Save post error:', err);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  // Gestion de l'upload d'image
  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }
}
