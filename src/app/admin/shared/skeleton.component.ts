import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Forme du contenu attendu pendant le chargement. */
export type SkeletonVariant = 'list' | 'table' | 'grid';

/**
 * Squelette de chargement des pages d'administration.
 *
 * L'audit du 2026-07-29 a releve **11 declarations identiques** de
 * `@keyframes skeleton-pulse` et **10 copies octet-pour-octet** de
 * `.skeleton-block`, reparties entre des `styles: []` inline et des `.scss`
 * dedies. Quatre d'entre elles ne differaient que par la largeur de la barre
 * d'actions.
 *
 * L'animation et les classes vivent desormais dans `styles/_admin-skeleton.scss`,
 * charge globalement : ce composant se contente d'assembler la forme.
 *
 * Le projet impose un skeleton pour tout contenu dynamique — jamais de zone vide
 * ni de spinner generique.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="status"
      aria-label="Chargement en cours"
      [class]="containerClass()"
    >
      @for (row of rowIndexes(); track row) {
        <div class="skeleton-item" data-testid="skeleton-row">
          @switch (variant()) {
            @case ('table') {
              @for (col of columnIndexes(); track col) {
                <div class="skeleton-block skeleton-cell" aria-hidden="true"></div>
              }
            }
            @case ('grid') {
              <div class="skeleton-block skeleton-card-media" aria-hidden="true"></div>
              <div class="skeleton-block skeleton-title-bar" aria-hidden="true"></div>
              <div class="skeleton-block skeleton-subtitle-bar" aria-hidden="true"></div>
            }
            @default {
              @if (hasHandle()) {
                <div class="skeleton-block skeleton-handle" aria-hidden="true"></div>
              }
              @if (hasThumb()) {
                <div class="skeleton-block skeleton-thumb" aria-hidden="true"></div>
              }
              <div class="skeleton-info">
                <div class="skeleton-block skeleton-title-bar" aria-hidden="true"></div>
                <div class="skeleton-block skeleton-subtitle-bar" aria-hidden="true"></div>
              </div>
              <div class="skeleton-block skeleton-actions-bar" aria-hidden="true"></div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('list');
  readonly rows = input<number>(4);
  /** Nombre de colonnes, variante `table` uniquement. */
  readonly columns = input<number>(6);
  /** Vignette en tete de ligne, variante `list`. */
  readonly hasThumb = input<boolean>(false);
  /** Poignee de reordonnancement, variante `list`. */
  readonly hasHandle = input<boolean>(false);

  readonly containerClass = computed(() => `skeleton-${this.variant()}`);

  readonly rowIndexes = computed(() =>
    Array.from({ length: Math.max(0, this.rows()) }, (_, i) => i),
  );

  readonly columnIndexes = computed(() =>
    Array.from({ length: Math.max(0, this.columns()) }, (_, i) => i),
  );
}
