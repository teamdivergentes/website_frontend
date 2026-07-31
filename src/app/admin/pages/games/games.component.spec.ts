import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';

import { GamesComponent } from './games.component';
import { GamesService } from '../../../shared/services/games.service';
import type { Game } from '../../../shared/models';

const makeGame = (id: number, name: string, position: number): Game => ({
  id,
  key: name.toLowerCase(),
  name,
  image: null,
  position,
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const mockGames: Game[] = [
  makeGame(1, 'Valorant', 0),
  makeGame(2, 'League of Legends', 1),
  makeGame(3, 'CS2', 2),
];

function buildServiceSpy(games: Game[] = mockGames) {
  const gamesSignal = signal<Game[]>(games);
  const spy = jasmine.createSpyObj(
    'GamesService',
    ['loadGames', 'reorderGames', 'toggleGameActive', 'seedGames', 'deleteGame'],
    { allGames: gamesSignal.asReadonly() }
  );
  spy.loadGames.and.returnValue(of(games));
  spy.reorderGames.and.returnValue(of(undefined));
  spy.toggleGameActive.and.returnValue(of(undefined));
  spy.seedGames.and.returnValue(of(undefined));
  spy.deleteGame.and.returnValue(of(undefined));
  return { spy, gamesSignal };
}

async function setup(games: Game[] = mockGames) {
  const { spy, gamesSignal } = buildServiceSpy(games);
  const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
  const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
  dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

  await TestBed.configureTestingModule({
    imports: [GamesComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: GamesService, useValue: spy },
      { provide: MatSnackBar, useValue: snackBarSpy },
      { provide: MatDialog, useValue: dialogSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(GamesComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, spy, snackBarSpy, gamesSignal };
}

describe('GamesComponent — a11y reorder', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should call onReorder when moveUp is clicked on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder');
    component.onReorder(1, 0);
    expect(component.onReorder).toHaveBeenCalledWith(1, 0);
  });

  it('should call onReorder when moveDown is clicked on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder');
    component.onReorder(1, 2);
    expect(component.onReorder).toHaveBeenCalledWith(1, 2);
  });

  it('should disable moveUp button on first row', async () => {
    const { fixture } = await setup();
    const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
    expect(moveUpBtns.length).toBeGreaterThan(0);
    expect(moveUpBtns[0].disabled).toBeTrue();
  });

  it('should disable moveDown button on last row', async () => {
    const { fixture } = await setup();
    const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
    expect(moveDownBtns.length).toBeGreaterThan(0);
    expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
  });

  it('should set liveMessage after successful reorder', async () => {
    const { component, spy } = await setup();
    spy.reorderGames.and.returnValue(of(undefined));
    component.onReorder(1, 2);
    expect(component.liveMessage()).not.toBe('');
  });

  it('should set error liveMessage on reorder failure', async () => {
    const { component, spy } = await setup();
    spy.reorderGames.and.returnValue(throwError(() => new Error('API error')));
    component.onReorder(1, 0);
    expect(component.liveMessage()).toContain('Echec');
  });

  it('should not call API when drop on same position', async () => {
    const { component, spy } = await setup();
    spy.reorderGames.calls.reset();
    component.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
    expect(spy.reorderGames).not.toHaveBeenCalled();
  });

  it('should render aria-live region', async () => {
    const { fixture } = await setup();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should not call service.reorderGames when already reordering (SEC-PR206-001)', async () => {
    const { component, spy } = await setup();
    spy.reorderGames.calls.reset();
    // Premiere requete laissee en attente : la garde doit bloquer la seconde.
    spy.reorderGames.and.returnValue(new Subject<void>().asObservable());

    component.onReorder(0, 1);
    component.onReorder(1, 2);

    expect(spy.reorderGames).toHaveBeenCalledTimes(1);
  });
});
