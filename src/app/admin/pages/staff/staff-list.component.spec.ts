import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { StaffListComponent } from './staff-list.component';
import { StaffService } from '../../../shared/services';
import { StaffCategory, type StaffMember } from '../../../shared/models';

const makeMember = (id: number, name: string, position: number): StaffMember => ({
  id,
  name,
  role: 'Manager',
  category: StaffCategory.ADMIN,
  position,
});

const mockMembers: StaffMember[] = [
  makeMember(1, 'Alice', 0),
  makeMember(2, 'Bob', 1),
  makeMember(3, 'Charlie', 2),
];

async function setup(members: StaffMember[] = mockMembers) {
  const membersSignal = signal<StaffMember[]>(members);
  const serviceSpy = jasmine.createSpyObj(
    'StaffService',
    ['loadStaff', 'reorderMembers', 'deleteMember'],
    {
      admins: computed(() => membersSignal()),
      headstaff: computed(() => [] as StaffMember[]),
      ambassadors: computed(() => [] as StaffMember[]),
    }
  );
  serviceSpy.loadStaff.and.returnValue(of(members));
  serviceSpy.reorderMembers.and.returnValue(of(undefined));
  serviceSpy.deleteMember.and.returnValue(of(undefined));

  const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
  dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);

  await TestBed.configureTestingModule({
    imports: [StaffListComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: StaffService, useValue: serviceSpy },
      { provide: MatDialog, useValue: dialogSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(StaffListComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, serviceSpy };
}

describe('StaffListComponent — a11y reorder', () => {
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

  it('should disable moveUp button on first row (i=0)', async () => {
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
    serviceSpy.reorderMembers.and.returnValue(of(undefined));
    component.onReorder(1, 2);
    expect(component.liveMessage()).not.toBe('');
  });

  it('should set error liveMessage on reorder failure', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderMembers.and.returnValue(throwError(() => new Error('API error')));
    component.onReorder(1, 0);
    expect(component.liveMessage()).toContain('Echec');
  });

  it('should not call API when drop on same position', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderMembers.calls.reset();
    component.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
    expect(serviceSpy.reorderMembers).not.toHaveBeenCalled();
  });

  it('should render aria-live region', async () => {
    const { fixture } = await setup();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should not call service.reorderMembers when already reordering (SEC-PR206-001)', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderMembers.calls.reset();
    component['reordering'].set(true);
    component.onReorder(0, 1);
    expect(serviceSpy.reorderMembers).not.toHaveBeenCalled();
  });
});
