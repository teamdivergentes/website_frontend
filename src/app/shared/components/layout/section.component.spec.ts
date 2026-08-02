import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionComponent } from './section.component';

describe('SectionComponent', () => {
  let fixture: ComponentFixture<SectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionComponent);
  });

  const render = (inputs: Record<string, unknown> = {}): HTMLElement => {
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('rend une balise section', () => {
    expect(render().querySelector('section')).toBeTruthy();
  });

  it('n\'a pas de titre quand heading est absent', () => {
    const el = render();

    expect(el.querySelector('h2')).toBeNull();
  });

  // Le niveau est impose : l'audit du 2026-08-02 a trouve des titres choisis pour
  // leur rendu plutot que pour la structure — dont un <h2> deux fois plus grand
  // que le <h1> de sa page.
  it('rend le titre en h2, quel que soit le palier demande', () => {
    for (const headingSize of ['3', '4', '5'] as const) {
      const el = render({ heading: 'Nos equipes', headingSize });
      const h2 = el.querySelector('h2');

      expect(h2?.textContent?.trim()).toBe('Nos equipes');
      expect(el.querySelector('h1')).toBeNull();
      expect(el.querySelector('h3')).toBeNull();
    }
  });

  it('applique le palier demande', () => {
    expect(render({ heading: 'T', headingSize: '5' }).querySelector('h2')?.className).toContain(
      'heading-5',
    );
  });

  it('utilise le palier 3 par defaut', () => {
    expect(render({ heading: 'T' }).querySelector('h2')?.className).toContain('heading-3');
  });
});
