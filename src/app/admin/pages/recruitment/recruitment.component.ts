import { Component, OnInit, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost } from '../../../shared/models';
import { RecruitmentFormDialogComponent } from './recruitment-form-dialog.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { environment } from '../../../../environments/environment';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { createReorder } from '../../shared/use-reorder';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { openOnCreateParam } from '../../shared/open-on-create-param';

/**
 * Page d'administration des offres de recrutement avec drag & drop pour reordonner.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
 */
@Component({
  selector: 'app-recruitment-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DragDropModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ,
    SkeletonComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    ErrorStateComponent],
  template: `
    <div class="recruitment-admin-page">
      <app-page-header title="Gestion du Recrutement">
        <button actions mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouvelle offre
        </button>
      </app-page-header>

      @if (error()) {
        <app-error-state [message]="error()!" [retrying]="loading()" (retry)="retryLoad()" />
      }

      <!-- Region aria-live pour les annonces de reorder -->
      <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status">{{ liveMessage() }}</div>

      @if (loading()) {
        <app-skeleton variant="list" [rows]="3" [hasThumb]="true" [hasHandle]="true" />
      } @else if (posts().length === 0) {
        <app-empty-state entity="offre" gender="f" icon="campaign" />
      } @else {
        <div class="posts-list" cdkDropList (cdkDropListDropped)="onDrop($event)" aria-label="Liste des offres, réordonnable">
          @for (post of posts(); track trackByPost($index, post); let i = $index) {
            <div class="post-item" cdkDrag>
              <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner" aria-hidden="true">
                <mat-icon aria-hidden="true">drag_indicator</mat-icon>
              </div>

              <div class="post-image">
                @if (post.image) {
                  <img [src]="post.image" [alt]="post.title" />
                } @else {
                  <div class="no-image">
                    <mat-icon>image</mat-icon>
                  </div>
                }
              </div>

              <div class="post-info">
                <h3>{{ post.title }}</h3>
                <p class="post-type">{{ post.type }}</p>
                <p class="post-description">{{ post.description | slice:0:100 }}{{ post.description.length > 100 ? '...' : '' }}</p>
              </div>

              <div class="post-actions">
                <button mat-icon-button
                  [disabled]="reordering() || i === 0"
                  (click)="onReorder(i, i - 1)"
                  [attr.aria-label]="'Deplacer ' + post.title + ' vers le haut'"
                  matTooltip="Monter">
                  <mat-icon aria-hidden="true">arrow_upward</mat-icon>
                </button>
                <button mat-icon-button
                  [disabled]="reordering() || i === posts().length - 1"
                  (click)="onReorder(i, i + 1)"
                  [attr.aria-label]="'Deplacer ' + post.title + ' vers le bas'"
                  matTooltip="Descendre">
                  <mat-icon aria-hidden="true">arrow_downward</mat-icon>
                </button>

                <mat-slide-toggle
                  [checked]="post.active"
                  (change)="toggleActive(post, $event)"
                  [attr.aria-label]="(post.active ? 'Désactiver ' : 'Activer ') + post.title"
                  matTooltip="Activer/Désactiver">
                </mat-slide-toggle>

                <button mat-icon-button (click)="openEditDialog(post)"
                  [attr.aria-label]="'Modifier ' + post.title"
                  matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>

                <button mat-icon-button color="warn" (click)="deletePost(post, $event)"
                  [attr.aria-label]="'Supprimer ' + post.title"
                  matTooltip="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    
    .post-type {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--admin-accent-border);
      border: 1px solid rgba(50, 210, 153, 0.25);
      border-radius: 4px;
      color: var(--green);
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .post-description {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 400px;
    }

    @media (max-width: 768px) {
      .post-item {
        flex-wrap: wrap;
      }

      .post-info {
        min-width: 0;
        flex-basis: calc(100% - 100px);
      }

      .post-description {
        max-width: 100%;
      }

      .post-actions {
        width: 100%;
        justify-content: flex-end;
        padding-top: 0.5rem;
        border-top: 1px solid var(--darkGreen);
        margin-top: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .drag-handle {
        display: none;
      }

      .post-image {
        display: none;
      }
    }
  `]
})
export class RecruitmentComponent implements OnInit {
  /**
   * Ouvre le formulaire de creation quand la palette de commandes le
   * demande par l'URL : cette creation n'a pas de route propre.
   */
  private readonly createOnDemand = openOnCreateParam(() => this.openCreateDialog());

  private readonly recruitmentService = inject(RecruitmentService);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Computed signal pour toutes les offres
  readonly posts = this.recruitmentService.allPosts;

  /**
   * Reordonnancement delegue au helper partage.
   * Declare apres `posts`, dont il depend a l'initialisation.
   */
  private readonly reorder = createReorder<RecruitmentPost>({
    items: this.posts,
    label: (post) => post.title,
    persist: (ordered) => this.recruitmentService.reorderPosts(ordered.map((post, index) => ({ id: post.id, position: index }))),
    onError: (err) => {
      this.notifier.error('Erreur lors de la réorganisation');
      if (!environment.production) {
        console.error('Reorder error:', err);
      }
      this.loadPosts();
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;

  ngOnInit(): void {
    this.loadPosts();
  }

  /**
   * Charge les offres depuis l'API
   */
  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.recruitmentService.loadAllPosts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Impossible de charger les offres.');
        if (!environment.production) console.error('Load posts error:', err);
      }
    });
  }

  /**
   * Gere le drop pour reordonner les offres (drag-drop CDK).
   */
  onDrop(event: CdkDragDrop<RecruitmentPost[]>): void {
    this.reorder.onDrop(event);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    this.reorder.onReorder(fromIndex, toIndex);
  }

  /**
   * Toggle actif/inactif d'une offre
   */
  toggleActive(post: RecruitmentPost, _event: unknown): void {
    this.recruitmentService.toggleActive(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackBar.open(
          `Offre "${post.title}" ${post.active ? 'désactivée' : 'activée'}`,
          'Fermer',
          { duration: 3000 }
        );
      },
      error: (err) => {
        this.notifier.error('Erreur lors du changement de statut');
        if (!environment.production) console.error('Toggle error:', err);
        this.loadPosts();
      }
    });
  }

  /**
   * Ouvre le modal de creation d'offre
   */
  openCreateDialog(): void {
    const dialogRef = this.adminDialog.open(RecruitmentFormDialogComponent, 'lg', { post: undefined });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.loadPosts();
      }
    });
  }

  /**
   * Ouvre le modal d'edition d'offre
   */
  openEditDialog(post: RecruitmentPost): void {
    const dialogRef = this.adminDialog.open(RecruitmentFormDialogComponent, 'lg', { post });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.loadPosts();
      }
    });
  }

  /**
   * Supprime une offre
   */
  deletePost(post: RecruitmentPost, event: Event): void {
    event.stopPropagation();

    this.confirm.delete("l'offre", post.title).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
      if (!confirmed) return;

      this.recruitmentService.deletePost(post.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.notifier.deleted('Offre', 'f');
        },
        error: (err) => {
          this.notifier.error('Erreur lors de la suppression');
          if (!environment.production) console.error('Delete error:', err);
        }
      });
    });
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByPost(index: number, post: RecruitmentPost): number {
    return post.id;
  }
}
