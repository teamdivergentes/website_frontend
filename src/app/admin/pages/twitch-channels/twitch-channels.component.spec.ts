import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
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
  ...overrides
});

describe('TwitchChannelsComponent', () => {
  let component: TwitchChannelsComponent;
  let fixture: ComponentFixture<TwitchChannelsComponent>;
  let channelsServiceSpy: jasmine.SpyObj<TwitchChannelsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const channelList: TwitchChannel[] = [
    mockChannel({ id: 1, twitchUsername: 'StreamerA', position: 0 }),
    mockChannel({ id: 2, twitchUsername: 'StreamerB', position: 1 })
  ];

  beforeEach(async () => {
    const channelsSignal = signal<TwitchChannel[]>(channelList);

    channelsServiceSpy = jasmine.createSpyObj(
      'TwitchChannelsService',
      ['loadChannels', 'loadLiveStatus', 'reorderChannels', 'deleteChannel',
       'createChannel', 'updateChannel', 'applyOptimisticReorder', 'isLive'],
      { channels: channelsSignal.asReadonly() }
    );
    channelsServiceSpy.loadChannels.and.returnValue(of(channelList));
    channelsServiceSpy.loadLiveStatus.and.returnValue(of([]));
    channelsServiceSpy.reorderChannels.and.returnValue(of(undefined as unknown as void));
    channelsServiceSpy.deleteChannel.and.returnValue(of(undefined as unknown as void));
    channelsServiceSpy.isLive.and.returnValue(false);

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
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TwitchChannelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit charger les chaînes au démarrage', () => {
    expect(channelsServiceSpy.loadChannels).toHaveBeenCalledTimes(1);
  });

  it('doit afficher le skeleton pendant le chargement', () => {
    component.loading.set(true);
    fixture.detectChanges();
    const skeleton = fixture.nativeElement.querySelector('.skeleton-table');
    expect(skeleton).toBeTruthy();
  });

  it('doit afficher la table quand les chaînes sont chargées', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('.channels-table');
    expect(table).toBeTruthy();
  });

  it('doit afficher le bon nombre de lignes', () => {
    component.loading.set(false);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.channel-row');
    expect(rows.length).toBe(2);
  });

  it('doit appeler refreshLive et charger le statut live', async () => {
    component.refreshLive();
    await fixture.whenStable();
    expect(channelsServiceSpy.loadLiveStatus).toHaveBeenCalled();
  });

  it('doit afficher un snackbar en cas d\'erreur de rafraîchissement live', async () => {
    channelsServiceSpy.loadLiveStatus.and.returnValue(throwError(() => new Error('network')));
    component.refreshLive();
    await fixture.whenStable();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Impossible de rafraîchir le statut live',
      'OK',
      jasmine.any(Object)
    );
  });

  it('doit ouvrir le dialog de création lors du clic sur "Nouvelle chaîne"', () => {
    component.openCreate();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('doit ouvrir le dialog d\'édition avec la bonne chaîne', () => {
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

  it('doit appeler applyOptimisticReorder puis reorderChannels lors du drop', () => {
    const dragEvent = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 }
    };
    component.onDrop(dragEvent as any);
    expect(channelsServiceSpy.applyOptimisticReorder).toHaveBeenCalled();
    expect(channelsServiceSpy.reorderChannels).toHaveBeenCalled();
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
      dropPoint: { x: 0, y: 0 }
    };
    component.onDrop(dragEvent as any);
    await fixture.whenStable();
    expect(channelsServiceSpy.loadChannels).toHaveBeenCalledTimes(2); // initial + rollback
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Erreur lors de la réorganisation', 'OK', jasmine.any(Object)
    );
  });

  // ── a11y : boutons monter / descendre ─────────────────────────────────────

  describe('a11y — boutons Monter / Descendre (WCAG 2.1.1)', () => {
    it('should call onReorder when moveUp is triggered on row i=1', () => {
      spyOn(component, 'onReorder').and.callThrough();
      component.onReorder(1, 0);
      expect(component.onReorder).toHaveBeenCalledWith(1, 0);
    });

    it('should call onReorder when moveDown is triggered on row i=1', () => {
      spyOn(component, 'onReorder').and.callThrough();
      component.onReorder(1, 2);
      expect(component.onReorder).toHaveBeenCalledWith(1, 2);
    });

    it('should disable moveUp button on first row', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
      expect(moveUpBtns.length).toBeGreaterThan(0);
      expect(moveUpBtns[0].disabled).toBeTrue();
    });

    it('should disable moveDown button on last row', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
      expect(moveDownBtns.length).toBeGreaterThan(0);
      expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
    });

    it('should set liveMessage after successful reorder', () => {
      channelsServiceSpy.reorderChannels.and.returnValue(of(undefined as unknown as void));
      component.onReorder(1, 0);
      expect(component.liveMessage()).not.toBe('');
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
  });
});
