import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, NEVER } from 'rxjs';
import { TeamDetailComponent } from './team-detail';
import { TeamsService } from '../../../shared/services/teams.service';
import { SeoService } from '../../../shared/services/seo.service';
import { TeamWithMembers } from '../../../shared/models/team.model';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

describe('TeamDetailComponent', () => {
  let component: TeamDetailComponent;
  let fixture: ComponentFixture<TeamDetailComponent>;
  let teamsService: jasmine.SpyObj<TeamsService>;
  let seoService: jasmine.SpyObj<SeoService>;
  let router: Router;

  const mockTeam: TeamWithMembers = {
    id: 1,
    name: 'Team Alpha',
    slug: 'team-alpha',
    game: 'Valorant',
    active: true,
    position: 0,
    members: [
      { id: 1, name: 'Player1', role: 'IGL', position: 0, joinedAt: '2024-01-01' },
      { id: 2, name: 'Player2', role: 'Duelist', position: 1, joinedAt: '2024-01-01' }
    ]
  };

  beforeEach(async () => {
    const teamsServiceSpy = jasmine.createSpyObj('TeamsService', ['getTeamBySlug']);
    const seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags', 'setJsonLd', 'getSportsTeamJsonLd']);

    seoServiceSpy.getSportsTeamJsonLd.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [TeamDetailComponent],
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
                get: (key: string) => key === 'teamId' ? 'team-alpha' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    teamsService = TestBed.inject(TeamsService) as jasmine.SpyObj<TeamsService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    router = TestBed.inject(Router);

    // Default: NEVER to keep loading
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
});
