/**
 * Helpers pour les annonces aria-live apres un reorder drag-drop.
 * Fonctions pures, sans dependance Angular.
 */

/**
 * Construit le message d'annonce apres un reorder reussi.
 *
 * - Position 1 sur N  → "{nom} positionne en tete de liste."
 * - Position N sur N  → "{nom} positionne en fin de liste."
 * - Sinon             → "{nom} deplace en position {pos} sur {total}."
 */
export function buildReorderMessage(name: string, newPosition: number, total: number): string {
  if (newPosition === 1) {
    return `${name} positionne en tete de liste.`;
  }
  if (newPosition === total) {
    return `${name} positionne en fin de liste.`;
  }
  return `${name} deplace en position ${newPosition} sur ${total}.`;
}

/**
 * Construit le message d'annonce apres un echec de reorder (rollback API).
 */
export function buildReorderErrorMessage(name: string): string {
  return `Echec du reorder. Position de ${name} restauree.`;
}
