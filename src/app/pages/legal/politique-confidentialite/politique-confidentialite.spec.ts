import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PolitiqueConfidentialiteComponent } from './politique-confidentialite';
import { SeoService } from '../../../shared/services/seo.service';

describe('PolitiqueConfidentialiteComponent', () => {
  let component: PolitiqueConfidentialiteComponent;
  let fixture: ComponentFixture<PolitiqueConfidentialiteComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [PolitiqueConfidentialiteComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PolitiqueConfidentialiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags with correct params on init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Politique de Confidentialité',
        url: '/politique-de-confidentialite'
      })
    );
  });

  it('should have a single h1 element', () => {
    const h1Elements = fixture.nativeElement.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should display all RGPD sections', () => {
    const h2Elements = fixture.nativeElement.querySelectorAll('h2');
    expect(h2Elements.length).toBeGreaterThanOrEqual(9);
  });

  it('should have an accessible cookie table', () => {
    const table = fixture.nativeElement.querySelector('table');
    expect(table).toBeTruthy();
    const caption = table.querySelector('caption');
    expect(caption).toBeTruthy();
    const thElements = table.querySelectorAll('th[scope="col"]');
    expect(thElements.length).toBe(4);
  });

  it('should have aria-labelledby on the main section', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('politique-title');
  });
});
