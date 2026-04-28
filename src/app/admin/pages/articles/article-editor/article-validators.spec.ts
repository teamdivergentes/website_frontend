import { slugify } from './article-validators';

describe('slugify', () => {
  it('should convert a simple title to slug', () => {
    expect(slugify('Mon Super Article')).toBe('mon-super-article');
  });

  it('should remove special characters', () => {
    expect(slugify('Mon Super Article !')).toBe('mon-super-article');
  });

  it('should handle accents', () => {
    expect(slugify('Équipe de France')).toBe('equipe-de-france');
  });

  it('should collapse multiple spaces into single dash', () => {
    expect(slugify('titre   avec   espaces')).toBe('titre-avec-espaces');
  });

  it('should collapse multiple dashes', () => {
    expect(slugify('titre--avec--tirets')).toBe('titre-avec-tirets');
  });

  it('should trim leading and trailing dashes', () => {
    expect(slugify('  titre  ')).toBe('titre');
  });

  it('should return empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle numeric characters', () => {
    expect(slugify('Article 2024')).toBe('article-2024');
  });

  it('should preserve existing dashes', () => {
    expect(slugify('déjà-vu')).toBe('deja-vu');
  });
});
