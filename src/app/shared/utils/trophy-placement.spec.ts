import { placementLabel, placementAria } from './trophy-placement';

/** Emojis médaille bannis du rendu (traitement typographique maison). */
const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '🏆'];

describe('placementLabel', () => {
  it('retourne « 1er » pour la 1re place (forme courte)', () => {
    expect(placementLabel(1)).toBe('1er');
  });

  it('retourne « 2e » pour la 2e place (forme courte)', () => {
    expect(placementLabel(2)).toBe('2e');
  });

  it('retourne « 3e » pour la 3e place (forme courte)', () => {
    expect(placementLabel(3)).toBe('3e');
  });

  it('retourne Top n pour un placement > 3', () => {
    expect(placementLabel(4)).toBe('Top 4');
    expect(placementLabel(8)).toBe('Top 8');
  });

  it('retourne « 1re place » avec withRank=true', () => {
    expect(placementLabel(1, true)).toBe('1re place');
  });

  it('retourne « 2e place » avec withRank=true', () => {
    expect(placementLabel(2, true)).toBe('2e place');
  });

  it('retourne « 3e place » avec withRank=true', () => {
    expect(placementLabel(3, true)).toBe('3e place');
  });

  it('retourne Top n même avec withRank=true pour placement > 3', () => {
    expect(placementLabel(16, true)).toBe('Top 16');
  });

  it("n'émet AUCUN emoji médaille, quelle que soit la forme", () => {
    for (const p of [1, 2, 3, 4, 8, 16]) {
      for (const emoji of MEDAL_EMOJIS) {
        expect(placementLabel(p)).not.toContain(emoji);
        expect(placementLabel(p, true)).not.toContain(emoji);
      }
    }
  });
});

describe('placementAria', () => {
  it('retourne "1re place" pour placement=1', () => {
    expect(placementAria(1)).toBe('1re place');
  });

  it('retourne "2e place" pour placement=2', () => {
    expect(placementAria(2)).toBe('2e place');
  });

  it('retourne "3e place" pour placement=3', () => {
    expect(placementAria(3)).toBe('3e place');
  });

  it('retourne "Top n" pour placement > 3', () => {
    expect(placementAria(4)).toBe('Top 4');
  });
});
