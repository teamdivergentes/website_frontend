import { hasSocialLinks, socialLinkCount, buildEmptyFormValues } from './team-member-validators';

describe('team-member-validators', () => {
  describe('hasSocialLinks', () => {
    it('should return false when all socials are empty', () => {
      expect(hasSocialLinks({ twitter: '', twitch: '', instagram: '', youtube: '' })).toBe(false);
    });

    it('should return true when twitter is set', () => {
      expect(hasSocialLinks({ twitter: 'https://twitter.com/test', twitch: '', instagram: '', youtube: '' })).toBe(true);
    });

    it('should return true when twitch is set', () => {
      expect(hasSocialLinks({ twitter: '', twitch: 'https://twitch.tv/test', instagram: '', youtube: '' })).toBe(true);
    });

    it('should return true when instagram is set', () => {
      expect(hasSocialLinks({ twitter: '', twitch: '', instagram: 'https://instagram.com/test', youtube: '' })).toBe(true);
    });

    it('should return true when youtube is set', () => {
      expect(hasSocialLinks({ twitter: '', twitch: '', instagram: '', youtube: 'https://youtube.com/test' })).toBe(true);
    });

    it('should return true when multiple socials are set', () => {
      expect(hasSocialLinks({ twitter: 'https://twitter.com/test', twitch: 'https://twitch.tv/test', instagram: '', youtube: '' })).toBe(true);
    });
  });

  describe('socialLinkCount', () => {
    it('should return 0 when all socials are empty', () => {
      expect(socialLinkCount({ twitter: '', twitch: '', instagram: '', youtube: '' })).toBe(0);
    });

    it('should return 1 when one social is set', () => {
      expect(socialLinkCount({ twitter: 'https://twitter.com/test', twitch: '', instagram: '', youtube: '' })).toBe(1);
    });

    it('should return 2 when two socials are set', () => {
      expect(socialLinkCount({ twitter: 'https://twitter.com/test', twitch: 'https://twitch.tv/test', instagram: '', youtube: '' })).toBe(2);
    });

    it('should return 3 when three socials are set', () => {
      expect(socialLinkCount({ twitter: 'a', twitch: 'b', instagram: 'c', youtube: '' })).toBe(3);
    });

    it('should return 4 when all socials are set', () => {
      expect(socialLinkCount({ twitter: 'a', twitch: 'b', instagram: 'c', youtube: 'd' })).toBe(4);
    });
  });

  describe('buildEmptyFormValues', () => {
    it('should return an object with all fields empty', () => {
      const result = buildEmptyFormValues();
      expect(result.name).toBe('');
      expect(result.realName).toBe('');
      expect(result.role).toBe('');
      expect(result.image).toBe('');
      expect(result.nationality).toBe('');
      expect(result.birthDate).toBe('');
      expect(result.biography).toBe('');
      expect(result.twitter).toBe('');
      expect(result.twitch).toBe('');
      expect(result.instagram).toBe('');
      expect(result.youtube).toBe('');
    });

    it('should return a new object on each call', () => {
      const a = buildEmptyFormValues();
      const b = buildEmptyFormValues();
      expect(a).not.toBe(b);
    });
  });
});
