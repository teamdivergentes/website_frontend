import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserTableComponent, UserTableActionEvent } from './user-table.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import type { User } from '../../../../../../shared/models/user.model';

const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@test.com',
    actif: true,
    role: { id: 1, name: 'Admin', permissions: [], createdAt: '', updatedAt: '' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'manager@test.com',
    actif: false,
    role: { id: 2, name: 'Manager', permissions: [], createdAt: '', updatedAt: '' },
    createdAt: '2024-01-02T00:00:00Z'
  }
];

describe('UserTableComponent', () => {
  let component: UserTableComponent;
  let fixture: ComponentFixture<UserTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTableComponent, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('users', mockUsers);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default column definitions', () => {
    expect(component.displayedColumns).toEqual(['email', 'role', 'actif', 'createdAt', 'actions']);
  });

  it('should accept users input', () => {
    expect(component.users()).toEqual(mockUsers);
  });

  it('should have default loading as false', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should have default totalUsers as 0', () => {
    expect(component.totalUsers()).toBe(0);
  });

  it('should have default pageSize as 20', () => {
    expect(component.pageSize()).toBe(20);
  });

  it('should emit sortChange on onSortChange()', () => {
    const emitted: Sort[] = [];
    component.sortChange.subscribe((v: Sort) => emitted.push(v));

    const sort: Sort = { active: 'email', direction: 'asc' };
    component.onSortChange(sort);

    expect(emitted).toHaveSize(1);
    expect(emitted[0]).toEqual(sort);
  });

  it('should emit pageChange on onPageChange()', () => {
    const emitted: PageEvent[] = [];
    component.pageChange.subscribe((v: PageEvent) => emitted.push(v));

    const event = new PageEvent();
    event.pageIndex = 1;
    event.pageSize = 10;
    component.onPageChange(event);

    expect(emitted).toHaveSize(1);
    expect(emitted[0].pageIndex).toBe(1);
  });

  it('should emit toggleActive on onToggleActive()', () => {
    const emitted: User[] = [];
    component.toggleActive.subscribe((v: User) => emitted.push(v));

    component.onToggleActive(mockUsers[0]);

    expect(emitted).toHaveSize(1);
    expect(emitted[0]).toEqual(mockUsers[0]);
  });

  it('should emit actionTriggered on onRowAction()', () => {
    const emitted: UserTableActionEvent[] = [];
    component.actionTriggered.subscribe((v: UserTableActionEvent) => emitted.push(v));

    component.onRowAction({ action: 'edit', user: mockUsers[0] });

    expect(emitted).toHaveSize(1);
    expect(emitted[0].action).toBe('edit');
  });

  it('should emit createClicked on onCreateClicked()', () => {
    let clickCount = 0;
    component.createClicked.subscribe(() => clickCount++);

    component.onCreateClicked();

    expect(clickCount).toBe(1);
  });

  it('should return warn color for admin role', () => {
    expect(component.getRoleColor('Admin')).toBe('warn');
    expect(component.getRoleColor('superadmin')).toBe('warn');
  });

  it('should return accent color for manager role', () => {
    expect(component.getRoleColor('Manager')).toBe('accent');
  });

  it('should return primary color for other roles', () => {
    expect(component.getRoleColor('Member')).toBe('primary');
    expect(component.getRoleColor('Viewer')).toBe('primary');
  });

  it('should use user id as trackBy key', () => {
    expect(component.trackByUser(0, mockUsers[0])).toBe(1);
    expect(component.trackByUser(1, mockUsers[1])).toBe(2);
  });
});
