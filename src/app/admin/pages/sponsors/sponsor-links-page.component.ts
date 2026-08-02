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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { AddLinkDto, LinkType, Sponsor, SponsorLink, UpdateLinkDto } from '../../../shared/models';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { AdminValidators, VALIDATION_MESSAGES } from '../../shared/admin-validators';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { FormActionsComponent } from '../../shared/form-actions.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { HasUnsavedChanges } from '../../shared/unsaved-changes.guard';
import { environment } from '../../../../environments/environment';

/** Mode d'affichage de la page : liste seule, ou liste + formulaire ouvert. */
type FormMode = 'list' | 'create' | 'edit';

/** Libelles des types de lien, dans l'ordre d'affichage du select. */
const LINK_TYPE_LABELS: Record<LinkType, string> = {
  [LinkType.WEBSITE]: 'Site web',
  [LinkType.TWITTER]: 'Twitter',
  [LinkType.INSTAGRAM]: 'Instagram',
  [LinkType.DISCORD]: 'Discord',
  [LinkType.PROMO_CODE]: 'Code promo',
  [LinkType.OTHER]: 'Autre',
};

/** Exemple d'URL propose selon le type choisi. */
const LINK_TYPE_PLACEHOLDERS: Record<LinkType, string> = {
  [LinkType.WEBSITE]: 'https://exemple.com',
  [LinkType.TWITTER]: 'https://twitter.com/sponsor',
  [LinkType.INSTAGRAM]: 'https://instagram.com/sponsor',
  [LinkType.DISCORD]: 'https://discord.gg/codeinvite',
  [LinkType.PROMO_CODE]: 'https://exemple.com/promo',
  [LinkType.OTHER]: 'https://exemple.com',
};

/** Valeurs d'un formulaire vierge. */
const EMPTY_LINK = {
  label: '',
  url: '',
  type: LinkType.WEBSITE,
  isPrimary: false,
};

/**
 * Gestion des liens d'un sponsor : site officiel, reseaux sociaux, code promo.
 *
 * C'etait le dernier dialogue au palier `lg` — une liste enfant **et** son
 * formulaire d'edition dans une meme modale, ce que la troisieme condition de
 * la regle inscrite dans `frontend/CLAUDE.md` interdit. Le palier disparait
 * avec cet ecran : `AdminDialogSize` ne porte plus que `sm` et `md`, et le type
 * devient le verrou de la regle.
 *
 * Le patron est celui de `/admin/teams/:id/coaching`, l'autre hybride
 * liste + formulaire reactif : l'identifiant vient de l'URL, un identifiant
 * inconnu rend un etat d'erreur reessayable, le formulaire ne s'ouvre qu'a la
 * demande, et la sortie est gardee. Il partage avec son jumeau
 * `/admin/sponsors/:id/images` la resolution du sponsor et le retour a la liste.
 *
 * Deux ecarts avec le dialogue d'origine, assumes :
 * - l'URL est desormais validee (`AdminValidators.url()`), la ou seul
 *   `required` s'appliquait : un « exemple.com » sans schema etait accepte et
 *   produisait un lien relatif casse sur la page publique ;
 * - enregistrer ne ferme plus l'ecran. Le dialogue se refermait apres chaque
 *   ajout, obligeant a le rouvrir pour saisir le lien suivant.
 */
