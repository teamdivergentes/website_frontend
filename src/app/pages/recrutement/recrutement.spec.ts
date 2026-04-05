import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject, NEVER } from 'rxjs';
import { RecrutementComponent } from './recrutement';
import { RecruitmentService } from '../../shared/services/recruitment.service';
import { SeoService } from '../../shared/services/seo.service';
import { RecruitmentPost } from '../../shared/models/recruitment.model';
import { provideRouter } from '@angular/router';

describe('RecrutementComponent', () => {
  let component: RecrutementComponent;
  let fixture: ComponentFixture<RecrutementComponent>;
  let recruitmentService: jasmine.SpyObj<RecruitmentService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const mockPosts: RecruitmentPost[] = [
    {
      id: 1,
      title: 'Community Manager',
      type: 'Bénévole',
      description: 'Gérer les réseaux sociaux',
      active: true,
      position: 0,
      slug: 'community-manager'
    }
  ];

  beforeEach(async () => {
    const recruitmentServiceSpy = jasmine.createSpyObj('RecruitmentService', ['loadActivePosts'], {
      activePosts: jasmine.createSpy().and.returnValue(mockPosts)
    });
    const seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [RecrutementComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RecruitmentService, useValue: recruitmentServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    recruitmentService = TestBed.inject(RecruitmentService) as jasmine.SpyObj<RecruitmentService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    // Default: NEVER to stay in loading state
    recruitmentService.loadActivePosts.and.returnValue(NEVER);

    fixture = TestBed.createComponent(RecrutementComponent);
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
      jasmine.objectContaining({ title: 'Recrutement' })
    );
  });

  it('should set loading to true when loading starts', () => {
    component.loadPosts();
    expect(component.loading()).toBe(true);
  });

  it('should set loading to false after posts loaded successfully', () => {
    recruitmentService.loadActivePosts.and.returnValue(of(mockPosts));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeUndefined();
  });

  it('should set error when loading fails', () => {
    recruitmentService.loadActivePosts.and.returnValue(throwError(() => new Error('Network error')));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Erreur lors du chargement des offres de recrutement');
  });

  it('should clear error on reload', () => {
    // First load fails
    recruitmentService.loadActivePosts.and.returnValue(throwError(() => new Error('error')));
    component.loadPosts();
    expect(component.error()).toBeTruthy();

    // Second load succeeds
    recruitmentService.loadActivePosts.and.returnValue(of(mockPosts));
    component.loadPosts();

    expect(component.error()).toBeUndefined();
  });

  it('should set loading to true at start of loadPosts', () => {
    const subject = new Subject<RecruitmentPost[]>();
    recruitmentService.loadActivePosts.and.returnValue(subject.asObservable());

    component.loadPosts();

    expect(component.loading()).toBe(true);
    subject.complete();
  });

  it('should call loadActivePosts on init', () => {
    fixture.detectChanges();
    expect(recruitmentService.loadActivePosts).toHaveBeenCalled();
  });
});
