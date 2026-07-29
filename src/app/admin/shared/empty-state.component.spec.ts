import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { EmptyStateComponent } from './empty-state.component';

async function mount(
  inputs: Record<string, unknown> = {},
): Promise<ComponentFixture<EmptyStateComponent>> {
  await TestBed.configureTestingModule({
    imports: [EmptyStateComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(EmptyStateComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function root(fixture: ComponentFixture<EmptyStateComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('EmptyStateComponent', () => {
  it('compose le message à partir du nom de l’entité', async () => {
    const fixture = await mount({ entity: 'article' });
    expect(root(fixture).textContent).toContain('Aucun article');
  });

  it('accorde au féminin', async () => {
    const fixture = await mount({ entity: 'équipe', gender: 'f' });
    expect(root(fixture).textContent).toContain('Aucune équipe');
  });

  it('accepte un message entièrement personnalisé', async () => {
    const fixture = await mount({ message: 'Aucun résultat pour cette recherche' });
    expect(root(fixture).textContent).toContain('Aucun résultat pour cette recherche');
  });

  it('affiche l’icône fournie', async () => {
    const fixture = await mount({ entity: 'article', icon: 'article' });
    expect(root(fixture).querySelector('mat-icon')?.textContent?.trim()).toBe('article');
  });

  it('n’affiche pas d’action quand aucune n’est proposée', async () => {
    const fixture = await mount({ entity: 'article' });
    expect(root(fixture).querySelector('[data-testid="empty-action"]')).toBeNull();
  });

  it('affiche l’action quand un libellé est fourni', async () => {
    const fixture = await mount({ entity: 'article', actionLabel: 'Créer le premier article' });
    const btn = root(fixture).querySelector('[data-testid="empty-action"]');
    expect(btn?.textContent).toContain('Créer le premier article');
  });

  it('émet action au clic', async () => {
    const fixture = await mount({ entity: 'article', actionLabel: 'Créer' });
    let clicked = false;
    fixture.componentInstance.action.subscribe(() => (clicked = true));

    root(fixture).querySelector<HTMLButtonElement>('[data-testid="empty-action"]')!.click();
    await fixture.whenStable();

    expect(clicked).toBeTrue();
  });

  it('utilise la classe partagée et non une variante locale', async () => {
    const fixture = await mount({ entity: 'article' });
    expect(root(fixture).querySelector('.empty-state')).toBeTruthy();
  });

  it('n’ajoute pas de ponctuation finale au message compose', async () => {
    const fixture = await mount({ entity: 'sponsor' });
    const text = root(fixture).querySelector('p')?.textContent?.trim() ?? '';
    expect(text.endsWith('.')).toBeFalse();
  });
});
