import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';
import { RuntimeConfigService } from '../../../shared/services/runtime-config.service';

describe('SeoService', () => {
  let service: SeoService;

  const siteUrl = 'https://teamdivergentes.fr';

  /** Mock minimal de RuntimeConfigService qui retourne toujours l'URL de prod */
  const runtimeConfigMock: Partial<RuntimeConfigService> = {
    get siteUrl() {
      return 'https://teamdivergentes.fr';
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SeoService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: RuntimeConfigService, useValue: runtimeConfigMock },
        {
          provide: Meta,
          useValue: jasmine.createSpyObj('Meta', [
            'updateTag',
            'addTag',
            'removeTag',
          ]),
        },
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
});
