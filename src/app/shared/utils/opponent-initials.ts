/**
 * Repli textuel d'écusson quand `opponentLogo` est absent — ce qui est le cas
 * de tous les adversaires aujourd'hui, aucun logo n'étant saisi en base.
 *
 * Règle : initiales des mots de 3 lettres ou plus, 3 caractères maximum.
 * Un seul mot retenu → ses 3 premières lettres. Aucun mot retenu → le premier
 * mot tel quel, tronqué à 3 caractères (couvre « G2 », « M8 »…).
 */
export function opponentInitials(name: string): string {
  const mots = name.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '';

  const wordsToIgnore = ['team'];
  const significatifs = mots.filter(
    m => m.length >= 3 && !wordsToIgnore.includes(m.toLowerCase())
  );

  if (significatifs.length === 0) {
    return mots[0].slice(0, 3).toUpperCase();
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
