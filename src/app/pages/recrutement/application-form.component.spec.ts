import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ApplicationFormComponent } from './application-form.component';
import { RecruitmentService } from '../../shared/services/recruitment.service';
import { SeoService } from '../../shared/services/seo.service';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('ApplicationFormComponent', () => {
  let component: ApplicationFormComponent;
  let fixture: ComponentFixture<ApplicationFormComponent>;
  let recruitmentService: jasmine.SpyObj<RecruitmentService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const mockQueryParams = {
    postTitle: 'Community Manager',
    postType: 'Bénévole'
  };

  beforeEach(async () => {
    const recruitmentServiceSpy = jasmine.createSpyObj('RecruitmentService', ['applyToPost']);
    const seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [ApplicationFormComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RecruitmentService, useValue: recruitmentServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of(mockQueryParams)
          }
        }
      ]
    }).compileComponents();

    recruitmentService = TestBed.inject(RecruitmentService) as jasmine.SpyObj<RecruitmentService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    fixture = TestBed.createComponent(ApplicationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate postTitle and postType from query params', () => {
    expect(component.postTitle).toBe('Community Manager');
    expect(component.postType).toBe('Bénévole');
  });

  it('should initialize isSubmitting to false', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should initialize submitSuccess to false', () => {
    expect(component.submitSuccess()).toBe(false);
  });

  it('should initialize submitError to null', () => {
    expect(component.submitError()).toBeNull();
  });

  it('should not submit when CV is not selected', () => {
    component.cvFile = null;
    component.onSubmit();
    expect(component.cvTouched).toBe(true);
    expect(recruitmentService.applyToPost).not.toHaveBeenCalled();
  });

  it('should not submit when already submitting', () => {
    component.isSubmitting.set(true);
    component.onSubmit();
    expect(recruitmentService.applyToPost).not.toHaveBeenCalled();
  });

  it('should set submitSuccess on successful submission', () => {
    component.name = 'John Doe';
    component.email = 'john@example.com';
    component.cvFile = new File(['cv'], 'cv.pdf');
    recruitmentService.applyToPost.and.returnValue(of({ success: true, message: 'ok' }));

    component.onSubmit();

    expect(component.submitSuccess()).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should reset form fields on successful submission', () => {
    component.name = 'John Doe';
    component.email = 'john@example.com';
    component.cvFile = new File(['cv'], 'cv.pdf');
    component.cvFileName = 'cv.pdf';
    recruitmentService.applyToPost.and.returnValue(of({ success: true, message: 'ok' }));

    component.onSubmit();

    expect(component.name).toBe('');
    expect(component.email).toBe('');
    expect(component.cvFile).toBeNull();
    expect(component.cvFileName).toBe('');
  });

  it('should set submitError on API error', () => {
    component.cvFile = new File(['cv'], 'cv.pdf');
    recruitmentService.applyToPost.and.returnValue(throwError(() => new Error('Network error')));

    component.onSubmit();

    expect(component.submitError()).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should set submitError when API returns success=false', () => {
    component.cvFile = new File(['cv'], 'cv.pdf');
    recruitmentService.applyToPost.and.returnValue(of({ success: false, message: 'Email invalide' }));

    component.onSubmit();

    expect(component.submitError()).toBe('Email invalide');
    expect(component.submitSuccess()).toBe(false);
  });

  it('should set cvFileName when file is selected', () => {
    const file = new File(['content'], 'mycv.pdf');
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelected(event);

    expect(component.cvFileName).toBe('mycv.pdf');
    expect(component.cvFile).toBe(file);
  });

  it('should set coverLetterFileName when file is selected', () => {
    const file = new File(['content'], 'cover.pdf');
    const event = { target: { files: [file] } } as unknown as Event;

    component.onCoverLetterSelected(event);

    expect(component.coverLetterFileName).toBe('cover.pdf');
    expect(component.coverLetterFile).toBe(file);
  });

  // US-noindex-postuler (EPIC-23)
  it('should call seoService.updateMetaTags with noIndex: true on init', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        noIndex: true,
        url: '/structure/recrutement/postuler',
      })
    );
  });

  it('should emit noindex meta tag for job application page', () => {
    const call = seoService.updateMetaTags.calls.mostRecent();
    expect(call.args[0]['noIndex']).toBe(true);
  });
});
