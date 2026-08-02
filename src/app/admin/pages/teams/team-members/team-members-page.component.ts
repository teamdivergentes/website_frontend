import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { TeamsService } from '../../../../shared/services';
import { Team, TeamMember } from '../../../../shared/models';
import {
  TeamMemberFormComponent,
  MemberSaveEvent,
} from './components/team-member-form/team-member-form.component';
import { TeamMemberListComponent } from './components/team-member-list/team-member-list.component';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { AdminNotifier } from '../../../shared/admin-notifier.service';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { ErrorStateComponent } from '../../../shared/error-state.component';
import { SkeletonComponent } from '../../../shared/skeleton.component';
import { createReorder } from '../../../shared/use-reorder';
import { HasUnsavedChanges } from '../../../shared/unsaved-changes.guard';
import { navigateAway } from '../../../shared/navigate-away';

/**
 * Gestion des membres d'une equipe.
 *
 * C'etait un dialogue de 1200px en `grid-template-columns: 1fr 1.2fr` : une mise
 * en page a deux colonnes dans une modale, pour onze controles **et** une liste
 * enfant reordonnable. La regle inscrite dans `frontend/CLAUDE.md` en violait
 * deux conditions sur trois.
 *
 * En page, l'ecran devient adressable — `/admin/teams/3/members` se partage en
 * support — et le retour arriere du navigateur y fonctionne.
 */
