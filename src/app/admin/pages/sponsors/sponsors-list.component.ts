import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Sponsor } from '../../../shared/models';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../shared/utils/a11y-announce';
import { EmptyStateComponent } from '../../shared/empty-state.component';

/**
 * Composant de liste des sponsors avec drag & drop.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
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
  ,
    EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Region aria-live pour les annonces de reorder -->
    <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status">{{ liveMessage() }}</div>

    <div class="sponsors-list" cdkDropList (cdkDropListDropped)="onDrop($event)" aria-label="Liste des sponsors, réordonnable">
      @for (sponsor of sponsors(); track sponsor.id; let i = $index) {
        <div class="sponsor-item" cdkDrag>
          <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner" aria-hidden="true">
            <mat-icon aria-hidden="true">drag_indicator</mat-icon>
          </div>

          <div class="sponsor-thumb">
            @if (getPrimaryImage(sponsor)) {
              <img [src]="getPrimaryImage(sponsor)!" [alt]="sponsor.name" />
            } @else {
              <div class="no-image" aria-hidden="true">
                <mat-icon>image</mat-icon>
              </div>
            }
          </div>

          <div class="sponsor-info">
            <h3>{{ sponsor.name }}</h3>
            <div class="meta">
              <span class="images-count">
                <mat-icon aria-hidden="true">image</mat-icon>
                {{ sponsor.images.length }}
              </span>
              <span class="links-count">
                <mat-icon aria-hidden="true">link</mat-icon>
                {{ sponsor.links.length }}
              </span>
              @if (sponsor.startDate || sponsor.endDate) {
                <span class="dates">
                  <mat-icon aria-hidden="true">calendar_today</mat-icon>
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
            [attr.aria-label]="(sponsor.active ? 'Désactiver ' : 'Activer ') + sponsor.name"
            matTooltip="Activer/Désactiver">
          </mat-slide-toggle>

          <div class="actions">
            <button mat-icon-button
                    [disabled]="reordering() || i === 0"
                    (click)="onReorder(i, i - 1)"
                    [attr.aria-label]="'Deplacer ' + sponsor.name + ' vers le haut'"
                    matTooltip="Monter">
              <mat-icon aria-hidden="true">arrow_upward</mat-icon>
            </button>
            <button mat-icon-button
                    [disabled]="reordering() || i === sponsors().length - 1"
                    (click)="onReorder(i, i + 1)"
                    [attr.aria-label]="'Deplacer ' + sponsor.name + ' vers le bas'"
                    matTooltip="Descendre">
              <mat-icon aria-hidden="true">arrow_downward</mat-icon>
            </button>
            <button mat-icon-button
                    [attr.aria-label]="'Gérer les images de ' + sponsor.name"
                    matTooltip="Gérer les images"
                    (click)="manageImages.emit(sponsor)">
              <mat-icon>collections</mat-icon>
            </button>
            <button mat-icon-button
                    [attr.aria-label]="'Gérer les liens de ' + sponsor.name"
                    matTooltip="Gérer les liens"
                    (click)="manageLinks.emit(sponsor)">
              <mat-icon>link</mat-icon>
            </button>
            <button mat-icon-button
                    [attr.aria-label]="'Modifier ' + sponsor.name"
                    matTooltip="Modifier"
                    (click)="edit.emit(sponsor)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button
                    color="warn"
                    [attr.aria-label]="'Supprimer ' + sponsor.name"
                    matTooltip="Supprimer"
                    (click)="delete.emit(sponsor)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      } @empty {
        <app-empty-state entity="sponsor" icon="handshake" />
      }
    </div>
  `,
  styles: [`
    .sponsors-list {
      padding: 0;
      min-height: 200px;
    }

    .sponsor-item {
      margin-bottom: 0;
    }

    .sponsor-thumb img {
      object-fit: contain;
      padding: 0.25rem;
    }

    .sponsor-info .meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8125rem;
      color: rgba(211, 211, 211, 0.6);

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

    .empty-list {
      text-align: center;
      padding: 3rem;
      color: var(--gray);
    }

    @media (max-width: 768px) {
      .sponsor-item {
        flex-wrap: wrap;
      }

      .sponsor-info {
        min-width: 0;
        flex-basis: calc(100% - 100px);
      }

      .sponsor-info .meta {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .sponsor-info .dates {
        display: none !important;
      }

      .actions {
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
    }
  `]
})
export class SponsorsListComponent {
  readonly sponsors = input.required<Sponsor[]>();

  readonly edit = output<Sponsor>();
  readonly delete = output<Sponsor>();
  readonly toggle = output<Sponsor>();
  readonly reorder = output<number[]>();
  readonly manageImages = output<Sponsor>();
  readonly manageLinks = output<Sponsor>();

  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');
  /** Guard anti-double-clic : bloque les emissions concurrentes (SEC-PR206-001). */
  protected readonly reordering = signal(false);

  /**
   * Gere le drop pour reordonner (drag-drop CDK).
   */
  onDrop(event: CdkDragDrop<Sponsor[]>): void {
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

    const sponsors = [...this.sponsors()];
    moveItemInArray(sponsors, fromIndex, toIndex);
    const movedSponsor = sponsors[toIndex];

    // Annonce optimiste
    if (movedSponsor) {
      this.liveMessage.set(buildReorderMessage(movedSponsor.name, toIndex + 1, sponsors.length));
    }

    // Emet les IDs reordonnes vers le composant parent (qui appellera resetReordering via finalize)
    this.reorder.emit(sponsors.map(s => s.id));
  }

  /** Remet le guard reordering a false ; appele par le parent via finalize (SEC-PR206-001). */
  resetReordering(): void {
    this.reordering.set(false);
  }

  /**
   * Recupere l'image principale
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

  /** Appele en cas d'erreur reorder par le parent. */
  setErrorMessage(name: string): void {
    this.liveMessage.set(buildReorderErrorMessage(name));
  }
}
