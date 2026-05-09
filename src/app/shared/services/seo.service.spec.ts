import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let meta: jasmine.SpyObj<Meta>;
  let titleService: jasmine.SpyObj<Title>;

  beforeEach(() => {
    const metaSpy = jasmine.createSpyObj('Meta', ['updateTag']);
    const titleSpy = jasmine.createSpyObj('Title', ['setTitle']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SeoService,
        { provide: Meta, useValue: metaSpy },
        { provide: Title, useValue: titleSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta) as jasmine.SpyObj<Meta>;
    titleService = TestBed.inject(Title) as jasmine.SpyObj<Title>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateMetaTags()', () => {
    it('should set title and description', () => {
      service.updateMetaTags({ title: 'Test', description: 'Desc test' });

      expect(titleService.setTitle).toHaveBeenCalledWith('Test | Team Divergentes');
      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'Desc test' });
    });

    it('should set robots to noindex,nofollow when noIndex is true', () => {
      service.updateMetaTags({ noIndex: true });

      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'noindex, nofollow' });
    });

    it('should set robots to index,follow when noIndex is false', () => {
      service.updateMetaTags({ noIndex: false });

      expect(meta.updateTag).toHaveBeenCalledWith({ name: 'robots', content: 'index, follow' });
    });

    // US-og-dimensions (EPIC-23): og:image:width, og:image:height, og:image:alt
    it('should emit og:image:width and og:image:height with defaults when image is provided', () => {
      service.updateMetaTags({ image: '/assets/img/test.jpg' });

      expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:width', content: '1200' });
      expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:height', content: '630' });
    });

    it('should emit og:image:alt with page title when image is provided', () => {
      service.updateMetaTags({ title: 'Ma page', image: '/assets/img/test.jpg' });

      expect(meta.updateTag).toHaveBeenCalledWith({
        property: 'og:image:alt',
        content: 'Ma page | Team Divergentes',
      });
    });

    it('should use custom imageWidth and imageHeight when provided', () => {
      service.updateMetaTags({ image: '/assets/img/test.jpg', imageWidth: 800, imageHeight: 420 });

      expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:width', content: '800' });
      expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:height', content: '420' });
    });

    it('should use custom imageAlt when provided', () => {
      service.updateMetaTags({ image: '/assets/img/test.jpg', imageAlt: 'Logo DVG' });

      expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:alt', content: 'Logo DVG' });
    });

    it('should NOT emit og:image:width/height/alt when no image is provided', () => {
      service.updateMetaTags({ title: 'Sans image' });

      const calls = meta.updateTag.calls.allArgs().map(args => args[0]);
      const properties = calls.map((tag: Record<string, string>) => tag['property'] ?? tag['name']);
      expect(properties).not.toContain('og:image:width');
      expect(properties).not.toContain('og:image:height');
      expect(properties).not.toContain('og:image:alt');
    });

    // US-og-article-times (EPIC-23): og:article:published_time and modified_time
    it('should emit og:article:published_time when publishedTime is provided', () => {
      service.updateMetaTags({
        type: 'article',
        publishedTime: '2026-03-01T10:00:00Z',
      });

      expect(meta.updateTag).toHaveBeenCalledWith({
        property: 'og:article:published_time',
        content: '2026-03-01T10:00:00Z',
      });
    });

    it('should emit og:article:modified_time when modifiedTime is provided', () => {
      service.updateMetaTags({
        type: 'article',
        modifiedTime: '2026-04-15T12:00:00Z',
      });

      expect(meta.updateTag).toHaveBeenCalledWith({
        property: 'og:article:modified_time',
        content: '2026-04-15T12:00:00Z',
      });
    });

    it('should emit both published and modified times when both are provided', () => {
      service.updateMetaTags({
        type: 'article',
        publishedTime: '2026-01-01T00:00:00Z',
        modifiedTime: '2026-06-01T00:00:00Z',
      });

      expect(meta.updateTag).toHaveBeenCalledWith({
        property: 'og:article:published_time',
        content: '2026-01-01T00:00:00Z',
      });
      expect(meta.updateTag).toHaveBeenCalledWith({
        property: 'og:article:modified_time',
        content: '2026-06-01T00:00:00Z',
      });
    });

    it('should NOT emit article times when neither publishedTime nor modifiedTime is provided', () => {
      service.updateMetaTags({ title: 'Pas de dates' });

      const calls = meta.updateTag.calls.allArgs().map(args => args[0]);
      const properties = calls.map((tag: Record<string, string>) => tag['property'] ?? tag['name']);
      expect(properties).not.toContain('og:article:published_time');
      expect(properties).not.toContain('og:article:modified_time');
    });
  });

  // US-sportsorganization-jsonld (EPIC-23)
  describe('getOrganizationJsonLd()', () => {
    it('should return @type as array containing Organization and SportsOrganization', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(schema['@type']).toEqual(['Organization', 'SportsOrganization']);
    });

    it('should include alternateName DVG', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(schema['alternateName']).toBe('DVG');
    });

    it('should include sport Esports', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(schema['sport']).toBe('Esports');
    });

    it('should include foundingDate 2017', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(schema['foundingDate']).toBe('2017');
    });

    it('should include address with PostalAddress type and FR country', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;
      const address = schema['address'] as Record<string, string>;

      expect(address['@type']).toBe('PostalAddress');
      expect(address['addressCountry']).toBe('FR');
    });

    it('should include name Team Divergentes', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(schema['name']).toBe('Team Divergentes');
    });

    it('should include logo with ImageObject type', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;
      const logo = schema['logo'] as Record<string, unknown>;

      expect(logo['@type']).toBe('ImageObject');
    });

    it('should include contactPoint', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;
      const contactPoint = schema['contactPoint'] as Record<string, string>;

      expect(contactPoint['@type']).toBe('ContactPoint');
      expect(contactPoint['email']).toBe('contact@teamdivergentes.fr');
    });

    it('should include sameAs with the provided social URLs', () => {
      const socialUrls = ['https://twitter.com/dvg', 'https://instagram.com/dvg'];
      const schema = service.getOrganizationJsonLd(socialUrls) as Record<string, unknown>;

      expect(schema['sameAs']).toEqual(socialUrls);
    });

    it('should include description', () => {
      const schema = service.getOrganizationJsonLd() as Record<string, unknown>;

      expect(typeof schema['description']).toBe('string');
      expect((schema['description'] as string).length).toBeGreaterThan(0);
    });
  });
});
