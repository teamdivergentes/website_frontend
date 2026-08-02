import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  OnInit,
  runInInjectionContext,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { CoachingStaffService, TeamsService } from '../../../../shared/services';
import {
  CoachingStaffMember,
  CreateCoachingStaffDto,
  Team,
  UpdateCoachingStaffDto,
} from '../../../../shared/models';
import { AuthService } from '../../../../../shared/services/api/auth.service';
import { environment } from '../../../../../environments/environment';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { FormActionsComponent } from '../../../shared/form-actions.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { ErrorStateComponent } from '../../../shared/error-state.component';
import { SkeletonComponent } from '../../../shared/skeleton.component';
import { createReorder } from '../../../shared/use-reorder';
import { HasUnsavedChanges } from '../../../shared/unsaved-changes.guard';
import { navigateAway } from '../../../shared/navigate-away';

type FormMode = 'list' | 'create' | 'edit';

/**
 * Gestion du staff de coaching d'une equipe.
 *
 * C'etait le dernier dialogue au palier `xl` : 1200px pour treize controles
 * **et** une liste enfant reordonnable, soit deux des trois conditions de la
 * regle inscrite dans `frontend/CLAUDE.md`. Le palier disparait avec cet ecran.
 *
 * Jumeau de `/admin/teams/:id/members`, dont il reprend le patron : resolution
 * de l'equipe par l'URL, `<app-page-header>` avec retour, etat d'erreur
 * reessayable, garde de sortie et `createReorder()`.
 *
 * Il en differe sur deux points, assumes :
 * - le formulaire reste **dans** la page plutot que dans un sous-composant, et
 *   n'apparait qu'en mode `create` / `edit` ; c'est la mise en page d'origine,
 *   et treize controles ne tiennent pas dans la seconde colonne qu'a la page
 *   membres ;
 * - un seul appel suffit a resoudre l'equipe, la liste des coachs ayant son
 *   propre endpoint par identifiant — la page membres devait, elle, repasser
 *   par le detail d'equipe par slug.
 */
