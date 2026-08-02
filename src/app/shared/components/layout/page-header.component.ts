import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * En-tete de page publique.
 *
 * Remplace les en-tetes recopies d'une page a l'autre : sur-titre, titre
 * principal avec fragment en surbrillance, sous-titre. L'audit du 2026-08-02 en
 * a releve autant de variantes que de pages.
 *
 * Un element portant l'attribut `header-before` est projete AVANT le sur-titre.
 * Sans ce slot, le seul point de projection etait en fin de template et les
 * heros riches — images decoratives posees au-dessus du label, comme sur
 * `/structure` — ne pouvaient pas entrer dans le gabarit.
 *
 * Le titre est toujours rendu en `<h1>` : c'est ce qui garantit la regle « un
 * seul `<h1>` par page », qu'aucune page ne pouvait tenir tant que chacune
 * ecrivait sa propre structure. Pour une page dont le titre visible n'est pas le
 * `<h1>` (une fiche joueur, par exemple), utiliser `visuallyHidden`.
 */
@Component({
  selector: 'dvg-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="dvg-page-header" [class.dvg-page-header--center]="centered()">
      <!-- Slot amont : voir la note sur header-before dans la doc de classe. -->
      <ng-content select="[header-before]" />

      @if (eyebrow()) {
        <p class="dvg-page-header__eyebrow heading-label">{{ eyebrow() }}</p>
      }

      <h1 [class]="titleClasses()" [attr.id]="titleId() || null">
        {{ title() }}@if (highlight()) {
          <span class="heading__highlight">{{ highlight() }}</span>
        }
      </h1>

      @if (subtitle()) {
        <p class="dvg-page-header__subtitle">{{ subtitle() }}</p>
      }

      <ng-content />
    </header>
  `,
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  /** Titre principal de la page. Rendu en `<h1>`. */
  readonly title = input.required<string>();

  /** Fragment affiche en degrade vert sous le titre, sur sa propre ligne. */
  readonly highlight = input<string>();

  /** Sur-titre en petites capitales espacees, au-dessus du titre. */
  readonly eyebrow = input<string>();

  /**
   * `id` pose sur le `<h1>` lui-meme, pour les pages dont une region porte un
   * `aria-labelledby`. Sans lui, l'`id` se poserait sur l'hote et la cible ne
   * serait plus le titre.
   */
  readonly titleId = input<string>();

  /** Ligne d'accroche sous le titre. */
  readonly subtitle = input<string>();

  /** Palier de l'echelle typographique applique au titre. */
  readonly size = input<'display' | '1' | '2'>('2');

  /** S'ecrit `centered` sans valeur dans le template. */
  readonly centered = input(false, { transform: booleanAttribute });

  /**
   * Masque l'en-tete visuellement en le laissant accessible. Pour les pages dont
   * le hero porte deja le titre visible mais qui doivent conserver un `<h1>`
   * pour le referencement et les lecteurs d'ecran.
   */
  readonly visuallyHidden = input(false, { transform: booleanAttribute });

  protected titleClasses(): string {
    const scale = this.size() === 'display' ? 'heading-display' : `heading-${this.size()}`;
    return this.visuallyHidden()
      ? `${scale} dvg-page-header__title visually-hidden`
      : `${scale} dvg-page-header__title`;
  }
}