@Component({
  selector: 'app-team-members-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    TeamMemberFormComponent,
    TeamMemberListComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()">
      <button
        leading
        mat-icon-button
        class="back-button"
        aria-label="Retour aux équipes"
        (click)="backToTeams()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
    </app-page-header>

    @if (loadError()) {
      <app-error-state [message]="loadError()!" [retrying]="loading()" (retry)="loadTeam()" />
    } @else if (loading()) {
      <app-skeleton variant="list" [rows]="5" [hasThumb]="true" [hasHandle]="true" />
    } @else {
      <!-- Region aria-live pour les annonces de reorder -->
      <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status">
        {{ liveMessage() }}
      </div>

      <div class="members-layout">
        <app-team-member-form
          [editingMember]="editingMember()"
          [saving]="saving()"
          [error]="error()"
          (memberSaved)="onMemberSaved($event)"
          (editCancelled)="onEditCancelled()"
        />

        <app-team-member-list
          [members]="members()"
          [reordering]="reordering()"
          [grabbedIndex]="grabbedIndex()"
          (editMember)="startEdit($event)"
          (deleteMember)="confirmDelete($event)"
          (dropped)="onDrop($event)"
          (reorderRequest)="onReorder($event.fromIndex, $event.toIndex)"
          (handleKeydown)="onHandleKeydown($event.event, $event.index)"
        />
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-button {
        margin-right: var(--admin-space-2);
      }

      /* Les deux colonnes du dialogue d'origine, sans sa contrainte de largeur : */
      /* la liste n'a plus de max-height interne, c'est la page qui defile. */
      /* Seule page de l'EPIC a poser deux colonnes de contenu cote a cote, donc */
      /* seule a prendre la borne large : --admin-page-max ecraserait le */
      /* formulaire a ~500px. Voir _admin-tokens.scss. */
      .members-layout {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: var(--admin-space-7);
        align-items: start;
        max-width: var(--admin-page-max-split);
      }

      /* Sous la borne d'une colonne unique, les deux colonnes n'ont plus la */
      /* place d'exister : la page repasse au meme empilement que ses soeurs. */
      @media (max-width: 1100px) {
        .members-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TeamMembersPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly teamsService = inject(TeamsService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);

  /** Identifiant d'equipe porte par l'URL, ce qui rend la page partageable. */
  private readonly teamId = Number(this.route.snapshot.paramMap.get('id'));

  private readonly memberForm = viewChild(TeamMemberFormComponent);

  readonly team = signal<Team | undefined>(undefined);
  readonly members = signal<TeamMember[]>([]);
  readonly editingMember = signal<TeamMember | undefined>(undefined);
  readonly saving = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  /** Echec de resolution de l'equipe, distinct d'un echec d'enregistrement. */
  readonly loadError = signal<string | undefined>(undefined);

  /**
   * Le nom de l'equipe est la seule chose qui dit ou l'on est quand on arrive
   * par une URL partagee.
   */
  readonly title = computed(() => {
    const team = this.team();
    return team ? `Membres de ${team.name}` : 'Membres de l’équipe';
  });

  readonly subtitle = computed(() => this.team()?.game ?? '');

  /**
   * Reordonnancement delegue au helper partage.
   *
   * Il vivait ici en deux morceaux : la garde de concurrence dans le composant
   * liste (`resetReordering()`), la mecanique dans le dialogue. Le helper porte
   * les deux, plus le deplacement au clavier que cet ecran n'avait pas.
   */
  private readonly reorder = createReorder<TeamMember>({
    items: this.members,
    label: (member) => member.name,
    applyOptimistic: (ordered) => this.members.set(ordered),
    persist: (ordered) =>
      this.teamsService.reorderMembers(
        this.teamId,
        ordered.map((member, index) => ({ id: member.id, position: index })),
      ),
    onError: (err) => {
      this.error.set('Erreur lors de la réorganisation');
      if (!environment.production) console.error('Reorder members error:', err);
      this.reloadMembers();
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;
  readonly grabbedIndex = this.reorder.grabbedIndex;

  ngOnInit(): void {
    this.loadTeam();
  }

  /**
   * Resout l'equipe designee par l'URL, puis ses membres.
   *
   * Deux appels sont necessaires : la liste des equipes donne le nom et le slug
   * a partir de l'identifiant, le detail par slug donne les membres. Un
   * identifiant inconnu doit se lire comme une erreur, pas comme une equipe
   * vide — sinon rien ne distingue une URL fausse d'une equipe sans joueur.
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
          this.fetchMembers(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set('Impossible de charger cette équipe.');
          if (!environment.production) console.error('Load team error:', err);
        },
      });
  }

  /** Rafraichit la liste apres une mutation, sans repasser par le squelette. */
  private reloadMembers(): void {
    this.fetchMembers(false);
  }

  private fetchMembers(initial: boolean): void {
    const team = this.team();
    if (!team) return;

    this.teamsService
      .getTeamBySlug(team.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.members.set([...detail.members].sort((a, b) => a.position - b.position));
          if (initial) this.loading.set(false);
        },
        error: (err) => {
          if (initial) {
            this.loading.set(false);
            this.loadError.set('Impossible de charger les membres de cette équipe.');
          } else {
            this.error.set('Erreur lors du chargement des membres');
          }
          if (!environment.production) console.error('Load members error:', err);
        },
      });
  }

  onMemberSaved(event: MemberSaveEvent): void {
    this.saving.set(true);
    this.error.set(undefined);

    const request$ = event.editingMember
      ? this.teamsService.updateMember(this.teamId, event.editingMember.id, event.data)
      : this.teamsService.addMember(this.teamId, event.data);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.notifier.saved('Membre', event.editingMember ? 'edit' : 'create', 'm');
        this.editingMember.set(undefined);
        // Vide le formulaire meme en mode ajout, ou l'effet de synchronisation
        // ne se rejoue pas : sans cela la saisie deja enregistree restait a
        // l'ecran, et la garde de sortie la prenait pour un travail en cours.
        this.memberForm()?.resetForm();
        this.reloadMembers();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        if (!environment.production) console.error('Save member error:', err);
      },
    });
  }

  onEditCancelled(): void {
    this.editingMember.set(undefined);
  }

  startEdit(member: TeamMember): void {
    this.editingMember.set(member);
  }

  confirmDelete(member: TeamMember): void {
    this.confirm.delete('ce membre', member.name).subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.teamsService
        .deleteMember(this.teamId, member.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notifier.deleted('Membre', 'm');
            this.reloadMembers();
          },
          error: (err: unknown) => {
            this.error.set('Erreur lors de la suppression');
            if (!environment.production) console.error('Delete member error:', err);
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

  backToTeams(): void {
    navigateAway(this.router, ['/admin/teams']);
  }

  /**
   * Contrat de `unsavedChangesGuard`.
   *
   * `form.dirty` seul ne suffit pas ici : la liste enfant porte un second etat
   * volatil. Un deplacement au clavier n'est persiste qu'au depot, donc une
   * ligne saisie et deja bougee represente un travail non enregistre que rien
   * dans le formulaire ne signale.
   */
  hasUnsavedChanges(): boolean {
    if (this.grabbedIndex() !== -1) return true;
    return this.memberForm()?.form.dirty ?? false;
  }
}
