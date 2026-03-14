import { formatDuration, formatNumber, formatPercent } from './format.utils';

describe('format.utils', () => {

  describe('formatDuration()', () => {
    it('doit retourner "0m 00s" pour 0 secondes', () => {
      expect(formatDuration(0)).toBe('0m 00s');
    });

    it('doit formater correctement les secondes inférieures à 60', () => {
      expect(formatDuration(45)).toBe('0m 45s');
    });

    it('doit formater correctement une minute exacte', () => {
      expect(formatDuration(60)).toBe('1m 00s');
    });

    it('doit formater correctement 1m30s', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('doit formater correctement 2m22s', () => {
      expect(formatDuration(142)).toBe('2m 22s');
    });

    it('doit zéro-padder les secondes inférieures à 10', () => {
      expect(formatDuration(65)).toBe('1m 05s');
    });

    it('doit gérer une durée négative', () => {
      expect(formatDuration(-90)).toBe('0m 00s');
    });
  });

  describe('formatNumber()', () => {
    it('doit retourner la valeur telle quelle pour les petits nombres', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });

    it('doit gérer les nombres négatifs', () => {
      expect(formatNumber(-500)).toBe('-500');
    });

    it('doit formater en "k" pour les milliers', () => {
      expect(formatNumber(1000)).toBe('1.0k');
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(12500)).toBe('12.5k');
    });

    it('doit formater en "M" pour les millions', () => {
      expect(formatNumber(1_000_000)).toBe('1.0M');
      expect(formatNumber(2_500_000)).toBe('2.5M');
    });
  });

  describe('formatPercent()', () => {
    it('doit retourner "0.0%"', () => {
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('doit formater un pourcentage avec une décimale', () => {
      expect(formatPercent(45.3)).toBe('45.3%');
      expect(formatPercent(100)).toBe('100.0%');
    });

    it('doit arrondir à une décimale', () => {
      expect(formatPercent(33.333)).toBe('33.3%');
    });

    it('doit gérer les pourcentages négatifs', () => {
      expect(formatPercent(-10.5)).toBe('-10.5%');
    });
  });

});
