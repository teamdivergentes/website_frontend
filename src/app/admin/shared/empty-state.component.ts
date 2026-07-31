import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Genre grammatical de l'entite, pour accorder "Aucun" / "Aucune". */
export type EntityGender = 'm' | 'f';

/**
 * Etat vide des pages d'administration.
 *
 * L'audit du 2026-07-29 a releve **16 formulations differentes** pour le meme
 * concept, reparties sur **7 noms de classe** (`.empty-state`, `.empty-list`,
 * `.empty-message`, `.empty-data-state`, `.chart-empty`, `.geo-empty`,
 * `.table-empty`) dont un seul etait stylé de facon partagee. La ponctuation
 * finale etait presente 4 fois sur 16, l'icone 6 fois, l'action 5 fois.
 *
 * Le gabarit est ici unique : "Aucun{e} {entite}", sans point final, avec icone
 * et action optionnelles.
 *
 * A ne pas confondre avec `<app-error-state>` : un etat vide dit qu'il n'y a
 * rien a montrer, une erreur dit qu'on n'a pas pu savoir. Les deux ne doivent
 * jamais etre affiches en meme temps.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      @if (icon()) {
        <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      }
      <p>{{ resolvedMessage() }}</p>
      @if (actionLabel()) {
        <button
          mat-stroked-button
          type="button"
          data-testid="empty-action"
          (click)="action.emit()"
        >
          @if (actionIcon()) {
            <mat-icon aria-hidden="true">{{ actionIcon() }}</mat-icon>
          }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  /** Nom de l'entite au singulier, en minuscules (ex. "article", "équipe"). */
  readonly entity = input<string>('');
  /** Genre de l'entite, pour accorder "Aucun" / "Aucune". */
  readonly gender = input<EntityGender>('m');
  /** Message complet, quand le gabarit ne convient pas (ex. resultat de recherche). */
  readonly message = input<string>('');
  readonly icon = input<string>('');
  readonly actionLabel = input<string>('');
  readonly actionIcon = input<string>('add');

  readonly action = output<void>();

  /** Message explicite s'il est fourni, sinon le gabarit. Jamais de point final. */
  readonly resolvedMessage = computed(() => {
    const custom = this.message().trim();
    if (custom) return custom;
    return `Aucun${this.gender() === 'f' ? 'e' : ''} ${this.entity()}`.trim();
  });
}
