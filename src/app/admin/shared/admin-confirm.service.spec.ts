import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AdminConfirmService } from './admin-confirm.service';

describe('AdminConfirmService', () => {
  let service: AdminConfirmService;
  let dialog: jasmine.SpyObj<MatDialog>;

  /** Config passée à MatDialog.open. */
  function lastConfig(): MatDialogConfig {
    return dialog.open.calls.mostRecent().args[1] as MatDialogConfig;
  }

  /** Données passées au dialogue de confirmation. */
  function lastData(): { title: string; message: string } {
    return lastConfig().data as { title: string; message: string };
  }

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatDialog', ['open']);
    spy.open.and.returnValue({ afterClosed: () => of(true) });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AdminConfirmService,
        { provide: MatDialog, useValue: spy },
      ],
    });

    service = TestBed.inject(AdminConfirmService);
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  it('utilise un titre unique', () => {
    service.delete('le jeu', 'Valorant');
    expect(lastData().title).toBe('Confirmer la suppression');
  });

  it('compose un message nommant l’entité et l’élément', () => {
    service.delete('le jeu', 'Valorant');
    expect(lastData().message).toContain('le jeu');
    expect(lastData().message).toContain('Valorant');
  });

  it('entoure le nom de guillemets', () => {
    service.delete('le jeu', 'Valorant');
    expect(lastData().message).toContain('"Valorant"');
  });

  it('rappelle systématiquement que l’action est irréversible', () => {
    service.delete("l'équipe", 'DVG Academy');
    expect(lastData().message).toContain('irréversible');
  });

  it('gère un élément sans nom', () => {
    service.delete('cette image');
    expect(lastData().message).toContain('cette image');
    expect(lastData().message).not.toContain('""');
  });

  it('impose une largeur maximale responsive', () => {
    service.delete('le jeu', 'Valorant');
    expect(lastConfig().maxWidth).toBe('95vw');
  });

  it('émet true quand l’utilisateur confirme', (done) => {
    service.delete('le jeu', 'Valorant').subscribe((confirmed) => {
      expect(confirmed).toBeTrue();
      done();
    });
  });

  it('émet false quand l’utilisateur ferme sans confirmer', (done) => {
    dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);

    service.delete('le jeu', 'Valorant').subscribe((confirmed) => {
      expect(confirmed).toBeFalse();
      done();
    });
  });

  // ─── Abandon d'une saisie en cours ────────────────────────────────────────

  describe('discardChanges()', () => {
    it('annonce ce qui va être perdu, pas une suppression', () => {
      service.discardChanges();
      expect(lastData().title).toBe('Quitter sans enregistrer');
      expect(lastData().message).toContain('non enregistrées');
    });

    it('nomme l’action de sortie plutôt que « Confirmer »', () => {
      service.discardChanges();
      expect((lastConfig().data as { confirmText: string }).confirmText).toBe('Quitter');
    });

    it('émet true quand l’utilisateur accepte de perdre sa saisie', (done) => {
      service.discardChanges().subscribe((confirmed) => {
        expect(confirmed).toBeTrue();
        done();
      });
    });

    it('émet false quand l’utilisateur revient au formulaire', (done) => {
      dialog.open.and.returnValue({ afterClosed: () => of(undefined) } as never);

      service.discardChanges().subscribe((confirmed) => {
        expect(confirmed).toBeFalse();
        done();
      });
    });
  });
});
