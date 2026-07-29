import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CgvComponent } from './cgv';
import { SeoService } from '../../../shared/services/seo.service';
import { LEGAL, SHOP_LEGAL, TODO_MARKER } from '../legal-info';

describe('CgvComponent', () => {
  let component: CgvComponent;
  let fixture: ComponentFixture<CgvComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  const text = (): string => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [CgvComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CgvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags with correct params on init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Conditions Générales de Vente',
        url: '/conditions-generales-de-vente'
      })
    );
  });

  it('should have a single h1 element', () => {
    const h1Elements = fixture.nativeElement.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should have aria-labelledby on the main section', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('cgv-title');
  });

  it('should render the fourteen numbered articles', () => {
    const h2Elements = fixture.nativeElement.querySelectorAll('h2');
    expect(h2Elements.length).toBe(14);
  });

  it('should expose the vendor identity from the single source', () => {
    const rendered = text();
    expect(rendered).toContain(LEGAL.name);
    expect(rendered).toContain(LEGAL.siren);
    expect(rendered).toContain(LEGAL.address);
    expect(rendered).toContain(LEGAL.email);
  });

  it('should render every table header cell with a scope', () => {
    const headers: HTMLTableCellElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('table th')
    );
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach(header => expect(header.getAttribute('scope')).toBe('row'));
  });

  // ---------------------------------------------------------------------
  // Trous juridiques : ce qui manque doit se voir à l'écran
  // ---------------------------------------------------------------------

  it('should display the TODO marker for the missing phone number', () => {
    expect(LEGAL.phone).withContext('fixture: le téléphone doit être absent').toBeNull();
    expect(component.phone).toContain(TODO_MARKER);
    expect(text()).toContain(TODO_MARKER);
  });

  it('should display the TODO marker instead of inventing a VAT mention', () => {
    expect(LEGAL.vatNumber).toBeNull();
    expect(LEGAL.vatExemptionNotice).toBeNull();
    expect(component.vatMention).toContain(TODO_MARKER);
  });

  /**
   * Le délai annoncé aux CGV engage le vendeur (art. L216-1) : il vient de
   * `SHOP_LEGAL`, jamais d'une durée écrite en dur dans la page, et affiche le
   * marqueur tant que la valeur manque.
   */
  it('should take the delivery delays from SHOP_LEGAL, or show the TODO marker', () => {
    const { shippingDelayBusinessDays, carrierDelayBusinessDays } = SHOP_LEGAL;

    if (shippingDelayBusinessDays === null || carrierDelayBusinessDays === null) {
      expect(component.shippingDelay).toContain(TODO_MARKER);
      expect(component.carrierDelay).toContain(TODO_MARKER);
      return;
    }
    expect(component.shippingDelay).toContain(`${shippingDelayBusinessDays}`);
    expect(component.carrierDelay).toContain(`${carrierDelayBusinessDays}`);
    expect(component.shippingDelay).not.toContain(TODO_MARKER);
    expect(component.carrierDelay).not.toContain(TODO_MARKER);
  });

  it('should display the TODO marker for the missing mediator', () => {
    expect(SHOP_LEGAL.mediator.name).toBeNull();
    expect(component.mediatorName).toContain(TODO_MARKER);
    expect(component.mediatorAddress).toContain(TODO_MARKER);
    expect(component.mediatorWebsite).toContain(TODO_MARKER);
  });

  it('should display the TODO marker for the missing return address', () => {
    expect(SHOP_LEGAL.returnAddress).toBeNull();
    expect(component.returnAddress).toContain(TODO_MARKER);
  });

  // ---------------------------------------------------------------------
  // Contenu contractuel obligatoire
  // ---------------------------------------------------------------------

  it('should reproduce the statutory guarantee box (art. L217-15)', () => {
    const box = fixture.nativeElement.querySelector('.legal-statutory-box');
    expect(box).withContext("l'encadré de l'article L217-15 est obligatoire").toBeTruthy();
    expect(box.textContent).toContain('L217-15');
    expect(box.textContent).toContain('garantie légale de conformité');
    expect(box.textContent).toContain('1641');
  });

  it('should state the personalised goods exception and its legal basis', () => {
    const rendered = text();
    expect(rendered).toContain('L221-28');
    expect(rendered).toContain('nettement personnalisés');
  });

  it('should cite the late delivery remedy (art. L216-1 to L216-6)', () => {
    expect(text()).toContain('L216-1');
    expect(text()).toContain('L216-6');
  });

  it('should cite the mediation obligation (art. L612-1)', () => {
    expect(text()).toContain('L612-1');
  });

  it('should state that no bank data is kept by the association', () => {
    const rendered = text();
    expect(rendered).toContain('Stripe');
    expect(rendered).toContain("Aucune donnée bancaire n'est saisie");
  });

  it('should restrict delivery to metropolitan France', () => {
    expect(text()).toContain('France métropolitaine');
  });

  it('should link to the retractation and privacy pages', () => {
    const hrefs: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>
    ).map(a => a.getAttribute('href') ?? '');
    expect(hrefs).toContain('/retractation');
    expect(hrefs).toContain('/politique-de-confidentialite');
  });

  it('should not link to the closed european ODR platform', () => {
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).not.toContain('ec.europa.eu/consumers/odr');
    expect(html.toLowerCase()).not.toContain('règlement en ligne des litiges');
  });

  it('should not use em dashes in the user facing copy', () => {
    expect(text()).not.toContain('—');
  });
});
