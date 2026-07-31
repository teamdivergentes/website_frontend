import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PageHeaderComponent } from './page-header.component';

/** Hôte permettant de tester la projection du slot d'actions. */
@Component({
  standalone: true,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="title" [subtitle]="subtitle" [count]="count" [countLabel]="countLabel">
      <button leading data-testid="host-leading">Retour</button>
      <button subtitle data-testid="host-subtitle">Sous-titre cliquable</button>
      <button actions data-testid="host-action">Nouveau</button>
    </app-page-header>
  `,
})
class HostComponent {
  title = 'Gestion des jeux';
  subtitle = '';
  count: number | null = null;
  countLabel = '';
}

async function mount(
  overrides: Partial<HostComponent> = {},
): Promise<ComponentFixture<HostComponent>> {
  await TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function root(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('PageHeaderComponent', () => {
  it('rend le titre dans un h1', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('h1')?.textContent?.trim()).toBe('Gestion des jeux');
  });

  it('utilise la classe partagée, dont vient toute la mise en page', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('.page-header')).toBeTruthy();
  });

  it('projette les actions fournies par la page', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('[data-testid="host-action"]')).toBeTruthy();
  });

  it('n’affiche pas de sous-titre par défaut', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('.subtitle')).toBeNull();
  });

  it('affiche le sous-titre quand il est fourni', async () => {
    const fixture = await mount({ subtitle: 'Catalogue des jeux couverts' });
    expect(root(fixture).querySelector('.subtitle')?.textContent).toContain(
      'Catalogue des jeux couverts',
    );
  });

  it('n’affiche pas de compteur par défaut', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('[data-testid="page-count"]')).toBeNull();
  });

  it('accorde le compteur au singulier', async () => {
    const fixture = await mount({ count: 1, countLabel: 'jeu' });
    expect(root(fixture).querySelector('[data-testid="page-count"]')?.textContent).toContain(
      '1 jeu',
    );
  });

  it('accorde le compteur au pluriel', async () => {
    const fixture = await mount({ count: 7, countLabel: 'jeu' });
    const text = root(fixture).querySelector('[data-testid="page-count"]')?.textContent ?? '';
    expect(text).toContain('7 jeux');
  });

  it('laisse invariables les mots terminés par s, x ou z', async () => {
    const fixture = await mount({ count: 3, countLabel: 'palmarès' });
    expect(root(fixture).querySelector('[data-testid="page-count"]')?.textContent).toContain(
      '3 palmarès',
    );
  });

  it('pluralise les mots en -al', async () => {
    const fixture = await mount({ count: 2, countLabel: 'journal' });
    expect(root(fixture).querySelector('[data-testid="page-count"]')?.textContent).toContain(
      '2 journaux',
    );
  });

  it('affiche un compteur à zéro plutôt que de le masquer', async () => {
    // Zero est une information ; le masquer laisserait croire a un chargement.
    const fixture = await mount({ count: 0, countLabel: 'jeu' });
    expect(root(fixture).querySelector('[data-testid="page-count"]')?.textContent).toContain('0');
  });

  // ─── Emplacements de projection ───────────────────────────────────────────

  it('projette un contenu avant le titre', async () => {
    // Le bouton de retour des pages de detail doit preceder le titre : sans cet
    // emplacement, deux pages gardaient leur en-tete recopie a la main.
    const fixture = await mount();
    const header = root(fixture).querySelector('.page-header');

    const leading = header?.querySelector('[data-testid="host-leading"]');
    const title = header?.querySelector('h1');

    expect(leading).not.toBeNull();
    expect(leading!.compareDocumentPosition(title!) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });

  it('projette un sous-titre interactif sous le titre', async () => {
    const fixture = await mount();
    const text = root(fixture).querySelector('.page-header-text');

    expect(text?.querySelector('[data-testid="host-subtitle"]')).not.toBeNull();
  });

  it('place les actions apres le bloc de texte', async () => {
    const fixture = await mount();
    const header = root(fixture).querySelector('.page-header');

    const text = header?.querySelector('.page-header-text');
    const action = header?.querySelector('[data-testid="host-action"]');

    expect(text!.compareDocumentPosition(action!) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });
});
