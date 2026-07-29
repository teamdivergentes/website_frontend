import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  OnInit,
  runInInjectionContext,
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
import { finalize } from 'rxjs';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { CoachingStaffService } from '../../../../shared/services';
import { CoachingStaffMember, CreateCoachingStaffDto, UpdateCoachingStaffDto, Team } from '../../../../shared/models';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { AuthService } from '../../../../../shared/services/api/auth.service';
import { environment } from '../../../../../environments/environment';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../../shared/utils/a11y-announce';
import { EmptyStateComponent } from '../../../shared/empty-state.component';

interface DialogData {
  team: Team;
}

type FormMode = 'list' | 'create' | 'edit';

/**
 * Dialog de gestion CRUD du coaching staff d'une equipe.
 * Composant unique (KISS) : liste + formulaire integres.
 * Pattern calque sur TeamMembersDialogComponent.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
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
    EmptyStateComponent],
  styleUrl: './coaching-staff-dialog.component.scss',
  templateUrl: './coaching-staff-dialog.component.html',
})
export class CoachingStaffDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CoachingStaffDialogComponent>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly coachingStaffService = inject(CoachingStaffService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);

  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  readonly team: Team = this.data.team;

  readonly coaches = signal<CoachingStaffMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly mode = signal<FormMode>('list');
  readonly editingCoach = signal<CoachingStaffMember | undefined>(undefined);
  readonly socialCount = signal<number>(0);
  readonly customFieldsText = signal<string>('');
  readonly customFieldsError = signal<string | undefined>(undefined);
  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');

  /** Guard anti-double-clic : bloque les appels API de reorder concurrents (SEC-PR206-001). */
  protected readonly reordering = signal(false);

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
      nationality: [''],
      birthDate: [''],
      biography: [''],
      customFields: [null as Record<string, unknown> | null],
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
          nationality: coach.nationality ?? '',
          birthDate: coach.birthDate ?? '',
          biography: coach.biography ?? '',
          customFields: coach.customFields ?? null,
          twitter: coach.socials?.twitter ?? '',
          twitch: coach.socials?.twitch ?? '',
          instagram: coach.socials?.instagram ?? '',
          youtube: coach.socials?.youtube ?? '',
          discord: coach.socials?.discord ?? '',
          website: coach.socials?.website ?? '',
        });
        this.customFieldsText.set(
          coach.customFields ? JSON.stringify(coach.customFields, null, 2) : '',
        );
      } else {
        this.form.reset();
        this.customFieldsText.set('');
      }
      this.customFieldsError.set(undefined);
      this.refreshSocialCount();
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => this.nameInput?.nativeElement.focus());
      });
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
    if (!this.form.valid) {
      // Sans cela, cliquer sur le bouton de validation sur un formulaire
      // invalide ne produisait aucun retour visible.
      this.form.markAllAsTouched();
      return;
    }

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
        nationality: v.nationality || null,
        birthDate: v.birthDate || null,
        biography: v.biography || null,
        customFields: v.customFields ?? undefined,
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
        nationality: v.nationality || undefined,
        birthDate: v.birthDate || undefined,
        biography: v.biography || undefined,
        customFields: v.customFields ?? undefined,
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

  /**
   * Reorder declenche par drag-drop CDK.
   */
  onDrop(event: CdkDragDrop<CoachingStaffMember[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.onReorder(event.previousIndex, event.currentIndex);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (this.reordering()) return;
    this.reordering.set(true);

    const coaches = [...this.coaches()];
    moveItemInArray(coaches, fromIndex, toIndex);
    this.coaches.set(coaches);

    const movedCoach = coaches[toIndex];
    // Annonce optimiste (aligne sur le pattern des autres composants — Finding 3)
    if (movedCoach) {
      this.liveMessage.set(buildReorderMessage(movedCoach.name, toIndex + 1, coaches.length));
    }

    const items = coaches.map((c, idx) => ({ id: c.id, position: idx }));

    this.coachingStaffService.reorder(this.team.id, items).pipe(
      finalize(() => this.reordering.set(false))
    ).subscribe({
      next: () => {
        // Annonce deja faite de facon optimiste ci-dessus
      },
      error: (err: unknown) => {
        this.error.set('Erreur lors de la réorganisation');
        if (!environment.production) console.error('Reorder coaches error:', err);
        if (movedCoach) {
          this.liveMessage.set(buildReorderErrorMessage(movedCoach.name));
        }
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

  onCustomFieldsInput(event: Event): void {
    const raw = (event.target as HTMLTextAreaElement).value.trim();
    this.customFieldsText.set(raw);
    if (!raw) {
      this.form.patchValue({ customFields: null });
      this.customFieldsError.set(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      this.form.patchValue({ customFields: parsed });
      this.customFieldsError.set(undefined);
    } catch {
      this.customFieldsError.set('JSON invalide');
    }
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
