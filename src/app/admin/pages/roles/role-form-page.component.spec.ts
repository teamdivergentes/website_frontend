import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { RoleFormPageComponent } from './role-form-page.component';
import { RolesService } from '../../../../shared/services/api/roles.service';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import type { Role, PermissionGroup } from '../../../../shared/models/user.model';

describe('RoleFormPageComponent', () => {
  let component: RoleFormPageComponent;
  let fixture: ComponentFixture<RoleFormPageComponent>;
  let rolesService: jasmine.SpyObj<RolesService>;
  let router: jasmine.SpyObj<Router>;
  let notifier: jasmine.SpyObj<AdminNotifier>;

  const mockPermissions: PermissionGroup[] = [
    { module: 'Utilisateurs', permissions: ['users:read', 'users:write', 'users:delete'] },
    { module: 'Rôles', permissions: ['roles:read', 'roles:write'] },
  ];

  const mockRole: Role = {
    id: 7,
    name: 'Community Manager',
    permissions: ['users:read', 'roles:read'],
    isSystem: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  /**
   * Monte la page. `id` absent = creation, present = edition — c'est le seul
   * signal dont dispose le composant, comme sur la route reelle.
   */
  async function setup(id?: string): Promise<void> {
    const rolesServiceSpy = jasmine.createSpyObj('RolesService', [
      'getPermissions',
      'getRole',
      'createRole',
      'updateRole',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const notifierSpy = jasmine.createSpyObj('AdminNotifier', ['saved', 'error', 'success']);

    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    rolesServiceSpy.getPermissions.and.returnValue(of(mockPermissions));
    rolesServiceSpy.getRole.and.returnValue(of(mockRole));

    await TestBed.configureTestingModule({
      imports: [RoleFormPageComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RolesService, useValue: rolesServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AdminNotifier, useValue: notifierSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    }).compileComponents();

    rolesService = TestBed.inject(RolesService) as jasmine.SpyObj<RolesService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notifier = TestBed.inject(AdminNotifier) as jasmine.SpyObj<AdminNotifier>;

    fixture = TestBed.createComponent(RoleFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  // ─── Creation ──────────────────────────────────────────────────────────────

  describe('création', () => {
    beforeEach(async () => {
      await setup();
    });

    it('se monte en mode création quand la route ne porte pas d’identifiant', () => {
      expect(component.isEdit()).toBe(false);
      expect(rolesService.getRole).not.toHaveBeenCalled();
    });

    it('titre et bouton de retour dans l’en-tête de page', () => {
      expect(el().querySelector('.page-header h1')?.textContent).toContain('Nouveau rôle');
      expect(el().querySelector('.page-header .back-button')).toBeTruthy();
    });

    it('construit la matrice complète des permissions', () => {
      expect(component.permissionGroups()).toHaveSize(2);
      expect(component.permissionTotal()).toBe(5);
    });

    it('rend tous les modules sans accordéon à déplier', () => {
      // Le dialogue repliait chaque module : la page les montre tous.
      expect(el().querySelectorAll('.permission-group')).toHaveSize(2);
      expect(el().querySelectorAll('.permissions-list mat-checkbox')).toHaveSize(5);
    });

    it('part avec un formulaire vide et vierge', () => {
      expect(component.form.controls.name.value).toBe('');
      expect(component.selectedTotal()).toBe(0);
      expect(component.form.dirty).toBe(false);
    });

    it('refuse la validation tant qu’aucune permission n’est cochée', () => {
      component.form.controls.name.setValue('Modérateur');
      expect(component.hasAnyPermissionSelected()).toBe(false);
      expect(component.isFormValid()).toBe(false);
      expect(el().querySelector('.validation-error')).toBeTruthy();
    });

    it('refuse la validation tant que le nom est vide', () => {
      component.selectAll(component.permissionGroups()[0]);
      expect(component.isFormValid()).toBe(false);
    });

    it('accepte un nom et au moins une permission', () => {
      component.form.controls.name.setValue('Modérateur');
      component.permissionGroups()[0].permissions[0].control.setValue(true);
      expect(component.isFormValid()).toBe(true);
    });

    it('enregistre le nom et les permissions cochées, dans l’ordre des modules', () => {
      rolesService.createRole.and.returnValue(of({ ...mockRole, id: 9 }));

      component.form.controls.name.setValue('Modérateur');
      component.permissionGroups()[0].permissions[0].control.setValue(true);
      component.permissionGroups()[1].permissions[0].control.setValue(true);
      component.save();

      expect(rolesService.createRole).toHaveBeenCalledWith({
        name: 'Modérateur',
        permissions: ['users:read', 'roles:read'],
      });
      expect(notifier.saved).toHaveBeenCalledWith('Rôle', 'create');
      expect(router.navigate).toHaveBeenCalledWith(['/admin/roles']);
    });

    it('n’enregistre pas un formulaire invalide et marque les champs comme touchés', () => {
      component.save();

      expect(rolesService.createRole).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('affiche un message et rend la main quand l’enregistrement échoue', () => {
      rolesService.createRole.and.returnValue(throwError(() => new Error('API')));

      component.form.controls.name.setValue('Modérateur');
      component.permissionGroups()[0].permissions[0].control.setValue(true);
      component.save();

      expect(component.saving()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ─── Edition ───────────────────────────────────────────────────────────────

  describe('édition', () => {
    beforeEach(async () => {
      await setup('7');
    });

    it('charge le rôle désigné par la route', () => {
      expect(component.isEdit()).toBe(true);
      expect(rolesService.getRole).toHaveBeenCalledWith(7);
      expect(component.form.controls.name.value).toBe('Community Manager');
    });

    it('titre d’édition dans l’en-tête', () => {
      expect(el().querySelector('.page-header h1')?.textContent).toContain('Modifier le rôle');
    });

    it('pré-coche les permissions déjà accordées, et elles seules', () => {
      const users = component.permissionGroups()[0];
      const roles = component.permissionGroups()[1];

      expect(users.permissions[0].control.value).toBe(true); // users:read
      expect(users.permissions[1].control.value).toBe(false); // users:write
      expect(roles.permissions[0].control.value).toBe(true); // roles:read
      expect(component.selectedTotal()).toBe(2);
    });

    it('reste vierge après le chargement', () => {
      // Sans ce `markAsPristine`, la garde de sortie confondrait le
      // pre-remplissage avec une saisie de l'administrateur.
      expect(component.form.dirty).toBe(false);
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('enregistre par une mise à jour, pas par une création', () => {
      rolesService.updateRole.and.returnValue(of(mockRole));

      component.form.controls.name.setValue('CM Senior');
      component.save();

      expect(rolesService.updateRole).toHaveBeenCalledWith(7, {
        name: 'CM Senior',
        permissions: ['users:read', 'roles:read'],
      });
      expect(rolesService.createRole).not.toHaveBeenCalled();
      expect(notifier.saved).toHaveBeenCalledWith('Rôle', 'edit');
      expect(router.navigate).toHaveBeenCalledWith(['/admin/roles']);
    });
  });

  // ─── Identifiant inconnu ───────────────────────────────────────────────────

  describe('identifiant inconnu', () => {
    beforeEach(async () => {
      await setup('404');
      rolesService.getRole.and.returnValue(throwError(() => new Error('Not found')));
      component.load();
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('rend un état d’erreur au lieu d’un formulaire vide', () => {
      // Un formulaire vide ferait croire a une creation, et l'enregistrement
      // echouerait ensuite sur une route d'edition.
      expect(component.loadError()).toBe('Impossible de charger ce rôle.');
      expect(el().querySelector('app-error-state')).toBeTruthy();
      expect(el().querySelector('form')).toBeNull();
    });

    it('propose de réessayer sans recharger la page', async () => {
      rolesService.getRole.and.returnValue(of(mockRole));

      const retry = el().querySelector<HTMLButtonElement>('[data-testid="error-retry"]');
      expect(retry).toBeTruthy();
      retry!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.loadError()).toBeUndefined();
      expect(el().querySelector('form')).toBeTruthy();
    });
  });

  describe('permissions indisponibles', () => {
    it('rend un état d’erreur plutôt qu’une matrice vide', async () => {
      // Le dialogue n'avait aucun gestionnaire d'erreur ici : une panne
      // affichait une matrice vide et le message "selectionnez au moins une
      // permission", qui accusait l'administrateur.
      await setup();
      rolesService.getPermissions.and.returnValue(throwError(() => new Error('API')));
      component.load();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.loadError()).toBe('Impossible de charger les permissions.');
      expect(el().querySelector('app-error-state')).toBeTruthy();
    });
  });

  // ─── Garde de sortie ───────────────────────────────────────────────────────

  describe('garde de sortie', () => {
    beforeEach(async () => {
      await setup();
    });

    it('laisse partir un formulaire intact', () => {
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('retient une saisie dans le champ nom', () => {
      component.form.controls.name.markAsDirty();
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('retient une case cochée à la souris', async () => {
      // Le point sensible de cette migration : les cases de la matrice ne sont
      // pas des champs de saisie. Si elles vivaient hors du formulaire, comme
      // dans le dialogue, `form.dirty` resterait faux ici.
      const box = el().querySelector<HTMLInputElement>('.permissions-list input[type="checkbox"]');
      expect(box).toBeTruthy();
      box!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTotal()).toBe(1);
      expect(component.form.dirty).toBe(true);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('retient un module coché en bloc', () => {
      // `setValue` ne marque rien comme modifie : sans le `markAsDirty`
      // explicite, cocher onze modules puis quitter ne demanderait rien.
      component.selectAll(component.permissionGroups()[0]);

      expect(component.selectedTotal()).toBe(3);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('retient un module décoché en bloc', () => {
      component.selectAll(component.permissionGroups()[0]);
      component.form.markAsPristine();
      component.deselectAll(component.permissionGroups()[0]);

      expect(component.selectedTotal()).toBe(0);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('ne retient plus rien après un enregistrement réussi', () => {
      rolesService.createRole.and.returnValue(of(mockRole));

      component.form.controls.name.setValue('Modérateur');
      component.selectAll(component.permissionGroups()[0]);
      component.save();

      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });

  // ─── Rechargement ──────────────────────────────────────────────────────────

  describe('rechargement', () => {
    it('ne duplique pas les contrôles de la matrice', async () => {
      await setup();
      component.load();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(Object.keys(component.form.controls.permissions.controls)).toHaveSize(5);
      expect(component.permissionTotal()).toBe(5);
    });
  });
});
