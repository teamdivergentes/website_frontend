import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject, NEVER } from 'rxjs';
import { SponsorComponent } from './sponsors';
import { SponsorsService } from '../../shared/services/sponsors.service';
import { Sponsor, ImageLayout } from '../../shared/models';
import { provideRouter } from '@angular/router';

describe('SponsorComponent', () => {
  let component: SponsorComponent;
  let fixture: ComponentFixture<SponsorComponent>;
  let sponsorsService: jasmine.SpyObj<SponsorsService>;

  const mockSponsors: Sponsor[] = [
    {
      id: 1,
      name: 'Test Sponsor',
      slug: 'test-sponsor',
      description: 'Description',
      position: 0,
      active: true,
      imageLayout: ImageLayout.LAYOUT_1,
      images: [],
      links: [],
      startDate: null,
      endDate: null,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const sponsorsServiceSpy = jasmine.createSpyObj('SponsorsService', ['loadSponsors'], {
      sponsors: jasmine.createSpy().and.returnValue(mockSponsors)
    });

    await TestBed.configureTestingModule({
      imports: [SponsorComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SponsorsService, useValue: sponsorsServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    sponsorsService = TestBed.inject(SponsorsService) as jasmine.SpyObj<SponsorsService>;
    // Valeur de retour par défaut pour éviter les erreurs "undefined is not subscribable"
    sponsorsService.loadSponsors.and.returnValue(NEVER);
    fixture = TestBed.createComponent(SponsorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sponsors on init', () => {
    sponsorsService.loadSponsors.and.returnValue(of(mockSponsors));

    fixture.detectChanges();

    expect(sponsorsService.loadSponsors).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeUndefined();
  });

  it('should set loading state while loading', () => {
    const subject = new Subject<Sponsor[]>();
    sponsorsService.loadSponsors.and.returnValue(subject.asObservable());

    component.ngOnInit();

    expect(component.loading()).toBe(true);
    subject.complete();
  });

  it('should handle load error', () => {
    const error = new Error('Load failed');
    sponsorsService.loadSponsors.and.returnValue(throwError(() => error));

    fixture.detectChanges();

    expect(component.error()).toBe('Erreur lors du chargement des sponsors');
    expect(component.loading()).toBe(false);
  });

  it('should compute noSponsors correctly when empty', () => {
    Object.defineProperty(component, 'sponsors', {
      get: () => () => []
    });

    expect(component.noSponsors()).toBe(true);
  });

  it('should compute noSponsors correctly when has sponsors', () => {
    Object.defineProperty(component, 'sponsors', {
      get: () => () => mockSponsors
    });

    expect(component.noSponsors()).toBe(false);
  });

  it('should unsubscribe on destroy', () => {
    sponsorsService.loadSponsors.and.returnValue(of(mockSponsors));

    component.ngOnInit();
    const subscription = component['subscription'];
    spyOn(subscription!, 'unsubscribe');

    component.ngOnDestroy();

    expect(subscription!.unsubscribe).toHaveBeenCalled();
  });

  it('should display loading state in template', () => {
    // detectChanges déclenche ngOnInit qui appelle loadSponsors (retourne NEVER)
    // ngOnInit positionne loading=true, donc le skeleton s'affiche
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loading = compiled.querySelector('.skeleton-sponsors');
    expect(loading).toBeTruthy();
    expect(loading?.getAttribute('aria-label')).toContain('Chargement des sponsors');
  });

  it('should display error state in template', () => {
    // Appel de detectChanges d'abord pour initialiser le composant
    fixture.detectChanges();
    // Puis on positionne l'état d'erreur et on re-détecte les changements
    component.loading.set(false);
    component.error.set('Test error');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const error = compiled.querySelector('.error-state');
    expect(error?.textContent).toContain('Test error');
  });
});
