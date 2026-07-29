import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormActionsComponent } from './form-actions.component';

async function mount(
  inputs: Record<string, unknown> = {},
): Promise<ComponentFixture<FormActionsComponent>> {
  await TestBed.configureTestingModule({
    imports: [FormActionsComponent, NoopAnimationsModule],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();

  const fixture = TestBed.createComponent(FormActionsComponent);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function root(fixture: ComponentFixture<FormActionsComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function cancelBtn(fixture: ComponentFixture<FormActionsComponent>): HTMLButtonElement {
  return root(fixture).querySelector<HTMLButtonElement>('[data-testid="form-cancel"]')!;
}

function submitBtn(fixture: ComponentFixture<FormActionsComponent>): HTMLButtonElement {
  return root(fixture).querySelector<HTMLButtonElement>('[data-testid="form-submit"]')!;
}

describe('FormActionsComponent', () => {
  // ─── Ordre et libelles ────────────────────────────────────────────────────

  it('place Annuler avant le bouton de validation', async () => {
    const fixture = await mount();
    const buttons = Array.from(root(fixture).querySelectorAll('button'));
    expect(buttons.indexOf(cancelBtn(fixture))).toBeLessThan(buttons.indexOf(submitBtn(fixture)));
  });

  it('libelle « Créer » en mode création', async () => {
    const fixture = await mount({ mode: 'create' });
    expect(submitBtn(fixture).textContent).toContain('Créer');
  });

  it('libelle « Enregistrer » en mode édition', async () => {
    const fixture = await mount({ mode: 'edit' });
    expect(submitBtn(fixture).textContent).toContain('Enregistrer');
  });

  it('accepte un libellé personnalisé', async () => {
    const fixture = await mount({ submitLabel: 'Réinitialiser' });
    expect(submitBtn(fixture).textContent).toContain('Réinitialiser');
  });

  // ─── Etat de soumission ───────────────────────────────────────────────────

  it('désactive le bouton de validation pendant la soumission', async () => {
    const fixture = await mount({ saving: true });
    expect(submitBtn(fixture).disabled).toBeTrue();
  });

  it('désactive AUSSI le bouton Annuler pendant la soumission', async () => {
    // Annuler en pleine requete laissait la requete aboutir sans retour.
    const fixture = await mount({ saving: true });
    expect(cancelBtn(fixture).disabled).toBeTrue();
  });

  it('affiche un indicateur de progression pendant la soumission', async () => {
    const fixture = await mount({ saving: true });
    expect(root(fixture).querySelector('mat-progress-spinner, mat-spinner')).toBeTruthy();
  });

  it('n’affiche aucun indicateur au repos', async () => {
    const fixture = await mount();
    expect(root(fixture).querySelector('mat-progress-spinner, mat-spinner')).toBeNull();
  });

  it('désactive la validation quand le formulaire est invalide', async () => {
    const fixture = await mount({ disabled: true });
    expect(submitBtn(fixture).disabled).toBeTrue();
  });

  // ─── Selecteurs de test ───────────────────────────────────────────────────

  it('conserve un data-testid par défaut', async () => {
    const fixture = await mount();
    expect(submitBtn(fixture)).toBeTruthy();
  });

  it('accepte un data-testid propre à la page, pour ne pas casser les E2E', async () => {
    const fixture = await mount({ submitTestId: 'game-save-btn' });
    expect(root(fixture).querySelector('[data-testid="game-save-btn"]')).toBeTruthy();
  });

  // ─── Evenements ───────────────────────────────────────────────────────────

  it('émet cancel au clic sur Annuler', async () => {
    const fixture = await mount();
    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    cancelBtn(fixture).click();
    await fixture.whenStable();

    expect(cancelled).toBeTrue();
  });

  it('émet submit au clic sur le bouton de validation', async () => {
    const fixture = await mount();
    let submitted = false;
    fixture.componentInstance.submit.subscribe(() => (submitted = true));

    submitBtn(fixture).click();
    await fixture.whenStable();

    expect(submitted).toBeTrue();
  });
});
