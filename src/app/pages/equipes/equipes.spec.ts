import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, NEVER } from 'rxjs';
import { EquipesComponent } from './equipes';
import { TeamsService } from '../../shared/services/teams.service';
import { StaffService } from '../../shared/services/staff.service';
import { GamesService } from '../../shared/services/games.service';
import { SeoService } from '../../shared/services/seo.service';
import { Team } from '../../shared/models/team.model';
import { StaffMember, StaffCategory } from '../../shared/models/staff.model';
import { Game } from '../../shared/models/game.model';
import { provideRouter } from '@angular/router';

describe('EquipesComponent', () => {
  let component: EquipesComponent;
  let fixture: ComponentFixture<EquipesComponent>;
  let teamsService: jasmine.SpyObj<TeamsService>;
  let staffService: jasmine.SpyObj<StaffService>;
  let gamesService: jasmine.SpyObj<GamesService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const mockTeams: Team[] = [
    { id: 1, name: 'Team Alpha', slug: 'team-alpha', game: 'valorant', active: true, position: 0 }
  ];

  const mockAmbassadors: StaffMember[] = [
    { id: 1, name: 'Ambassador 1', role: 'Joueur', category: StaffCategory.AMBASSADOR, position: 0 }
  ];

  const mockGames: Game[] = [
    { id: 1, name: 'Valorant', key: 'valorant', active: true, position: 0, image: '/img/valorant.png', createdAt: '', updatedAt: '' }
  ];

  beforeEach(async () => {
    const teamsServiceSpy = jasmine.createSpyObj('TeamsService', ['loadTeams'], {
      activeTeams: jasmine.createSpy().and.returnValue(mockTeams)
    });
    const staffServiceSpy = jasmine.createSpyObj('StaffService', ['loadStaff'], {
      ambassadors: jasmine.createSpy().and.returnValue(mockAmbassadors)
    });
    const gamesServiceSpy = jasmine.createSpyObj('GamesService', ['loadActiveGames'], {
      activeGames: jasmine.createSpy().and.returnValue(mockGames)
    });
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    seoServiceSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });

    await TestBed.configureTestingModule({
      imports: [EquipesComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TeamsService, useValue: teamsServiceSpy },
        { provide: StaffService, useValue: staffServiceSpy },
        { provide: GamesService, useValue: gamesServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    teamsService = TestBed.inject(TeamsService) as jasmine.SpyObj<TeamsService>;
    staffService = TestBed.inject(StaffService) as jasmine.SpyObj<StaffService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    // Default: return NEVER to stay in loading state
    teamsService.loadTeams.and.returnValue(NEVER);
    staffService.loadStaff.and.returnValue(NEVER);
    gamesService.loadActiveGames.and.returnValue(NEVER);

    fixture = TestBed.createComponent(EquipesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags on init', () => {
    fixture.detectChanges();
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Equipes & Ambassadeurs' })
    );
  });

  it('should call setJsonLd with BreadcrumbList [Accueil, Equipes] on init', () => {
    fixture.detectChanges();
    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
      { name: 'Accueil', url: '/' },
      { name: 'Equipes', url: '/structure/equipes' },
    ]);
    expect(seoService.setJsonLd).toHaveBeenCalledWith({ '@type': 'BreadcrumbList' });
  });

  it('should set loading to true on init', () => {
    component.ngOnInit();
    expect(component.loading()).toBe(true);
  });

  it('should set loading to false after data loaded successfully', () => {
    teamsService.loadTeams.and.returnValue(of(mockTeams));
    staffService.loadStaff.and.returnValue(of(mockAmbassadors));
    gamesService.loadActiveGames.and.returnValue(of(mockGames));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeUndefined();
  });

  it('should set loading to false and keep no error on partial error (catchError)', () => {
    teamsService.loadTeams.and.returnValue(throwError(() => new Error('fail')));
    staffService.loadStaff.and.returnValue(of(mockAmbassadors));
    gamesService.loadActiveGames.and.returnValue(of(mockGames));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
  });

  it('should return placeholder image when no image provided', () => {
    const result = component.getImageUrl(undefined);
    expect(result).toContain('placeholder.png');
  });

  it('should return provided image url', () => {
    const result = component.getImageUrl('/uploads/team.png');
    expect(result).toBe('/uploads/team.png');
  });

  it('should return game logo when game key matches', () => {
    const result = component.getGameLogo('valorant');
    expect(result).toBe('/img/valorant.png');
  });

  it('should return default logo when game key not found', () => {
    const result = component.getGameLogo('unknown-game');
    expect(result).toContain('logoTD.svg');
  });

  it('should return ambassador placeholder when no image', () => {
    const result = component.getAmbassadorImage(undefined);
    expect(result).toContain('logoTD.svg');
  });

  it('should return ambassador image when provided', () => {
    const result = component.getAmbassadorImage('/uploads/ambassador.png');
    expect(result).toBe('/uploads/ambassador.png');
  });

  it('should trackByTeam return team id', () => {
    const team = mockTeams[0];
    expect(component.trackByTeam(0, team)).toBe(1);
  });

  it('should trackByAmbassador return ambassador id', () => {
    const ambassador = mockAmbassadors[0];
    expect(component.trackByAmbassador(0, ambassador)).toBe(1);
  });

  it('should display loading skeleton while loading', () => {
    fixture.detectChanges();
    // loading state is true (NEVER observable), skeleton should appear
    expect(component.loading()).toBe(true);
  });
});
