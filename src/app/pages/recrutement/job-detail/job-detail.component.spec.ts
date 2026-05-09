import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, NEVER } from 'rxjs';
import { JobDetailComponent } from './job-detail.component';
import { RecruitmentService } from '../../../shared/services/recruitment.service';
import { SeoService } from '../../../shared/services/seo.service';
import { RecruitmentPost } from '../../../shared/models/recruitment.model';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('JobDetailComponent', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let recruitmentService: jasmine.SpyObj<RecruitmentService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const mockPost: RecruitmentPost = {
    id: 1,
    title: 'Community Manager',
    type: 'Bénévole',
    description: 'Gérer les réseaux sociaux de la team',
    active: true,
    position: 0,
    slug: 'community-manager',
    location: 'Remote',
    duration: '6 mois',
    missions: 'Gérer les publications\nAnimer la communauté',
    skills: 'Créativité\nSens de la communication',
    createdAt: '2025-01-15T00:00:00Z',
  };

  beforeEach(async () => {
    const recruitmentServiceSpy = jasmine.createSpyObj('RecruitmentService', ['getPostBySlug'], {
      activePosts: jasmine.createSpy().and.returnValue([mockPost])
    });
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getJobPostingJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    seoServiceSpy.getJobPostingJsonLd.and.returnValue({ '@type': 'JobPosting' });
    seoServiceSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });

    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RecruitmentService, useValue: recruitmentServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => key === 'slug' ? 'community-manager' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    recruitmentService = TestBed.inject(RecruitmentService) as jasmine.SpyObj<RecruitmentService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    // Default: NEVER to keep loading
    recruitmentService.getPostBySlug.and.returnValue(NEVER);

    fixture = TestBed.createComponent(JobDetailComponent);
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
  });

  it('should load post on init and set loading to false', () => {
    recruitmentService.getPostBySlug.and.returnValue(of(mockPost));
    fixture.detectChanges();

    expect(recruitmentService.getPostBySlug).toHaveBeenCalledWith('community-manager');
    expect(component.loading()).toBe(false);
    expect(component.post()).toEqual(mockPost);
  });

  it('should update SEO tags after loading post', () => {
    recruitmentService.getPostBySlug.and.returnValue(of(mockPost));
    fixture.detectChanges();

    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Community Manager' })
    );
  });

  it('should call setJsonLd with JobPosting and BreadcrumbList after loading post', () => {
    recruitmentService.getPostBySlug.and.returnValue(of(mockPost));
    fixture.detectChanges();

    expect(seoService.getJobPostingJsonLd).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Community Manager', slug: 'community-manager' })
    );
    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalledWith([
      { name: 'Accueil', url: '/' },
      { name: 'Recrutement', url: '/structure/recrutement' },
      { name: 'Community Manager', url: '/structure/recrutement/community-manager' },
    ]);
    expect(seoService.setJsonLd).toHaveBeenCalledWith([
      { '@type': 'BreadcrumbList' },
      { '@type': 'JobPosting' },
    ]);
  });

  it('should split lines correctly', () => {
    const result = component.splitLines('Line 1\nLine 2\nLine 3');
    expect(result).toEqual(['Line 1', 'Line 2', 'Line 3']);
  });

  it('should filter empty lines when splitting', () => {
    const result = component.splitLines('Line 1\n\nLine 3');
    expect(result).toEqual(['Line 1', 'Line 3']);
  });

  it('should return empty array for undefined text', () => {
    const result = component.splitLines(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    const result = component.splitLines('');
    expect(result).toEqual([]);
  });

  it('should return correct query params when post is loaded', () => {
    recruitmentService.getPostBySlug.and.returnValue(of(mockPost));
    fixture.detectChanges();

    const params = component.getApplyQueryParams();
    expect(params).toEqual({ postTitle: 'Community Manager', postType: 'Bénévole' });
  });

  it('should return empty params when no post', () => {
    const params = component.getApplyQueryParams();
    expect(params).toEqual({});
  });
});
