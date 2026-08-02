import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
  });

  const render = (inputs: Record<string, unknown>): HTMLElement => {
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('rend le titre dans un h1', () => {
    const el = render({ title: 'Nous contacter' });
    const h1 = el.querySelector('h1');

    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Nous contacter');
  });

  // La regle « un seul <h1> par page » ne tenait sur aucune page tant que chacune
  // ecrivait sa propre structure : l'audit du 2026-08-02 a trouve un <h2> place
  // avant le <h1> et une page sans aucun titre. Le composant doit donc imposer le
  // niveau, quelle que soit la taille demandee.
  it('rend toujours un h1, quel que soit le palier typographique', () => {
    for (const size of ['display', '1', '2'] as const) {
      const el = render({ title: 'Titre', size });

      expect(el.querySelectorAll('h1').length).toBe(1);
      expect(el.querySelector('h2')).toBeNull();
    }
  });

  it('applique le palier demande au titre', () => {
    expect(render({ title: 'T', size: 'display' }).querySelector('h1')?.className).toContain(
      'heading-display',
    );
    expect(render({ title: 'T', size: '1' }).querySelector('h1')?.className).toContain('heading-1');
  });

  it('utilise le palier 2 par defaut', () => {
    expect(render({ title: 'T' }).querySelector('h1')?.className).toContain('heading-2');
  });

  it('rend le fragment en surbrillance dans le h1', () => {
    const h1 = render({ title: 'Une demande ?', highlight: 'Contactez-nous' }).querySelector('h1');
    const span = h1?.querySelector('.heading__highlight');

    expect(span?.textContent?.trim()).toBe('Contactez-nous');
    expect(h1?.textContent).toContain('Une demande ?');
  });

  it('omet sur-titre, fragment et sous-titre quand ils ne sont pas fournis', () => {
    const el = render({ title: 'Seul' });

    expect(el.querySelector('.dvg-page-header__eyebrow')).toBeNull();
    expect(el.querySelector('.heading__highlight')).toBeNull();
    expect(el.querySelector('.dvg-page-header__subtitle')).toBeNull();
  });

  it('rend le sur-titre et le sous-titre quand ils sont fournis', () => {
    const el = render({ title: 'T', eyebrow: 'Nos offres', subtitle: 'Une accroche' });

    expect(el.querySelector('.dvg-page-header__eyebrow')?.textContent?.trim()).toBe('Nos offres');
    expect(el.querySelector('.dvg-page-header__subtitle')?.textContent?.trim()).toBe('Une accroche');
  });

  // Sans cet input, l'`id` se posait sur l'hote et un `aria-labelledby` de page
  // ne ciblait plus le titre — cas rencontre sur les pages legales.
  it('pose titleId sur le h1 lui-meme', () => {
    const h1 = render({ title: 'T', titleId: 'mentions-title' }).querySelector('h1');

    expect(h1?.getAttribute('id')).toBe('mentions-title');
  });

  it('ne pose aucun id quand titleId est absent', () => {
    expect(render({ title: 'T' }).querySelector('h1')?.hasAttribute('id')).toBeFalse();
  });

  // `centered` et `visuallyHidden` s'ecrivent sans valeur dans les templates.
  it('accepte centered en attribut nu', () => {
    const el = render({ title: 'T', centered: '' });

    expect(el.querySelector('.dvg-page-header--center')).toBeTruthy();
  });

  it('masque visuellement le titre sans le retirer du DOM', () => {
    const h1 = render({ title: 'Boutique', visuallyHidden: '' }).querySelector('h1');

    expect(h1?.className).toContain('visually-hidden');
    expect(h1?.textContent?.trim()).toBe('Boutique');
  });
});
