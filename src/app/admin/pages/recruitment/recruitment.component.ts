import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost } from '../../../shared/models';
import { RecruitmentFormDialogComponent } from './recruitment-form-dialog.component';

/**
 * Page d'administration des offres de recrutement avec drag & drop pour réordonner
 * Permet de créer, modifier, supprimer et activer/désactiver des offres
 */
@Component({
  selector: 'app-recruitment-admin',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="recruitment-admin-page">
      <div class="page-header">
        <h1>Gestion du Recrutement</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouvelle offre
        </button>
      </div>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else if (posts().length === 0) {
        <div class="empty-state">
          <p>Aucune offre créée. Commencez par en ajouter une !</p>
        </div>
      } @else {
        <div class="posts-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
          @for (post of posts(); track trackByPost($index, post)) {
            <div class="post-item" cdkDrag>
              <div class="drag-handle" cdkDragHandle>
                <mat-icon>drag_indicator</mat-icon>
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
                <mat-slide-toggle
                  [checked]="post.active"
                  (change)="toggleActive(post, $event)"
                  matTooltip="Activer/Désactiver">
                </mat-slide-toggle>

                <button mat-icon-button (click)="openEditDialog(post)" matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>

                <button mat-icon-button color="warn" (click)="deletePost(post, $event)" matTooltip="Supprimer">
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
      background: rgba(50, 210, 153, 0.1);
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
  `]
})
export class RecruitmentComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Computed signal pour toutes les offres
  readonly posts = this.recruitmentService.allPosts;

  ngOnInit(): void {
    this.loadPosts();
  }

  /**
   * Charge les offres depuis l'API
   */
  loadPosts(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.recruitmentService.loadAllPosts().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des offres');
        console.error('Load posts error:', err);
      }
    });
  }

  /**
   * Gère le drop pour réordonner les offres
   */
  onDrop(event: CdkDragDrop<RecruitmentPost[]>): void {
    const posts = [...this.posts()];
    moveItemInArray(posts, event.previousIndex, event.currentIndex);

    // Met à jour les positions
    const reorderData = posts.map((post, index) => ({
      id: post.id,
      position: index
    }));

    this.recruitmentService.reorderPosts(reorderData).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadPosts();
      }
    });
  }

  /**
   * Toggle actif/inactif d'une offre
   */
  toggleActive(post: RecruitmentPost, _event: unknown): void {
    this.recruitmentService.toggleActive(post.id).subscribe({
      error: (err) => {
        this.error.set('Erreur lors du changement de statut');
        console.error('Toggle error:', err);
        this.loadPosts();
      }
    });
  }

  /**
   * Ouvre le modal de création d'offre
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(RecruitmentFormDialogComponent, {
      width: '920px',
      maxWidth: '95vw',
      data: { post: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPosts();
      }
    });
  }

  /**
   * Ouvre le modal d'édition d'offre
   */
  openEditDialog(post: RecruitmentPost): void {
    const dialogRef = this.dialog.open(RecruitmentFormDialogComponent, {
      width: '920px',
      maxWidth: '95vw',
      data: { post }
    });

    dialogRef.afterClosed().subscribe(result => {
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

    if (!window.confirm(`Voulez-vous vraiment supprimer l'offre "${post.title}" ?`)) {
      return;
    }

    this.recruitmentService.deletePost(post.id).subscribe({
      next: () => {
        // La suppression est gérée par le signal dans le service
      },
      error: (err) => {
        this.error.set('Erreur lors de la suppression');
        console.error('Delete error:', err);
      }
    });
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByPost(index: number, post: RecruitmentPost): number {
    return post.id;
  }
}
