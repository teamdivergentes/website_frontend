import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
  let router: jasmine.SpyObj<Router>;

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
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [RolesComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RolesService, useValue: rolesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    rolesService = TestBed.inject(RolesService) as jasmine.SpyObj<RolesService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

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
    // L'erreur est desormais portee par un bandeau persistant, pas par un
    // snackbar de 3 s qui laissait "Aucun role cree" a l'ecran (EPIC-41).
    expect(component.error()).toBe('Impossible de charger les rôles.');
  });

  // ─── EPIC-41 : le formulaire est une page routee, plus un dialogue ─────────

  it('navigue vers la page de création au lieu d’ouvrir un dialogue', () => {
    component.goToCreate();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/roles/new']);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('navigue vers la page d’édition du rôle choisi', () => {
    component.goToEdit(mockRoles[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/admin/roles/edit', mockRoles[0].id]);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('l’état vide renvoie vers la même page de création', async () => {
    rolesService.getRoles.and.returnValue(of([]));
    fixture.detectChanges();
    await fixture.whenStable();

    const action = (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="empty-action"]');
    expect(action).toBeTruthy();
    action!.click();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/roles/new']);
  });

  // ─── Roles systeme : le comportement d'origine ne bouge pas ────────────────

  describe('rôles système', () => {
    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('reste modifiable, comme avant la migration', () => {
      // Le backend n'interdit que la suppression : ne pas durcir ici.
      expect(mockRoles[0].isSystem).toBe(true);
      component.goToEdit(mockRoles[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/admin/roles/edit', mockRoles[0].id]);
    });

    it('refuse la suppression d’un rôle encore porté par des utilisateurs', () => {
      component.confirmDelete(mockRoles[0]);
      expect(rolesService.deleteRole).not.toHaveBeenCalled();
    });
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
    const dialogRef = { afterClosed: () => of(true) };
    dialog.open.and.returnValue(dialogRef as any);
    rolesService.deleteRole.and.returnValue(of(void 0));

    component.confirmDelete(roleWithoutUsers);

    expect(dialog.open).toHaveBeenCalled();
    expect(rolesService.deleteRole).toHaveBeenCalledWith(roleWithoutUsers.id);
  });

  it('should cancel deletion if user cancels confirmation', () => {
    const roleWithoutUsers = { ...mockRoles[1], _count: { users: 0 } };
    const dialogRef = { afterClosed: () => of(false) };
    dialog.open.and.returnValue(dialogRef as any);

    component.confirmDelete(roleWithoutUsers);

    expect(dialog.open).toHaveBeenCalled();
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

  // ─── EPIC-41 : une panne d'API ne doit plus se deguiser en base vide ────────

  describe('erreur de chargement', () => {
    beforeEach(async () => {
      rolesService.getRoles.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('expose un signal error persistant', () => {
      expect(component.error()).toBeTruthy();
    });

    it('affiche un bandeau d\'erreur', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('app-error-state')).toBeTruthy();
    });

    it('n\'affiche PAS l\'etat vide en meme temps', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.empty-state')).toBeNull();
    });

    it('ne remonte plus l\'erreur de chargement par snackbar', () => {
      // Le snackbar disparaissait au bout de 3 s et laissait "Aucun role cree" a l'ecran.
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('permet de reessayer sans recharger la page', async () => {
      rolesService.getRoles.calls.reset();
      rolesService.getRoles.and.returnValue(of(mockRoles));

      component.retryLoad();
      await fixture.whenStable();

      expect(rolesService.getRoles).toHaveBeenCalled();
      expect(component.error()).toBeNull();
    });
  });
});
