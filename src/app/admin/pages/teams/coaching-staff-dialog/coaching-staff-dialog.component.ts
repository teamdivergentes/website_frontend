import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { CoachingStaffService } from '../../../../shared/services';
import { CoachingStaffMember, CreateCoachingStaffDto, UpdateCoachingStaffDto, Team } from '../../../../shared/models';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

interface DialogData {
  team: Team;
}

type FormMode = 'list' | 'create' | 'edit';

/**
 * Dialog de gestion CRUD du coaching staff d'une équipe.
 * Composant unique (KISS) : liste + formulaire intégrés.
 * Pattern calqué sur TeamMembersDialogComponent.
 */
@Component({
  selector: 'app-coaching-staff-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    DragDropModule,
    ImageUploadComponent,
  ],
  styles: [`
    mat-dialog-content {
      min-width: min(900px, 90vw);
      max-height: 80vh;
      padding: 1.5rem !important;
      overflow-y: auto;
    }

    /* ── Skeleton ── */
    @keyframes skeleton-pulse {
      0%, 100% { background-position: 200% 0; }
      50%       { background-position: 0 0; }
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--darkGreen, #28413b);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .skeleton-block {
      background: linear-gradient(
        90deg,
        rgba(40, 65, 59, 0.3) 0%,
        rgba(50, 210, 153, 0.08) 50%,
        rgba(40, 65, 59, 0.3) 100%
      );
      background-size: 200% 100%;
      border-radius: 6px;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .sk-handle { width: 24px; height: 24px; flex-shrink: 0; }
    .sk-avatar { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; }
    .sk-info   { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .sk-name   { width: 40%; height: 14px; }
    .sk-role   { width: 25%; height: 12px; }
    .sk-btns   { width: 80px; height: 32px; flex-shrink: 0; border-radius: 8px; }

    /* ── Liste ── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-header h3 {
      margin: 0;
      color: var(--white, #fff);
    }

    .coach-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.6rem 1rem;
      border: 1px solid var(--darkGreen, #28413b);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.02);
      cursor: default;
    }

    .drag-handle {
      cursor: grab;
      color: var(--gray, #999);
      flex-shrink: 0;
    }

    .drag-handle:active { cursor: grabbing; }

    .coach-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .coach-avatar-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--darkGreen, #28413b);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--gray, #999);
    }

    .coach-info {
      flex: 1;
      min-width: 0;
    }

    .coach-info strong {
      display: block;
      font-size: 0.9rem;
      color: var(--white, #fff);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .coach-info .real-name {
      display: block;
      font-size: 0.8rem;
      color: var(--gray, #999);
    }

    .coach-info .role-badge {
      display: inline-block;
      font-size: 0.75rem;
      color: var(--green, #32D299);
      margin-top: 2px;
    }

    .coach-actions { flex-shrink: 0; }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--gray, #999);
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* ── Formulaire ── */
    .form-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--darkGreen, #28413b);
    }

    .form-section h3 {
      margin: 0 0 1rem 0;
      color: var(--white, #fff);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-row mat-form-field,
    mat-form-field.full-width {
      width: 100%;
    }

    .image-field {
      display: inline-block;
      margin: 0.5rem 0 1rem;
      max-width: 160px;
    }

    .image-field .field-label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--gray, #999);
      font-size: 0.875rem;
    }

    .image-field app-image-upload {
      display: block;
      width: 160px;
      height: 160px;
    }

    .social-panel {
      margin: 0.5rem 0 1rem;
      background: transparent;
      border: 1px solid var(--darkGreen, #28413b);
      border-radius: 8px;
      box-shadow: none;
    }

    .social-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      margin-left: 8px;
      border-radius: 10px;
      background: var(--green, #32D299);
      color: #101111;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }

    .error-message {
      padding: 0.75rem;
      background: #231210;
      color: #ff8a80;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  `],
  template: `
    <h2 mat-dialog-title>Coaching staff — {{ team.name }}</h2>

    <mat-dialog-content>
      <!-- ── Liste ── -->
      <div class="section-header">
        <h3>Coachs ({{ coaches().length }})</h3>
        <button
          mat-raised-button
          color="primary"
          (click)="startCreate()"
          aria-label="Ajouter un coach"
        >
          <mat-icon aria-hidden="true">add</mat-icon>
          Ajouter un coach
        </button>
      </div>

      @if (loading()) {
        <div role="status" aria-label="Chargement en cours">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-block sk-handle"></div>
              <div class="skeleton-block sk-avatar"></div>
              <div class="sk-info">
                <div class="skeleton-block sk-name"></div>
                <div class="skeleton-block sk-role"></div>
              </div>
              <div class="skeleton-block sk-btns"></div>
            </div>
          }
        </div>
      } @else if (coaches().length === 0) {
        <p class="empty-state">Aucun coach dans cette équipe.</p>
      } @else {
        <div cdkDropList (cdkDropListDropped)="onDrop($event)" aria-label="Liste des coachs, déplaçable">
          @for (coach of coaches(); track coach.id) {
            <div class="coach-row" cdkDrag>
              <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner" [attr.aria-label]="'Réordonner ' + coach.name">
                <mat-icon aria-hidden="true">drag_indicator</mat-icon>
              </div>

              @if (coach.image) {
                <img [src]="coach.image" [alt]="coach.name" class="coach-avatar" />
              } @else {
                <div class="coach-avatar-placeholder" aria-hidden="true">
                  <mat-icon>person</mat-icon>
                </div>
              }

              <div class="coach-info">
                <strong>{{ coach.name }}</strong>
                @if (coach.realName) {
                  <span class="real-name">{{ coach.realName }}</span>
                }
                <span class="role-badge">{{ coach.role }}</span>
              </div>

              <div class="coach-actions">
                <button
                  mat-icon-button
                  [attr.aria-label]="'Modifier ' + coach.name"
                  matTooltip="Modifier"
                  (click)="startEdit(coach)"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  [attr.aria-label]="'Supprimer ' + coach.name"
                  matTooltip="Supprimer"
                  (click)="confirmDelete(coach)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── Formulaire (create / edit) ── -->
      @if (mode() !== 'list') {
        <div class="form-section">
          <h3>{{ mode() === 'edit' ? 'Modifier' : 'Ajouter' }} un coach</h3>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Nom (pseudo)</mat-label>
                <input matInput formControlName="name" required aria-required="true" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nom réel</mat-label>
                <input matInput formControlName="realName" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rôle (Head Coach, Analyste…)</mat-label>
              <input matInput formControlName="role" required aria-required="true" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Biographie</mat-label>
              <textarea matInput formControlName="biography" rows="3"></textarea>
            </mat-form-field>

            <div class="image-field">
              <span id="photo-coach-label" class="field-label">Photo du coach</span>
              <app-image-upload
                aria-labelledby="photo-coach-label"
                [currentImage]="form.get('image')?.value"
                description="Photo du coach. Format carré recommandé."
                (imageUploaded)="onImageUploaded($event)"
                (imageRemoved)="onImageRemoved()"
              />
            </div>

            <mat-expansion-panel
              class="social-panel"
              [expanded]="socialCount() > 0"
            >
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Réseaux sociaux
                  @if (socialCount(); as count) {
                    <span class="social-badge">{{ count }}</span>
                  }
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="form-row" (input)="refreshSocialCount()">
                <mat-form-field appearance="outline">
                  <mat-label>Twitter</mat-label>
                  <input matInput formControlName="twitter" type="url" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Twitch</mat-label>
                  <input matInput formControlName="twitch" type="url" />
                </mat-form-field>
              </div>

              <div class="form-row" (input)="refreshSocialCount()">
                <mat-form-field appearance="outline">
                  <mat-label>Instagram</mat-label>
                  <input matInput formControlName="instagram" type="url" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>YouTube</mat-label>
                  <input matInput formControlName="youtube" type="url" />
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            @if (error()) {
              <div class="error-message" role="alert">{{ error() }}</div>
            }

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelForm()">Annuler</button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!form.valid || saving()"
              >
                {{ saving() ? 'Enregistrement...' : (mode() === 'edit' ? 'Mettre à jour' : 'Ajouter') }}
              </button>
            </div>
          </form>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fermer</button>
    </mat-dialog-actions>
  `,
})
export class CoachingStaffDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CoachingStaffDialogComponent>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly coachingStaffService = inject(CoachingStaffService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly team: Team = this.data.team;

  readonly coaches = signal<CoachingStaffMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly mode = signal<FormMode>('list');
  readonly editingCoach = signal<CoachingStaffMember | undefined>(undefined);
  readonly socialCount = signal<number>(0);

  readonly isEditMode = computed(() => this.mode() === 'edit');

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      realName: [''],
      role: ['', Validators.required],
      image: [''],
      biography: [''],
      twitter: [''],
      twitch: [''],
      instagram: [''],
      youtube: [''],
    });

    // Sync form with editingCoach signal
    effect(() => {
      const coach = this.editingCoach();
      if (coach) {
        this.form.patchValue({
          name: coach.name,
          realName: coach.realName ?? '',
          role: coach.role,
          image: coach.image ?? '',
          biography: coach.biography ?? '',
          twitter: coach.socials?.twitter ?? '',
          twitch: coach.socials?.twitch ?? '',
          instagram: coach.socials?.instagram ?? '',
          youtube: coach.socials?.youtube ?? '',
        });
      } else {
        this.form.reset();
      }
      this.refreshSocialCount();
    });
  }

  ngOnInit(): void {
    this.loadCoaches();
  }

  private loadCoaches(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.coachingStaffService.list(this.team.id).subscribe({
      next: (coaches) => {
        this.coaches.set([...coaches].sort((a, b) => a.position - b.position));
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Load coaches error:', err);
        this.error.set('Erreur lors du chargement du coaching staff');
        this.loading.set(false);
      },
    });
  }

  startCreate(): void {
    this.editingCoach.set(undefined);
    this.mode.set('create');
    this.error.set(undefined);
  }

  startEdit(coach: CoachingStaffMember): void {
    this.editingCoach.set(coach);
    this.mode.set('edit');
    this.error.set(undefined);
  }

  cancelForm(): void {
    this.mode.set('list');
    this.editingCoach.set(undefined);
    this.error.set(undefined);
    this.form.reset();
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    const v = this.form.value;
    const isEdit = this.isEditMode();
    const clearVal = isEdit ? null : undefined;

    const socials = {
      twitter: v.twitter || clearVal,
      twitch: v.twitch || clearVal,
      instagram: v.instagram || clearVal,
      youtube: v.youtube || clearVal,
    };

    this.saving.set(true);
    this.error.set(undefined);

    if (isEdit) {
      const coach = this.editingCoach()!;
      const dto: UpdateCoachingStaffDto = {
        name: v.name,
        realName: v.realName || null,
        role: v.role,
        image: v.image || null,
        biography: v.biography || null,
        socials,
      };

      this.coachingStaffService.update(this.team.id, coach.id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadCoaches();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set("Erreur lors de la mise à jour");
          console.error('Update coach error:', err);
        },
      });
    } else {
      const dto: CreateCoachingStaffDto = {
        name: v.name,
        realName: v.realName || undefined,
        role: v.role,
        image: v.image || undefined,
        biography: v.biography || undefined,
        socials,
      };

      this.coachingStaffService.create(this.team.id, dto).subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.loadCoaches();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set("Erreur lors de la création");
          console.error('Create coach error:', err);
        },
      });
    }
  }

  confirmDelete(coach: CoachingStaffMember): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer ${coach.name} ?`,
      },
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.coachingStaffService.delete(this.team.id, coach.id).subscribe({
        next: () => this.loadCoaches(),
        error: (err: unknown) => {
          this.error.set('Erreur lors de la suppression');
          console.error('Delete coach error:', err);
        },
      });
    });
  }

  onDrop(event: CdkDragDrop<CoachingStaffMember[]>): void {
    const coaches = [...this.coaches()];
    moveItemInArray(coaches, event.previousIndex, event.currentIndex);

    const items = coaches.map((c, idx) => ({ id: c.id, position: idx }));

    this.coachingStaffService.reorder(this.team.id, items).subscribe({
      next: () => this.coaches.set(coaches),
      error: (err: unknown) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder coaches error:', err);
        this.loadCoaches();
      },
    });
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  refreshSocialCount(): void {
    const v = this.form.value;
    const count = [v.twitter, v.twitch, v.instagram, v.youtube].filter(Boolean).length;
    this.socialCount.set(count);
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
