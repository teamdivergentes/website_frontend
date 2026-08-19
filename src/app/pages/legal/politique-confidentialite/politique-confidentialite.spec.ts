import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PolitiqueConfidentialiteComponent } from './politique-confidentialite';
import { SeoService } from '../../../shared/services/seo.service';

describe('PolitiqueConfidentialiteComponent', () => {
  let component: PolitiqueConfidentialiteComponent;
  let fixture: ComponentFixture<PolitiqueConfidentialiteComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  /** Texte rendu, espaces normalisés pour ne pas dépendre du formatage du template. */
  const renderedText = (): string =>
    (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

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
    expect(h1Elements).toHaveSize(1);
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
    expect(thElements).toHaveSize(4);
  });

  it('should have aria-labelledby on the main section', () => {
    // `<dvg-page>` rend aussi un `<section>` (voir page.component.ts) : cibler
    // la section de la page, pas la premiere section du DOM.
    const section = fixture.nativeElement.querySelector('section.legal-page');
    expect(section.getAttribute('aria-labelledby')).toBe('politique-title');
  });

  it('should declare the shop order processing and the data it involves', () => {
    const text = renderedText();
    expect(text).toContain('Gestion des commandes de la boutique');
    expect(text).toContain('adresse de livraison');
    expect(text).toContain('texte de flocage');
    expect(text).toContain('référence de paiement');
  });

  it('should state the legal basis of the sale contract for shop orders', () => {
    const text = renderedText();
    expect(text).toContain('article 6.1.b du RGPD');
    expect(text).toContain('article 6.1.c du RGPD');
  });

  it('should name the recipients of the order data', () => {
    const text = renderedText();
    expect(text).toContain('Stripe');
    expect(text).toContain('fabricant des maillots');
    expect(text).toContain("L'équipe de l'association");
  });

  it('should not announce any transfer of customer order data to Discord', () => {
    const orderRecipients = Array.from(
      fixture.nativeElement.querySelectorAll('li')
    ) as HTMLElement[];
    const discordItems = orderRecipients.filter(li => (li.textContent ?? '').includes('Discord'));
    discordItems.forEach(li => {
      const content = li.textContent ?? '';
      expect(content).not.toContain('commande');
      expect(content).not.toContain('flocage');
      expect(content).not.toContain('livraison');
    });
  });

  it('should state the retention periods for orders and accounting records', () => {
    const text = renderedText();
    expect(text).toContain('5 ans');
    expect(text).toContain('L110-4');
    expect(text).toContain('10 ans');
    expect(text).toContain('L123-22');
  });

  it('should keep the existing retention periods for applications and analytics', () => {
    const text = renderedText();
    expect(text).toContain('Candidatures :');
    expect(text).toContain('2 ans après le dernier contact');
    expect(text).toContain('14 mois');
  });

  it('should mention non-EU transfers linked to the shop providers', () => {
    const text = renderedText();
    expect(text).toContain('Stripe, Inc., USA');
    expect(text).toContain('clauses contractuelles types');
  });

  it('should recall the data subject rights and how to exercise them for orders', () => {
    const text = renderedText();
    expect(text).toContain("Droit d'accès");
    expect(text).toContain('Droit de rectification');
    expect(text).toContain("Droit à l'effacement");
    expect(text).toContain('Droit à la portabilité');
    expect(text).toContain("Droit d'opposition");
    expect(text).toContain('données de commande de la boutique');
    expect(text).toContain('contact@teamdivergentes.fr');
  });
});
