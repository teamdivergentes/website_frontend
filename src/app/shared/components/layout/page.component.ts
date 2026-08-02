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
   * Largeur du conteneur. `none` laisse la page gerer sa propre mise en page —
   * pour un hero pleine largeur, par exemple.
   */
  readonly container = input<'xs' | 'sm' | 'md' | 'lg' | 'none'>('md');

  protected containerClass = computed(() => `container-${this.container()}`);
}
