/**
 * Utilitaires partagés pour l'affichage du placement d'un trophée.
 *
 * @param placement  Valeur numérique du placement (1, 2, 3, n)
 * @param withRank   Si true, ajoute un suffixe textuel après la médaille (ex : « 🥇 1er »)
 * @returns Chaîne affichable pour le template
 */
export function placementLabel(placement: number, withRank = false): string {
  if (placement === 1) return withRank ? '🥇 1er' : '🥇';
  if (placement === 2) return withRank ? '🥈 2e' : '🥈';
  if (placement === 3) return withRank ? '🥉 3e' : '🥉';
  return `Top ${placement}`;
}

/**
 * Texte accessible (aria-label) pour un placement.
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
