import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, Observable } from 'rxjs';
import { unsavedChangesGuard, HasUnsavedChanges } from './unsaved-changes.guard';
import { AdminConfirmService } from './admin-confirm.service';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';

describe('unsavedChangesGuard', () => {
  let confirm: jasmine.SpyObj<AdminConfirmService>;

  /** Execute la garde dans un contexte d'injection, comme le fait le routeur. */
  function run(component: HasUnsavedChanges | null) {
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component as HasUnsavedChanges,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  }

  beforeEach(() => {
    confirm = jasmine.createSpyObj('AdminConfirmService', ['discardChanges']);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AdminConfirmService, useValue: confirm },
      ],
    });
  });

  it('laisse sortir d’une page intacte sans rien demander', () => {
    const result = run({ hasUnsavedChanges: () => false });

    expect(result).toBeTrue();
    expect(confirm.discardChanges).not.toHaveBeenCalled();
  });

  it('demande confirmation quand la saisie n’est pas enregistree', () => {
    confirm.discardChanges.and.returnValue(of(true));

    const result = run({ hasUnsavedChanges: () => true });

    expect(confirm.discardChanges).toHaveBeenCalled();
    expect(result).not.toBeTrue();
  });

  it('retient l’utilisateur sur la page s’il refuse de perdre sa saisie', (done) => {
    confirm.discardChanges.and.returnValue(of(false));

    const result = run({ hasUnsavedChanges: () => true });

    (result as Observable<boolean>).subscribe((allowed) => {
      expect(allowed).toBeFalse();
      done();
    });
  });

  it('ne bloque pas quand le composant est absent', () => {
    // Le routeur peut appeler la garde sans instance si le composant a deja ete
    // detruit : bloquer la navigation piegerait l'utilisateur sur une page vide.
    expect(run(null)).toBeTrue();
  });
});
