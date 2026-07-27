import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, NEVER } from 'rxjs';
import { TeamDetailComponent } from './team-detail';
import { TeamsService } from '../../../shared/services/teams.service';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { MatchesService } from '../../../shared/services/matches.service';
import { SeoService } from '../../../shared/services/seo.service';
import { TeamWithMembers, CoachingStaffMember } from '../../../shared/models/team.model';
import { Trophy } from '../../../shared/models/trophy.model';
import { Match } from '../../../shared/models/match.model';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

describe('TeamDetailComponent', () => {
  let component: TeamDetailComponent;
  let fixture: ComponentFixture<TeamDetailComponent>;
  let teamsService: jasmine.SpyObj<TeamsService>;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let matchesService: jasmine.SpyObj<MatchesService>;
  let seoService: jasmine.SpyObj<SeoService>;
  let router: Router;

  const mockMembers = [
    { id: 1, name: 'Player1', role: 'IGL', position: 0, joinedAt: '2024-01-01' },
    { id: 2, name: 'Player2', role: 'Duelist', position: 1, joinedAt: '2024-01-01' },
  ];

  const mockCoachingStaff: CoachingStaffMember[] = [
    { id: 10, name: 'Coach Alpha', role: 'Head Coach', position: 0, teamId: 1 },
    { id: 11, name: 'Coach Beta', role: 'Analyste', position: 1, teamId: 1 },
  ];

  const mockTeam: TeamWithMembers = {
    id: 1,
    name: 'Team Alpha',
    slug: 'team-alpha',
    game: 'Valorant',
    active: true,
    position: 0,
    members: mockMembers,
  };

  const mockTrophy: Trophy = {
    id: 10,
    competition: 'Coupe de France LoL',
    placement: 1,
    date: '2025-06-15T00:00:00.000Z',
    featured: true,
  };

  const mockUpcomingMatch: Match = {
    id: 1,
    teamId: 1,
    opponentName: 'Team Rivale',
    scheduledAt: '2025-09-15T18:00:00.000Z',
    streamUrl: 'https://twitch.tv/dvg',
    scoreDvg: null,
    scoreOpponent: null,
  };

  const mockResultMatch: Match = {
    id: 2,
    teamId: 1,
    opponentName: 'Team Alpha',
    scheduledAt: '2025-06-01T16:00:00.000Z',
    streamUrl: null,
    scoreDvg: 2,
    scoreOpponent: 1,
  };

  const mockTeamWithCoaching: TeamWithMembers = {
    ...mockTeam,
    coachingStaff: mockCoachingStaff,
  };

  beforeEach(async () => {
    const teamsServiceSpy = jasmine.createSpyObj('TeamsService', ['getTeamBySlug']);
    const trophiesServiceSpy = jasmine.createSpyObj('TrophiesService', ['getTeamTrophies']);
    const matchesServiceSpy = jasmine.createSpyObj('MatchesService', [
      'getUpcoming',
      'getResults',
    ]);
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getSportsTeamJsonLd',
      'getBreadcrumbListJsonLd',
    ]);

    seoServiceSpy.getSportsTeamJsonLd.and.returnValue({ '@type': 'SportsTeam' });
    seoServiceSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });
    // Par défaut : pas de trophées, pas de matchs
    trophiesServiceSpy.getTeamTrophies.and.returnValue(of([]));
    matchesServiceSpy.getUpcoming.and.returnValue(of([]));
    matchesServiceSpy.getResults.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TeamDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TeamsService, useValue: teamsServiceSpy },
        { provide: TrophiesService, useValue: trophiesServiceSpy },
        { provide: MatchesService, useValue: matchesServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'teamId' ? 'team-alpha' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    teamsService = TestBed.inject(TeamsService) as jasmine.SpyObj<TeamsService>;
    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    router = TestBed.inject(Router);

    // Par défaut : NEVER pour maintenir l'état loading
    teamsService.getTeamBySlug.and.returnValue(NEVER);

    fixture = TestBed.createComponent(TeamDetailComponent);
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

  it('should load team by slug on init', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(teamsService.getTeamBySlug).toHaveBeenCalledWith('team-alpha');
    expect(component.loading()).toBe(false);
    expect(component.team()).toEqual(mockTeam);
  });

  it('should compute teamName from loaded team', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(component.teamName()).toBe('Team Alpha');
  });

  it('should return empty string for teamName when no team', () => {
    expect(component.teamName()).toBe('');
  });

  it('should update SEO tags after loading team', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Team Alpha' })
    );
    expect(seoService.setJsonLd).toHaveBeenCalled();
  });

  it('should call setJsonLd with BreadcrumbList and SportsTeam after loading team', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
      { name: 'Accueil', url: '/' },
      { name: 'Equipes', url: '/structure/equipes' },
      { name: 'Team Alpha', url: '/structure/equipes/team-alpha' },
    ]);
    expect(seoService.setJsonLd).toHaveBeenCalledWith([
      { '@type': 'BreadcrumbList' },
      { '@type': 'SportsTeam' },
    ]);
  });

  it('should set error on loading failure', () => {
    teamsService.getTeamBySlug.and.returnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Équipe introuvable');
  });

  it('should initialize slider at slide 0', () => {
    fixture.detectChanges();
    expect(component.currentSlide()).toBe(0);
  });

  it('should goToSlide change current slide', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    component.goToSlide(1);
    expect(component.currentSlide()).toBe(1);
  });

  it('should not goToSlide beyond members count', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    component.goToSlide(10);
    expect(component.currentSlide()).toBe(0);
  });

  it('should not goToSlide to negative index', () => {
    teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
    fixture.detectChanges();

    component.goToSlide(-1);
    expect(component.currentSlide()).toBe(0);
  });

  it('should navigate back to equipes on goBack', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/structure/equipes']);
  });

  // ============================================================
  // Tests US : coaching staff
  // ============================================================

  describe('coaching staff signal', () => {
    it('should return empty array when coachingStaff is undefined', () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();

      expect(component.coachingStaff()).toEqual([]);
    });

    it('should return empty array when coachingStaff is empty array', () => {
      const teamWithEmptyCoaching: TeamWithMembers = { ...mockTeam, coachingStaff: [] };
      teamsService.getTeamBySlug.and.returnValue(of(teamWithEmptyCoaching));
      fixture.detectChanges();

      expect(component.coachingStaff()).toEqual([]);
    });

    it('should return coaching staff sorted by position', () => {
      const unsortedStaff: CoachingStaffMember[] = [
        { id: 11, name: 'Coach Beta', role: 'Analyste', position: 1, teamId: 1 },
        { id: 10, name: 'Coach Alpha', role: 'Head Coach', position: 0, teamId: 1 },
      ];
      const teamWithStaff: TeamWithMembers = { ...mockTeam, coachingStaff: unsortedStaff };
      teamsService.getTeamBySlug.and.returnValue(of(teamWithStaff));
      fixture.detectChanges();

      const staff = component.coachingStaff();
      expect(staff.length).toBe(2);
      expect(staff[0].name).toBe('Coach Alpha');
      expect(staff[1].name).toBe('Coach Beta');
    });

    it('should return 2 coaching staff members when provided', () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeamWithCoaching));
      fixture.detectChanges();

      expect(component.coachingStaff().length).toBe(2);
    });
  });

  describe('DOM : coaching staff section', () => {
    it('should NOT render coaching section when coachingStaff is empty', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();

      const coachingHeading = fixture.nativeElement.querySelector('.coaching-heading');
      expect(coachingHeading).toBeNull();

      const coachingSection = fixture.nativeElement.querySelector('.coaching-section');
      expect(coachingSection).toBeNull();
    });

    it('should render H2 "NOTRE COACHING STAFF" when coachingStaff has members', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeamWithCoaching));
      fixture.detectChanges();
      await fixture.whenStable();

      const coachingHeading = fixture.nativeElement.querySelector('.coaching-heading');
      expect(coachingHeading).not.toBeNull();
      expect(coachingHeading.textContent.trim()).toBe('NOTRE COACHING STAFF');
    });

    it('should render 2 coach cards when coachingStaff has 2 members', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeamWithCoaching));
      fixture.detectChanges();
      await fixture.whenStable();

      const coachCards = fixture.nativeElement.querySelectorAll('.coach-card');
      expect(coachCards.length).toBe(2);
    });

    it('should display coach names and roles in cards', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeamWithCoaching));
      fixture.detectChanges();
      await fixture.whenStable();

      const coachNames = fixture.nativeElement.querySelectorAll('.coach-name');
      const coachRoles = fixture.nativeElement.querySelectorAll('.coach-role');

      expect(coachNames[0].textContent.trim()).toBe('Coach Alpha');
      expect(coachRoles[0].textContent.trim()).toBe('Head Coach');
    });

    it('should render H1 with team name (unique H1)', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();

      const h1Elements = fixture.nativeElement.querySelectorAll('h1');
      expect(h1Elements.length).toBe(1);
      expect(h1Elements[0].textContent.trim()).toBe('Team Alpha');
    });

    it('should render H2 "NOS JOUEURS" when team is loaded', async () => {
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();

      const playersHeading = fixture.nativeElement.querySelector('.players-heading');
      expect(playersHeading).not.toBeNull();
      expect(playersHeading.textContent.trim()).toBe('NOS JOUEURS');
    });

    it('should render clickable coach card as <a> when coach has a slug', async () => {
      const teamWithSluggedCoach: TeamWithMembers = {
        ...mockTeam,
        coachingStaff: [
          { id: 10, name: 'Coach Alpha', role: 'Head Coach', position: 0, teamId: 1, slug: 'coach-alpha' },
        ],
      };
      teamsService.getTeamBySlug.and.returnValue(of(teamWithSluggedCoach));
      fixture.detectChanges();
      await fixture.whenStable();

      const anchorCards = fixture.nativeElement.querySelectorAll('a.coach-card');
      expect(anchorCards.length).toBe(1);
    });

    it('should render non-clickable coach card as <div> when coach has no slug', async () => {
      const teamWithSluglessCoach: TeamWithMembers = {
        ...mockTeam,
        coachingStaff: [
          { id: 11, name: 'Coach Beta', role: 'Analyste', position: 1, teamId: 1 },
        ],
      };
      teamsService.getTeamBySlug.and.returnValue(of(teamWithSluglessCoach));
      fixture.detectChanges();
      await fixture.whenStable();

      const divCards = fixture.nativeElement.querySelectorAll('div.coach-card');
      expect(divCards.length).toBe(1);
      const anchorCards = fixture.nativeElement.querySelectorAll('a.coach-card');
      expect(anchorCards.length).toBe(0);
    });
  });

  // ============================================================
  // Tests US : badges palmarès
  // ============================================================

  describe('badges palmarès', () => {
    it("charge les trophées de l'équipe après le chargement de l'équipe", () => {
      trophiesService.getTeamTrophies.and.returnValue(of([mockTrophy]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();

      expect(trophiesService.getTeamTrophies).toHaveBeenCalledWith(mockTeam.id);
      expect(component.teamTrophies()).toEqual([mockTrophy]);
    });

    it("n'affiche pas le bloc palmarès sans trophée", async () => {
      trophiesService.getTeamTrophies.and.returnValue(of([]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();

      const section = fixture.nativeElement.querySelector('.team-honours');
      expect(section).toBeNull();
    });

    it('affiche le bloc palmarès (app-team-honours) quand des trophées existent', async () => {
      trophiesService.getTeamTrophies.and.returnValue(of([mockTrophy]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const section = fixture.nativeElement.querySelector('.team-honours');
      expect(section).not.toBeNull();
    });
  });

  // ============================================================
  // Tests US : bandeau matchs team-detail
  // ============================================================

  describe('bandeau matchs', () => {
    it('affiche le bandeau match quand des données sont disponibles', async () => {
      matchesService.getUpcoming.and.returnValue(of([mockUpcomingMatch]));
      matchesService.getResults.and.returnValue(of([mockResultMatch]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const strip = fixture.nativeElement.querySelector('.match-strip');
      expect(strip).not.toBeNull();
    });

    it("charge les matchs avec l'id de l'équipe", () => {
      matchesService.getUpcoming.and.returnValue(of([mockUpcomingMatch]));
      matchesService.getResults.and.returnValue(of([mockResultMatch]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();

      expect(matchesService.getUpcoming).toHaveBeenCalledWith(1, mockTeam.id);
      expect(matchesService.getResults).toHaveBeenCalledWith(3, mockTeam.id);
    });

    it('affiche le skeleton pendant le chargement des matchs', async () => {
      // NEVER simule une requête de matchs en attente ; l'équipe est chargée
      matchesService.getUpcoming.and.returnValue(NEVER);
      matchesService.getResults.and.returnValue(NEVER);
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.match-strip-skeleton');
      expect(skeleton).not.toBeNull();
      const strip = fixture.nativeElement.querySelector('.match-strip');
      expect(strip).toBeNull();
    });

    it('masque le skeleton et affiche le strip après la réponse', async () => {
      matchesService.getUpcoming.and.returnValue(of([mockUpcomingMatch]));
      matchesService.getResults.and.returnValue(of([mockResultMatch]));
      teamsService.getTeamBySlug.and.returnValue(of(mockTeam));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const skeleton = fixture.nativeElement.querySelector('.match-strip-skeleton');
      expect(skeleton).toBeNull();
      const strip = fixture.nativeElement.querySelector('.match-strip');
      expect(strip).not.toBeNull();
    });
  });
});
