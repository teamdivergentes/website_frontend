import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost, CreateRecruitmentDto, UpdateRecruitmentDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface DialogData {
  post?: RecruitmentPost;
}

/**
 * Dialog pour créer ou modifier une offre de recrutement
 */
@Component({
  selector: 'app-recruitment-form-dialog',
  standalone: true,
  imports: [FormActionsComponent, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier' : 'Créer' }} une offre</h2>

    <mat-dialog-content>
      <form [formGroup]="form">

        <!-- ═══ Section 1 : Informations générales ═══ -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">01</span>
            <span class="section-label">Informations générales</span>
          </div>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Titre du poste</mat-label>
              <input matInput formControlName="title" required />
              @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
                <mat-error>Le titre est requis</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Type de contrat</mat-label>
              <mat-select formControlName="type" required>
                @for (type of contractTypes; track type) {
                  <mat-option [value]="type">{{ type }}</mat-option>
                }
              </mat-select>
              @if (form.get('type')?.hasError('required') && form.get('type')?.touched) {
                <mat-error>Le type est requis</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Description courte</mat-label>
            <textarea matInput formControlName="description" rows="3" required
              placeholder="Résumé affiché sur la carte de l'offre"></textarea>
            @if (form.get('description')?.hasError('required') && form.get('description')?.touched) {
              <mat-error>La description est requise</mat-error>
            }
          </mat-form-field>

          <div class="row-media">
            <div class="image-field">
              <label>Image</label>
              <app-image-upload
                [currentImage]="form.get('image')?.value"
                (imageUploaded)="onImageUploaded($event)"
                (imageRemoved)="onImageRemoved()"
              />
            </div>
            <div class="active-field">
              <mat-checkbox formControlName="active">Offre active</mat-checkbox>
              <span class="hint">Visible sur le site public</span>
            </div>
          </div>
        </div>

        <!-- ═══ Section 2 : Détails du poste ═══ -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">02</span>
            <span class="section-label">Fiche de poste</span>
          </div>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Localisation</mat-label>
              <input matInput formControlName="location" placeholder="Télétravail" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Durée</mat-label>
              <input matInput formControlName="duration" placeholder="Long terme" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Missions principales</mat-label>
            <textarea matInput formControlName="missions" rows="4"></textarea>
            <mat-hint>Une mission par ligne</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Compétences</mat-label>
            <textarea matInput formControlName="skills" rows="4"></textarea>
            <mat-hint>Une entrée par ligne</mat-hint>
          </mat-form-field>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Profil recherché</mat-label>
              <textarea matInput formControlName="requirements" rows="4"></textarea>
              <mat-hint>Un critère par ligne</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Ce que nous offrons</mat-label>
              <textarea matInput formControlName="benefits" rows="4"></textarea>
              <mat-hint>Un avantage par ligne</mat-hint>
            </mat-form-field>
          </div>
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
    :host {
      display: block;
    }

    mat-dialog-content {
      max-height: 72vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 24px !important;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 8px 0 16px;

      mat-form-field {
        width: 100%;
      }
    }

    /* ── Section cards ── */
    .form-section {
      background: rgba(16, 17, 17, 0.6);
      border: 1px solid rgba(40, 65, 59, 0.35);
      border-radius: 12px;
      padding: 20px 24px 24px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(40, 65, 59, 0.4);
    }

    .section-number {
      font-size: 0.7rem;
      font-weight: 700;
      color: #32D299;
      background: rgba(50, 210, 153, 0.1);
      border: 1px solid rgba(50, 210, 153, 0.2);
      border-radius: 6px;
      padding: 2px 8px;
      letter-spacing: 0.05em;
    }

    .section-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      letter-spacing: -0.01em;
    }

    /* ── Grid layouts ── */
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .row-media {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }

    /* ── Image upload ── */
    .image-field {
      flex: 0 0 200px;

      label {
        display: block;
        margin-bottom: 6px;
        color: rgba(211, 211, 211, 0.6);
        font-size: 0.8125rem;
        font-weight: 500;
      }

      app-image-upload {
        display: block;
        width: 200px;
      }
    }

    /* ── Active checkbox ── */
    .active-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 24px;

      .hint {
        font-size: 0.75rem;
        color: rgba(211, 211, 211, 0.4);
        padding-left: 32px;
      }
    }

    /* ── Error message ── */
    .error-message {
      padding: 0.75rem 1rem;
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 8px;
      color: #ef5350;
      font-size: 0.875rem;
      font-weight: 500;
    }
  `]
})
export class RecruitmentFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RecruitmentFormDialogComponent>);
  private readonly notifier = inject(AdminNotifier);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly recruitmentService = inject(RecruitmentService);

  readonly form: FormGroup;
  readonly isEdit = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly contractTypes = ['Bénévole', 'CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'];

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      description: ['', Validators.required],
      image: [''],
      active: [true],
      location: [''],
      duration: [''],
      missions: [''],
      skills: [''],
      requirements: [''],
      benefits: ['']
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
        active: this.data.post.active,
        location: this.data.post.location || '',
        duration: this.data.post.duration || '',
        missions: this.data.post.missions || '',
        skills: this.data.post.skills || '',
        requirements: this.data.post.requirements || '',
        benefits: this.data.post.benefits || ''
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
    const clearValue = this.isEdit() ? null : undefined;
    const postData: CreateRecruitmentDto | UpdateRecruitmentDto = {
      title: formValue.title,
      type: formValue.type,
      description: formValue.description,
      image: formValue.image || clearValue,
      active: formValue.active,
      location: formValue.location || clearValue,
      duration: formValue.duration || clearValue,
      missions: formValue.missions || clearValue,
      skills: formValue.skills || clearValue,
      requirements: formValue.requirements || clearValue,
      benefits: formValue.benefits || clearValue
    };

    const request$ = this.isEdit()
      ? this.recruitmentService.updatePost(this.data.post!.id, postData as UpdateRecruitmentDto)
      : this.recruitmentService.createPost(postData as CreateRecruitmentDto);

    request$.subscribe({
      next: () => {
        this.notifier.saved('Offre', this.isEdit() ? 'edit' : 'create', 'f');
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
