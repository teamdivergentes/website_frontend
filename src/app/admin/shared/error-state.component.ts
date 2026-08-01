import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Bandeau d'erreur persistant pour les pages d'administration.
 *
 * Remplace le couple "snackbar de 3 secondes + etat vide" qui laissait croire
 * qu'une base etait vide alors que l'API etait en panne : l'administrateur qui
 * ratait le snackbar voyait "Aucun role cree" en permanence, et pouvait recreer
 * des entites en double.
 *
 * Regle d'usage : quand une page a une erreur de chargement, elle rend ce
 * composant **et non** son etat vide. Les deux ne sont jamais visibles ensemble.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-state" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <p>{{ message() }}</p>
      @if (retryable()) {
        <button
          mat-flat-button
          type="button"
          data-testid="error-retry"
          [disabled]="retrying()"
          (click)="retry.emit()"
        >
          <mat-icon aria-hidden="true">refresh</mat-icon>
          {{ retrying() ? 'Rechargement…' : 'Réessayer' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2.5rem 1.5rem;
      text-align: center;
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: var(--admin-radius-sm);

      mat-icon {
        color: #ef5350;
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }

      p {
        margin: 0;
        color: var(--white);
        font-size: 0.9375rem;
      }
    }
  `],
})
export class ErrorStateComponent {
  /** Message affiche a l'utilisateur. Doit dire ce qui a echoue, pas "une erreur est survenue". */
  readonly message = input.required<string>();
  /** Faux quand l'erreur n'est pas transitoire (droits insuffisants, ressource absente). */
  readonly retryable = input<boolean>(true);
  /** Vrai pendant que le rechargement declenche par l'utilisateur est en cours. */
  readonly retrying = input<boolean>(false);

  readonly retry = output<void>();
}
