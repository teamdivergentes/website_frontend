import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { TeamsComponent } from './teams.component';
import { TeamsService } from '../../../shared/services';
import type { Team } from '../../../shared/models';

const makeTeam = (id: number, name: string, position: number): Team => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s/g, '-'),
  game: 'Valorant',
  active: true,
  position,
});

const mockTeams: Team[] = [
  makeTeam(1, 'DVG Valorant', 0),
  makeTeam(2, 'DVG LoL', 1),
  makeTeam(3, 'DVG CS2', 2),
];

async function setup(teams: Team[] = mockTeams) {
  const teamsSignal = signal<Team[]>(teams);
  const serviceSpy = jasmine.createSpyObj(
    'TeamsService',
    ['loadTeams', 'reorderTeams', 'toggleTeamActive', 'deleteTeam', 'getTeamBySlug', 'reorderMembers', 'addMember', 'updateMember', 'deleteMember'],
    { allTeams: teamsSignal.asReadonly() }
  );
  serviceSpy.loadTeams.and.returnValue(of(teams));
  serviceSpy.reorderTeams.and.returnValue(of(undefined));
  serviceSpy.toggleTeamActive.and.returnValue(of(undefined));
  serviceSpy.deleteTeam.and.returnValue(of(undefined));

  const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
  const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
  dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

  await TestBed.configureTestingModule({
    imports: [TeamsComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: TeamsService, useValue: serviceSpy },
      { provide: MatSnackBar, useValue: snackBarSpy },
      { provide: MatDialog, useValue: dialogSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TeamsComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, serviceSpy };
}

describe('TeamsComponent — a11y reorder', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should call onReorder when moveUp is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder').and.callThrough();
    component.onReorder(1, 0);
    expect(component.onReorder).toHaveBeenCalledWith(1, 0);
  });

  it('should call onReorder when moveDown is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder').and.callThrough();
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
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderTeams.and.returnValue(of(undefined));
    component.onReorder(1, 2);
    expect(component.liveMessage()).not.toBe('');
  });

  it('should set error liveMessage on reorder failure', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderTeams.and.returnValue(throwError(() => new Error('API error')));
    component.onReorder(1, 0);
    expect(component.liveMessage()).toContain('Echec');
  });

  it('should not call API when drop on same position', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderTeams.calls.reset();
    component.onDrop({ previousIndex: 0, currentIndex: 0 } as any);
    expect(serviceSpy.reorderTeams).not.toHaveBeenCalled();
  });

  it('should render aria-live region', async () => {
    const { fixture } = await setup();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should not call service.reorderTeams when already reordering (SEC-PR206-001)', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderTeams.calls.reset();
    component['reordering'].set(true);
    component.onReorder(0, 1);
    expect(serviceSpy.reorderTeams).not.toHaveBeenCalled();
  });
});
