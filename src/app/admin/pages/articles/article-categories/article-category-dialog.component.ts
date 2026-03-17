import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ArticleTypesService } from '../../../../shared/services/article-types.service';
import { ArticleType } from '../../../../shared/models';

export interface ArticleCategoryDialogData {
  category?: ArticleType;
}

/**
 * Dialog Material pour créer ou modifier une catégorie d'article
 */
@Component({
  selector: 'app-article-category-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon aria-hidden="true">{{ isEdit() ? 'edit' : 'add_circle' }}</mat-icon>
      {{ isEdit() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="category-form" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Nom de la catégorie</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ex : Actualités, Tutoriels…"
            [attr.aria-required]="true"
          />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Le nom est requis</mat-error>
          }
          @if (form.get('name')?.hasError('maxlength')) {
            <mat-error>Le nom ne doit pas dépasser 100 caractères</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Annuler</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        [disabled]="form.invalid || saving()"
        (click)="save()"
      >
        {{ saving() ? 'Enregistrement…' : (isEdit() ? 'Enregistrer' : 'Créer') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-form {
      display: flex;
      flex-direction: column;
      min-width: 360px;
      padding-top: 0.5rem;

      mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class ArticleCategoryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ArticleCategoryDialogComponent>);
  private readonly data = inject<ArticleCategoryDialogData>(MAT_DIALOG_DATA);
  private readonly typesService = inject(ArticleTypesService);

  readonly saving = signal<boolean>(false);
  readonly isEdit = computed(() => !!this.data?.category);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]]
  });

  ngOnInit(): void {
    if (this.data?.category) {
      this.form.patchValue({ name: this.data.category.name });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const name: string = this.form.value.name.trim();

    if (this.isEdit()) {
      this.typesService.updateArticleType(this.data.category!.id, { name }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving.set(false);
        }
      });
    } else {
      this.typesService.createArticleType({ name }).subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.saving.set(false);
        }
      });
    }
  }
}
