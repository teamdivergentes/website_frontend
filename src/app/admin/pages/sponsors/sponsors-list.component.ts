import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Sponsor } from '../../../shared/models';

/**
 * Composant de liste des sponsors avec drag & drop
 */
@Component({
  selector: 'app-sponsors-list',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sponsors-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
      @for (sponsor of sponsors; track sponsor.id) {
        <div class="sponsor-item" cdkDrag>
          <div class="drag-handle" cdkDragHandle>
            <mat-icon>drag_indicator</mat-icon>
          </div>

          <div class="sponsor-thumb">
            @if (getPrimaryImage(sponsor)) {
              <img [src]="getPrimaryImage(sponsor)!" [alt]="sponsor.name" />
            } @else {
              <div class="no-image">
                <mat-icon>image</mat-icon>
              </div>
            }
          </div>

          <div class="sponsor-info">
            <h3>{{ sponsor.name }}</h3>
            <div class="meta">
              <span class="images-count">
                <mat-icon>image</mat-icon>
                {{ sponsor.images.length }}
              </span>
              <span class="links-count">
                <mat-icon>link</mat-icon>
                {{ sponsor.links.length }}
              </span>
              @if (sponsor.startDate || sponsor.endDate) {
                <span class="dates">
                  <mat-icon>calendar_today</mat-icon>
                  @if (sponsor.startDate) {
                    {{ formatDate(sponsor.startDate) }}
                  }
                  @if (sponsor.endDate) {
                    - {{ formatDate(sponsor.endDate) }}
                  }
                </span>
              }
            </div>
          </div>

          <mat-slide-toggle
            [checked]="sponsor.active"
            (change)="toggle.emit(sponsor)"
            matTooltip="Activer/Désactiver">
          </mat-slide-toggle>

          <div class="actions">
            <button mat-icon-button
                    matTooltip="Gérer les images"
                    (click)="manageImages.emit(sponsor)">
              <mat-icon>collections</mat-icon>
            </button>
            <button mat-icon-button
                    matTooltip="Gérer les liens"
                    (click)="manageLinks.emit(sponsor)">
              <mat-icon>link</mat-icon>
            </button>
            <button mat-icon-button
                    matTooltip="Modifier"
                    (click)="edit.emit(sponsor)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button
                    color="warn"
                    matTooltip="Supprimer"
                    (click)="delete.emit(sponsor)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      } @empty {
        <p class="empty-list">Aucun sponsor</p>
      }
    </div>
  `,
  styles: [`
    .sponsors-list {
      padding: 1rem 0;
      min-height: 200px;
    }

    .empty-list {
      text-align: center;
      padding: 3rem;
      color: var(--gray, #999);
    }

    .sponsor-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: var(--card-bg, #1e1e1e);
      border-radius: 8px;
      border: 1px solid var(--border, #333);
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary, #32D299);
      }
    }

    .drag-handle {
      cursor: move;
      color: var(--gray, #999);
    }

    .sponsor-thumb {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-dark, #121212);
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 0.25rem;
      }

      .no-image {
        color: var(--gray, #999);
      }
    }

    .sponsor-info {
      flex: 1;

      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--white, #fff);
        font-size: 1rem;
      }

      .meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--gray, #999);

        span {
          display: flex;
          align-items: center;
          gap: 0.25rem;

          mat-icon {
            font-size: 1rem;
            width: 1rem;
            height: 1rem;
          }
        }
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class SponsorsListComponent {
  @Input({ required: true }) sponsors!: Sponsor[];

  @Output() edit = new EventEmitter<Sponsor>();
  @Output() delete = new EventEmitter<Sponsor>();
  @Output() toggle = new EventEmitter<Sponsor>();
  @Output() reorder = new EventEmitter<number[]>();
  @Output() manageImages = new EventEmitter<Sponsor>();
  @Output() manageLinks = new EventEmitter<Sponsor>();

  /**
   * Gère le drop pour réordonner
   */
  onDrop(event: CdkDragDrop<Sponsor[]>): void {
    const sponsors = [...this.sponsors];
    moveItemInArray(sponsors, event.previousIndex, event.currentIndex);
    this.reorder.emit(sponsors.map(s => s.id));
  }

  /**
   * Récupère l'image principale
   */
  getPrimaryImage(sponsor: Sponsor): string | null {
    return sponsor.images.find(i => i.isPrimary)?.url ||
           sponsor.images[0]?.url ||
           null;
  }

  /**
   * Formate une date
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
