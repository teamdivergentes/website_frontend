import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PriceComponent } from './price.component';

describe('PriceComponent', () => {
  let fixture: ComponentFixture<PriceComponent>;

  const render = async (priceCents: number, listPriceCents: number | null = null) => {
    fixture.componentRef.setInput('priceCents', priceCents);
    fixture.componentRef.setInput('listPriceCents', listPriceCents);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PriceComponent],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(PriceComponent);
  });

  it('affiche le prix seul hors promotion', async () => {
    const element = await render(4990);

    expect(element.textContent).toContain('49');
    expect(element.textContent).toContain('90');
    expect(element.querySelector('s')).toBeNull();
  });

  it('barre le prix catalogue pendant une promotion', async () => {
    const element = await render(3990, 4990);

    // Le séparateur décimal suit la locale de l'application : le test porte sur
    // les montants, pas sur son réglage.
    expect(element.querySelector('s')?.textContent).toMatch(/49.90/);
    expect(element.querySelector('.dvg-price__now')?.textContent).toMatch(/39.90/);
  });

  it('annonce lequel des deux montants est dû', async () => {
    // Barré à l'écran, un prix reste un nombre pour une synthèse vocale : sans
    // ces annonces, elle énonce deux montants à la suite sans les distinguer.
    const element = await render(3990, 4990);
    // Les libellés portent une espace insécable avant le deux-points : le test
    // vise le mot, pas la typographie.
    const annonces = Array.from(element.querySelectorAll('.visually-hidden'))
      .map((n) => n.textContent ?? '')
      .join(' | ');

    expect(annonces).toContain('Ancien prix');
    expect(annonces).toContain('Prix réduit');
  });

  it('ne distingue pas les deux prix par la seule couleur', async () => {
    // La rature reste perceptible quand la nuance de vert ne l'est pas.
    const element = await render(3990, 4990);

    expect(element.querySelector('.dvg-price__old s')).not.toBeNull();
  });

  it('n’affiche rien de barré quand le serveur ne donne pas de prix catalogue', async () => {
    // La présence de `listPriceCents` décide seule : le composant ne compare
    // pas les deux montants pour deviner s'il y a une promotion.
    const element = await render(4990, null);

    expect(element.querySelector('s')).toBeNull();
  });
});
