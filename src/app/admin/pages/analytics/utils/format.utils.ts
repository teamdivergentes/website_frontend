/**
 * Utilitaires de formatage partagés entre les composants analytics.
 * Centralisés ici pour éviter la duplication (FIX BETA-005).
 */

/**
 * Formate une durée en secondes en "Xm XXs"
 * @example formatDuration(142) → "2m 22s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0m 00s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Formate un nombre entier avec suffixe k / M pour les grandes valeurs.
 * @example formatNumber(1500) → "1.5k"
 * @example formatNumber(2_500_000) → "2.5M"
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

/**
 * Formate un nombre en pourcentage avec une décimale.
 * @example formatPercent(45.3) → "45.3%"
 */
export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}
