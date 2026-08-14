/**
 * Repli textuel d'écusson quand `opponentLogo` est absent — ce qui est le cas
 * de tous les adversaires aujourd'hui, aucun logo n'étant saisi en base.
 *
 * Découpe le nom sur les espaces et les tirets, sélectionne les mots de 3 lettres
 * ou plus, puis retourne :
 * - 2 mots retenus ou plus → leurs initiales (max 3 caractères)
 * - Exactement 1 mot retenu → ses 3 premières lettres
 * - Aucun mot retenu → les 3 premiers caractères alphanumériques du nom
 *   (couvre « G2 », « M8 »)
 * - Résultat toujours en majuscules
 */
export function opponentInitials(name: string): string {
  const mots = name.trim().split(/[\s-]+/).filter(Boolean);
  if (mots.length === 0) return '';

  const significatifs = mots.filter(m => m.length >= 3);

  if (significatifs.length === 0) {
    // Extraire les 3 premiers caractères alphanumériques du nom
    const alphanumeric = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3);
    return alphanumeric.toUpperCase();
  }

  if (significatifs.length === 1) {
    return significatifs[0].slice(0, 3).toUpperCase();
  }

  return significatifs
    .slice(0, 3)
    .map(m => m[0])
    .join('')
    .toUpperCase();
}
