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

  // ─── Affichage optimiste ──────────────────────────────────────────────────

  it("applique l'ordre a l'affichage avant d'attendre la reponse du serveur", () => {
    const applyOptimistic = jasmine.createSpy('applyOptimistic');
    const pending = new Subject<void>();
    const r = make({
      items,
      label: (i) => i.name,
      persist: () => pending.asObservable(),
      applyOptimistic,
    });

    r.onReorder(0, 2);

    expect(applyOptimistic).toHaveBeenCalledWith([
      { id: 2, name: 'Bravo' },
      { id: 3, name: 'Charlie' },
      { id: 1, name: 'Alpha' },
    ]);
  });

  // ─── Deplacement au clavier (grab & move ARIA) ────────────────────────────

  /** Fabrique un evenement clavier dont on peut verifier le preventDefault. */
  function key(k: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: k, cancelable: true });
    spyOn(event, 'preventDefault');
    return event;
  }

  it('saisit une ligne sur Espace et la relache sur un second Espace', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist, applyOptimistic: (o) => items.set(o) });

    r.onHandleKeydown(key(' '), 0);
    expect(r.grabbedIndex()).toBe(0);

    r.onHandleKeydown(key(' '), 0);
    expect(r.grabbedIndex()).toBe(-1);
    expect(persist).toHaveBeenCalled();
  });

  it('ne saisit pas tant qu’une persistance est en vol', () => {
    const r = make({
      items,
      label: (i) => i.name,
      persist: () => new Subject<void>().asObservable(),
    });

    r.onReorder(0, 1);
    r.onHandleKeydown(key(' '), 0);

    expect(r.grabbedIndex()).toBe(-1);
  });

  it('déplace la ligne saisie avec les flèches, sans persister à chaque touche', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist, applyOptimistic: (o) => items.set(o) });

    r.onHandleKeydown(key(' '), 0);
    r.onHandleKeydown(key('ArrowDown'), 0);

    expect(r.grabbedIndex()).toBe(1);
    expect(items().map((i) => i.id)).toEqual([2, 1, 3]);
    expect(persist).not.toHaveBeenCalled();
    expect(r.liveMessage()).toContain('Alpha');
  });

  it('ignore les flèches en dehors de toute saisie', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const applyOptimistic = jasmine.createSpy('applyOptimistic');
    const r = make({ items, label: (i) => i.name, persist, applyOptimistic });

    r.onHandleKeydown(key('ArrowDown'), 0);

    expect(applyOptimistic).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('ne déborde pas des bornes de la liste', () => {
    const applyOptimistic = jasmine.createSpy('applyOptimistic');
    const r = make({
      items,
      label: (i) => i.name,
      persist: () => of(null),
      applyOptimistic,
    });

    r.onHandleKeydown(key(' '), 0);
    r.onHandleKeydown(key('ArrowUp'), 0);

    expect(r.grabbedIndex()).toBe(0);
    expect(applyOptimistic).not.toHaveBeenCalled();
  });

  it('restaure l’ordre initial sur Échap', () => {
    const persist = jasmine.createSpy('persist').and.returnValue(of(null));
    const r = make({ items, label: (i) => i.name, persist, applyOptimistic: (o) => items.set(o) });

    r.onHandleKeydown(key(' '), 0);
    r.onHandleKeydown(key('ArrowDown'), 0);
    r.onHandleKeydown(key('Escape'), 0);

    expect(r.grabbedIndex()).toBe(-1);
    expect(items().map((i) => i.id)).toEqual([1, 2, 3]);
    expect(persist).not.toHaveBeenCalled();
    expect(r.liveMessage()).toContain('annul');
  });

  it('neutralise le comportement natif des touches qu’il traite', () => {
    const r = make({ items, label: (i) => i.name, persist: () => of(null) });

    const grab = key(' ');
    r.onHandleKeydown(grab, 0);
    expect(grab.preventDefault).toHaveBeenCalled();

    const move = key('ArrowDown');
    r.onHandleKeydown(move, 0);
    expect(move.preventDefault).toHaveBeenCalled();
  });

  it('laisse passer les touches qui ne le concernent pas', () => {
    const r = make({ items, label: (i) => i.name, persist: () => of(null) });

    const tab = key('Tab');
    r.onHandleKeydown(tab, 0);

    expect(tab.preventDefault).not.toHaveBeenCalled();
  });
});
