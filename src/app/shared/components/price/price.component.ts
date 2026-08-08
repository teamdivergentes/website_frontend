import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

/**
 * Un prix, avec son prix catalogue barré quand une promotion court.
 *
 * **Pourquoi un composant plutôt qu'un `<s>` recopié.** Un prix barré est une
 * information, pas une décoration : barré à l'écran, il reste un nombre pour
 * une synthèse vocale, qui énonce alors deux montants à la suite sans dire
 * lequel est dû. Le traitement — annonce « ancien prix », rature plutôt que
 * couleur seule — doit être identique partout, or il y a quatre endroits où
 * un prix s'affiche : la fiche produit et les **trois** listes de boutique qui
 * coexistent en attendant l'arbitrage de l'EPIC-40.
 *
 * Le composant n'impose **aucune taille ni couleur** : il hérite de son hôte,
 * chaque liste ayant son échelle. Il ne décide que de ce qui doit être vrai
 * partout.
 */
@Component({
  selector: 'dvg-price',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (listPriceCents(); as oldPrice) {
      <span class="dvg-price__old">
        <span class="visually-hidden">Ancien prix&nbsp;: </span>
        <s>{{ oldPrice / 100 | number: '1.2-2' }}&nbsp;€</s>
      </span>
      <span class="visually-hidden">Prix réduit&nbsp;: </span>
    }
    <span class="dvg-price__now">{{ priceCents() / 100 | number: '1.2-2' }}&nbsp;€</span>
  `,
  styles: `
    :host {
      display: inline;
    }

    .dvg-price__old {
      font-size: 0.62em;
      color: rgb(255 255 255 / 55%);
      margin-right: 0.3em;
    }
  `,
})
export class PriceComponent {
  /** Ce que le client paie. */
  readonly priceCents = input.required<number>();

  /**
   * Prix catalogue à barrer, `null` hors promotion.
   *
   * Sa seule présence déclenche l'affichage : le composant ne compare pas les
   * deux montants pour deviner s'il y a une promotion. C'est le serveur qui le
   * dit, et lui seul connaît la fenêtre de validité.
   */
  readonly listPriceCents = input<number | null>(null);
}
