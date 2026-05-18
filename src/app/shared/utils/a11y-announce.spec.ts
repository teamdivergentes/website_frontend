import { buildReorderMessage, buildReorderErrorMessage } from './a11y-announce';

describe('a11y-announce helpers', () => {
  describe('buildReorderMessage', () => {
    it('should return "tete de liste" message when position is 1', () => {
      const msg = buildReorderMessage('Joueur Alpha', 1, 5);
      expect(msg).toBe('Joueur Alpha positionne en tete de liste.');
    });

    it('should return "fin de liste" message when position equals total', () => {
      const msg = buildReorderMessage('Joueur Beta', 5, 5);
      expect(msg).toBe('Joueur Beta positionne en fin de liste.');
    });

    it('should return position message for middle positions', () => {
      const msg = buildReorderMessage('Joueur Gamma', 3, 5);
      expect(msg).toBe('Joueur Gamma deplace en position 3 sur 5.');
    });

    it('should handle a list of 2 items — position 2 = fin', () => {
      const msg = buildReorderMessage('Joueur Delta', 2, 2);
      expect(msg).toBe('Joueur Delta positionne en fin de liste.');
    });
  });

  describe('buildReorderErrorMessage', () => {
    it('should return error message with name', () => {
      const msg = buildReorderErrorMessage('Coach Alpha');
      expect(msg).toBe('Echec du reorder. Position de Coach Alpha restauree.');
    });
  });
});
