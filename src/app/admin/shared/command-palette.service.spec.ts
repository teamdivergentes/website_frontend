import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { CommandPaletteService } from './command-palette.service';
import { CommandPaletteComponent } from './command-palette.component';

describe('CommandPaletteService', () => {
  let service: CommandPaletteService;
  let dialog: jasmine.SpyObj<MatDialog>;
  let closed: Subject<undefined>;

  beforeEach(() => {
    closed = new Subject<undefined>();
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => closed.asObservable(),
      close: () => closed.next(undefined),
    } as unknown as MatDialogRef<CommandPaletteComponent>);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CommandPaletteService,
        { provide: MatDialog, useValue: dialog },
      ],
    });

    service = TestBed.inject(CommandPaletteService);
  });

  /** Fabrique un evenement clavier avec la cible demandee. */
  function keydown(key: string, modifier: 'meta' | 'ctrl' | 'none', target?: Element): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      metaKey: modifier === 'meta',
      ctrlKey: modifier === 'ctrl',
    });
    if (target) Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  // ─── Ouverture ────────────────────────────────────────────────────────────

  it('ouvre la palette en dialogue', () => {
    service.open();
    expect(dialog.open).toHaveBeenCalledWith(CommandPaletteComponent, jasmine.any(Object));
  });

  it('confie le focus au composant plutôt qu’au dialogue', () => {
    // `autoFocus` par defaut prendrait la premiere entree de la liste ; le champ
    // de recherche doit recevoir le focus.
    service.open();
    const config = dialog.open.calls.mostRecent().args[1];
    expect(config?.autoFocus).toBeFalse();
    expect(config?.restoreFocus).toBeTrue();
  });

  it('n’ouvre pas une seconde palette par-dessus la première', () => {
    service.open();
    service.open();
    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('peut être rouverte après fermeture', () => {
    service.open();
    closed.next(undefined);
    service.open();
    expect(dialog.open).toHaveBeenCalledTimes(2);
  });

  // ─── Raccourci clavier ────────────────────────────────────────────────────

  it('répond à Cmd+K et Ctrl+K', () => {
    expect(service.handlesShortcut(keydown('k', 'meta'))).toBeTrue();
    expect(service.handlesShortcut(keydown('k', 'ctrl'))).toBeTrue();
  });

  it('accepte la majuscule', () => {
    expect(service.handlesShortcut(keydown('K', 'meta'))).toBeTrue();
  });

  it('ignore K sans touche de modification', () => {
    expect(service.handlesShortcut(keydown('k', 'none'))).toBeFalse();
  });

  it('ignore les autres touches', () => {
    expect(service.handlesShortcut(keydown('j', 'meta'))).toBeFalse();
  });

  it('laisse la frappe aux champs de saisie', () => {
    // Un editeur admin ouvert perdrait la saisie en cours.
    for (const tag of ['input', 'textarea', 'select']) {
      const field = document.createElement(tag);
      expect(service.handlesShortcut(keydown('k', 'meta', field)))
        .withContext(tag)
        .toBeFalse();
    }
  });

  it('laisse la frappe aux zones éditables', () => {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    // jsdom/Chrome ne derive `isContentEditable` que pour un noeud attache.
    Object.defineProperty(editable, 'isContentEditable', { value: true });

    expect(service.handlesShortcut(keydown('k', 'meta', editable))).toBeFalse();
  });

  it('se déclenche depuis un élément ordinaire', () => {
    const div = document.createElement('div');
    expect(service.handlesShortcut(keydown('k', 'meta', div))).toBeTrue();
  });
});
