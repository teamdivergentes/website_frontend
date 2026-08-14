/**
 * Formatage de l'échéance d'un match en langage relatif.
 *
 * Le format brut (« Mer. 5 Août, 20:00 ») impose au visiteur de calculer
 * lui-même la proximité du match. Ces libellés la donnent directement.
 *
 * Fonction pure : `now` n'est injecté que par les tests. En production,
 * l'appel se fait sans second argument et la valeur est recalculée à chaque
 * rendu via un `computed()` — pas de timer, la granularité au jour ne le
 * justifie pas (cf. spec §4).
 */

const JOURS_ABREGES = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Minuit du jour de la date fournie, heure locale. */
function debutDeJour(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Écart en jours calendaires (0 = même jour, 1 = demain). */
function ecartEnJours(depuis: Date, vers: Date): number {
  const ms = debutDeJour(vers).getTime() - debutDeJour(depuis).getTime();
  return Math.round(ms / 86_400_000);
}

function heure(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatRelativeSchedule(scheduledAt: string, now: Date = new Date()): string {
  const cible = new Date(scheduledAt);
  const deltaMs = cible.getTime() - now.getTime();

  // Match imminent ou déjà commencé.
  if (deltaMs < 3_600_000) return "DANS MOINS D'UNE HEURE";

  const jours = ecartEnJours(now, cible);

  if (jours === 0) return `AUJOURD'HUI ${heure(cible)}`;
  if (jours === 1) return `DEMAIN ${heure(cible)}`;
  if (jours < 7) {
    return `DANS ${jours} JOURS — ${JOURS_ABREGES[cible.getDay()].toUpperCase()} ${heure(cible)}`;
  }

  const jour = JOURS_ABREGES[cible.getDay()].toUpperCase();
  const mois = MOIS[cible.getMonth()].toUpperCase();
  return `${jour} ${cible.getDate()} ${mois}, ${heure(cible)}`;
}