@Component({
  selector: 'app-coaching-staff-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    DragDropModule,
    ImageUploadComponent,
    EmptyStateComponent,
    FormActionsComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  styleUrl: './coaching-staff-page.component.scss',
  templateUrl: './coaching-staff-page.component.html',
})
export class CoachingStaffPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly coachingStaffService = inject(CoachingStaffService);
  private readonly teamsService = inject(TeamsService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);

  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  /** Identifiant d'equipe porte par l'URL, ce qui rend la page partageable. */
  private readonly teamId = Number(this.route.snapshot.paramMap.get('id'));

  readonly team = signal<Team | undefined>(undefined);
  readonly coaches = signal<CoachingStaffMember[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  /** Echec de resolution de l'equipe ou du chargement initial de la liste. */
  readonly loadError = signal<string | undefined>(undefined);
  readonly mode = signal<FormMode>('list');
  readonly editingCoach = signal<CoachingStaffMember | undefined>(undefined);
  readonly socialCount = signal<number>(0);
  readonly customFieldsText = signal<string>('');
  readonly customFieldsError = signal<string | undefined>(undefined);

  readonly isEditMode = computed(() => this.mode() === 'edit');
  readonly canWrite = computed(() => this.authService.hasPermission('coaching_staff:write'));
  readonly canDelete = computed(() => this.authService.hasPermission('coaching_staff:delete'));

  /**
   * Le nom de l'equipe est la seule chose qui dit ou l'on est quand on arrive
   * par une URL partagee.
   */
  readonly title = computed(() => {
    const team = this.team();
    return team ? `Staff de coaching de ${team.name}` : 'Staff de coaching';
  });

  readonly subtitle = computed(() => this.team()?.game ?? '');

  private readonly URL_PATTERN = /^https?:\/\/.+/;

  readonly form: FormGroup;

  /**
   * Reordonnancement delegue au helper partage.
   *
   * Cet ecran avait ete laisse hors du helper a la feature 2 : sa mecanique
   * etait imbriquee dans le dialogue. Il y gagne le deplacement au clavier
   * (grab & move ARIA), que les seuls boutons Monter / Descendre n'offraient pas.
   */
  private readonly reorder = createReorder<CoachingStaffMember>({
    items: this.coaches,
    label: (coach) => coach.name,
    applyOptimistic: (ordered) => this.coaches.set(ordered),
    persist: (ordered) =>
      this.coachingStaffService.reorder(
        this.teamId,
        ordered.map((coach, index) => ({ id: coach.id, position: index })),
      ),
    onError: (err) => {
      this.error.set('Erreur lors de la réorganisation');
      if (!environment.production) console.error('Reorder coaches error:', err);
      this.reloadCoaches();
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;
  readonly grabbedIndex = this.reorder.grabbedIndex;

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

    // Synchronise le formulaire quand le coach edite change.
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
    });

    // Le focus initial etait offert par `cdkFocusInitial` du dialogue ; une page
    // n'a pas d'equivalent. Il suit donc l'ouverture du formulaire, et non le
    // coach edite : `editingCoach` vaut deja `undefined` avant un ajout, l'effet
    // de synchronisation ne se rejouerait pas.
    effect(() => {
      if (this.mode() === 'list') return;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => this.nameInput()?.nativeElement.focus());
      });
    });
  }

  ngOnInit(): void {
    this.loadTeam();
  }

  /**
   * Resout l'equipe designee par l'URL, puis son staff.
   *
   * Un identifiant inconnu doit se lire comme une erreur, pas comme une equipe
   * sans coach — sinon rien ne distingue une URL fausse d'un staff vide.
   */
  loadTeam(): void {
    this.loading.set(true);
    this.loadError.set(undefined);

    this.teamsService
      .loadTeams()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (teams) => {
          const team = teams.find((candidate) => candidate.id === this.teamId);
          if (!team) {
            this.loading.set(false);
            this.loadError.set("Cette équipe n'existe pas.");
            return;
          }
          this.team.set(team);
          this.fetchCoaches(true);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set('Impossible de charger cette équipe.');
          if (!environment.production) console.error('Load team error:', err);
        },
      });
  }

  /** Rafraichit la liste apres une mutation, sans repasser par le squelette. */
  private reloadCoaches(): void {
    this.fetchCoaches(false);
  }

  private fetchCoaches(initial: boolean): void {
    this.coachingStaffService
      .list(this.teamId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (coaches) => {
          this.coaches.set([...coaches].sort((a, b) => a.position - b.position));
          if (initial) this.loading.set(false);
        },
        error: (err: unknown) => {
          if (initial) {
            // En dialogue, cet echec n'alimentait que le bandeau du formulaire,
            // invisible en mode liste : la panne passait pour un staff vide.
            this.loading.set(false);
            this.loadError.set('Impossible de charger le staff de cette équipe.');
          } else {
            this.error.set('Erreur lors du chargement du coaching staff');
          }
          if (!environment.production) console.error('Load coaches error:', err);
        },
      });
  }

  startCreate(): void {
    this.editingCoach.set(undefined);
    this.mode.set('create');
    this.error.set(undefined);
    // `editingCoach` ne change pas quand on revient de la liste vers l'ajout :
    // l'effet de synchronisation ne se rejoue pas, le formulaire est donc vide
    // ici explicitement. Meme defaut que celui corrige sur la page membres.
    this.form.reset();
    this.customFieldsText.set('');
    this.customFieldsError.set(undefined);
    this.refreshSocialCount();
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

      this.coachingStaffService
        .update(this.teamId, coach.id, dto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.cancelForm();
            this.reloadCoaches();
          },
          error: (err: unknown) => {
            this.saving.set(false);
            this.error.set('Erreur lors de la mise à jour');
            if (!environment.production) console.error('Update coach error:', err);
          },
        });
      return;
    }

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

    this.coachingStaffService
      .create(this.teamId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.cancelForm();
          this.reloadCoaches();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la création');
          if (!environment.production) console.error('Create coach error:', err);
        },
      });
  }

  confirmDelete(coach: CoachingStaffMember): void {
    this.confirm.delete('ce coach', coach.name).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.coachingStaffService
        .delete(this.teamId, coach.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.reloadCoaches(),
          error: (err: unknown) => {
            this.error.set('Erreur lors de la suppression');
            if (!environment.production) console.error('Delete coach error:', err);
          },
        });
    });
  }

  onDrop(event: { previousIndex: number; currentIndex: number }): void {
    this.reorder.onDrop(event);
  }

  onReorder(fromIndex: number, toIndex: number): void {
    this.reorder.onReorder(fromIndex, toIndex);
  }

  onHandleKeydown(event: KeyboardEvent, index: number): void {
    this.reorder.onHandleKeydown(event, index);
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  refreshSocialCount(): void {
    const v = this.form.value;
    const count = [v.twitter, v.twitch, v.instagram, v.youtube, v.discord, v.website].filter(
      Boolean,
    ).length;
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

  backToTeams(): void {
    navigateAway(this.router, ['/admin/teams']);
  }

  /**
   * Contrat de `unsavedChangesGuard`.
   *
   * `form.dirty` seul ne suffit pas : la liste porte un second etat volatil.
   * Un deplacement au clavier n'est persiste qu'au depot, donc une ligne saisie
   * et deja bougee represente un travail non enregistre que rien dans le
   * formulaire ne signale.
   *
   * Le mode est verifie avec le formulaire : replie, il n'est plus a l'ecran,
   * et un residu de `dirty` retiendrait sur une page sans saisie visible.
   */
  hasUnsavedChanges(): boolean {
    if (this.grabbedIndex() !== -1) return true;
    return this.mode() !== 'list' && this.form.dirty;
  }
}
