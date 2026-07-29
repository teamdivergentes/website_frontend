import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RetractationComponent } from './retractation';
import { SeoService } from '../../../shared/services/seo.service';
import { LEGAL, SHOP_LEGAL, TODO_MARKER } from '../legal-info';

describe('RetractationComponent', () => {
  let component: RetractationComponent;
  let fixture: ComponentFixture<RetractationComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  const text = (): string => fixture.nativeElement.textContent as string;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [RetractationComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RetractationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call updateMetaTags with correct params on init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Droit de rétractation',
        url: '/retractation'
      })
    );
  });

  it('should have a single h1 element', () => {
    const h1Elements = fixture.nativeElement.querySelectorAll('h1');
    expect(h1Elements.length).toBe(1);
  });

  it('should have aria-labelledby on the main section', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('retractation-title');
  });

  it('should render the six numbered sections', () => {
    const h2Elements = fixture.nativeElement.querySelectorAll('h2');
    expect(h2Elements.length).toBe(6);
  });

  // ---------------------------------------------------------------------
  // Avis d'information
  // ---------------------------------------------------------------------

  it('should state the fourteen day period', () => {
    expect(text()).toContain('quatorze jours');
  });

  it('should state the personalised goods exception with its legal basis', () => {
    const rendered = text();
    expect(rendered).toContain('L221-28');
    expect(rendered).toContain('nettement personnalisés');
  });

  it('should keep the right open for a jersey without flocking', () => {
    expect(text()).toContain('Maillot commandé sans flocage');
  });

  it('should say who pays the return costs', () => {
    expect(SHOP_LEGAL.returnCostsBorneByCustomer).toBeTrue();
    expect(component.returnCosts).toContain('à la charge du client');
    expect(text()).toContain('à la charge du client');
  });

  // ---------------------------------------------------------------------
  // Trous juridiques : ce qui manque doit se voir à l'écran
  // ---------------------------------------------------------------------

  it('should display the TODO marker for the missing return address', () => {
    expect(SHOP_LEGAL.returnAddress).withContext("fixture: l'adresse doit être absente").toBeNull();
    expect(component.returnAddress).toContain(TODO_MARKER);
    expect(text()).toContain(TODO_MARKER);
  });

  it('should display the TODO marker for the missing phone number', () => {
    expect(LEGAL.phone).toBeNull();
    expect(component.phone).toContain(TODO_MARKER);
  });

  // ---------------------------------------------------------------------
  // Formulaire type (annexe art. R221-1)
  // ---------------------------------------------------------------------

  it('should reproduce every mandatory line of the R221-1 template', () => {
    const form = component.formTemplate;
    expect(form).toContain("À l'attention de");
    expect(form).toContain('rétractation du contrat portant sur');
    expect(form).toContain('Commandé le (*)/reçu le (*) :');
    expect(form).toContain('Nom du (des) consommateur(s) :');
    expect(form).toContain('Adresse du (des) consommateur(s) :');
    expect(form).toContain('Signature du (des) consommateur(s)');
    expect(form).toContain('Date :');
    expect(form).toContain('(*) Rayez la mention inutile.');
  });

  it('should render the form as selectable text, not as decoration', () => {
    const pre = fixture.nativeElement.querySelector('pre.retract-form');
    expect(pre).toBeTruthy();
    expect(pre.textContent).toContain("À l'attention de");
    expect(pre.textContent).toContain('Date :');
  });

  it('should carry the TODO marker inside the form when the return address is unknown', () => {
    expect(component.formTemplate).toContain(TODO_MARKER);
  });

  it('should cite the R221-1 annex', () => {
    expect(text()).toContain('R221-1');
  });

  it('should copy the form to the clipboard', async () => {
    const write = spyOn(component, 'writeToClipboard').and.resolveTo();

    await component.copyForm();

    expect(write).toHaveBeenCalledWith(component.formTemplate);
    expect(component.copyState()).toBe('copied');
  });

  it('should report a clipboard failure instead of throwing', async () => {
    spyOn(component, 'writeToClipboard').and.rejectWith(new Error('denied'));

    await component.copyForm();

    expect(component.copyState()).toBe('error');
  });

  it('should trigger the browser print dialog', () => {
    const printSpy = spyOn(globalThis, 'print');

    component.printForm();

    expect(printSpy).toHaveBeenCalled();
  });

  it('should link back to the CGV page', () => {
    const hrefs: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('a[href]') as NodeListOf<HTMLAnchorElement>
    ).map(a => a.getAttribute('href') ?? '');
    expect(hrefs).toContain('/conditions-generales-de-vente');
  });

  it('should not use em dashes in the user facing copy', () => {
    expect(text()).not.toContain('—');
  });
});
