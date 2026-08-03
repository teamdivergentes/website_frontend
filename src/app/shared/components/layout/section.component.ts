import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Section d'une page publique, avec son titre optionnel.
 *
 * Le titre est rendu en `<h2>` : c'est le niveau attendu sous le `<h1>` de
 * `dvg-page-header`. Cette contrainte est volontaire — l'audit du 2026-08-02 a
 * trouve un `<h2>` place avant le `<h1>` de sa page et un `<h2>` deux fois plus
 * grand que le `<h1>` de la meme page, deux defauts qu'un niveau choisi pour son
 * rendu plutot que pour la structure rend possibles.
 */
@Component({
  selector: 'dvg-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dvg-section">
      @if (heading()) {
        <h2 [class]="'dvg-section__heading heading-' + headingSize()">{{ heading() }}</h2>
      }
      <ng-content />
    </section>
  `,
  styleUrl: './section.component.scss',
})
export class SectionComponent {
  /** Titre de la section. Rendu en `<h2>`. Omis, la section n'a pas de titre. */
  readonly heading = input<string>();

  /** Palier de l'echelle applique au titre de section. */
  readonly headingSize = input<'3' | '4' | '5'>('3');
}
