import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ErrorStateComponent } from './error-state.component';

async function mount(inputs: Record<string, unknown> = {}): Promise<ComponentFixture<ErrorStateComponent>> {
  await TestBed.configureTestingModule({
    imports: [ErrorStateComponent],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(ErrorStateComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function root(fixture: ComponentFixture<ErrorStateComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('ErrorStateComponent', () => {
  it('affiche le message fourni', async () => {
    const fixture = await mount({ message: 'Erreur lors du chargement des rôles' });
    expect(root(fixture).textContent).toContain('Erreur lors du chargement des rôles');
  });

  it('annonce l’erreur aux lecteurs d’écran', async () => {
    const fixture = await mount({ message: 'Erreur' });
    expect(root(fixture).querySelector('[role="alert"]')).toBeTruthy();
  });

  it('propose un bouton Réessayer', async () => {
    const fixture = await mount({ message: 'Erreur' });
    expect(root(fixture).querySelector('[data-testid="error-retry"]')).toBeTruthy();
  });

  it('émet retry au clic sur Réessayer', async () => {
    const fixture = await mount({ message: 'Erreur' });
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));

    root(fixture).querySelector<HTMLButtonElement>('[data-testid="error-retry"]')!.click();
    await fixture.whenStable();

    expect(retried).toBeTrue();
  });

  it('masque le bouton quand aucun réessai n’est possible', async () => {
    const fixture = await mount({ message: 'Erreur', retryable: false });
    expect(root(fixture).querySelector('[data-testid="error-retry"]')).toBeNull();
  });

  it('désactive le bouton pendant un rechargement en cours', async () => {
    const fixture = await mount({ message: 'Erreur', retrying: true });
    const btn = root(fixture).querySelector<HTMLButtonElement>('[data-testid="error-retry"]');
    expect(btn?.disabled).toBeTrue();
  });
});
