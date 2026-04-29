import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UsersComponent } from './users.component';
import { UsersService } from '../../../../shared/services/api/users.service';
import { RolesService } from '../../../../shared/services/api/roles.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { PaginatedResponse, User } from '../../../../shared/models/user.model';

const mockUser: User = {
  id: 1,
  email: 'admin@test.com',
  actif: true,
  role: { id: 1, name: 'Admin', permissions: [], createdAt: '', updatedAt: '' },
  createdAt: '2024-01-01T00:00:00Z'
};

const mockResponse: PaginatedResponse<User> = {
  data: [mockUser],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
};

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let rolesServiceSpy: jasmine.SpyObj<RolesService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsers', 'toggleActive', 'deleteUser']);
    rolesServiceSpy = jasmine.createSpyObj('RolesService', ['getRoles']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    usersServiceSpy.getUsers.and.returnValue(of(mockResponse));
    rolesServiceSpy.getRoles.and.returnValue(of([]));
    authServiceSpy.hasPermission.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [UsersComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: RolesService, useValue: rolesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(usersServiceSpy.getUsers).toHaveBeenCalled();
    expect(component.users()).toEqual([mockUser]);
    expect(component.totalUsers()).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('should update loading state during load', () => {
    // After init, loading should be false
    expect(component.loading()).toBeFalse();
  });

  it('should check permissions via hasPermission()', () => {
    component.hasPermission('users:write');
    expect(authServiceSpy.hasPermission).toHaveBeenCalledWith('users:write');
  });

  it('should update users on onFiltersChange()', () => {
    usersServiceSpy.getUsers.calls.reset();
    component.onFiltersChange({ search: 'test', roleId: null, actif: null });
    expect(usersServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should update pageSize on onPageChange()', () => {
    const pageEvent = { pageIndex: 1, pageSize: 50, length: 100 } as any;
    component.onPageChange(pageEvent);
    expect(component.pageSize()).toBe(50);
    expect(usersServiceSpy.getUsers).toHaveBeenCalledTimes(2);
  });

  it('should reload on onSortChange()', () => {
    usersServiceSpy.getUsers.calls.reset();
    component.onSortChange({ active: 'email', direction: 'asc' });
    expect(usersServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should reset sort to default when no direction on onSortChange()', () => {
    usersServiceSpy.getUsers.calls.reset();
    component.onSortChange({ active: '', direction: '' });
    expect(usersServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should open create dialog on openCreateDialog()', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should open create dialog and reload when result is truthy', () => {
    usersServiceSpy.getUsers.calls.reset();
    const dialogRef = { afterClosed: () => of(true) };
    dialogSpy.open.and.returnValue(dialogRef as any);
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
    expect(usersServiceSpy.getUsers).toHaveBeenCalled();
  });

  it('should toggle user active via onToggleActive()', () => {
    usersServiceSpy.toggleActive.and.returnValue(of({ ...mockUser, actif: false }));
    component.onToggleActive(mockUser);
    expect(usersServiceSpy.toggleActive).toHaveBeenCalledWith(mockUser.id);
  });

  it('should handle table action edit', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    component.onTableAction({ action: 'edit', user: mockUser });
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should handle table action changeRole', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    component.onTableAction({ action: 'changeRole', user: mockUser });
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should handle table action resetPassword', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
    component.onTableAction({ action: 'resetPassword', user: mockUser });
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should handle table action delete', () => {
    dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
    component.onTableAction({ action: 'delete', user: mockUser });
    expect(dialogSpy.open).toHaveBeenCalled();
  });
});
