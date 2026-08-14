import { Match } from '../models/match.model';

export type MatchOutcome = 'win' | 'loss' | 'draw';

/**
 * Calcule le résultat d'un match DVG.
 * Retourne null si les scores ne sont pas disponibles.
 */
export function matchOutcome(
  match: Pick<Match, 'scoreDvg' | 'scoreOpponent'>,
): MatchOutcome | null {
  const { scoreDvg, scoreOpponent } = match;
  if (scoreDvg == null || scoreOpponent == null) return null;
  if (scoreDvg > scoreOpponent) return 'win';
  if (scoreDvg < scoreOpponent) return 'loss';
  return 'draw';
}

/**
 * Libellé court du résultat (affiché dans le badge).
 * 'V' | 'D' | 'N'
 */
export function outcomeLabel(outcome: MatchOutcome): string {
  if (outcome === 'win') return 'V';
  if (outcome === 'loss') return 'D';
  return 'N';
}

/**
 * Texte accessible (aria-label) pour un résultat de match.
 * Exemple : « Victoire 2 à 1 contre Adversaire »
 */
export function outcomeAria(match: Match): string {
  const outcome = matchOutcome(match);
  if (outcome == null) return `Match contre ${match.opponentName}`;
  const scoreStr = `${match.scoreDvg} à ${match.scoreOpponent}`;
  if (outcome === 'win') return `Victoire ${scoreStr} contre ${match.opponentName}`;
  if (outcome === 'loss') return `Défaite ${scoreStr} contre ${match.opponentName}`;
  return `Match nul ${scoreStr} contre ${match.opponentName}`;
}
