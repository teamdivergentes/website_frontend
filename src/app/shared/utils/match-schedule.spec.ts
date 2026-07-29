import { formatRelativeSchedule } from './match-schedule';

describe('formatRelativeSchedule', () => {
  // Référence fixe : mercredi 5 août 2026, 14:00 heure locale.
  const now = new Date(2026, 7, 5, 14, 0, 0);

  const at = (y: number, m: number, d: number, h: number, min = 0): string =>
    new Date(y, m, d, h, min, 0).toISOString();

  it("affiche 'moins d'une heure' sous 60 minutes", () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 14, 30), now)).toBe(
      "DANS MOINS D'UNE HEURE",
    );
  });

  it('affiche l\'heure seule le jour même au-delà d\'une heure', () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 20), now)).toBe('AUJOURD\'HUI 20:00');
  });

  it('affiche "demain" avec l\'heure', () => {
    expect(formatRelativeSchedule(at(2026, 7, 6, 20), now)).toBe('DEMAIN 20:00');
  });

  it('affiche le nombre de jours et le jour abrégé entre 2 et 6 jours', () => {
    expect(formatRelativeSchedule(at(2026, 7, 8, 20), now)).toBe('DANS 3 JOURS — SAM. 20:00');
  });

  it('affiche la date complète à 7 jours ou plus', () => {
    // 15 août 2026 est un samedi (la référence `now` est le mercredi 5 août).
    expect(formatRelativeSchedule(at(2026, 7, 15, 20), now)).toBe('SAM. 15 AOÛT, 20:00');
  });

  it('traite un match déjà commencé comme "moins d\'une heure"', () => {
    expect(formatRelativeSchedule(at(2026, 7, 5, 13, 30), now)).toBe(
      "DANS MOINS D'UNE HEURE",
    );
  });

  it('compte les jours en jours calendaires, pas en tranches de 24 h', () => {
    // 23:00 demain = moins de 24 h d'écart, mais c'est bien "demain".
    const tardDemain = formatRelativeSchedule(at(2026, 7, 6, 23), now);
    expect(tardDemain).toBe('DEMAIN 23:00');
  });
});
