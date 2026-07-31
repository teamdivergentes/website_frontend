import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminNotifier } from './admin-notifier.service';

describe('AdminNotifier', () => {
  let notifier: AdminNotifier;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AdminNotifier,
        { provide: MatSnackBar, useValue: spy },
      ],
    });

    notifier = TestBed.inject(AdminNotifier);
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  describe('success', () => {
    it('affiche le message', () => {
      notifier.success('Jeu créé');
      expect(snackBar.open).toHaveBeenCalledWith('Jeu créé', 'OK', jasmine.any(Object));
    });

    it('utilise une durée courte', () => {
      notifier.success('Jeu créé');
      const config = snackBar.open.calls.mostRecent().args[2];
      expect(config?.duration).toBe(2500);
    });
  });

  describe('error', () => {
    it('affiche le message', () => {
      notifier.error('Erreur lors de la suppression');
      expect(snackBar.open).toHaveBeenCalledWith(
        'Erreur lors de la suppression',
        'Fermer',
        jasmine.any(Object),
      );
    });

    it('reste affiché plus longtemps qu’un succès', () => {
      notifier.success('ok');
      const successDuration = snackBar.open.calls.mostRecent().args[2]?.duration ?? 0;

      notifier.error('ko');
      const errorDuration = snackBar.open.calls.mostRecent().args[2]?.duration ?? 0;

      expect(errorDuration).toBeGreaterThan(successDuration);
    });
  });

  describe('deleted', () => {
    it('accorde au masculin', () => {
      notifier.deleted('Jeu');
      expect(snackBar.open).toHaveBeenCalledWith('Jeu supprimé', 'OK', jasmine.any(Object));
    });

    it('accorde au féminin', () => {
      notifier.deleted('Équipe', 'f');
      expect(snackBar.open).toHaveBeenCalledWith('Équipe supprimée', 'OK', jasmine.any(Object));
    });
  });

  describe('saved', () => {
    it('distingue création et modification', () => {
      notifier.saved('Jeu', 'create');
      expect(snackBar.open).toHaveBeenCalledWith('Jeu créé', 'OK', jasmine.any(Object));

      notifier.saved('Jeu', 'edit');
      expect(snackBar.open).toHaveBeenCalledWith('Jeu mis à jour', 'OK', jasmine.any(Object));
    });

    it('accorde au féminin', () => {
      notifier.saved('Équipe', 'create', 'f');
      expect(snackBar.open).toHaveBeenCalledWith('Équipe créée', 'OK', jasmine.any(Object));
    });
  });
});
