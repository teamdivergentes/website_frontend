import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost, CreateRecruitmentDto, UpdateRecruitmentDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { HasUnsavedChanges } from '../../shared/unsaved-changes.guard';
import { environment } from '../../../../environments/environment';

/**
 * Creation et edition d'une offre de recrutement.
 *
 * Ce formulaire etait un dialogue de 920px avec `max-height: 72vh` et scroll
 * interne. Il porte onze controles, dont quatre zones de texte multilignes : en
 * remplissant la derniere, le pied du dialogue sortait de l'ecran et le bouton
 * qui enregistre le travail n'etait plus visible.
 *
 * La regle inscrite dans `frontend/CLAUDE.md` en fait une page : au-dela de
 * huit controles, la modale n'est plus le bon contenant.
 */
@Component({
  selector: 'app-recruitment-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    ImageUploadComponent,
    FormActionsComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  template: `
    <app-page-header [title]="isEdit() ? 'Modifier l\\'offre' : 'Nouvelle offre'">
      <button
        leading
        mat-icon-button
        class="back-button"
        aria-label="Retour aux offres"
        (click)="cancel()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
    </app-page-header>

    @if (loadError()) {
      <app-error-state
        [message]="loadError()!"
        [retrying]="loading()"
        (retry)="loadPost()"
      />
    } @else if (loading()) {
      <app-skeleton variant="list" [rows]="6" />
    } @else {
      <form [formGroup]="form" class="form-page">

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

        <div class="form-footer">
          <app-form-actions
            [mode]="isEdit() ? 'edit' : 'create'"
            [saving]="saving()"
            [disabled]="!form.valid"
            (cancelled)="cancel()"
            (submitted)="save()"
          />
        </div>
      </form>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .back-button {
      margin-right: var(--admin-space-2);
    }

    /* Formulaire en une colonne, avec des rangees a deux champs : borne de */
    /* contenu du panel. Voir _admin-tokens.scss. */
    .form-page {
      display: flex;
      flex-direction: column;
      max-width: var(--admin-page-max);

      mat-form-field {
        width: 100%;
      }
    }

    /* ── Section cards ── */
    .form-section {
      background: var(--admin-surface-veil);
      border: 1px solid var(--admin-border-panel);
      border-radius: var(--admin-radius-lg);
      padding: var(--admin-space-5) var(--admin-space-6) var(--admin-space-6);
      margin-bottom: var(--admin-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-3);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--admin-space-3);
      margin-bottom: var(--admin-space-1);
      padding-bottom: var(--admin-space-3);
      border-bottom: 1px solid var(--admin-border-panel);
    }

    .section-number {
      font-size: var(--admin-font-2xs);
      font-weight: 700;
      color: var(--admin-accent);
      background: var(--admin-accent-border);
      border: 1px solid var(--admin-accent-bg);
      border-radius: var(--admin-radius-sm);
      padding: var(--admin-space-05) var(--admin-space-2);
      letter-spacing: 0.05em;
    }

    .section-label {
      font-size: var(--admin-font-md);
      font-weight: 600;
      color: var(--admin-text);
      letter-spacing: -0.01em;
    }

    /* ── Grid layouts ── */
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--admin-space-3);
    }

    .row-media {
      display: flex;
      align-items: flex-start;
      gap: var(--admin-space-6);
    }

    /* ── Image upload ── */
    .image-field {
      flex: 0 0 200px;

      label {
        display: block;
        margin-bottom: var(--admin-space-2);
        color: var(--admin-text-quiet);
        font-size: var(--admin-font-sm);
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
      gap: var(--admin-space-1);
      padding-top: var(--admin-space-6);

      .hint {
        font-size: var(--admin-font-xs);
        color: var(--admin-text-faint);
        padding-left: var(--admin-space-7);
      }
    }

    /* ── Error message ── */
    .error-message {
      padding: var(--admin-space-3) var(--admin-space-4);
      background: var(--admin-danger-bg-subtle);
      border: 1px solid var(--admin-danger-border);
      border-radius: var(--admin-radius-sm);
      color: var(--admin-danger);
      font-size: var(--admin-font-md);
      font-weight: 500;
      margin-bottom: var(--admin-space-4);
    }

    /* ── Pied d'action ── */
    /* Colle en bas de la fenetre : sur une page longue, le bouton qui */
    /* enregistre ne doit pas demander de faire defiler pour etre atteint. */
    .form-footer {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      padding: var(--admin-space-3) 0;
      background: var(--admin-surface);
      border-top: 1px solid var(--admin-border);
    }

    @media (max-width: 599px) {
      .row-2 {
        grid-template-columns: 1fr;
      }

      .row-media {
        flex-direction: column;
        gap: var(--admin-space-3);
      }

      .active-field {
        padding-top: 0;
      }
    }
  `]
})
export class RecruitmentFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifier = inject(AdminNotifier);
  private readonly recruitmentService = inject(RecruitmentService);

  readonly form: FormGroup;
  readonly isEdit = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  /** Echec du chargement de l'offre a editer, distinct d'un echec d'enregistrement. */
  readonly loadError = signal<string | undefined>(undefined);
  readonly contractTypes = ['Bénévole', 'CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'];

  private postId: number | null = null;
  /** Passe a vrai le temps de la navigation qui suit un enregistrement reussi. */
  private saved = false;

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
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.postId = Number(id);
    this.isEdit.set(true);
    this.loadPost();
  }

  /**
   * Charge l'offre a editer.
   *
   * Un identifiant inconnu doit se lire comme une erreur, pas comme un
   * formulaire vide : sans cela, l'administrateur croirait creer une offre et
   * verrait son enregistrement echouer sur une route d'edition.
   */
  loadPost(): void {
    if (this.postId === null) return;

    this.loading.set(true);
    this.loadError.set(undefined);

    this.recruitmentService
      .getPostById(this.postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.patchForm(post);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set("Impossible de charger cette offre.");
          if (!environment.production) console.error('Load post error:', err);
        },
      });
  }

  private patchForm(post: RecruitmentPost): void {
    this.form.patchValue({
      title: post.title,
      type: post.type,
      description: post.description,
      image: post.image || '',
      active: post.active,
      location: post.location || '',
      duration: post.duration || '',
      missions: post.missions || '',
      skills: post.skills || '',
      requirements: post.requirements || '',
      benefits: post.benefits || ''
    });
    this.form.markAsPristine();
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
      ? this.recruitmentService.updatePost(this.postId!, postData as UpdateRecruitmentDto)
      : this.recruitmentService.createPost(postData as CreateRecruitmentDto);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notifier.saved('Offre', this.isEdit() ? 'edit' : 'create', 'f');
        this.saved = true;
        this.backToList();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        if (!environment.production) console.error('Save post error:', err);
      }
    });
  }

  cancel(): void {
    this.backToList();
  }

  /** Contrat de `unsavedChangesGuard`. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  private backToList(): void {
    void this.router.navigate(['/admin/recruitment']);
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
    this.form.markAsDirty();
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
    this.form.markAsDirty();
  }
}
