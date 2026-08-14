import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SkeletonComponent } from './skeleton.component';

async function mount(
  inputs: Record<string, unknown> = {},
): Promise<ComponentFixture<SkeletonComponent>> {
  await TestBed.configureTestingModule({
    imports: [SkeletonComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(SkeletonComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function root(fixture: ComponentFixture<SkeletonComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('SkeletonComponent', () => {
  // ─── Annonce du chargement ────────────────────────────────────────────────

  it('annonce le chargement aux lecteurs d’écran', async () => {
    const fixture = await mount();
    const region = root(fixture).querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-label')).toBeTruthy();
  });

  it('masque le contenu décoratif aux lecteurs d’écran', async () => {
    const fixture = await mount();
    // Les blocs eux-memes sont du decor : seule la region porte l'annonce.
    expect(root(fixture).querySelectorAll('.skeleton-block[aria-hidden="true"]').length)
      .toBeGreaterThan(0);
  });

  // ─── Nombre de lignes ─────────────────────────────────────────────────────

  it('rend le nombre de lignes demandé', async () => {
    const fixture = await mount({ rows: 6 });
    expect(root(fixture).querySelectorAll('[data-testid="skeleton-row"]').length).toBe(6);
  });

  it('rend 4 lignes par défaut', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelectorAll('[data-testid="skeleton-row"]').length).toBe(4);
  });

  // ─── Variantes ────────────────────────────────────────────────────────────

  it('rend une liste par défaut', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('.skeleton-list')).toBeTruthy();
  });

  it('rend une grille quand on le demande', async () => {
    const fixture = await mount({ variant: 'grid' });
    expect(root(fixture).querySelector('.skeleton-grid')).toBeTruthy();
    expect(root(fixture).querySelector('.skeleton-list')).toBeNull();
  });

  it('rend un tableau avec le nombre de colonnes demandé', async () => {
    const fixture = await mount({ variant: 'table', columns: 5, rows: 2 });
    const firstRow = root(fixture).querySelector('[data-testid="skeleton-row"]');
    expect(firstRow?.querySelectorAll('.skeleton-block').length).toBe(5);
  });

  // ─── Options de la variante liste ─────────────────────────────────────────

  it('affiche une vignette quand la liste en comporte', async () => {
    const fixture = await mount({ variant: 'list', hasThumb: true });
    expect(root(fixture).querySelector('.skeleton-thumb')).toBeTruthy();
  });

  it('omet la vignette par défaut', async () => {
    const fixture = await mount({ variant: 'list' });
    expect(root(fixture).querySelector('.skeleton-thumb')).toBeNull();
  });

  it('affiche une poignée quand la liste est réordonnable', async () => {
    const fixture = await mount({ variant: 'list', hasHandle: true });
    expect(root(fixture).querySelector('.skeleton-handle')).toBeTruthy();
  });
});
