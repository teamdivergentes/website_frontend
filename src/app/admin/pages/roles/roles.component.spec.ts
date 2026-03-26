import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { RolesComponent } from './roles.component';
import { RolesService } from '../../../../shared/services/api/roles.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import type { Role } from '../../../../shared/models/user.model';

describe('RolesComponent', () => {
  let component: RolesComponent;
  let fixture: ComponentFixture<RolesComponent>;
  let rolesService: jasmine.SpyObj<RolesService>;
  let authService: jasmine.SpyObj<AuthService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockRoles: Role[] = [
    {
      id: 1,
      name: 'Admin',
      permissions: ['users:read', 'users:write', 'roles:read'],
      isSystem: true,
      _count: { users: 2 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'User',
      permissions: ['users:read'],
      isSystem: false,
      _count: { users: 5 },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const rolesServiceSpy = jasmine.createSpyObj('RolesService', [
      'getRoles',
      'deleteRole'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [RolesComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RolesService, useValue: rolesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    rolesService = TestBed.inject(RolesService) as jasmine.SpyObj<RolesService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    rolesService.getRoles.and.returnValue(of(mockRoles));
    authService.hasPermission.and.returnValue(true);

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    fixture.detectChanges();

    expect(rolesService.getRoles).toHaveBeenCalled();
    expect(component.roles()).toEqual(mockRoles);
    expect(component.loading()).toBe(false);
  });

  it('should handle load error', () => {
    rolesService.getRoles.and.returnValue(throwError(() => new Error('API Error')));
    
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Erreur lors du chargement des rôles',
      'OK',
      { duration: 3000 }
    );
  });

  it('should open create dialog', () => {
    const dialogRef = { afterClosed: () => of(true) };
    dialog.open.and.returnValue(dialogRef as any);

    component.openCreateDialog();

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open edit dialog', () => {
    const dialogRef = { afterClosed: () => of(true) };
    dialog.open.and.returnValue(dialogRef as any);

    component.openEditDialog(mockRoles[0]);

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should prevent deletion of role with users', () => {
    const roleWithUsers = mockRoles[0];
    component.confirmDelete(roleWithUsers);

    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringContaining('Impossible de supprimer'),
      'OK',
      { duration: 4000 }
    );
    expect(rolesService.deleteRole).not.toHaveBeenCalled();
  });

  it('should delete role without users after confirmation', () => {
    const roleWithoutUsers = { ...mockRoles[1], _count: { users: 0 } };
    spyOn(window, 'confirm').and.returnValue(true);
    rolesService.deleteRole.and.returnValue(of(void 0));

    component.confirmDelete(roleWithoutUsers);

    expect(window.confirm).toHaveBeenCalled();
    expect(rolesService.deleteRole).toHaveBeenCalledWith(roleWithoutUsers.id);
  });

  it('should cancel deletion if user cancels confirmation', () => {
    const roleWithoutUsers = { ...mockRoles[1], _count: { users: 0 } };
    spyOn(window, 'confirm').and.returnValue(false);

    component.confirmDelete(roleWithoutUsers);

    expect(rolesService.deleteRole).not.toHaveBeenCalled();
  });

  it('should check permissions correctly', () => {
    authService.hasPermission.and.returnValue(false);

    expect(component.hasPermission('roles:write')).toBe(false);
    expect(authService.hasPermission).toHaveBeenCalledWith('roles:write');
  });

  it('should return remaining permissions for tooltip', () => {
    const role: Role = {
      id: 1,
      name: 'Test',
      permissions: ['perm1', 'perm2', 'perm3', 'perm4', 'perm5'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    const remaining = component.getRemainingPermissions(role);

    expect(remaining).toBe('perm4, perm5');
  });

  it('should use trackBy with role id', () => {
    const role = mockRoles[0];
    const trackById = component.trackByRole(0, role);

    expect(trackById).toBe(role.id);
  });
});
