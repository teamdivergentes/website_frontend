/**
 * Utilitaires partagés pour l'affichage du placement d'un trophée.
 *
 * Le rang est désormais rendu de façon TYPOGRAPHIQUE (aucun emoji médaille).
 * L'habillage « médaille » (pastille or/argent/bronze désaturée) est porté par
 * le CSS des composants (`.hero-placement`, `.mosaic-placement`, `.row-placement`),
 * qui distingue les podiums via l'attribut `aria-label` (cf. {@link placementAria}).
 *
 * @param placement  Valeur numérique du placement (1, 2, 3, n)
 * @param withRank   Si true, retourne une forme descriptive longue (« 1re place »)
 *                   adaptée aux tableaux/labels ; sinon la forme courte (« 1er »).
 * @returns Chaîne affichable pour le template (jamais d'emoji)
 */
export function placementLabel(placement: number, withRank = false): string {
  if (placement === 1) return withRank ? '1re place' : '1er';
  if (placement === 2) return withRank ? '2e place' : '2e';
  if (placement === 3) return withRank ? '3e place' : '3e';
  return `Top ${placement}`;
}

/**
 * Texte accessible (aria-label) pour un placement.
 * Sert aussi de sélecteur CSS pour teinter les pastilles podium.
 *
 * @param placement  Valeur numérique du placement
 * @returns Chaîne descriptive lisible par un lecteur d'écran
 */
export function placementAria(placement: number): string {
  if (placement === 1) return '1re place';
  if (placement === 2) return '2e place';
  if (placement === 3) return '3e place';
  return `Top ${placement}`;
}
