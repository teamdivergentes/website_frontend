import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';
import { RuntimeConfigService } from '../../../shared/services/runtime-config.service';
import { Article } from '../models';

describe('SeoService', () => {
  let service: SeoService;

  const siteUrl = 'https://teamdivergentes.fr';

  /** Mock minimal de RuntimeConfigService qui retourne toujours l'URL de prod */
  const runtimeConfigMock: Partial<RuntimeConfigService> = {
    get siteUrl() {
      return 'https://teamdivergentes.fr';
    },
  };

  let metaSpy: jasmine.SpyObj<Meta>;

  beforeEach(() => {
    metaSpy = jasmine.createSpyObj('Meta', ['updateTag', 'addTag', 'removeTag']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SeoService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: RuntimeConfigService, useValue: runtimeConfigMock },
        { provide: Meta, useValue: metaSpy },
        {
          provide: Title,
          useValue: jasmine.createSpyObj('Title', ['setTitle']),
        },
      ],
    });
    service = TestBed.inject(SeoService);
  });

  // =====================================================================
  // getJobPostingJsonLd
  // =====================================================================
  describe('getJobPostingJsonLd()', () => {
    it('should return a schema with @type JobPosting', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'Community Manager',
        description: '<p>Gérer les réseaux sociaux</p>',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'community-manager',
      }) as Record<string, unknown>;

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('JobPosting');
    });

    it('should include title and datePosted', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'Community Manager',
        description: 'Gérer les réseaux sociaux',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'community-manager',
      }) as Record<string, unknown>;

      expect(schema['title']).toBe('Community Manager');
      expect(schema['datePosted']).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should set validThrough to +90 days when expiresAt is absent', () => {
      const before = Date.now();
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;
      const after = Date.now();

      const validThrough = new Date(schema['validThrough'] as string).getTime();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

      expect(validThrough).toBeGreaterThanOrEqual(before + ninetyDaysMs - 1000);
      expect(validThrough).toBeLessThanOrEqual(after + ninetyDaysMs + 1000);
    });

    it('should use expiresAt ISO when provided', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        expiresAt: '2025-06-30T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      expect(schema['validThrough']).toBe('2025-06-30T00:00:00.000Z');
    });

    it('should set employmentType to VOLUNTEER', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      expect(schema['employmentType']).toBe('VOLUNTEER');
    });

    it('should include hiringOrganization with Team Divergentes', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      const hiring = schema['hiringOrganization'] as Record<string, unknown>;
      expect(hiring['@type']).toBe('Organization');
      expect(hiring['name']).toBe('Team Divergentes');
      expect(hiring['sameAs']).toBe(siteUrl);
      expect(hiring['logo']).toContain('logoTD.svg');
    });

    it('should include jobLocationType as TELECOMMUTE', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      expect(schema['jobLocationType']).toBe('TELECOMMUTE');
    });

    it('should include jobLocation with addressCountry FR', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      const location = schema['jobLocation'] as Record<string, unknown>;
      const address = location['address'] as Record<string, unknown>;
      expect(address['addressCountry']).toBe('FR');
    });

    it('should set directApply to false', () => {
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        slug: 'cm',
      }) as Record<string, unknown>;

      expect(schema['directApply']).toBe(false);
    });

    it('should handle null expiresAt (fall back to +90 days)', () => {
      const before = Date.now();
      const schema = service.getJobPostingJsonLd({
        title: 'CM',
        description: 'Desc',
        createdAt: '2025-01-15T00:00:00Z',
        expiresAt: null,
        slug: 'cm',
      }) as Record<string, unknown>;
      const after = Date.now();

      const validThrough = new Date(schema['validThrough'] as string).getTime();
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

      expect(validThrough).toBeGreaterThanOrEqual(before + ninetyDaysMs - 1000);
      expect(validThrough).toBeLessThanOrEqual(after + ninetyDaysMs + 1000);
    });
  });

  // =====================================================================
  // getPersonJsonLd
  // =====================================================================
  describe('getPersonJsonLd()', () => {
    it('should return a schema with @type Person', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod', role: 'Duelist' },
        { name: 'Team Valorant', game: 'Valorant' },
      ) as Record<string, unknown>;

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Person');
    });

    it('should include player name', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['name']).toBe('SnipeGod');
    });

    it('should include jobTitle when role is provided', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod', role: 'Duelist' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['jobTitle']).toBe('Duelist');
    });

    it('should omit jobTitle when role is absent', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['jobTitle']).toBeUndefined();
    });

    it('should include memberOf SportsTeam', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod' },
        { name: 'Team Valorant', game: 'Valorant' },
      ) as Record<string, unknown>;

      const memberOf = schema['memberOf'] as Record<string, unknown>;
      expect(memberOf['@type']).toBe('SportsTeam');
      expect(memberOf['name']).toBe('Team Valorant');
      expect(memberOf['sport']).toBe('Valorant');
    });

    it('should omit sport in memberOf when game is absent', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      const memberOf = schema['memberOf'] as Record<string, unknown>;
      expect(memberOf['sport']).toBeUndefined();
    });

    it('should include image as absolute URL when provided as relative path', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod', image: '/uploads/snipegod.jpg' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['image']).toBe(`${siteUrl}/uploads/snipegod.jpg`);
    });

    it('should keep image as-is when already absolute', () => {
      const imageUrl = 'https://cdn.example.com/player.jpg';
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod', image: imageUrl },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['image']).toBe(imageUrl);
    });

    it('should omit image when not provided', () => {
      const schema = service.getPersonJsonLd(
        { name: 'SnipeGod' },
        { name: 'Team Valorant' },
      ) as Record<string, unknown>;

      expect(schema['image']).toBeUndefined();
    });
  });

  // =====================================================================
  // updateMetaTags — préfixe article:* et nouveaux champs
  // =====================================================================
  describe('updateMetaTags() — article:* tags', () => {
    it('should call removeTag for og:article:published_time on every call', () => {
      service.updateMetaTags({});
      expect(metaSpy.removeTag).toHaveBeenCalledWith("property='og:article:published_time'");
    });

    it('should call removeTag for og:article:modified_time on every call', () => {
      service.updateMetaTags({});
      expect(metaSpy.removeTag).toHaveBeenCalledWith("property='og:article:modified_time'");
    });

    it('should emit article:published_time (not og:article:published_time)', () => {
      service.updateMetaTags({ publishedTime: '2026-01-01T00:00:00Z' });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      const hasCorrect = calls.some(
        args => args[0].property === 'article:published_time' && args[0].content === '2026-01-01T00:00:00Z',
      );
      const hasWrong = calls.some(args => args[0].property === 'og:article:published_time');
      expect(hasCorrect).toBeTrue();
      expect(hasWrong).toBeFalse();
    });

    it('should emit article:modified_time (not og:article:modified_time)', () => {
      service.updateMetaTags({ modifiedTime: '2026-06-01T00:00:00Z' });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      const hasCorrect = calls.some(
        args => args[0].property === 'article:modified_time' && args[0].content === '2026-06-01T00:00:00Z',
      );
      const hasWrong = calls.some(args => args[0].property === 'og:article:modified_time');
      expect(hasCorrect).toBeTrue();
      expect(hasWrong).toBeFalse();
    });

    it('should emit article:author when articleAuthor is provided', () => {
      service.updateMetaTags({ articleAuthor: siteUrl });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      const found = calls.some(
        args => args[0].property === 'article:author' && args[0].content === siteUrl,
      );
      expect(found).toBeTrue();
    });

    it('should NOT emit article:author when articleAuthor is absent', () => {
      service.updateMetaTags({});
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string }]>;
      const found = calls.some(args => args[0].property === 'article:author');
      expect(found).toBeFalse();
    });

    it('should emit article:section when articleSection is provided', () => {
      service.updateMetaTags({ articleSection: 'Esport EVA' });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      const found = calls.some(
        args => args[0].property === 'article:section' && args[0].content === 'Esport EVA',
      );
      expect(found).toBeTrue();
    });

    it('should NOT emit article:section when articleSection is absent', () => {
      service.updateMetaTags({});
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string }]>;
      const found = calls.some(args => args[0].property === 'article:section');
      expect(found).toBeFalse();
    });

    it('should call removeTag for article:tag before adding tags', () => {
      service.updateMetaTags({ articleTags: ['Valorant', 'Esport'] });
      expect(metaSpy.removeTag).toHaveBeenCalledWith("property='article:tag'");
    });

    it('should call addTag once per tag when articleTags is provided', () => {
      service.updateMetaTags({ articleTags: ['Valorant', 'Esport'] });
      const addCalls = metaSpy.addTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      const tagCalls = addCalls.filter(args => args[0].property === 'article:tag');
      expect(tagCalls.length).toBe(2);
      const contents = tagCalls.map(args => args[0].content);
      expect(contents).toContain('Valorant');
      expect(contents).toContain('Esport');
    });

    it('should NOT call removeTag for article:tag when articleTags is empty', () => {
      service.updateMetaTags({ articleTags: [] });
      const removeCalls = metaSpy.removeTag.calls.allArgs() as Array<[string]>;
      const found = removeCalls.some(args => args[0] === "property='article:tag'");
      expect(found).toBeFalse();
    });
  });

  // =====================================================================
  // buildArticleJsonLd
  // =====================================================================
  describe('buildArticleJsonLd()', () => {
    const baseArticle: Article = {
      id: 1,
      title: 'Test Article',
      slug: 'test-article',
      content: JSON.stringify({
        blocks: [
          { type: 'paragraph', data: { text: 'Bonjour le monde' } },
          { type: 'header', data: { text: 'Sous-titre article' } },
        ],
      }),
      excerpt: 'Un article de test',
      imageUrl: '/uploads/test.jpg',
      published: true,
      featured: false,
      typeId: 1,
      userId: 1,
      type: { id: 1, name: 'Esport EVA', createdAt: '2025-01-01', updatedAt: '2025-01-01' },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    };

    it('should return @type Article', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['@type']).toBe('Article');
      expect(schema['@context']).toBe('https://schema.org');
    });

    it('should include mainEntityOfPage with WebPage @id', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      const mep = schema['mainEntityOfPage'] as Record<string, unknown>;
      expect(mep['@type']).toBe('WebPage');
      expect(mep['@id']).toBe(`${siteUrl}/articles/test-article`);
    });

    it('should convert relative imageUrl to ImageObject with absolute URL', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      const image = schema['image'] as Record<string, unknown>;
      expect(image['@type']).toBe('ImageObject');
      expect(image['url']).toBe(`${siteUrl}/uploads/test.jpg`);
      expect(image['width']).toBe(1200);
      expect(image['height']).toBe(630);
    });

    it('should keep absolute imageUrl as-is in ImageObject', () => {
      const article = { ...baseArticle, imageUrl: 'https://cdn.example.com/img.jpg' };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      const image = schema['image'] as Record<string, unknown>;
      expect(image['url']).toBe('https://cdn.example.com/img.jpg');
    });

    it('should use default OG image fallback when imageUrl is absent', () => {
      const article = { ...baseArticle, imageUrl: undefined };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      const image = schema['image'] as Record<string, unknown>;
      expect(image['url']).toContain('images4k.jpg');
    });

    it('should include articleSection from article.type.name', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['articleSection']).toBe('Esport EVA');
    });

    it('should omit articleSection when type is absent', () => {
      const article = { ...baseArticle, type: undefined };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      expect(schema['articleSection']).toBeUndefined();
    });

    it('should include keywords derived from type name', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['keywords']).toBe('Esport EVA');
    });

    it('should omit keywords when type is absent', () => {
      const article = { ...baseArticle, type: undefined };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      expect(schema['keywords']).toBeUndefined();
    });

    it('should include wordCount derived from EditorJS paragraph and header blocks', () => {
      // content = "Bonjour le monde" (3 mots) + "Sous-titre article" (2 mots) = 5 mots
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['wordCount']).toBe(5);
    });

    it('should compute wordCount from list blocks', () => {
      const article = {
        ...baseArticle,
        content: JSON.stringify({
          blocks: [
            { type: 'list', data: { items: ['Premiers points', 'Second élément'] } },
          ],
        }),
      };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      // "Premiers points" (2) + "Second élément" (2) = 4
      expect(schema['wordCount']).toBe(4);
    });

    it('should strip HTML tags when computing wordCount', () => {
      const article = {
        ...baseArticle,
        content: JSON.stringify({
          blocks: [
            { type: 'paragraph', data: { text: '<b>Bonjour</b> le <em>monde</em>' } },
          ],
        }),
      };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      expect(schema['wordCount']).toBe(3);
    });

    it('should omit wordCount when content is empty', () => {
      const article = {
        ...baseArticle,
        content: JSON.stringify({ blocks: [] }),
      };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      expect(schema['wordCount']).toBeUndefined();
    });

    it('should include inLanguage fr-FR', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['inLanguage']).toBe('fr-FR');
    });

    it('should include isPartOf WebSite with @id and name', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      const isPartOf = schema['isPartOf'] as Record<string, unknown>;
      expect(isPartOf['@type']).toBe('WebSite');
      expect(isPartOf['@id']).toBe(`${siteUrl}/#website`);
      expect(isPartOf['name']).toBe('Team Divergentes');
    });

    it('should include author with url set to siteUrl', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      const author = schema['author'] as Record<string, unknown>;
      expect(author['@type']).toBe('Organization');
      expect(author['name']).toBe('Team Divergentes');
      expect(author['url']).toBe(siteUrl);
    });

    it('should include publisher with logo ImageObject', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      const publisher = schema['publisher'] as Record<string, unknown>;
      expect(publisher['@type']).toBe('Organization');
      expect(publisher['name']).toBe('Team Divergentes');
      const logo = publisher['logo'] as Record<string, unknown>;
      expect(logo['@type']).toBe('ImageObject');
      expect((logo['url'] as string)).toContain('logoTD.svg');
    });

    it('should include headline and description', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['headline']).toBe('Test Article');
      expect(schema['description']).toBe('Un article de test');
    });

    it('should include datePublished and dateModified', () => {
      const schema = service.buildArticleJsonLd(baseArticle) as Record<string, unknown>;
      expect(schema['datePublished']).toBe('2026-01-01T00:00:00Z');
      expect(schema['dateModified']).toBe('2026-02-01T00:00:00Z');
    });

    it('should handle invalid EditorJS content gracefully (wordCount = 0, omitted)', () => {
      const article = { ...baseArticle, content: 'not-json-at-all' };
      const schema = service.buildArticleJsonLd(article) as Record<string, unknown>;
      expect(schema['wordCount']).toBeUndefined();
    });
  });

  // =====================================================================
  // getBreadcrumbListJsonLd
  // =====================================================================
  describe('getBreadcrumbListJsonLd()', () => {
    it('should return a schema with @type BreadcrumbList', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
      ]) as Record<string, unknown>;

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
    });

    it('should build itemListElement with correct position and name', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Equipes', url: '/structure/equipes' },
      ]) as Record<string, unknown>;

      const items = schema['itemListElement'] as Record<string, unknown>[];
      expect(items.length).toBe(2);
      expect(items[0]['position']).toBe(1);
      expect(items[0]['name']).toBe('Accueil');
      expect(items[1]['position']).toBe(2);
      expect(items[1]['name']).toBe('Equipes');
    });

    it('should build absolute URL for relative paths', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Equipes', url: '/structure/equipes' },
      ]) as Record<string, unknown>;

      const items = schema['itemListElement'] as Record<string, unknown>[];
      expect(items[0]['item']).toBe(`${siteUrl}/`);
      expect(items[1]['item']).toBe(`${siteUrl}/structure/equipes`);
    });

    it('should keep absolute URL as-is', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: 'https://teamdivergentes.fr/' },
      ]) as Record<string, unknown>;

      const items = schema['itemListElement'] as Record<string, unknown>[];
      expect(items[0]['item']).toBe('https://teamdivergentes.fr/');
    });

    it('should include @type ListItem for each item', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Equipes', url: '/structure/equipes' },
        { name: 'Team Alpha', url: '/structure/equipes/team-alpha' },
      ]) as Record<string, unknown>;

      const items = schema['itemListElement'] as Record<string, unknown>[];
      items.forEach(item => {
        expect(item['@type']).toBe('ListItem');
      });
    });

    it('should handle three-level breadcrumb', () => {
      const schema = service.getBreadcrumbListJsonLd([
        { name: 'Accueil', url: '/' },
        { name: 'Equipes', url: '/structure/equipes' },
        { name: 'SnipeGod', url: '/structure/equipes/team-alpha/joueur/snipegod' },
      ]) as Record<string, unknown>;

      const items = schema['itemListElement'] as Record<string, unknown>[];
      expect(items.length).toBe(3);
      expect(items[2]['position']).toBe(3);
      expect(items[2]['name']).toBe('SnipeGod');
    });
  });
  describe('buildDescription()', () => {
    it("retourne le repli quand la source est vide", () => {
      expect(service.buildDescription('', 'Repli')).toBe('Repli');
      expect(service.buildDescription(null, 'Repli')).toBe('Repli');
      expect(service.buildDescription(undefined, 'Repli')).toBe('Repli');
    });

    it("retourne le repli quand la source ne contient que du balisage", () => {
      // Un editeur riche laisse souvent un paragraphe vide derriere lui. Sans
      // ce cas, la carte de partage partirait avec une description blanche.
      expect(service.buildDescription('<p></p><br>', 'Repli')).toBe('Repli');
    });

    it('retire les balises et normalise les espaces', () => {
      expect(
        service.buildDescription('<p>Attaquant  \n  <strong>capitaine</strong></p>', 'Repli'),
      ).toBe('Attaquant capitaine');
    });

    it('decode les entites HTML', () => {
      expect(service.buildDescription('Maillot &quot;Joker&quot; &amp; flocage', 'Repli')).toBe(
        'Maillot "Joker" & flocage',
      );
    });

    it('decode les entites nommees francaises', () => {
      // Cas reel : l'editeur riche encode les accents. Sans decodage, la carte
      // de partage affichait « Arriv&eacute; en 2024 ».
      expect(
        service.buildDescription('Arriv&eacute; en 2024, il s&rsquo;impose &agrave; l&#39;aile', 'Repli'),
      ).toBe('Arrivé en 2024, il s’impose à l\'aile');
    });

    it('decode les entites numeriques, decimales et hexadecimales', () => {
      expect(service.buildDescription('caf&#233; et cr&#xE8;me', 'Repli')).toBe('café et crème');
    });

    it('laisse intacte une entite inconnue', () => {
      // Mieux vaut un `&trade;` visible qu'un texte ampute.
      expect(service.buildDescription('Marque&trade; deposee', 'Repli')).toBe('Marque&trade; deposee');
    });

    it("ne reinterprete pas une entite protegee par &amp;", () => {
      // `&amp;lt;` doit ressortir en `&lt;` litteral, pas en `<`. Decoder
      // `&amp;` en premier produirait le mauvais resultat.
      expect(service.buildDescription('a &amp;lt; b', 'Repli')).toBe('a &lt; b');
    });

    it('tronque au mot et non au caractere', () => {
      const source = 'mot '.repeat(60).trim();
      const result = service.buildDescription(source, 'Repli');

      expect(result.length).toBeLessThanOrEqual(161);
      expect(result.endsWith('\u2026')).toBeTrue();
      // Aucun mot coupe : la troncature tombe sur une frontiere.
      expect(result.slice(0, -1).trimEnd().endsWith('mot')).toBeTrue();
    });

    it('laisse intact un texte plus court que la limite', () => {
      expect(service.buildDescription('Texte court', 'Repli')).toBe('Texte court');
    });
  });

  describe('updateMetaTags() — dimensions og:image', () => {
    const dimensionCalls = () =>
      (metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string }]>).filter(args =>
        ['og:image:width', 'og:image:height'].includes(args[0].property ?? ''),
      );

    it("annonce 1200x630 pour l'image du site", () => {
      service.updateMetaTags({ title: 'Contact' });
      expect(dimensionCalls().length).toBe(2);
    });

    it("n'annonce aucune dimension pour une image de contenu", () => {
      // Une photo de joueur est en portrait. Annoncer 1200x630 ferait reserver
      // au scraper un cadre au mauvais format, qui rogne l'image.
      service.updateMetaTags({ title: 'SnipeGod', image: '/uploads/players/snipegod.jpg' });
      expect(dimensionCalls().length).toBe(0);
      expect(metaSpy.removeTag).toHaveBeenCalledWith("property='og:image:width'");
      expect(metaSpy.removeTag).toHaveBeenCalledWith("property='og:image:height'");
    });

    it('annonce les dimensions fournies explicitement', () => {
      service.updateMetaTags({ image: '/uploads/a.jpg', imageWidth: 800, imageHeight: 800 });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      expect(
        calls.some(a => a[0].property === 'og:image:width' && a[0].content === '800'),
      ).toBeTrue();
    });

    it("utilise le titre de la page comme texte alternatif par defaut", () => {
      service.updateMetaTags({ title: 'Palmares' });
      const calls = metaSpy.updateTag.calls.allArgs() as Array<[{ property?: string; content?: string }]>;
      expect(
        calls.some(
          a => a[0].property === 'og:image:alt' && a[0].content === 'Palmares | Team Divergentes',
        ),
      ).toBeTrue();
    });
  });
});
