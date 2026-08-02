import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, Observable, Subject } from 'rxjs';

import { CoachingStaffPageComponent } from './coaching-staff-page.component';
import { CoachingStaffService, TeamsService } from '../../../../shared/services';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { AuthService } from '../../../../../shared/services/api/auth.service';
import type { CoachingStaffMember, Team } from '../../../../shared/models';

const mockTeam: Team = {
  id: 42,
  name: 'DVG Valorant',
  slug: 'dvg-valorant',
  game: 'Valorant',
  active: true,
  position: 0,
};

const otherTeam: Team = { ...mockTeam, id: 43, name: 'DVG LoL', slug: 'dvg-lol' };

const mockCoaches: CoachingStaffMember[] = [
  {
    id: 1,
    name: 'Coach Alpha',
    role: 'Head Coach',
    position: 0,
    teamId: 42,
    socials: { discord: 'https://discord.gg/alpha', website: 'https://alpha.gg' },
  },
  { id: 2, name: 'Coach Beta', role: 'Analyste', position: 1, teamId: 42 },
];

function buildService(coaches: CoachingStaffMember[] = mockCoaches) {
  return {
    list: jasmine.createSpy('list').and.returnValue(of(coaches)),
    create: jasmine.createSpy('create').and.returnValue(of(coaches[0])),
    update: jasmine.createSpy('update').and.returnValue(of(coaches[0])),
    delete: jasmine.createSpy('delete').and.returnValue(of(undefined)),
    reorder: jasmine.createSpy('reorder').and.returnValue(of({ message: 'ok' })),
  };
}

function buildAuthService(canWrite = true, canDelete = true) {
  return {
    hasPermission: jasmine.createSpy('hasPermission').and.callFake((perm: string) => {
      if (perm === 'coaching_staff:write') return canWrite;
      if (perm === 'coaching_staff:delete') return canDelete;
      return false;
    }),
  };
}

interface SetupOptions {
  canWrite?: boolean;
  canDelete?: boolean;
  /** Identifiant porte par l'URL. `'42'` correspond a `mockTeam`. */
  id?: string;
  /** Remplace la reponse de `TeamsService.loadTeams()`. */
  teams?: Observable<Team[]>;
}

interface SetupResult {
  fixture: ComponentFixture<CoachingStaffPageComponent>;
  component: CoachingStaffPageComponent;
  serviceSpy: ReturnType<typeof buildService>;
  teamsSpy: jasmine.SpyObj<TeamsService>;
  confirmSpy: jasmine.SpyObj<AdminConfirmService>;
  router: jasmine.SpyObj<Router>;
}

async function setupComponent(
  coaches: CoachingStaffMember[] = mockCoaches,
  options: SetupOptions = {},
): Promise<SetupResult> {
  const serviceSpy = buildService(coaches);
  const authSpy = buildAuthService(options.canWrite ?? true, options.canDelete ?? true);

  const teamsSpy = jasmine.createSpyObj<TeamsService>('TeamsService', ['loadTeams']);
  teamsSpy.loadTeams.and.returnValue(options.teams ?? of([mockTeam, otherTeam]));

  const confirmSpy = jasmine.createSpyObj<AdminConfirmService>('AdminConfirmService', [
    'delete',
    'discardChanges',
  ]);
  confirmSpy.delete.and.returnValue(of(true));

  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  router.navigate.and.resolveTo(true);

  await TestBed.configureTestingModule({
    imports: [CoachingStaffPageComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: CoachingStaffService, useValue: serviceSpy },
      { provide: TeamsService, useValue: teamsSpy },
      { provide: AdminConfirmService, useValue: confirmSpy },
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: options.id ?? '42' }) } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CoachingStaffPageComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return {
    fixture,
    component: fixture.componentInstance,
    serviceSpy,
    teamsSpy,
    confirmSpy,
    router,
  };
}

