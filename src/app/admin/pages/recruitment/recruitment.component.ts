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
    .recruitment-admin-page {
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 700;
      }
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .post-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      &.cdk-drag-preview {
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
    }

    .drag-handle {
      cursor: move;
      color: #999;
      display: flex;
      align-items: center;

      mat-icon {
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
      }
    }

    .post-image {
      width: 80px;
      height: 80px;
      border-radius: 4px;
      overflow: hidden;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        color: #ccc;

        mat-icon {
          font-size: 2rem;
          width: 2rem;
          height: 2rem;
        }
      }
    }

    .post-info {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }

      .post-type {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .post-description {
        margin: 0;
        color: #999;
        font-size: 0.875rem;
        line-height: 1.4;
      }
    }

    .post-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
      width: '600px',
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
      width: '600px',
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
