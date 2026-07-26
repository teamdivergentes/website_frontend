import { opponentInitials } from './opponent-initials';

describe('opponentInitials', () => {
  it('prend les initiales de deux mots', () => {
    expect(opponentInitials('Gentle Mates')).toBe('GM');
  });

  it('plafonne a trois caracteres', () => {
    expect(opponentInitials('Karmine Corp Blue Academy')).toBe('KCB');
  });

  it('prend les trois premieres lettres d\'un mot unique', () => {
    expect(opponentInitials('Solary')).toBe('SOL');
  });

  it('ignore les mots de moins de trois lettres', () => {
    expect(opponentInitials('Team BDS')).toBe('BDS');
  });

  it('gere les espaces multiples et superflus', () => {
    expect(opponentInitials('  Vitality   Bee  ')).toBe('VB');
  });

  it('retourne une chaine vide pour une entree vide', () => {
    expect(opponentInitials('')).toBe('');
    expect(opponentInitials('   ')).toBe('');
  });

  it('retombe sur le mot court si tous les mots sont courts', () => {
    expect(opponentInitials('G2')).toBe('G2');
  });
});
