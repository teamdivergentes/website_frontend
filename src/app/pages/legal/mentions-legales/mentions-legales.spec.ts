import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MentionsLegalesComponent } from './mentions-legales';
import { SeoService } from '../../../shared/services/seo.service';
import { HOST, LEGAL, SHOP_LEGAL, MISSING_MARKER } from '../legal-info';

describe('MentionsLegalesComponent', () => {
  let component: MentionsLegalesComponent;
  let fixture: ComponentFixture<MentionsLegalesComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  /** Texte rendu, espaces normalisés pour ne pas dépendre du formatage du template. */
  const renderedText = (): string =>
    (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [MentionsLegalesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MentionsLegalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags with correct params on init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Mentions Légales',
        url: '/mentions-legales'
      })
    );
  });

  it('should have a single h1 element', () => {
    const h1Elements = fixture.nativeElement.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should display section headings', () => {
    const h2Elements = fixture.nativeElement.querySelectorAll('h2');
    expect(h2Elements.length).toBeGreaterThanOrEqual(9);
  });

  it('should have aria-labelledby on the main section', () => {
    // `<dvg-page>` rend aussi un `<section>` (voir page.component.ts) : cibler
    // la section de la page, pas la premiere section du DOM.
    const section = fixture.nativeElement.querySelector('section.legal-page');
    expect(section.getAttribute('aria-labelledby')).toBe('mentions-title');
  });

  it('should render the editor identity from the shared legal constants', () => {
    const text = renderedText();
    expect(text).toContain(LEGAL.name);
    expect(text).toContain(LEGAL.legalForm);
    expect(text).toContain(LEGAL.siren);
    expect(text).toContain(LEGAL.address);
    expect(text).toContain(LEGAL.email);
    expect(text).toContain(LEGAL.publicationDirector);
  });

  it('should render the host details from the shared legal constants', () => {
    const text = renderedText();
    expect(text).toContain(HOST.name);
    expect(text).toContain(HOST.address);
    expect(text).toContain(HOST.phone);
  });

  it('should display a phone number for the vendor, or the TODO marker', () => {
    const text = renderedText();
    expect(text).toContain('Téléphone :');
    expect(text).toContain(LEGAL.phone ?? MISSING_MARKER);
  });

  it('should display the VAT number or the exemption notice, or the TODO marker', () => {
    const text = renderedText();
    expect(text).toContain(LEGAL.vatNumber ?? LEGAL.vatExemptionNotice ?? MISSING_MARKER);
  });

  it('should describe the online selling activity', () => {
    const text = renderedText();
    expect(text).toContain('Activité de vente en ligne');
    expect(text).toContain('produits dérivés');
  });

  it('should link to the terms of sale', () => {
    const link: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      'a[href="/conditions-generales-de-vente"]'
    );
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('conditions générales de vente');
  });

  it('should display the ADEME unique identifier for the textile EPR scheme, or the TODO marker', () => {
    const text = renderedText();
    expect(text).toContain('Identifiant unique ADEME :');
    expect(text).toContain(SHOP_LEGAL.ademeUniqueId ?? MISSING_MARKER);
  });

  it('should not leave any legal placeholder unmarked when a constant is missing', () => {
    const text = renderedText();
    const missingCount = [LEGAL.phone, LEGAL.vatNumber ?? LEGAL.vatExemptionNotice, SHOP_LEGAL.ademeUniqueId]
      .filter(value => value === null).length;
    const markerCount = text.split(MISSING_MARKER).length - 1;
    expect(markerCount).toBeGreaterThanOrEqual(missingCount);
  });
});
