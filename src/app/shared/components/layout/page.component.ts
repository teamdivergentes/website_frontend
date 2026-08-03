import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Enveloppe d'une page publique : conteneur et rythme vertical.
 *
 * Remplace le couple `<section class="ma-page"><div class="small-container">`
 * que chaque page reecrivait avec sa propre largeur. L'audit du 2026-08-02 a
 * releve 75 `max-width` en dur pour 32 valeurs distinctes, alors que
 * `_containers.scss` proposait deja trois largeurs — utilisees par 3 pages
 * sur 21.
 */
@Component({
  selector: 'dvg-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dvg-page">
      @if (container() === 'none') {
        <ng-content />
      } @else {
        <div [class]="containerClass()">
          <ng-content />
        </div>
      }
    </section>
  `,
  styleUrl: './page.component.scss',
})
export class PageComponent {
  /**
   * Largeur du conteneur. Regle arretee avec le PO le 2026-08-03 :
   *
   * - `xs` (960px)  : pages de lecture et de formulaire — contact, pages
   *   legales, candidature, 404. Au-dela, la ligne de texte depasse la longueur
   *   confortable a la lecture.
   * - `sm` (1350px) : pages de contenu et de listing — articles, equipes,
   *   recrutement, twitch, sponsors, boutique.
   * - `none`        : heros pleine largeur, qui gerent leur propre mise en page
   *   — accueil, structure.
   *
   * `md` et `lg` restent disponibles mais ne sont pas dans la regle : les
   * utiliser demande une raison.
   *
   * Avant cette regle, sept largeurs cohabitaient (700, 800, 840, 960, 1200,
   * 1350, 1600) avec des gouttieres de 16, 24 ou 108px selon la page.
   */
  readonly container = input<'xs' | 'sm' | 'md' | 'lg' | 'none'>('sm');

  protected containerClass = computed(() => `container-${this.container()}`);
}
