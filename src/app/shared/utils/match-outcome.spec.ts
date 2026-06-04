import { Match } from '../models/match.model';
import { matchOutcome, outcomeLabel, outcomeAria } from './match-outcome';

describe('matchOutcome', () => {
  it('retourne "win" quand scoreDvg > scoreOpponent', () => {
    expect(matchOutcome({ scoreDvg: 2, scoreOpponent: 1 })).toBe('win');
  });

  it('retourne "loss" quand scoreDvg < scoreOpponent', () => {
    expect(matchOutcome({ scoreDvg: 0, scoreOpponent: 2 })).toBe('loss');
  });

  it('retourne "draw" quand les scores sont égaux', () => {
    expect(matchOutcome({ scoreDvg: 1, scoreOpponent: 1 })).toBe('draw');
  });

  it('retourne null quand scoreDvg est null', () => {
    expect(matchOutcome({ scoreDvg: null, scoreOpponent: 1 })).toBeNull();
  });

  it('retourne null quand scoreOpponent est null', () => {
    expect(matchOutcome({ scoreDvg: 2, scoreOpponent: null })).toBeNull();
  });

  it('retourne null quand les deux scores sont null', () => {
    expect(matchOutcome({ scoreDvg: null, scoreOpponent: null })).toBeNull();
  });
});

describe('outcomeLabel', () => {
  it('retourne "V" pour win', () => {
    expect(outcomeLabel('win')).toBe('V');
  });

  it('retourne "D" pour loss', () => {
    expect(outcomeLabel('loss')).toBe('D');
  });

  it('retourne "N" pour draw', () => {
    expect(outcomeLabel('draw')).toBe('N');
  });
});

describe('outcomeAria', () => {
  const baseMatch: Match = {
    id: 1,
    teamId: 1,
    opponentName: 'Team Rivale',
    scheduledAt: '2025-06-15T18:00:00.000Z',
    scoreDvg: 2,
    scoreOpponent: 1,
  };

  it('retourne un label victoire avec le score', () => {
    expect(outcomeAria({ ...baseMatch, scoreDvg: 2, scoreOpponent: 1 })).toBe(
      'Victoire 2 à 1 contre Team Rivale',
    );
  });

  it('retourne un label défaite avec le score', () => {
    expect(outcomeAria({ ...baseMatch, scoreDvg: 0, scoreOpponent: 2 })).toBe(
      'Défaite 0 à 2 contre Team Rivale',
    );
  });

  it('retourne un label nul avec le score', () => {
    expect(outcomeAria({ ...baseMatch, scoreDvg: 1, scoreOpponent: 1 })).toBe(
      'Match nul 1 à 1 contre Team Rivale',
    );
  });

  it('retourne un label générique quand les scores sont absents', () => {
    expect(
      outcomeAria({ ...baseMatch, scoreDvg: null, scoreOpponent: null }),
    ).toBe('Match contre Team Rivale');
  });
});
