import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, NEVER } from 'rxjs';
import { PlayerDetailComponent } from './player-detail';
import { TeamsService } from '../../../shared/services/teams.service';
import { SeoService } from '../../../shared/services/seo.service';
import { TeamMember, TeamWithMembers } from '../../../shared/models';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

describe('PlayerDetailComponent', () => {
  let component: PlayerDetailComponent;
  let fixture: ComponentFixture<PlayerDetailComponent>;
  let teamsService: jasmine.SpyObj<TeamsService>;
  let seoService: jasmine.SpyObj<SeoService>;
  let router: Router;

  const mockTeam: TeamWithMembers = {
    id: 1,
    name: 'Team Valorant',
    slug: 'team-valorant',
    game: 'Valorant',
    active: true,
    position: 0,
    members: [],
  };

  const mockPlayer: TeamMember = {
    id: 42,
    name: 'SnipeGod',
    role: 'Duelist',
    position: 0,
    joinedAt: '2024-01-01',
    slug: 'snipegod',
    birthDate: '2001-06-15',
    socials: { twitter: 'https://twitter.com/snipegod' },
  };

  beforeEach(async () => {
    const teamsServiceSpy = jasmine.createSpyObj('TeamsService', [
      'getMemberBySlug',
      'getTeamBySlug',
    ]);
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getPersonJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    seoServiceSpy.getPersonJsonLd.and.returnValue({ '@type': 'Person' });
    seoServiceSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });

    await TestBed.configureTestingModule({
      imports: [PlayerDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TeamsService, useValue: teamsServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'playerSlug') return 'snipegod';
                  if (key === 'teamId') return 'team-valorant';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    teamsService = TestBed.inject(TeamsService) as jasmine.SpyObj<TeamsService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    router = TestBed.inject(Router);

    // Par défaut : NEVER pour maintenir l'état loading
    teamsService.getMemberBySlug.and.returnValue(NEVER);
    teamsService.getTeamBySlug.and.returnValue(NEVER);

    fixture = TestBed.createComponent(PlayerDetailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in loading state', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    expect(component.error()).toBeUndefined();
  });

  it('should load player and team on init', () => {
    teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(teamsService.getMemberBySlug).toHaveBeenCalledWith('snipegod');
    expect(teamsService.getTeamBySlug).toHaveBeenCalledWith('team-valorant');
    expect(component.loading()).toBe(false);
    expect(component.player()).toEqual(mockPlayer);
    expect(component.team()).toEqual(mockTeam);
  });

  it('should compute teamName from loaded team', () => {
    teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(component.teamName()).toBe('Team Valorant');
  });

  it('should return empty string for teamName when no team', () => {
    expect(component.teamName()).toBe('');
  });

  // ============================================================
  // SEO-B1 : canonical URL doit inclure /joueur/ dans le path
  // ============================================================
  describe('SEO canonical URL (SEO-B1)', () => {
    it('should build canonical URL with /joueur/ segment when teamSlug is present', () => {
      teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();

      expect(seoService.updateMetaTags).toHaveBeenCalledWith(
        jasmine.objectContaining({
          url: '/structure/equipes/team-valorant/joueur/snipegod',
        })
      );
    });

    it('canonical URL must NOT be /structure/equipes/teamSlug/playerSlug (without /joueur/)', () => {
      teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();

      const calls = seoService.updateMetaTags.calls.allArgs();
      const successCall = calls.find(
        args => args[0]?.url && !args[0]?.noIndex
      );
      expect(successCall).toBeTruthy();
      const url: string = successCall![0].url as string;
      // Vérifie que le segment /joueur/ est bien présent
      expect(url).toContain('/joueur/');
    });
  });

  it('should call setJsonLd with Person and BreadcrumbList after loading player with team', () => {
    teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(seoService.getPersonJsonLd).toHaveBeenCalledWith(
      jasmine.objectContaining({ name: 'SnipeGod', role: 'Duelist' }),
      jasmine.objectContaining({ name: 'Team Valorant', game: 'Valorant' }),
    );
    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
      { name: 'Accueil', url: '/' },
      { name: 'Equipes', url: '/structure/equipes' },
      { name: 'Team Valorant', url: '/structure/equipes/team-valorant' },
      { name: 'SnipeGod', url: '/structure/equipes/team-valorant/joueur/snipegod' },
    ]);
    expect(seoService.setJsonLd).toHaveBeenCalledWith([
      { '@type': 'BreadcrumbList' },
      { '@type': 'Person' },
    ]);
  });

  it('should set error and noIndex SEO on loading failure', () => {
    teamsService.getMemberBySlug.and.returnValue(throwError(() => new Error('Not found')));
    teamsService.getTeamBySlug.and.returnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Joueur introuvable');
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ noIndex: true })
    );
  });

  it('should compute age from birthDate', () => {
    teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    const age = component.age();
    expect(age).toBeGreaterThan(0);
    expect(age).toBeLessThan(100);
  });

  it('should return undefined age when no birthDate', () => {
    const playerNoBirthDate: TeamMember = { ...mockPlayer, birthDate: undefined };
    teamsService.getMemberBySlug.and.returnValue(of(playerNoBirthDate));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(component.age()).toBeUndefined();
  });

  it('should compute socialLinks from socials', () => {
    teamsService.getMemberBySlug.and.returnValue(of(mockPlayer));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    const links = component.socialLinks();
    expect(links.length).toBe(1);
    expect(links[0].platform).toBe('twitter');
  });

  it('should return empty socialLinks when no socials', () => {
    const playerNoSocials: TeamMember = { ...mockPlayer, socials: undefined };
    teamsService.getMemberBySlug.and.returnValue(of(playerNoSocials));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(component.socialLinks()).toEqual([]);
  });

  it('should navigate back to team on goBack', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/structure/equipes', 'team-valorant']);
  });

  it('should navigate back to equipes list on goBack when no teamId in snapshot', () => {
    // Simule l'absence de teamId directement sur le snapshot de la route
    const route = TestBed.inject(ActivatedRoute);
    spyOn(route.snapshot.paramMap, 'get').and.returnValue(null);

    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/structure/equipes']);
  });

  it('should format field key from camelCase', () => {
    const result = component.formatFieldKey('myCustomField');
    expect(result).toBe('My Custom Field');
  });

  it('should getCustomFields return empty array when no customFields', () => {
    expect(component.getCustomFields()).toEqual([]);
  });

  it('should getCustomFields return entries when customFields exists', () => {
    const playerWithFields: TeamMember = {
      ...mockPlayer,
      customFields: { rank: 'Radiant', server: 'EU' },
    };
    teamsService.getMemberBySlug.and.returnValue(of(playerWithFields));
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    const fields = component.getCustomFields();
    expect(fields.length).toBe(2);
    expect(fields.find(f => f.key === 'rank')?.value).toBe('Radiant');
  });
});
