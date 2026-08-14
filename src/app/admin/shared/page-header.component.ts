import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * En-tete des pages d'administration.
 *
 * La mise en page, la marge, la taille du titre et le responsive viennent
 * entierement de `styles/_admin-shared.scss` : ce composant ne fait que porter
 * le markup, pour que treize pages cessent de le recopier.
 *
 * **Ne pas y ajouter de styles locaux de `.page-header`.** Le bloc partage est
 * scope a `.admin-layout`, soit la meme specificite qu'un style de composant :
 * un doublon local ne gagnerait que par ordre d'injection, ce qui est
 * exactement le piege qui avait rendu mortes onze declarations reparties dans
 * huit fichiers.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <!-- Precede le titre : bouton de retour d'une page de detail, par exemple. -->
      <ng-content select="[leading]" />
      <div class="page-header-text">
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="subtitle">{{ subtitle() }}</p>
        }
        @if (count() !== null) {
          <p class="subtitle" data-testid="page-count">{{ countText() }}</p>
        }
        <!-- Sous-titre interactif, que l'entree texte ne peut pas porter. -->
        <ng-content select="[subtitle]" />
      </div>
      <ng-content select="[actions]" />
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  /** Nombre d'elements. `null` masque le compteur ; zero reste affiche. */
  readonly count = input<number | null>(null);
  /** Nom de l'entite au singulier. */
  readonly countLabel = input<string>('');
  /** Pluriel explicite, quand la regle par defaut ne suffit pas. */
  readonly countLabelPlural = input<string>('');

  readonly countText = computed(() => {
    const n = this.count() ?? 0;
    const label = this.countLabel();
    if (!label) return String(n);
    const word = n > 1 ? (this.countLabelPlural() || pluralize(label)) : label;
    return `${n} ${word}`;
  });
}

/**
 * Pluriel francais pour les cas courants du panel.
 *
 * Un simple ajout de "s" produisait "jeus". Les regles couvertes suffisent au
 * vocabulaire de l'admin ; pour tout mot irregulier, passer `countLabelPlural`.
 */
function pluralize(word: string): string {
  // Deja au pluriel ou invariable.
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z')) return word;
  // bureau -> bureaux, jeu -> jeux
  if (word.endsWith('eau') || word.endsWith('eu')) return `${word}x`;
  // journal -> journaux
  if (word.endsWith('al')) return `${word.slice(0, -2)}aux`;
  return `${word}s`;
}
