import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { RoleFormDialogComponent } from './role-form-dialog.component';
import { RolesService } from '../../../../shared/services/api/roles.service';
import type { Role, PermissionGroup } from '../../../../shared/models/user.model';

describe('RoleFormDialogComponent', () => {
  let component: RoleFormDialogComponent;
  let fixture: ComponentFixture<RoleFormDialogComponent>;
  let rolesService: jasmine.SpyObj<RolesService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<RoleFormDialogComponent>>;

  const mockPermissions: PermissionGroup[] = [
    {
      module: 'Utilisateurs',
      permissions: ['users:read', 'users:write', 'users:delete']
    },
    {
      module: 'Rôles',
      permissions: ['roles:read', 'roles:write']
    }
  ];

  const mockRole: Role = {
    id: 1,
    name: 'Test Role',
    permissions: ['users:read', 'roles:read'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  function setupComponent(data: any = {}) {
    const rolesServiceSpy = jasmine.createSpyObj('RolesService', [
      'getPermissions',
      'createRole',
      'updateRole'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [RoleFormDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RolesService, useValue: rolesServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    });

    rolesService = TestBed.inject(RolesService) as jasmine.SpyObj<RolesService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RoleFormDialogComponent>>;
    rolesService.getPermissions.and.returnValue(of(mockPermissions));

    fixture = TestBed.createComponent(RoleFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    return { rolesService, dialogRef };
  }

  it('should create in creation mode', () => {
    setupComponent();
    expect(component).toBeTruthy();
    expect(component.isEdit()).toBe(false);
  });

  it('should create in edit mode', () => {
    setupComponent({ role: mockRole });
    expect(component.isEdit()).toBe(true);
    expect(component.form.value.name).toBe(mockRole.name);
  });

  it('should load permissions on init', () => {
    const { rolesService } = setupComponent();
    expect(rolesService.getPermissions).toHaveBeenCalled();
    expect(component.permissionGroups().length).toBe(2);
  });

  it('should preselect permissions in edit mode', () => {
    setupComponent({ role: mockRole });
    
    const groups = component.permissionGroups();
    const usersGroup = groups.find(g => g.module === 'Utilisateurs');
    const rolesGroup = groups.find(g => g.module === 'Rôles');

    expect(usersGroup?.permissions[0].control.value).toBe(true); // users:read
    expect(usersGroup?.permissions[1].control.value).toBe(false); // users:write
    expect(rolesGroup?.permissions[0].control.value).toBe(true); // roles:read
  });

  it('should select all permissions in a group', () => {
    setupComponent();
    
    const group = component.permissionGroups()[0];
    component.selectAll(group);

    group.permissions.forEach(perm => {
      expect(perm.control.value).toBe(true);
    });
  });

  it('should deselect all permissions in a group', () => {
    setupComponent();
    
    const group = component.permissionGroups()[0];
    component.selectAll(group);
    component.deselectAll(group);

    group.permissions.forEach(perm => {
      expect(perm.control.value).toBe(false);
    });
  });

  it('should count selected permissions correctly', () => {
    setupComponent();
    
    const group = component.permissionGroups()[0];
    group.permissions[0].control.setValue(true);
    group.permissions[1].control.setValue(true);

    expect(component.getSelectedCount(group)).toBe(2);
  });

  it('should validate that at least one permission is selected', () => {
    setupComponent();
    
    component.form.patchValue({ name: 'Test' });
    expect(component.hasAnyPermissionSelected()).toBe(false);
    expect(component.isFormValid()).toBe(false);

    const group = component.permissionGroups()[0];
    group.permissions[0].control.setValue(true);

    expect(component.hasAnyPermissionSelected()).toBe(true);
    expect(component.isFormValid()).toBe(true);
  });

  it('should validate name is required', () => {
    setupComponent();
    
    const group = component.permissionGroups()[0];
    group.permissions[0].control.setValue(true);

    expect(component.isFormValid()).toBe(false);

    component.form.patchValue({ name: 'Test' });
    expect(component.isFormValid()).toBe(true);
  });

  it('should create role successfully', () => {
    const { rolesService, dialogRef } = setupComponent();
    const newRole: Role = { ...mockRole, id: 2, name: 'New Role' };
    rolesService.createRole.and.returnValue(of(newRole));

    component.form.patchValue({ name: 'New Role' });
    const group = component.permissionGroups()[0];
    group.permissions[0].control.setValue(true);

    component.save();

    expect(rolesService.createRole).toHaveBeenCalledWith({
      name: 'New Role',
      permissions: ['users:read']
    });
    expect(dialogRef.close).toHaveBeenCalledWith(newRole);
  });

  it('should update role successfully', () => {
    const { rolesService, dialogRef } = setupComponent({ role: mockRole });
    const updatedRole: Role = { ...mockRole, name: 'Updated Role' };
    rolesService.updateRole.and.returnValue(of(updatedRole));

    component.form.patchValue({ name: 'Updated Role' });

    component.save();

    expect(rolesService.updateRole).toHaveBeenCalledWith(
      mockRole.id,
      jasmine.objectContaining({ name: 'Updated Role' })
    );
    expect(dialogRef.close).toHaveBeenCalledWith(updatedRole);
  });

  it('should handle create error', () => {
    const { rolesService } = setupComponent();
    rolesService.createRole.and.returnValue(throwError(() => new Error('API Error')));

    component.form.patchValue({ name: 'Test' });
    const group = component.permissionGroups()[0];
    group.permissions[0].control.setValue(true);

    component.save();

    expect(component.saving()).toBe(false);
  });

  it('should not save if form is invalid', () => {
    const { rolesService } = setupComponent();

    component.save();

    expect(rolesService.createRole).not.toHaveBeenCalled();
    expect(rolesService.updateRole).not.toHaveBeenCalled();
  });
});
