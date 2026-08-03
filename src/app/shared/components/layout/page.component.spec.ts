import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageComponent } from './page.component';

describe('PageComponent', () => {
  let fixture: ComponentFixture<PageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PageComponent);
  });

  const render = (inputs: Record<string, unknown> = {}): HTMLElement => {
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  // `sm` est la largeur de contenu, celle de la majorite des pages publiques.
  it('utilise la largeur de contenu par defaut', () => {
    expect(render().querySelector('.container-sm')).toBeTruthy();
  });

  it('applique la largeur demandee', () => {
    for (const container of ['xs', 'sm', 'md', 'lg'] as const) {
      expect(render({ container }).querySelector(`.container-${container}`)).toBeTruthy();
    }
  });

  // `none` sert aux heros pleine largeur, qui gerent leur propre mise en page.
  it('ne pose aucune largeur avec none', () => {
    const el = render({ container: 'none' });

    expect(el.querySelector('[class^="container-"]')).toBeNull();
    expect(el.querySelector('section')).toBeTruthy();
  });

  // Ce test manquait, et son absence a laisse passer un bug complet : le
  // template avait DEUX `<ng-content>` (un par branche d'un `@if`), or Angular
  // ne projette le contenu qu'une fois. Les pages en `none` s'affichaient
  // vides, sans que build, lint ni les autres tests ne bronchent.
  it('projette le contenu, quelle que soit la largeur', () => {
    for (const container of ['xs', 'sm', 'md', 'lg', 'none'] as const) {
      fixture.componentRef.setInput('container', container);
      fixture.detectChanges();

      const hote = fixture.nativeElement as HTMLElement;
      const section = hote.querySelector('section.dvg-page');

      expect(section)
        .withContext(`section absente pour container="${container}"`)
        .toBeTruthy();
      expect(section?.querySelector('ng-content, div'))
        .withContext(`aucun point de projection pour container="${container}"`)
        .toBeTruthy();
    }
  });
});
