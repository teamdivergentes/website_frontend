import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SliderComponent, SliderImage } from './slider';
import { sharedTestProvider } from '../../tests/shared-test-provider';

/**
 * Le carrousel ne telecharge que les vues deja demandees.
 *
 * Ses vues sont empilees au meme endroit : elles sont donc toutes dans le
 * viewport, et `loading="lazy"` ne differait rien — le navigateur les chargeait
 * toutes au premier rendu. La regle que ces tests verrouillent est double :
 * on charge le moins possible, mais JAMAIS moins que ce qui va etre affiche.
 */
describe('SliderComponent', () => {
  let fixture: ComponentFixture<SliderComponent>;
  let component: SliderComponent;

  const images: SliderImage[] = [
    { index: 0, path: 'a.png', webpPath: 'a.webp', width: 10, height: 10, alt: 'a' },
    { index: 1, path: 'b.png', webpPath: 'b.webp', width: 10, height: 10, alt: 'b' },
    { index: 2, path: 'c.png', webpPath: 'c.webp', width: 10, height: 10, alt: 'c' },
  ];

  /** Sources reellement posees dans le DOM, dans l'ordre des vues. */
  const renderedSources = (): (string | null)[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.slider-container > picture')
    ).map((p) => {
      const img = (p as HTMLElement).querySelector('img');
      return img ? img.getAttribute('src') : null;
    });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SliderComponent],
      providers: [sharedTestProvider],
    }).compileComponents();

    fixture = TestBed.createComponent(SliderComponent);
    component = fixture.componentInstance;
    // Rotation automatique desactivee : ces tests pilotent l'index a la main.
    fixture.componentRef.setInput('images', images);
    fixture.componentRef.setInput('autoPlayInterval', 0);
    fixture.detectChanges();
  });

  it('ne pose de source que sur la vue affichee et la suivante', () => {
    // `afterNextRender` a ajoute la vue d'avance : 0 (affichee) et 1 (prefetch).
    expect(renderedSources()).toEqual(['a.png', 'b.png', null]);
  });

  it("n'affiche jamais une vue dont la source n'a pas ete demandee", () => {
    component.goToSlide(1);
    fixture.detectChanges();

    const sources = renderedSources();
    // La vue affichee porte sa source...
    expect(sources[1]).toBe('b.png');
    // ...et la suivante est prete avant qu'on y arrive.
    expect(sources[2]).toBe('c.png');
  });

  it('replie la vue d avance sur la boucle depuis la derniere vue', () => {
    component.goToSlide(2);
    fixture.detectChanges();

    // Depuis la derniere vue, la suivante est la premiere : deja demandee,
    // donc toutes les vues portent desormais leur source.
    expect(renderedSources()).toEqual(['a.png', 'b.png', 'c.png']);
  });

  it('ne redemande pas une vue deja demandee', () => {
    const before = renderedSources();
    component.goToSlide(0);
    fixture.detectChanges();

    expect(renderedSources()).toEqual(before);
  });
});
