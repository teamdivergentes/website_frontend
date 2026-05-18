import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, NEVER, Subject } from 'rxjs';
import { CoachDetailComponent } from './coach-detail';
import { CoachingStaffService } from '../../../shared/services/coaching-staff.service';
import { SeoService } from '../../../shared/services/seo.service';
import { CoachingStaffMember } from '../../../shared/models';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

describe('CoachDetailComponent', () => {
  let component: CoachDetailComponent;
  let fixture: ComponentFixture<CoachDetailComponent>;
  let coachingStaffService: jasmine.SpyObj<CoachingStaffService>;
  let seoService: jasmine.SpyObj<SeoService>;
  let router: Router;

  const mockTeamRef = {
    id: 1,
    slug: 'team-valorant',
    name: 'Team Valorant',
    game: 'Valorant',
  };

  const mockCoach: CoachingStaffMember = {
    id: 10,
    name: 'HeadCoach',
    role: 'Head Coach',
    position: 0,
    teamId: 1,
    slug: 'headcoach',
    birthDate: '1990-03-20',
    nationality: 'Française',
    socials: { twitter: 'https://twitter.com/headcoach' },
    biography: 'Expérimenté coach esport.',
    team: mockTeamRef,
  };

  beforeEach(async () => {
    const coachingStaffServiceSpy = jasmine.createSpyObj('CoachingStaffService', [
      'findBySlug',
      'list',
      'create',
      'update',
      'delete',
      'reorder',
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
      imports: [CoachDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CoachingStaffService, useValue: coachingStaffServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'slug') return 'headcoach';
                  if (key === 'teamId') return 'team-valorant';
                  return null;
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    coachingStaffService = TestBed.inject(CoachingStaffService) as jasmine.SpyObj<CoachingStaffService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    router = TestBed.inject(Router);

    // Par défaut : NEVER pour maintenir l'état loading
    coachingStaffService.findBySlug.and.returnValue(NEVER);

    fixture = TestBed.createComponent(CoachDetailComponent);
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

  it('should load coach by slug on init', () => {
    coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
    fixture.detectChanges();

    expect(coachingStaffService.findBySlug).toHaveBeenCalledWith('headcoach');
    expect(component.loading()).toBe(false);
    expect(component.coach()).toEqual(mockCoach);
  });

  it('should compute teamName from loaded coach.team', () => {
    coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
    fixture.detectChanges();

    expect(component.teamName()).toBe('Team Valorant');
  });

  it('should return empty string for teamName when no coach', () => {
    expect(component.teamName()).toBe('');
  });

  it('should compute age from birthDate', () => {
    coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
    fixture.detectChanges();

    const age = component.age();
    expect(age).toBeGreaterThan(0);
    expect(age).toBeLessThan(100);
  });

  it('should return undefined age when no birthDate', () => {
    const coachNoBirthDate: CoachingStaffMember = { ...mockCoach, birthDate: undefined };
    coachingStaffService.findBySlug.and.returnValue(of(coachNoBirthDate));
    fixture.detectChanges();

    expect(component.age()).toBeUndefined();
  });

  it('should compute socialLinks from socials', () => {
    coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
    fixture.detectChanges();

    const links = component.socialLinks();
    expect(links.length).toBe(1);
    expect(links[0].platform).toBe('twitter');
  });

  it('should return empty socialLinks when no socials', () => {
    const coachNoSocials: CoachingStaffMember = { ...mockCoach, socials: undefined };
    coachingStaffService.findBySlug.and.returnValue(of(coachNoSocials));
    fixture.detectChanges();

    expect(component.socialLinks()).toEqual([]);
  });

  describe('SEO', () => {
    it('should call updateMetaTags with coach data after loading', () => {
      coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
      fixture.detectChanges();

      expect(seoService.updateMetaTags).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'HeadCoach | Head Coach | Team Valorant',
          url: '/structure/equipes/team-valorant/coach/headcoach',
          type: 'profile',
        })
      );
    });

    it('should call setJsonLd with BreadcrumbList and Person after loading', () => {
      coachingStaffService.findBySlug.and.returnValue(of(mockCoach));
      fixture.detectChanges();

      expect(seoService.getPersonJsonLd).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'HeadCoach', role: 'Head Coach' }),
        jasmine.objectContaining({ name: 'Team Valorant', game: 'Valorant' }),
      );
      expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
        { name: 'Accueil', url: '/' },
        { name: 'Equipes', url: '/structure/equipes' },
        { name: 'Team Valorant', url: '/structure/equipes/team-valorant' },
        { name: 'HeadCoach', url: '/structure/equipes/team-valorant/coach/headcoach' },
      ]);
      expect(seoService.setJsonLd).toHaveBeenCalledWith([
        { '@type': 'BreadcrumbList' },
        { '@type': 'Person' },
      ]);
    });

    it('should set noIndex SEO on loading error', () => {
      coachingStaffService.findBySlug.and.returnValue(throwError(() => new Error('Not found')));
      fixture.detectChanges();

      expect(seoService.updateMetaTags).toHaveBeenCalledWith(
        jasmine.objectContaining({ noIndex: true })
      );
    });
  });

  it('should set error state on loading failure', () => {
    coachingStaffService.findBySlug.and.returnValue(throwError(() => new Error('Not found')));
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Coach introuvable');
  });

  it('should navigate back to team on goBack', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/structure/equipes', 'team-valorant']);
  });

  it('should navigate back to equipes list on goBack when no teamId in snapshot', () => {
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
    const coachWithFields: CoachingStaffMember = {
      ...mockCoach,
      customFields: { experience: '10 ans', certifications: 'UEFA B' },
    };
    coachingStaffService.findBySlug.and.returnValue(of(coachWithFields));
    fixture.detectChanges();

    const fields = component.getCustomFields();
    expect(fields.length).toBe(2);
    expect(fields.find(f => f.key === 'experience')?.value).toBe('10 ans');
  });

  it('should unsubscribe from loadCoach when component is destroyed (takeUntilDestroyed)', () => {
    const subject = new Subject<CoachingStaffMember>();
    coachingStaffService.findBySlug.and.returnValue(subject.asObservable());
    fixture.detectChanges();

    expect(component.loading()).toBe(true);

    // Destroy component before observable emits
    fixture.destroy();

    // Emit after destruction — loading should NOT have changed (no subscriber)
    subject.next(mockCoach);

    // loading remains true because the subscription was cleaned up
    expect(component.loading()).toBe(true);
  });
});
