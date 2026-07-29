import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { createReorder } from './use-reorder';

interface Item {
  id: number;
  name: string;
}

const ITEMS: Item[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Bravo' },
  { id: 3, name: 'Charlie' },
];

/** Monte le helper dans un contexte d'injection, comme dans un composant. */
function make(config: Parameters<typeof createReorder<Item>>[0]) {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  return TestBed.runInInjectionContext(() => createReorder(config));
}

describe('createReorder', () => {
  let items: ReturnType<typeof signal<Item[]>>;

  beforeEach(() => {
    items = signal<Item[]>([...ITEMS]);
  });

  // ─── Contrat de persistance ───────────────────────────────────────────────

  it('persiste la liste dans son nouvel ordre', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist });

    r.onReorder(0, 2);

    expect(persist).toHaveBeenCalledWith([
      { id: 2, name: 'Bravo' },
      { id: 3, name: 'Charlie' },
      { id: 1, name: 'Alpha' },
    ]);
  });

  it('ne persiste pas quand la position ne change pas', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist });

    r.onReorder(1, 1);

    expect(persist).not.toHaveBeenCalled();
  });

  // ─── Garde de concurrence ─────────────────────────────────────────────────

  it('ignore un second appel tant que le premier n’a pas abouti', () => {
    // C'est la garde absente de team-members-dialog : un double-clic
    // declenchait deux appels concurrents sur la meme collection.
    const pending = new Subject<null>();
    const persist = jasmine.createSpy('persist').and.returnValue(pending.asObservable());
    const r = make({ items, label: (i) => i.name, persist });

    r.onReorder(0, 1);
    r.onReorder(1, 2);

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('libère la garde une fois la persistance terminée', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist });

    r.onReorder(0, 1);
    expect(r.reordering()).toBeFalse();

    r.onReorder(1, 2);
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it('libère la garde même en cas d’échec', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(throwError(() => new Error('ko')));
    const r = make({ items, label: (i) => i.name, persist, onError: () => undefined });

    r.onReorder(0, 1);

    expect(r.reordering()).toBeFalse();
  });

  // ─── Annonce accessible ───────────────────────────────────────────────────

  it('annonce la nouvelle position en cas de succès', () => {
    const r = make({ items, label: (i) => i.name, persist: () => of(null) });

    r.onReorder(0, 2);

    // Position 3 sur 3 : le helper existant annonce "en fin de liste".
    expect(r.liveMessage()).toContain('Alpha');
    expect(r.liveMessage()).toContain('fin de liste');
  });

  it('annonce la position chiffrée pour un déplacement intermédiaire', () => {
    const r = make({ items, label: (i) => i.name, persist: () => of(null) });

    r.onReorder(0, 1);

    expect(r.liveMessage()).toContain('position 2 sur 3');
  });

  it('annonce l’échec', () => {
    const r = make({
      items,
      label: (i) => i.name,
      persist: () => throwError(() => new Error('ko')),
      onError: () => undefined,
    });

    r.onReorder(0, 2);

    expect(r.liveMessage()).toContain('Alpha');
  });

  // ─── Rappels ──────────────────────────────────────────────────────────────

  it('appelle onSuccess après persistance', () => {
    const onSuccess = jasmine.createSpy('onSuccess');
    const r = make({ items, label: (i) => i.name, persist: () => of(null), onSuccess });

    r.onReorder(0, 1);

    expect(onSuccess).toHaveBeenCalled();
  });

  it('appelle onError en cas d’échec, pour permettre le rechargement', () => {
    const onError = jasmine.createSpy('onError');
    const r = make({
      items,
      label: (i) => i.name,
      persist: () => throwError(() => new Error('ko')),
      onError,
    });

    r.onReorder(0, 1);

    expect(onError).toHaveBeenCalled();
  });

  // ─── Glisser-deposer ──────────────────────────────────────────────────────

  it('traite un événement de glisser-déposer comme un réordonnancement', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist });

    r.onDrop({ previousIndex: 0, currentIndex: 2 });

    expect(persist).toHaveBeenCalled();
  });
});
