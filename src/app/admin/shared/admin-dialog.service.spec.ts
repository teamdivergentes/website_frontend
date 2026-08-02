import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AdminDialogService } from './admin-dialog.service';

@Component({ selector: 'app-dummy', standalone: true, template: '' })
class DummyComponent {}

describe('AdminDialogService', () => {
  let service: AdminDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;

  function lastConfig(): MatDialogConfig {
    return dialog.open.calls.mostRecent().args[1] as MatDialogConfig;
  }

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatDialog', ['open']);
    spy.open.and.returnValue({ afterClosed: () => null });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AdminDialogService,
        { provide: MatDialog, useValue: spy },
      ],
    });

    service = TestBed.inject(AdminDialogService);
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  });

  // ─── Paliers de taille ────────────────────────────────────────────────────

  it('applique le palier sm', () => {
    service.open(DummyComponent, 'sm');
    expect(lastConfig().width).toBe('440px');
  });

  it('applique le palier md par défaut', () => {
    service.open(DummyComponent);
    expect(lastConfig().width).toBe('600px');
  });

  it('n’expose que des paliers, pas des largeurs libres', () => {
    // Le typage interdit une largeur arbitraire ; ce test documente l'intention.
    const widths = ['440px', '600px', '920px'];
    for (const size of ['sm', 'md', 'lg'] as const) {
      service.open(DummyComponent, size);
      expect(widths).toContain(lastConfig().width!);
    }
  });

  it('n’offre plus le palier xl, retiré avec son dernier appelant', () => {
    // Le staff de coaching etait le seul a ouvrir a 1200px ; il est desormais
    // une page. Aucun palier ne doit reintroduire cette largeur.
    for (const size of ['sm', 'md', 'lg'] as const) {
      service.open(DummyComponent, size);
      expect(lastConfig().width).not.toBe('1200px');
    }
  });

  // ─── Garde-fous appliques a chaque ouverture ──────────────────────────────

  it('borne la largeur au viewport', () => {
    service.open(DummyComponent, 'lg');
    expect(lastConfig().maxWidth).toBe('95vw');
  });

  it('borne la hauteur au viewport', () => {
    // Huit ouvertures sur treize n'avaient pas de maxHeight et debordaient
    // sur un ecran de 768px de haut.
    service.open(DummyComponent, 'md');
    expect(lastConfig().maxHeight).toBe('90vh');
  });

  it('marque le panneau pour que les styles admin l’atteignent', () => {
    // Les overlays CDK sont montes hors de `.admin-layout` : sans cette classe,
    // les styles partages scopes sous ce conteneur ne s'appliquent pas.
    service.open(DummyComponent, 'md');
    expect(lastConfig().panelClass).toBe('admin-dialog');
  });

  it('place le focus sur le premier element focusable', () => {
    service.open(DummyComponent, 'md');
    expect(lastConfig().autoFocus).toBe('first-tabbable');
  });

  // ─── Donnees ──────────────────────────────────────────────────────────────

  it('transmet les données au dialogue', () => {
    service.open(DummyComponent, 'md', { id: 42 });
    expect(lastConfig().data).toEqual({ id: 42 });
  });
});
