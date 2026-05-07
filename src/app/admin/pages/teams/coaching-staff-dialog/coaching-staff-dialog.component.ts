import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
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
import { AuthService } from '../../../../../shared/services/api/auth.service';
import { environment } from '../../../../../environments/environment';

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
  styleUrl: './coaching-staff-dialog.component.scss',
  template: `
    <h2 mat-dialog-title>Coaching staff — {{ team.name }}</h2>

    <mat-dialog-content>
      <!-- ── Liste ── -->
      <div class="section-header">
        <h3>Coachs ({{ coaches().length }})</h3>
        @if (canWrite()) {
          <button
            mat-raised-button
            color="primary"
            (click)="startCreate()"
            aria-label="Ajouter un coach"
          >
            <mat-icon aria-hidden="true">add</mat-icon>
            Ajouter un coach
          </button>
        }
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
                  [disabled]="!canWrite()"
                  (click)="startEdit(coach)"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  [attr.aria-label]="'Supprimer ' + coach.name"
                  matTooltip="Supprimer"
                  [disabled]="!canDelete()"
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
                <mat-label>Nom (pseudo) *</mat-label>
                <input matInput #nameInput formControlName="name" cdkFocusInitial aria-required="true" />
                @if (form.get('name')?.hasError('required')) {
                  <mat-error>Le nom est obligatoire</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nom réel</mat-label>
                <input matInput formControlName="realName" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rôle (Head Coach, Analyste…) *</mat-label>
              <input matInput formControlName="role" aria-required="true" />
              @if (form.get('role')?.hasError('required')) {
                <mat-error>Le rôle est obligatoire</mat-error>
              }
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
                  @if (form.get('twitter')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Twitch</mat-label>
                  <input matInput formControlName="twitch" type="url" />
                  @if (form.get('twitch')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row" (input)="refreshSocialCount()">
                <mat-form-field appearance="outline">
                  <mat-label>Instagram</mat-label>
                  <input matInput formControlName="instagram" type="url" />
                  @if (form.get('instagram')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>YouTube</mat-label>
                  <input matInput formControlName="youtube" type="url" />
                  @if (form.get('youtube')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row" (input)="refreshSocialCount()">
                <mat-form-field appearance="outline">
                  <mat-label>Discord</mat-label>
                  <input matInput formControlName="discord" type="url" />
                  @if (form.get('discord')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Site web</mat-label>
                  <input matInput formControlName="website" type="url" />
                  @if (form.get('website')?.hasError('pattern')) {
                    <mat-error>URL invalide (doit commencer par http:// ou https://)</mat-error>
                  }
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
  private readonly authService = inject(AuthService);

  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  readonly team: Team = this.data.team;

  readonly coaches = signal<CoachingStaffMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly mode = signal<FormMode>('list');
  readonly editingCoach = signal<CoachingStaffMember | undefined>(undefined);
  readonly socialCount = signal<number>(0);

  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly canWrite = computed(() => this.authService.hasPermission('coaching_staff:write'));
  readonly canDelete = computed(() => this.authService.hasPermission('coaching_staff:delete'));

  private readonly URL_PATTERN = /^https?:\/\/.+/;

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      realName: [''],
      role: ['', Validators.required],
      image: [''],
      biography: [''],
      twitter: ['', [Validators.pattern(this.URL_PATTERN)]],
      twitch: ['', [Validators.pattern(this.URL_PATTERN)]],
      instagram: ['', [Validators.pattern(this.URL_PATTERN)]],
      youtube: ['', [Validators.pattern(this.URL_PATTERN)]],
      discord: ['', [Validators.pattern(this.URL_PATTERN)]],
      website: ['', [Validators.pattern(this.URL_PATTERN)]],
    });

    // Sync form with editingCoach signal + focus on first field
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
          discord: coach.socials?.discord ?? '',
          website: coach.socials?.website ?? '',
        });
      } else {
        this.form.reset();
      }
      this.refreshSocialCount();
      setTimeout(() => this.nameInput?.nativeElement.focus(), 0);
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
        if (!environment.production) console.error('Load coaches error:', err);
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
      discord: v.discord || clearVal,
      website: v.website || clearVal,
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
          if (!environment.production) console.error('Update coach error:', err);
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
          if (!environment.production) console.error('Create coach error:', err);
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
          if (!environment.production) console.error('Delete coach error:', err);
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
        if (!environment.production) console.error('Reorder coaches error:', err);
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
    const count = [v.twitter, v.twitch, v.instagram, v.youtube, v.discord, v.website].filter(Boolean).length;
    this.socialCount.set(count);
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
