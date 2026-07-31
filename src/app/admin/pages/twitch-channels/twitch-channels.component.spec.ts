import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TwitchChannelsComponent } from './twitch-channels.component';
import { TwitchChannelsService } from '../../../shared/services/twitch-channels.service';
import { TwitchChannel } from '../../../shared/models/twitch-channel.model';

const mockChannel = (overrides: Partial<TwitchChannel> = {}): TwitchChannel => ({
  id: 1,
  twitchUsername: 'TestStreamer',
  displayName: 'Test Streamer',
  gameLabel: 'Valorant',
  description: null as unknown as string,
  teamMemberId: undefined,
  teamMember: undefined,
  position: 0,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('TwitchChannelsComponent', () => {
  let component: TwitchChannelsComponent;
  let fixture: ComponentFixture<TwitchChannelsComponent>;
  let channelsServiceSpy: jasmine.SpyObj<TwitchChannelsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let channelsSignal: WritableSignal<TwitchChannel[]>;

  const channelList: TwitchChannel[] = [
    mockChannel({ id: 1, twitchUsername: 'StreamerA', position: 0 }),
    mockChannel({ id: 2, twitchUsername: 'StreamerB', position: 1 }),
    mockChannel({ id: 3, twitchUsername: 'StreamerC', position: 2 }),
  ];

  beforeEach(async () => {
    channelsSignal = signal<TwitchChannel[]>(channelList);

    channelsServiceSpy = jasmine.createSpyObj(
      'TwitchChannelsService',
      [
        'loadChannels',
        'loadLiveStatus',
        'reorderChannels',
        'deleteChannel',
        'createChannel',
        'updateChannel',
        'applyOptimisticReorder',
        'isLive',
      ],
      { channels: channelsSignal.asReadonly() }
    );
    channelsServiceSpy.loadChannels.and.returnValue(of(channelList));
    channelsServiceSpy.loadLiveStatus.and.returnValue(of([]));
    channelsServiceSpy.reorderChannels.and.returnValue(of(undefined as unknown as void));
    channelsServiceSpy.deleteChannel.and.returnValue(of(undefined as unknown as void));
    channelsServiceSpy.isLive.and.returnValue(false);
    channelsServiceSpy.applyOptimisticReorder.and.callFake((ids: number[]) => {
      const map = new Map(channelsSignal().map((c) => [c.id, c]));
      const reordered = ids
        .map((id, index) => {
          const channel = map.get(id);
          return channel ? { ...channel, position: index } : null;
        })
        .filter((c): c is TwitchChannel => c !== null);
      channelsSignal.set(reordered);
    });

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [TwitchChannelsComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TwitchChannelsService, useValue: channelsServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TwitchChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit creer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit charger les chaines au demarrage', () => {
    expect(channelsServiceSpy.loadChannels).toHaveBeenCalledTimes(1);
  });

  it('doit afficher le skeleton pendant le chargement', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('.skeleton-table');
    expect(skeleton).toBeTruthy();
  });

  it('doit afficher la table quand les chaines sont chargees', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('.channels-table');
    expect(table).toBeTruthy();
  });

  it('doit afficher le bon nombre de lignes', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.channel-row');
    expect(rows.length).toBe(3);
  });

  it('doit appeler refreshLive et charger le statut live', async () => {
    component.refreshLive();
    await fixture.whenStable();
    expect(channelsServiceSpy.loadLiveStatus).toHaveBeenCalled();
  });

  it('doit afficher un snackbar en cas d\'erreur de rafraichissement live', async () => {
    channelsServiceSpy.loadLiveStatus.and.returnValue(throwError(() => new Error('network')));
    component.refreshLive();
    await fixture.whenStable();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Impossible de rafraîchir le statut live',
      'OK',
      jasmine.any(Object)
    );
  });

  it('doit ouvrir le dialog de creation lors du clic sur "Nouvelle chaine"', () => {
    component.openCreate();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('doit ouvrir le dialog d\'edition avec la bonne chaine', () => {
    component.openEdit(channelList[0]);
    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({ data: { channel: channelList[0] } })
    );
  });

  it('doit ouvrir le dialog de confirmation avant la suppression', () => {
    component.confirmDelete(channelList[0]);
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  // ── drag-drop (souris) ─────────────────────────────────────────────

  it('doit appeler applyOptimisticReorder puis reorderChannels lors du drop', () => {
    const dragEvent = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
    };
    component.onDrop(dragEvent as any);
    expect(channelsServiceSpy.applyOptimisticReorder).toHaveBeenCalled();
    expect(channelsServiceSpy.reorderChannels).toHaveBeenCalled();
  });

  it('onDrop doit envoyer la sequence d\'IDs dans le bon ordre', () => {
    const dragEvent = {
      previousIndex: 0,
      currentIndex: 2,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
    };
    component.onDrop(dragEvent as any);
    // Channels order was [1,2,3] -> move 0->2 gives [2,3,1]
    expect(channelsServiceSpy.reorderChannels).toHaveBeenCalledWith([2, 3, 1]);
  });

  it('doit rollback le reorder en cas d\'erreur API', async () => {
    channelsServiceSpy.reorderChannels.and.returnValue(throwError(() => new Error('server')));
    const dragEvent = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
    };
    component.onDrop(dragEvent as any);
    await fixture.whenStable();
    expect(channelsServiceSpy.loadChannels).toHaveBeenCalledTimes(2); // initial + rollback
    // Le message passe desormais par AdminNotifier : action "Fermer", 5000 ms.
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors de la réorganisation', 'Fermer', jasmine.any(Object)
    );
  });

  // ── boutons Monter/Descendre retires ──────────────────────────────

  it('ne doit plus afficher de boutons Monter/Descendre', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const upBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
    const downBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
    expect(upBtns.length).toBe(0);
    expect(downBtns.length).toBe(0);
  });

  it('ne doit plus afficher de colonne col-kb', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const kbCols = fixture.nativeElement.querySelectorAll('.col-kb');
    expect(kbCols.length).toBe(0);
  });

  // ── a11y / clavier : poignee drag handle ──────────────────────────

  describe('a11y — poignee drag handle ARIA', () => {
    it('doit rendre la poignee focusable (tabindex="0")', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('.drag-handle');
      expect(handle).toBeTruthy();
      expect(handle.getAttribute('tabindex')).toBe('0');
    });

    it('doit avoir role="button" sur la poignee', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('.drag-handle');
      expect(handle.getAttribute('role')).toBe('button');
    });

    it('doit avoir un aria-roledescription sur la poignee', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('.drag-handle');
      expect(handle.getAttribute('aria-roledescription')).toBeTruthy();
    });

    it('doit avoir un aria-label dynamique avec le username et la position', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const handles = fixture.nativeElement.querySelectorAll('.drag-handle');
      expect(handles.length).toBe(3);
      // First handle: StreamerA, position 1 sur 3
      const label0 = handles[0].getAttribute('aria-label');
      expect(label0).toContain('StreamerA');
      expect(label0).toContain('1');
      expect(label0).toContain('3');
    });

    it('ne doit PAS avoir aria-hidden="true" sur la poignee', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const handle = fixture.nativeElement.querySelector('.drag-handle');
      expect(handle.getAttribute('aria-hidden')).not.toBe('true');
    });
  });

  // ── clavier : grab & move ─────────────────────────────────────────

  describe('clavier — grab & move', () => {
    let handles: HTMLElement[];

    beforeEach(() => {
      component.loading.set(false);
      fixture.detectChanges();
      handles = Array.from(fixture.nativeElement.querySelectorAll('.drag-handle'));
    });

    function keydown(el: HTMLElement, key: string): void {
      el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      fixture.detectChanges();
    }

    it('Espace doit saisir la ligne (etat grabbed)', () => {
      keydown(handles[0], ' ');
      expect(handles[0].classList.contains('grabbed')).toBeTrue();
    });

    it('Entree doit aussi saisir la ligne', () => {
      keydown(handles[1], 'Enter');
      expect(handles[1].classList.contains('grabbed')).toBeTrue();
    });

    it('ArrowDown en etat saisi doit deplacer la ligne vers le bas', () => {
      // Grab StreamerA (index 0)
      keydown(handles[0], ' ');
      // Move down
      keydown(handles[0], 'ArrowDown');
      // applyOptimisticReorder should have been called with [2,1,3]
      expect(channelsServiceSpy.applyOptimisticReorder).toHaveBeenCalledWith([2, 1, 3]);
    });

    it('ArrowUp en etat saisi doit deplacer la ligne vers le haut', () => {
      // Grab StreamerC (index 2)
      keydown(handles[2], ' ');
      // Move up
      keydown(handles[2], 'ArrowUp');
      // applyOptimisticReorder should have been called with [1,3,2]
      expect(channelsServiceSpy.applyOptimisticReorder).toHaveBeenCalledWith([1, 3, 2]);
    });

    it('ArrowDown ne doit rien faire si deja en derniere position', () => {
      channelsServiceSpy.applyOptimisticReorder.calls.reset();
      // Grab StreamerC (last)
      keydown(handles[2], ' ');
      // ArrowDown should be a no-op
      keydown(handles[2], 'ArrowDown');
      expect(channelsServiceSpy.applyOptimisticReorder).not.toHaveBeenCalled();
    });

    it('ArrowUp ne doit rien faire si deja en premiere position', () => {
      channelsServiceSpy.applyOptimisticReorder.calls.reset();
      // Grab StreamerA (first)
      keydown(handles[0], ' ');
      // ArrowUp should be a no-op
      keydown(handles[0], 'ArrowUp');
      expect(channelsServiceSpy.applyOptimisticReorder).not.toHaveBeenCalled();
    });

    it('Espace en etat saisi doit deposer et appeler reorderChannels (un seul appel API)', () => {
      channelsServiceSpy.reorderChannels.calls.reset();
      // Grab StreamerA (index 0)
      keydown(handles[0], ' ');
      // Move down
      keydown(handles[0], 'ArrowDown');
      // Drop
      keydown(handles[0], ' ');
      expect(channelsServiceSpy.reorderChannels).toHaveBeenCalledTimes(1);
    });

    it('Echap en etat saisi doit annuler sans appel API', () => {
      channelsServiceSpy.reorderChannels.calls.reset();
      channelsServiceSpy.applyOptimisticReorder.calls.reset();
      // Grab StreamerA (index 0)
      keydown(handles[0], ' ');
      // Move down
      keydown(handles[0], 'ArrowDown');
      // Escape — should restore original
      keydown(handles[0], 'Escape');
      expect(channelsServiceSpy.reorderChannels).not.toHaveBeenCalled();
      // applyOptimisticReorder should have been called to restore
      const lastCall = channelsServiceSpy.applyOptimisticReorder.calls.mostRecent();
      expect(lastCall.args[0]).toEqual([1, 2, 3]); // original order restored
    });

    it('doit annoncer le deplacement via la region aria-live', () => {
      keydown(handles[0], ' ');
      keydown(handles[0], 'ArrowDown');
      expect(component.liveMessage()).not.toBe('');
    });

    it('ne doit pas saisir tant qu’un reorder est en vol (guard anti-double)', () => {
      // La garde vit desormais dans le helper partage : on la declenche par un
      // appel reseau laisse en attente plutot qu'en forcant le signal.
      channelsServiceSpy.reorderChannels.and.returnValue(new Subject<void>().asObservable());
      component.onReorder(0, 1);
      fixture.detectChanges();

      keydown(handles[0], ' ');

      expect(component.grabbedIndex()).toBe(-1);
    });

    it('ArrowDown/ArrowUp sans saisie prealable ne doit rien faire', () => {
      channelsServiceSpy.applyOptimisticReorder.calls.reset();
      keydown(handles[0], 'ArrowDown');
      keydown(handles[0], 'ArrowUp');
      expect(channelsServiceSpy.applyOptimisticReorder).not.toHaveBeenCalled();
    });

    it('should set error liveMessage on reorder failure', () => {
      channelsServiceSpy.reorderChannels.and.returnValue(throwError(() => new Error('API error')));
      component.onReorder(1, 0);
      expect(component.liveMessage()).toContain('Echec');
    });

    it('should not call API when drop on same position', () => {
      channelsServiceSpy.reorderChannels.calls.reset();
      component.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
      expect(channelsServiceSpy.reorderChannels).not.toHaveBeenCalled();
    });

    it('should render aria-live region with polite attribute', () => {
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });

    it('should not call service.reorderChannels when already reordering (SEC-PR206-001)', () => {
      channelsServiceSpy.reorderChannels.calls.reset();
      // Premiere requete laissee en attente : la garde doit bloquer la seconde.
      channelsServiceSpy.reorderChannels.and.returnValue(new Subject<void>().asObservable());

      component.onReorder(0, 1);
      component.onReorder(1, 2);

      expect(channelsServiceSpy.reorderChannels).toHaveBeenCalledTimes(1);
    });
  });

  // ── a11y : region aria-live ────────────────────────────────────────

  it('doit rendre une region aria-live avec polite', () => {
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  // ── guard reordering ──────────────────────────────────────────────

  it('ne doit pas appeler reorderChannels si deja reordering (SEC-PR206-001)', () => {
    // La garde vit dans le helper partage : on l'arme par un appel laisse en
    // vol plutot qu'en forcant le signal, desormais en lecture seule.
    channelsServiceSpy.reorderChannels.and.returnValue(new Subject<void>().asObservable());
    component.onReorder(0, 1);
    channelsServiceSpy.reorderChannels.calls.reset();

    component.onReorder(1, 2);

    expect(channelsServiceSpy.reorderChannels).not.toHaveBeenCalled();
  });

  it('ne doit pas appeler API quand drop sur meme position', () => {
    channelsServiceSpy.reorderChannels.calls.reset();
    component.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
    expect(channelsServiceSpy.reorderChannels).not.toHaveBeenCalled();
  });
});
