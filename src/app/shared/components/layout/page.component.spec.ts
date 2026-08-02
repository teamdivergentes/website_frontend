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

  it('utilise le conteneur moyen par defaut', () => {
    expect(render().querySelector('.container-md')).toBeTruthy();
  });

  it('applique la largeur demandee', () => {
    for (const container of ['xs', 'sm', 'md', 'lg'] as const) {
      expect(render({ container }).querySelector(`.container-${container}`)).toBeTruthy();
    }
  });

  // `none` sert aux heros pleine largeur, qui gerent leur propre mise en page.
  it('ne pose aucun conteneur avec none', () => {
    const el = render({ container: 'none' });

    expect(el.querySelector('[class^="container-"]')).toBeNull();
    expect(el.querySelector('section')).toBeTruthy();
  });
});
