import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Barre d'outils de l'éditeur d'articles.
 * Affiche le titre de la page, le bouton retour, et les actions (Enregistrer, Supprimer).
 *
 * Inputs :
 * - isEditMode  : true si on modifie un article existant
 * - saving      : true pendant l'enregistrement (désactive les boutons)
 * - formValid   : true si le formulaire est valide
 *
 * Outputs :
 * - saveClicked   : demande de sauvegarde
 * - deleteClicked : demande de suppression
 * - cancelClicked : retour à la liste
 */
@Component({
  selector: 'app-article-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="page-header">
      <div class="header-left">
        <button
          class="btn-back"
          (click)="cancelClicked.emit()"
          aria-label="Retour à la liste des articles"
        >
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
          Retour
        </button>
        <h1>{{ isEditMode() ? "Modifier l'article" : 'Nouvel article' }}</h1>
      </div>

      <div class="header-actions">
        @if (isEditMode()) {
          <button
            type="button"
            class="btn btn-danger"
            (click)="deleteClicked.emit()"
            [disabled]="saving()"
            aria-label="Supprimer l'article"
          >
            <mat-icon aria-hidden="true">delete</mat-icon>
            Supprimer
          </button>
        }

        <button
          type="button"
          class="btn btn-primary"
          (click)="saveClicked.emit()"
          [disabled]="saving() || !formValid()"
          aria-label="Enregistrer l'article"
        >
          @if (saving()) {
            <span class="spinner-small" role="status" aria-label="Enregistrement en cours"></span>
            Enregistrement...
          } @else {
            <mat-icon aria-hidden="true">save</mat-icon>
            Enregistrer
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;

        @media (max-width: 599px) {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--white);
          letter-spacing: -0.02em;
        }
      }

      .btn-back {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(211, 211, 211, 0.6);
        font-size: 0.875rem;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        transition:
          color 0.2s ease,
          background 0.2s ease;
        font-family: inherit;

        mat-icon {
          font-size: 1.1rem;
          width: 1.1rem;
          height: 1.1rem;
        }

        &:hover {
          color: var(--white);
          background: rgba(255, 255, 255, 0.05);
        }
      }

      .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;

        mat-icon {
          font-size: 1.1rem;
          width: 1.1rem;
          height: 1.1rem;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.btn-primary {
          background: var(--green);
          color: var(--black);

          &:hover:not(:disabled) {
            background: rgba(50, 210, 153, 0.85);
          }
        }

        &.btn-danger {
          background: rgba(244, 67, 54, 0.1);
          color: #ef5350;
          border: 1px solid rgba(244, 67, 54, 0.2);

          &:hover:not(:disabled) {
            background: rgba(244, 67, 54, 0.2);
          }
        }
      }

      .spinner-small {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        flex-shrink: 0;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ArticleToolbarComponent {
  readonly isEditMode = input.required<boolean>();
  readonly saving = input.required<boolean>();
  readonly formValid = input.required<boolean>();

  readonly saveClicked = output<void>();
  readonly deleteClicked = output<void>();
  readonly cancelClicked = output<void>();
}