describe('CoachingStaffPageComponent', () => {
  it('should create', async () => {
    const { component } = await setupComponent();
    expect(component).toBeTruthy();
  });

  // ── Chargement ────────────────────────────────────────────────────────────

  describe('au chargement', () => {
    it('résout l’équipe de l’URL et charge son staff', async () => {
      const { component, serviceSpy } = await setupComponent();
      expect(serviceSpy.list).toHaveBeenCalledWith(42);
      expect(component.coaches().map((c) => c.name)).toEqual(['Coach Alpha', 'Coach Beta']);
      expect(component.loading()).toBeFalse();
    });

    it('trie le staff par position', async () => {
      const unordered: CoachingStaffMember[] = [
        { ...mockCoaches[1], position: 5 },
        { ...mockCoaches[0], position: 1 },
      ];
      const { component } = await setupComponent(unordered);
      expect(component.coaches().map((c) => c.name)).toEqual(['Coach Alpha', 'Coach Beta']);
    });

    it('affiche le nom de l’équipe, seul repère quand on arrive par une URL partagée', async () => {
      const { fixture, component } = await setupComponent();
      expect(component.title()).toBe('Staff de coaching de DVG Valorant');
      const heading: HTMLElement = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toContain('DVG Valorant');
    });

    it('affiche les coachs chargés', async () => {
      const { fixture } = await setupComponent();
      const rows = fixture.nativeElement.querySelectorAll('.coach-row');
      expect(rows.length).toBe(2);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Coach Alpha');
    });

    it('affiche l’état vide quand l’équipe n’a aucun coach', async () => {
      const { fixture } = await setupComponent([]);
      expect(fixture.nativeElement.querySelector('.empty-state')).not.toBeNull();
    });

    it('rend une région aria-live pour les annonces de réordonnancement', async () => {
      const { fixture } = await setupComponent();
      expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).not.toBeNull();
    });
  });

  // ── Identifiant inconnu ───────────────────────────────────────────────────

  describe('quand l’identifiant d’équipe est inconnu', () => {
    it('affiche une erreur plutôt qu’un staff vide', async () => {
      const { fixture, component, serviceSpy } = await setupComponent(mockCoaches, { id: '999' });

      // Sans cela, une URL fausse et une equipe sans coach se ressemblent.
      expect(component.loadError()).toBe("Cette équipe n'existe pas.");
      expect(serviceSpy.list).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.coach-row')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="error-retry"]')).not.toBeNull();
    });

    it('réessaie le chargement à la demande', async () => {
      const { fixture, component, teamsSpy, serviceSpy } = await setupComponent(mockCoaches, {
        id: '999',
      });

      teamsSpy.loadTeams.and.returnValue(of([{ ...mockTeam, id: 999 }]));
      component.loadTeam();
      await fixture.whenStable();

      expect(component.loadError()).toBeUndefined();
      expect(serviceSpy.list).toHaveBeenCalledWith(999);
    });

    it('signale aussi un échec réseau sur la liste des équipes', async () => {
      const { component } = await setupComponent(mockCoaches, {
        teams: throwError(() => new Error('offline')),
      });

      expect(component.loadError()).toBe('Impossible de charger cette équipe.');
      expect(component.loading()).toBeFalse();
    });

    it('bloque la page quand le staff lui-même ne se charge pas', async () => {
      // En dialogue, cet echec n'alimentait que le bandeau du formulaire,
      // invisible en mode liste : la panne passait pour un staff vide.
      const serviceSpy = buildService();
      serviceSpy.list.and.returnValue(throwError(() => new Error('HTTP error')));

      const teamsSpy = jasmine.createSpyObj<TeamsService>('TeamsService', ['loadTeams']);
      teamsSpy.loadTeams.and.returnValue(of([mockTeam]));

      await TestBed.configureTestingModule({
        imports: [CoachingStaffPageComponent, NoopAnimationsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: CoachingStaffService, useValue: serviceSpy },
          { provide: TeamsService, useValue: teamsSpy },
          {
            provide: AdminConfirmService,
            useValue: jasmine.createSpyObj('AdminConfirmService', ['delete', 'discardChanges']),
          },
          { provide: AuthService, useValue: buildAuthService() },
          { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap({ id: '42' }) } },
          },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(CoachingStaffPageComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.loadError()).toBe(
        'Impossible de charger le staff de cette équipe.',
      );
      expect(fixture.nativeElement.querySelector('[data-testid="error-retry"]')).not.toBeNull();
    });
  });

  // ── SEC-CS-001 : hasPermission UI guards ──────────────────────────────────

  describe('Permissions (SEC-CS-001)', () => {
    it('should show "Ajouter un coach" button when canWrite() is true', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: true });
      expect(fixture.nativeElement.querySelector('[aria-label="Ajouter un coach"]')).not.toBeNull();
    });

    it('should hide "Ajouter un coach" button when canWrite() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: false });
      expect(fixture.nativeElement.querySelector('[aria-label="Ajouter un coach"]')).toBeNull();
    });

    it('should disable edit buttons when canWrite() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: false });
      const editBtn = fixture.nativeElement.querySelector('[aria-label="Modifier Coach Alpha"]');
      expect(editBtn?.disabled).toBeTrue();
    });

    it('should disable delete buttons when canDelete() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canDelete: false });
      const delBtn = fixture.nativeElement.querySelector('[aria-label="Supprimer Coach Alpha"]');
      expect(delBtn?.disabled).toBeTrue();
    });

    it('canWrite() computed returns true when authService grants coaching_staff:write', async () => {
      const { component } = await setupComponent(mockCoaches, { canWrite: true });
      expect(component.canWrite()).toBeTrue();
    });

    it('canWrite() computed returns false when authService denies coaching_staff:write', async () => {
      const { component } = await setupComponent(mockCoaches, { canWrite: false });
      expect(component.canWrite()).toBeFalse();
    });

    it('canDelete() computed returns false when authService denies coaching_staff:delete', async () => {
      const { component } = await setupComponent(mockCoaches, { canDelete: false });
      expect(component.canDelete()).toBeFalse();
    });
  });

  // ── ARCH-02 : discord & website ───────────────────────────────────────────

  describe('Champs discord et website (ARCH-02)', () => {
    it('should include discord and website in the form group', async () => {
      const { component } = await setupComponent();
      expect(component.form.get('discord')).not.toBeNull();
      expect(component.form.get('website')).not.toBeNull();
    });

    it('should patch discord and website from editingCoach', async () => {
      const { fixture, component } = await setupComponent();
      component.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      expect(component.form.value.discord).toBe('https://discord.gg/alpha');
      expect(component.form.value.website).toBe('https://alpha.gg');
    });

    it('should preserve discord and website values in onSubmit (edit mode)', async () => {
      const { fixture, component, serviceSpy } = await setupComponent();
      component.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      component.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({
          socials: jasmine.objectContaining({
            discord: 'https://discord.gg/alpha',
            website: 'https://alpha.gg',
          }),
        }),
      );
    });

    it('should count discord and website in socialCount', async () => {
      const { component } = await setupComponent();
      component.form.patchValue({
        discord: 'https://discord.gg/test',
        website: 'https://test.com',
      });
      component.refreshSocialCount();
      expect(component.socialCount()).toBeGreaterThanOrEqual(2);
    });
  });

  // ── SEC-CS-003 : Validators.pattern URLs ─────────────────────────────────

  describe('Validation URLs socials (SEC-CS-003)', () => {
    it('should mark form invalid when twitter URL is invalid', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'TestCoach', role: 'Analyste', twitter: 'not-a-url' });
      expect(component.form.valid).toBeFalse();
    });

    it('should mark form valid when twitter URL starts with https://', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        twitter: 'https://twitter.com/test',
      });
      expect(component.form.valid).toBeTrue();
    });

    it('should mark form invalid when discord URL is invalid', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        discord: 'discord.gg/invalid',
      });
      expect(component.form.get('discord')?.hasError('pattern')).toBeTrue();
    });

    it('should mark form invalid when website URL is invalid', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        website: 'ftp://invalid',
      });
      expect(component.form.get('website')?.hasError('pattern')).toBeTrue();
    });
  });

  // ── BETA-UX-01 : mat-error requis ────────────────────────────────────────

  describe('Validation champs requis (BETA-UX-01)', () => {
    it('should have required error on name when empty', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      const nameCtrl = component.form.get('name')!;
      nameCtrl.markAsTouched();
      expect(nameCtrl.hasError('required')).toBeTrue();
    });

    it('should have required error on role when empty', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      const roleCtrl = component.form.get('role')!;
      roleCtrl.markAsTouched();
      expect(roleCtrl.hasError('required')).toBeTrue();
    });
  });

  // ── Mode create ───────────────────────────────────────────────────────────

  describe('Mode create', () => {
    it('should switch to create mode on "Ajouter un coach"', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      expect(component.mode()).toBe('create');
    });

    it('should show form when in create mode', async () => {
      const { fixture, component } = await setupComponent();
      component.startCreate();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.form-section form')).not.toBeNull();
    });

    it('should not call create() when form is invalid', async () => {
      const { component, serviceSpy } = await setupComponent();
      component.startCreate();
      component.onSubmit();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create() with correct data when form is valid', async () => {
      const { component, serviceSpy } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'NewCoach', role: 'Manager' });
      component.onSubmit();
      expect(serviceSpy.create).toHaveBeenCalledWith(
        42,
        jasmine.objectContaining({ name: 'NewCoach', role: 'Manager' }),
      );
    });

    it('should reload coaches after successful create', async () => {
      const { fixture, component, serviceSpy } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'NewCoach', role: 'Analyste' });
      component.onSubmit();
      await fixture.whenStable();
      expect(serviceSpy.list).toHaveBeenCalledTimes(2); // 1 init + 1 refresh
      expect(component.mode()).toBe('list');
    });

    it('reste sur la page et affiche l’erreur quand la création échoue', async () => {
      const { component, serviceSpy } = await setupComponent();
      serviceSpy.create.and.returnValue(throwError(() => new Error('boom')));

      component.startCreate();
      component.form.patchValue({ name: 'NewCoach', role: 'Analyste' });
      component.onSubmit();

      expect(component.error()).toBe('Erreur lors de la création');
      expect(component.saving()).toBeFalse();
      expect(component.mode()).toBe('create');
    });

    it('vide le formulaire à chaque ouverture du mode ajout', async () => {
      // `editingCoach` vaut `undefined` avant comme apres : l'effet de
      // synchronisation ne se rejoue pas, la saisie precedente resterait a
      // l'ecran et la garde de sortie la prendrait pour un brouillon.
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'Abandonne' });
      component.cancelForm();

      component.startCreate();

      expect(component.form.value.name).toBeNull();
      expect(component.form.dirty).toBeFalse();
    });

    it('should cancel form and return to list mode', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.cancelForm();
      expect(component.mode()).toBe('list');
    });
  });

  // ── Mode edit ─────────────────────────────────────────────────────────────

  describe('Mode edit', () => {
    it('should switch to edit mode with coach data', async () => {
      const { component } = await setupComponent();
      component.startEdit(mockCoaches[0]);
      expect(component.mode()).toBe('edit');
      expect(component.editingCoach()).toEqual(mockCoaches[0]);
    });

    it('should populate form with coach data in edit mode', async () => {
      const { fixture, component } = await setupComponent();
      component.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      expect(component.form.value.name).toBe('Coach Alpha');
      expect(component.form.value.role).toBe('Head Coach');
    });

    it('should call update() with correct data', async () => {
      const { fixture, component, serviceSpy } = await setupComponent();
      component.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      component.form.patchValue({ role: 'Manager' });
      component.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({ role: 'Manager' }),
      );
    });
  });

  // ── Suppression ───────────────────────────────────────────────────────────

  describe('Suppression', () => {
    it('supprime un coach après confirmation, puis recharge la liste', async () => {
      const { fixture, component, serviceSpy, confirmSpy } = await setupComponent();
      serviceSpy.list.calls.reset();

      component.confirmDelete(mockCoaches[0]);
      await fixture.whenStable();

      expect(confirmSpy.delete).toHaveBeenCalledWith('ce coach', 'Coach Alpha');
      expect(serviceSpy.delete).toHaveBeenCalledWith(42, 1);
      expect(serviceSpy.list).toHaveBeenCalledTimes(1);
    });

    it('ne supprime rien si la confirmation est refusée', async () => {
      const { component, serviceSpy, confirmSpy } = await setupComponent();
      confirmSpy.delete.and.returnValue(of(false));

      component.confirmDelete(mockCoaches[0]);

      expect(serviceSpy.delete).not.toHaveBeenCalled();
    });

    it('affiche l’erreur quand la suppression échoue', async () => {
      const { component, serviceSpy } = await setupComponent();
      serviceSpy.delete.and.returnValue(throwError(() => new Error('500')));

      component.confirmDelete(mockCoaches[0]);

      expect(component.error()).toBe('Erreur lors de la suppression');
    });
  });

  // ── Reordonnancement, delegue a createReorder() ───────────────────────────

  describe('réordonnancement', () => {
    it('persiste le nouvel ordre avec les positions recalculées', async () => {
      const { component, serviceSpy } = await setupComponent();

      component.onReorder(1, 0);

      expect(serviceSpy.reorder).toHaveBeenCalledWith(42, [
        { id: 2, position: 0 },
        { id: 1, position: 1 },
      ]);
      expect(component.coaches().map((c) => c.name)).toEqual(['Coach Beta', 'Coach Alpha']);
      expect(component.liveMessage()).toContain('Coach Beta');
    });

    it('réordonne aussi depuis un dépôt à la souris', async () => {
      const { serviceSpy, component } = await setupComponent();
      component.onDrop({ previousIndex: 0, currentIndex: 1 });
      expect(serviceSpy.reorder).toHaveBeenCalledWith(42, jasmine.any(Array));
    });

    it('n’appelle pas l’API quand la position ne change pas', async () => {
      const { component, serviceSpy } = await setupComponent();
      component.onDrop({ previousIndex: 1, currentIndex: 1 });
      expect(serviceSpy.reorder).not.toHaveBeenCalled();
    });

    it('bloque un second appel tant que le premier est en vol (SEC-PR206-001)', async () => {
      const { component, serviceSpy } = await setupComponent();
      serviceSpy.reorder.and.returnValue(new Subject<void>().asObservable());

      component.onReorder(0, 1);
      component.onReorder(1, 0);

      expect(serviceSpy.reorder).toHaveBeenCalledTimes(1);
    });

    it('annonce l’échec et recharge la liste depuis le serveur', async () => {
      const { fixture, component, serviceSpy } = await setupComponent();
      serviceSpy.reorder.and.returnValue(throwError(() => new Error('API error')));
      serviceSpy.list.calls.reset();

      component.onReorder(1, 0);
      await fixture.whenStable();

      expect(component.liveMessage()).toContain('Echec');
      expect(component.error()).toBe('Erreur lors de la réorganisation');
      expect(serviceSpy.list).toHaveBeenCalledTimes(1);
    });

    it('désactive Monter sur la première ligne et Descendre sur la dernière', async () => {
      const { fixture } = await setupComponent();
      const up = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
      const down = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
      expect(up[0].disabled).toBeTrue();
      expect(down[down.length - 1].disabled).toBeTrue();
    });

    it('déplace au clavier sans persister avant le dépôt (grab & move ARIA)', async () => {
      // Le gain de `createReorder()` : cet ecran n'avait que Monter / Descendre.
      const { component, serviceSpy } = await setupComponent();

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      expect(component.grabbedIndex()).toBe(0);

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      expect(component.coaches().map((c) => c.name)).toEqual(['Coach Beta', 'Coach Alpha']);
      expect(serviceSpy.reorder).not.toHaveBeenCalled();

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 1);
      expect(component.grabbedIndex()).toBe(-1);
      expect(serviceSpy.reorder).toHaveBeenCalledTimes(1);
    });

    it('restaure l’ordre d’origine sur Échap', async () => {
      const { component, serviceSpy } = await setupComponent();

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), 1);

      expect(component.coaches().map((c) => c.name)).toEqual(['Coach Alpha', 'Coach Beta']);
      expect(serviceSpy.reorder).not.toHaveBeenCalled();
    });

    it('expose la poignée comme élément réordonnable au clavier', async () => {
      const { fixture } = await setupComponent();
      const handle: HTMLElement = fixture.nativeElement.querySelector('.drag-handle');
      expect(handle.getAttribute('aria-roledescription')).toBe('element reordonnable');
    });
  });

  // ── Garde de sortie ───────────────────────────────────────────────────────

  describe('garde de sortie', () => {
    it('ne retient pas une page intacte', async () => {
      const { component } = await setupComponent();
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('retient une saisie non enregistrée', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'Brouillon' });
      component.form.markAsDirty();

      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('ne retient plus rien après un enregistrement réussi', async () => {
      const { fixture, component } = await setupComponent();
      component.startCreate();
      component.form.patchValue({ name: 'NewCoach', role: 'Analyste' });
      component.form.markAsDirty();

      component.onSubmit();
      await fixture.whenStable();

      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('retient un déplacement au clavier encore saisi', async () => {
      // La liste porte un etat volatil que `form.dirty` ne voit pas : le
      // mouvement n'est persiste qu'au depot.
      const { component } = await setupComponent();
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);

      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('ne retient plus le déplacement une fois déposé', async () => {
      const { component } = await setupComponent();
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 1);

      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });

  // ── Image upload ──────────────────────────────────────────────────────────

  describe('Image upload', () => {
    it('should update image field on upload', async () => {
      const { component } = await setupComponent();
      component.onImageUploaded('https://cdn.example.com/coach.png');
      expect(component.form.value.image).toBe('https://cdn.example.com/coach.png');
    });

    it('should clear image field on removal', async () => {
      const { component } = await setupComponent();
      component.form.patchValue({ image: 'https://cdn.example.com/old.png' });
      component.onImageRemoved();
      expect(component.form.value.image).toBe('');
    });
  });

  // ── Réseaux sociaux ───────────────────────────────────────────────────────

  describe('Réseaux sociaux', () => {
    it('should count social links correctly (twitter + instagram)', async () => {
      const { component } = await setupComponent();
      component.form.patchValue({ twitter: 'https://t.co/x', instagram: 'https://ig.com/x' });
      component.refreshSocialCount();
      expect(component.socialCount()).toBe(2);
    });

    it('should count discord and website in social count', async () => {
      const { component } = await setupComponent();
      component.form.patchValue({
        discord: 'https://discord.gg/test',
        website: 'https://site.com',
      });
      component.refreshSocialCount();
      expect(component.socialCount()).toBe(2);
    });
  });

  // ── Parité champs joueurs (US-599) ────────────────────────────────────────

  describe('Parité champs joueurs : nationality, birthDate, customFields (US-599)', () => {
    it('should include nationality, birthDate and customFields in the form group', async () => {
      const { component } = await setupComponent();
      expect(component.form.get('nationality')).not.toBeNull();
      expect(component.form.get('birthDate')).not.toBeNull();
      expect(component.form.get('customFields')).not.toBeNull();
    });

    it('should patch nationality and birthDate from editingCoach', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        nationality: 'Française',
        birthDate: '1995-06-15',
        customFields: { game: 'Valorant', rank: 'Radiant' },
      };
      const { fixture, component } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      component.startEdit(coachWithExtra);
      await fixture.whenStable();
      expect(component.form.value.nationality).toBe('Française');
      expect(component.form.value.birthDate).toBe('1995-06-15');
      expect(component.form.value.customFields).toEqual({ game: 'Valorant', rank: 'Radiant' });
    });

    it('should include customFieldsText signal when editing coach with customFields', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        customFields: { key: 'value' },
      };
      const { fixture, component } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      component.startEdit(coachWithExtra);
      await fixture.whenStable();
      expect(component.customFieldsText()).toContain('"key"');
    });

    it('should include nationality and birthDate in update payload (edit mode)', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        nationality: 'Française',
        birthDate: '1995-06-15',
      };
      const { fixture, component, serviceSpy } = await setupComponent([
        coachWithExtra,
        mockCoaches[1],
      ]);
      component.startEdit(coachWithExtra);
      await fixture.whenStable();
      component.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({ nationality: 'Française', birthDate: '1995-06-15' }),
      );
    });

    it('should include nationality and birthDate in create payload', async () => {
      const { component, serviceSpy } = await setupComponent();
      component.startCreate();
      component.form.patchValue({
        name: 'Coach Gamma',
        role: 'Analyste',
        nationality: 'Belge',
        birthDate: '1998-03-22',
      });
      component.onSubmit();
      expect(serviceSpy.create).toHaveBeenCalledWith(
        42,
        jasmine.objectContaining({ nationality: 'Belge', birthDate: '1998-03-22' }),
      );
    });

    it('should parse valid JSON and update customFields control via onCustomFieldsInput', async () => {
      const { component } = await setupComponent();
      const event = { target: { value: '{"rank":"Radiant"}' } } as unknown as Event;
      component.onCustomFieldsInput(event);
      expect(component.form.value.customFields).toEqual({ rank: 'Radiant' });
      expect(component.customFieldsError()).toBeUndefined();
    });

    it('should set customFieldsError on invalid JSON via onCustomFieldsInput', async () => {
      const { component } = await setupComponent();
      const event = { target: { value: '{invalid json' } } as unknown as Event;
      component.onCustomFieldsInput(event);
      expect(component.customFieldsError()).toBe('JSON invalide');
    });

    it('should clear customFields when empty input via onCustomFieldsInput', async () => {
      const { component } = await setupComponent();
      component.form.patchValue({ customFields: { key: 'val' } });
      const event = { target: { value: '   ' } } as unknown as Event;
      component.onCustomFieldsInput(event);
      expect(component.form.value.customFields).toBeNull();
      expect(component.customFieldsError()).toBeUndefined();
    });

    it('should include customFields in update payload when set', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        customFields: { tier: 'S' },
      };
      const { fixture, component, serviceSpy } = await setupComponent([
        coachWithExtra,
        mockCoaches[1],
      ]);
      component.startEdit(coachWithExtra);
      await fixture.whenStable();
      component.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({ customFields: { tier: 'S' } }),
      );
    });

    it('efface l’erreur de JSON en rouvrant le formulaire d’ajout', async () => {
      const { component } = await setupComponent();
      component.startCreate();
      component.onCustomFieldsInput({ target: { value: '{bad json' } } as unknown as Event);
      expect(component.customFieldsError()).toBe('JSON invalide');

      component.cancelForm();
      component.startCreate();

      expect(component.customFieldsError()).toBeUndefined();
      expect(component.customFieldsText()).toBe('');
    });
  });

  // ── Retour a la liste ─────────────────────────────────────────────────────

  describe('retour à la liste', () => {
    it('revient aux équipes depuis le bouton de retour', async () => {
      const { fixture, router } = await setupComponent();

      const back: HTMLButtonElement = fixture.nativeElement.querySelector('.back-button');
      back.click();

      expect(router.navigate).toHaveBeenCalledWith(['/admin/teams']);
    });
  });
});