@Component({
  selector: 'app-sponsor-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    EmptyStateComponent,
    ErrorStateComponent,
    FormActionsComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  templateUrl: './sponsor-links-page.component.html',
  styleUrl: './sponsor-links-page.component.scss',
})
export class SponsorLinksPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sponsorsService = inject(SponsorsService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);
  private readonly fb = inject(FormBuilder);
  private readonly injector = inject(Injector);

  private readonly labelInput = viewChild<ElementRef<HTMLInputElement>>('labelInput');

  /** Identifiant porte par l'URL, ce qui rend la page partageable. */
  private readonly sponsorId = Number(this.route.snapshot.paramMap.get('id'));

  readonly sponsor = signal<Sponsor | undefined>(undefined);
  readonly links = signal<SponsorLink[]>([]);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  /** Echec de resolution du sponsor : bloquant, la page n'a alors rien a montrer. */
  readonly loadError = signal<string | undefined>(undefined);
  readonly mode = signal<FormMode>('list');
  readonly editingLink = signal<SponsorLink | undefined>(undefined);
  /** Type courant du formulaire, pour l'exemple d'URL affiche en placeholder. */
  private readonly linkType = signal<LinkType>(LinkType.WEBSITE);

  readonly isEditMode = computed(() => this.mode() === 'edit');

  /** Le nom du sponsor est la seule chose qui dit ou l'on est sur une URL partagee. */
  readonly title = computed(() => {
    const sponsor = this.sponsor();
    return sponsor ? `Liens de ${sponsor.name}` : 'Liens du sponsor';
  });

  readonly subtitle = computed(() => this.sponsor()?.description ?? '');

  readonly urlPlaceholder = computed(() => LINK_TYPE_PLACEHOLDERS[this.linkType()]);

  /** Types proposes par le select, decrits une fois. */
  readonly linkTypes: readonly { value: LinkType; label: string }[] = (
    Object.keys(LINK_TYPE_LABELS) as LinkType[]
  ).map((value) => ({ value, label: LINK_TYPE_LABELS[value] }));

  readonly messages = VALIDATION_MESSAGES;

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      label: ['', Validators.required],
      // Le dialogue n'avait que `required` : "exemple.com" passait, et la page
      // publique en faisait un lien relatif casse.
      url: ['', [Validators.required, AdminValidators.url()]],
      type: [LinkType.WEBSITE, Validators.required],
      isPrimary: [false],
    });

    this.form
      .get('type')!
      .valueChanges.pipe(takeUntilDestroyed())
      .subscribe((type: LinkType) => this.linkType.set(type ?? LinkType.WEBSITE));

    // Synchronise le formulaire quand le lien edite change.
    effect(() => {
      const link = this.editingLink();
      if (link) {
        this.form.patchValue({
          label: link.label,
          url: link.url,
          type: link.type,
          isPrimary: link.isPrimary,
        });
      } else {
        this.form.reset(EMPTY_LINK);
      }
    });

    // Le focus initial etait offert par `autoFocus: 'first-tabbable'` du
    // dialogue ; une page n'a pas d'equivalent. Il suit donc l'ouverture du
    // formulaire, et non le lien edite : `editingLink` vaut deja `undefined`
    // avant un ajout, l'effet de synchronisation ne se rejouerait pas.
    effect(() => {
      if (this.mode() === 'list') return;
      runInInjectionContext(this.injector, () => {
        afterNextRender(() => this.labelInput()?.nativeElement.focus());
      });
    });
  }

  ngOnInit(): void {
    this.loadSponsor();
  }

  /**
   * Resout le sponsor designe par l'URL.
   *
   * Le dialogue recevait le sponsor tout fait par `MAT_DIALOG_DATA` : il ne
   * pouvait donc pas connaitre ce cas. Une page, elle, s'atteint par une URL
   * fausse ou perimee, et un identifiant inconnu doit se lire comme une erreur
   * et non comme un sponsor sans lien.
   */
  loadSponsor(): void {
    this.loading.set(true);
    this.loadError.set(undefined);
    this.fetchSponsor(true);
  }

  /** Rafraichit apres une mutation, sans repasser par le squelette. */
  private reloadSponsor(): void {
    this.fetchSponsor(false);
  }

  private fetchSponsor(initial: boolean): void {
    this.sponsorsService
      .loadAllSponsors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sponsors) => {
          if (initial) this.loading.set(false);
          const sponsor = sponsors.find((candidate) => candidate.id === this.sponsorId);
          if (!sponsor) {
            if (initial) {
              this.loadError.set("Ce sponsor n'existe pas.");
            } else {
              this.notifier.error('Ce sponsor a été supprimé');
            }
            return;
          }
          this.sponsor.set(sponsor);
          this.links.set([...sponsor.links]);
        },
        error: (err: unknown) => {
          // Le dialogue n'avait aucun gestionnaire ici : il ne rechargeait rien,
          // il se fermait. En page, une panne d'API apres une mutation laisserait
          // la liste dans son etat precedent sans rien dire — c'est le defaut
          // n°1 de l'audit dans sa variante silencieuse.
          if (initial) {
            this.loading.set(false);
            this.loadError.set('Impossible de charger ce sponsor.');
          } else {
            this.notifier.error('Impossible de rafraîchir les liens du sponsor');
          }
          if (!environment.production) console.error('Load sponsor links error:', err);
        },
      });
  }

  startCreate(): void {
    this.editingLink.set(undefined);
    this.mode.set('create');
    // `editingLink` ne change pas quand on revient de la liste vers l'ajout :
    // l'effet de synchronisation ne se rejoue pas, le formulaire est donc vide
    // ici explicitement. Meme defaut que celui corrige sur les pages d'equipe.
    this.form.reset(EMPTY_LINK);
  }

  startEdit(link: SponsorLink): void {
    this.editingLink.set(link);
    this.mode.set('edit');
  }

  cancelForm(): void {
    this.mode.set('list');
    this.editingLink.set(undefined);
    this.form.reset(EMPTY_LINK);
  }

  /** Ajoute ou met a jour un lien. */
  onSubmit(): void {
    if (this.form.invalid) {
      // Sans cela, cliquer sur le bouton de validation sur un formulaire
      // invalide ne produisait aucun retour visible.
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value as AddLinkDto & UpdateLinkDto;
    const editing = this.editingLink();
    this.saving.set(true);

    const request = editing
      ? this.sponsorsService.updateLink(this.sponsorId, editing.id, value)
      : this.sponsorsService.addLink(this.sponsorId, value);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifier.saved('Lien', editing ? 'edit' : 'create');
        this.cancelForm();
        this.reloadSponsor();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.notifier.error("Erreur lors de l'enregistrement du lien");
        if (!environment.production) console.error('Save link error:', err);
      },
    });
  }

  /** Supprime un lien, apres confirmation. */
  removeLink(link: SponsorLink): void {
    this.confirm.delete('ce lien', link.label).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.sponsorsService
        .removeLink(this.sponsorId, link.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notifier.deleted('Lien');
            // Le lien supprime pouvait etre celui en cours d'edition : le
            // formulaire pointerait alors sur une ressource disparue.
            if (this.editingLink()?.id === link.id) this.cancelForm();
            this.reloadSponsor();
          },
          error: (err: unknown) => {
            this.notifier.error('Erreur lors de la suppression du lien');
            if (!environment.production) console.error('Remove link error:', err);
          },
        });
    });
  }

  /** Libelle lisible d'un type de lien. */
  linkTypeLabel(type: LinkType): string {
    return LINK_TYPE_LABELS[type];
  }

  backToSponsors(): void {
    void this.router.navigate(['/admin/sponsors']);
  }

  /**
   * Contrat de `unsavedChangesGuard`.
   *
   * Composition classique du patron : le formulaire est le seul etat volatil de
   * cet ecran. Contrairement aux pages d'equipe, la liste des liens n'est pas
   * reordonnable — il n'y a donc pas de deplacement au clavier a proteger — et
   * contrairement a la page des images du meme sponsor, rien n'est persiste
   * avant la validation.
   *
   * Le mode est verifie avec le formulaire : replie, il n'est plus a l'ecran,
   * et un residu de `dirty` retiendrait sur une page sans saisie visible.
   */
  hasUnsavedChanges(): boolean {
    return this.mode() !== 'list' && this.form.dirty;
  }
}
