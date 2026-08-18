import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PrivacyOptoutComponent } from './privacy-optout';
import { SeoService } from '../../shared/services/seo.service';

describe('PrivacyOptoutComponent', () => {
  let component: PrivacyOptoutComponent;
  let fixture: ComponentFixture<PrivacyOptoutComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [PrivacyOptoutComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyOptoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags with correct params on init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Préférences vie privée',
        url: '/privacy-optout'
      })
    );
  });

  it('should render Matomo opt-out iframe with correct src attribute', () => {
    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe.src).toContain('matomo.tellebma.fr');
    expect(iframe.src).toContain('action=optOut');
    expect(iframe.src).toContain('language=fr');
  });

  it('should point the iframe to the exact Matomo origin allowed by the CSP', () => {
    // L'origine de l'iframe doit rester alignee avec la directive frame-src
    // definie dans nginx.conf ($csp_frame). Si ce domaine change, la CSP doit
    // etre mise a jour sous peine de voir l'iframe bloquee en production.
    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(new URL(iframe.src).origin).toBe('https://matomo.tellebma.fr');
  });

  it('should have a title and aria-label on the iframe', () => {
    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe.getAttribute('title')).toBeTruthy();
    expect(iframe.getAttribute('aria-label')).toBeTruthy();
  });

  it('should have a single h1 element', () => {
    const h1Elements = fixture.nativeElement.querySelectorAll('h1');
    expect(h1Elements).toHaveSize(1);
  });
});
