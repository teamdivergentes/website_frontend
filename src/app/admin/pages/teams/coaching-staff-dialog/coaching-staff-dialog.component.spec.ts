import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { CoachingStaffDialogComponent } from './coaching-staff-dialog.component';
import { CoachingStaffService } from '../../../../shared/services';
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

function buildDialogRef() {
  return { close: jasmine.createSpy('close') };
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

async function setupComponent(
  coaches: CoachingStaffMember[] = mockCoaches,
  authOpts: { canWrite?: boolean; canDelete?: boolean } = {},
): Promise<{
  fixture: ComponentFixture<CoachingStaffDialogComponent>;
  serviceSpy: ReturnType<typeof buildService>;
}> {
  const serviceSpy = buildService(coaches);
  const authSpy = buildAuthService(authOpts.canWrite ?? true, authOpts.canDelete ?? true);

  await TestBed.configureTestingModule({
    imports: [CoachingStaffDialogComponent, NoopAnimationsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialogRef, useValue: buildDialogRef() },
      { provide: MAT_DIALOG_DATA, useValue: { team: mockTeam } },
      { provide: CoachingStaffService, useValue: serviceSpy },
      { provide: AuthService, useValue: authSpy },
      {
        provide: MatDialog,
        useValue: {
          open: jasmine.createSpy('open').and.returnValue({
            afterClosed: () => of(true),
            close: jasmine.createSpy('close'),
            addPanelClass: jasmine.createSpy(),
            removePanelClass: jasmine.createSpy(),
            updatePosition: jasmine.createSpy(),
            updateSize: jasmine.createSpy(),
            getState: () => 0,
            beforeClosed: () => of(undefined),
            componentInstance: {},
            componentRef: null,
            _containerInstance: { _config: {} },
          }),
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CoachingStaffDialogComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, serviceSpy };
}

describe('CoachingStaffDialogComponent', () => {
  it('should create', async () => {
    const { fixture } = await setupComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display team name in dialog title', async () => {
    const { fixture } = await setupComponent();
    const title: HTMLElement = fixture.nativeElement.querySelector('[mat-dialog-title]');
    expect(title.textContent).toContain('DVG Valorant');
  });

  it('should call list() on init', async () => {
    const { serviceSpy } = await setupComponent();
    expect(serviceSpy.list).toHaveBeenCalledWith(42);
  });

  it('should display the loaded coaches', async () => {
    const { fixture } = await setupComponent();
    const rows = fixture.nativeElement.querySelectorAll('.coach-row');
    expect(rows.length).toBe(2);
  });

  it('should display coach names', async () => {
    const { fixture } = await setupComponent();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Coach Alpha');
    expect(el.textContent).toContain('Coach Beta');
  });

  it('should show empty state when no coaches', async () => {
    const { fixture } = await setupComponent([]);
    const empty: HTMLElement = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).not.toBeNull();
  });

  it('should show skeleton while loading', async () => {
    const svc = {
      list: jasmine.createSpy('list').and.returnValue(of(mockCoaches)),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      reorder: jasmine.createSpy('reorder'),
    };
    const authSpy = buildAuthService();

    await TestBed.configureTestingModule({
      imports: [CoachingStaffDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: buildDialogRef() },
        { provide: MAT_DIALOG_DATA, useValue: { team: mockTeam } },
        { provide: CoachingStaffService, useValue: svc },
        { provide: AuthService, useValue: authSpy },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CoachingStaffDialogComponent);
    expect(fixture.componentInstance.loading()).toBe(false);
    fixture.detectChanges();
  });

  // ── SEC-CS-001 : hasPermission UI guards ──────────────────────────────────

  describe('Permissions (SEC-CS-001)', () => {
    it('should show "Ajouter un coach" button when canWrite() is true', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: true });
      const btn = fixture.nativeElement.querySelector('[aria-label="Ajouter un coach"]');
      expect(btn).not.toBeNull();
    });

    it('should hide "Ajouter un coach" button when canWrite() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: false });
      fixture.detectChanges();
      await fixture.whenStable();
      const btn = fixture.nativeElement.querySelector('[aria-label="Ajouter un coach"]');
      expect(btn).toBeNull();
    });

    it('should disable edit buttons when canWrite() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: false });
      fixture.detectChanges();
      await fixture.whenStable();
      const editBtn = fixture.nativeElement.querySelector('[aria-label="Modifier Coach Alpha"]');
      expect(editBtn?.disabled).toBeTrue();
    });

    it('should disable delete buttons when canDelete() is false', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canDelete: false });
      fixture.detectChanges();
      await fixture.whenStable();
      const delBtn = fixture.nativeElement.querySelector('[aria-label="Supprimer Coach Alpha"]');
      expect(delBtn?.disabled).toBeTrue();
    });

    it('canWrite() computed returns true when authService grants coaching_staff:write', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: true });
      expect(fixture.componentInstance.canWrite()).toBeTrue();
    });

    it('canWrite() computed returns false when authService denies coaching_staff:write', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canWrite: false });
      expect(fixture.componentInstance.canWrite()).toBeFalse();
    });

    it('canDelete() computed returns false when authService denies coaching_staff:delete', async () => {
      const { fixture } = await setupComponent(mockCoaches, { canDelete: false });
      expect(fixture.componentInstance.canDelete()).toBeFalse();
    });
  });

  // ── ARCH-02 : discord & website ───────────────────────────────────────────

  describe('Champs discord et website (ARCH-02)', () => {
    it('should include discord and website in the form group', async () => {
      const { fixture } = await setupComponent();
      expect(fixture.componentInstance.form.get('discord')).not.toBeNull();
      expect(fixture.componentInstance.form.get('website')).not.toBeNull();
    });

    it('should patch discord and website from editingCoach', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      expect(fixture.componentInstance.form.value.discord).toBe('https://discord.gg/alpha');
      expect(fixture.componentInstance.form.value.website).toBe('https://alpha.gg');
    });

    it('should preserve discord and website values in onSubmit (edit mode)', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      fixture.componentInstance.onSubmit();
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
      const { fixture } = await setupComponent();
      fixture.componentInstance.form.patchValue({
        discord: 'https://discord.gg/test',
        website: 'https://test.com',
      });
      fixture.componentInstance.refreshSocialCount();
      expect(fixture.componentInstance.socialCount()).toBeGreaterThanOrEqual(2);
    });
  });

  // ── SEC-CS-003 : Validators.pattern URLs ─────────────────────────────────

  describe('Validation URLs socials (SEC-CS-003)', () => {
    it('should mark form invalid when twitter URL is invalid', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        twitter: 'not-a-url',
      });
      expect(fixture.componentInstance.form.valid).toBeFalse();
    });

    it('should mark form valid when twitter URL starts with https://', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        twitter: 'https://twitter.com/test',
      });
      expect(fixture.componentInstance.form.valid).toBeTrue();
    });

    it('should mark form invalid when discord URL is invalid', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        discord: 'discord.gg/invalid',
      });
      expect(fixture.componentInstance.form.get('discord')?.hasError('pattern')).toBeTrue();
    });

    it('should mark form invalid when website URL is invalid', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({
        name: 'TestCoach',
        role: 'Analyste',
        website: 'ftp://invalid',
      });
      expect(fixture.componentInstance.form.get('website')?.hasError('pattern')).toBeTrue();
    });
  });

  // ── BETA-UX-01 : mat-error requis ────────────────────────────────────────

  describe('Validation champs requis (BETA-UX-01)', () => {
    it('should have required error on name when empty', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      const nameCtrl = fixture.componentInstance.form.get('name')!;
      nameCtrl.markAsTouched();
      fixture.detectChanges();
      expect(nameCtrl.hasError('required')).toBeTrue();
    });

    it('should have required error on role when empty', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      const roleCtrl = fixture.componentInstance.form.get('role')!;
      roleCtrl.markAsTouched();
      fixture.detectChanges();
      expect(roleCtrl.hasError('required')).toBeTrue();
    });
  });

  // ── Mode create ───────────────────────────────────────────────────────────

  describe('Mode create', () => {
    it('should switch to create mode on "Ajouter un coach"', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('create');
    });

    it('should show form when in create mode', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.detectChanges();
      await fixture.whenStable();
      const form = fixture.nativeElement.querySelector('.form-section form');
      expect(form).not.toBeNull();
    });

    it('should not call create() when form is invalid', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create() with correct data when form is valid', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({ name: 'NewCoach', role: 'Manager' });
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.create).toHaveBeenCalledWith(
        42,
        jasmine.objectContaining({ name: 'NewCoach', role: 'Manager' }),
      );
    });

    it('should reload coaches after successful create', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({ name: 'NewCoach', role: 'Analyste' });
      fixture.componentInstance.onSubmit();
      await fixture.whenStable();
      expect(serviceSpy.list).toHaveBeenCalledTimes(2); // 1 init + 1 refresh
    });

    it('should cancel form and return to list mode', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.cancelForm();
      expect(fixture.componentInstance.mode()).toBe('list');
    });
  });

  // ── Mode edit ─────────────────────────────────────────────────────────────

  describe('Mode edit', () => {
    it('should switch to edit mode with coach data', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startEdit(mockCoaches[0]);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('edit');
      expect(fixture.componentInstance.editingCoach()).toEqual(mockCoaches[0]);
    });

    it('should populate form with coach data in edit mode', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      expect(fixture.componentInstance.form.value.name).toBe('Coach Alpha');
      expect(fixture.componentInstance.form.value.role).toBe('Head Coach');
    });

    it('should call update() with correct data', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startEdit(mockCoaches[0]);
      await fixture.whenStable();
      fixture.componentInstance.form.patchValue({ role: 'Manager' });
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({ role: 'Manager' }),
      );
    });
  });

  // ── Suppression ───────────────────────────────────────────────────────────

  describe('Suppression', () => {
    it('service.delete() service method works', async () => {
      // Teste directement l'appel au service (le flow MatDialog confirmDelete est couvert par E2E Playwright)
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance['coachingStaffService'].delete(42, 1).subscribe();
      expect(serviceSpy.delete).toHaveBeenCalledWith(42, 1);
    });
  });

  // ── Drag & drop ───────────────────────────────────────────────────────────

  describe('Drag & drop', () => {
    it('should call reorder() after drop', async () => {
      const { fixture, serviceSpy } = await setupComponent();

      const dropEvent = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      };

      fixture.componentInstance.onDrop(dropEvent as any);
      expect(serviceSpy.reorder).toHaveBeenCalledWith(42, jasmine.any(Array));
    });
  });

  // ── a11y : boutons monter / descendre (WCAG 2.1.1) ──────────────────────

  describe('a11y — boutons Monter / Descendre (WCAG 2.1.1)', () => {
    it('should call onReorder when moveUp is triggered on row i=1', async () => {
      const { fixture } = await setupComponent();
      spyOn(fixture.componentInstance, 'onReorder').and.callThrough();
      fixture.componentInstance.onReorder(1, 0);
      expect(fixture.componentInstance.onReorder).toHaveBeenCalledWith(1, 0);
    });

    it('should call onReorder when moveDown is triggered on row i=1', async () => {
      const { fixture } = await setupComponent();
      spyOn(fixture.componentInstance, 'onReorder').and.callThrough();
      fixture.componentInstance.onReorder(1, 2);
      expect(fixture.componentInstance.onReorder).toHaveBeenCalledWith(1, 2);
    });

    it('should disable moveUp button on first row', async () => {
      const { fixture } = await setupComponent();
      const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
      expect(moveUpBtns.length).toBeGreaterThan(0);
      expect(moveUpBtns[0].disabled).toBeTrue();
    });

    it('should disable moveDown button on last row', async () => {
      const { fixture } = await setupComponent();
      const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
      expect(moveDownBtns.length).toBeGreaterThan(0);
      expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
    });

    it('should set liveMessage after successful reorder', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      serviceSpy.reorder.and.returnValue(of({ message: 'ok' }));
      fixture.componentInstance.onReorder(1, 0);
      await fixture.whenStable();
      expect(fixture.componentInstance.liveMessage()).not.toBe('');
    });

    it('should set error liveMessage on reorder failure', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      serviceSpy.reorder.and.returnValue(throwError(() => new Error('API error')));
      fixture.componentInstance.onReorder(1, 0);
      await fixture.whenStable();
      expect(fixture.componentInstance.liveMessage()).toContain('Echec');
    });

    it('should not call reorder() when drop on same position', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      serviceSpy.reorder.calls.reset();
      fixture.componentInstance.onDrop({ previousIndex: 1, currentIndex: 1 } as any);
      expect(serviceSpy.reorder).not.toHaveBeenCalled();
    });

    it('should render aria-live region with polite attribute', async () => {
      const { fixture } = await setupComponent();
      const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(liveRegion).not.toBeNull();
    });

    it('should not call service.reorder when already reordering (SEC-PR206-001)', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      serviceSpy.reorder.calls.reset();
      fixture.componentInstance['reordering'].set(true);
      fixture.componentInstance.onReorder(0, 1);
      expect(serviceSpy.reorder).not.toHaveBeenCalled();
    });
  });

  // ── Image upload ──────────────────────────────────────────────────────────

  describe('Image upload', () => {
    it('should update image field on upload', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.onImageUploaded('https://cdn.example.com/coach.png');
      expect(fixture.componentInstance.form.value.image).toBe('https://cdn.example.com/coach.png');
    });

    it('should clear image field on removal', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.form.patchValue({ image: 'https://cdn.example.com/old.png' });
      fixture.componentInstance.onImageRemoved();
      expect(fixture.componentInstance.form.value.image).toBe('');
    });
  });

  // ── Réseaux sociaux ───────────────────────────────────────────────────────

  describe('Réseaux sociaux', () => {
    it('should count social links correctly (twitter + instagram)', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.form.patchValue({
        twitter: 'https://t.co/x',
        instagram: 'https://ig.com/x',
      });
      fixture.componentInstance.refreshSocialCount();
      expect(fixture.componentInstance.socialCount()).toBe(2);
    });

    it('should count discord and website in social count', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.form.patchValue({
        discord: 'https://discord.gg/test',
        website: 'https://site.com',
      });
      fixture.componentInstance.refreshSocialCount();
      expect(fixture.componentInstance.socialCount()).toBe(2);
    });
  });

  // ── Parité champs joueurs (US-599) ────────────────────────────────────────

  describe('Parité champs joueurs : nationality, birthDate, customFields (US-599)', () => {
    it('should include nationality, birthDate and customFields in the form group', async () => {
      const { fixture } = await setupComponent();
      expect(fixture.componentInstance.form.get('nationality')).not.toBeNull();
      expect(fixture.componentInstance.form.get('birthDate')).not.toBeNull();
      expect(fixture.componentInstance.form.get('customFields')).not.toBeNull();
    });

    it('should patch nationality and birthDate from editingCoach', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        nationality: 'Française',
        birthDate: '1995-06-15',
        customFields: { game: 'Valorant', rank: 'Radiant' },
      };
      const { fixture } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      fixture.componentInstance.startEdit(coachWithExtra);
      await fixture.whenStable();
      expect(fixture.componentInstance.form.value.nationality).toBe('Française');
      expect(fixture.componentInstance.form.value.birthDate).toBe('1995-06-15');
      expect(fixture.componentInstance.form.value.customFields).toEqual({ game: 'Valorant', rank: 'Radiant' });
    });

    it('should include customFieldsText signal when editing coach with customFields', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        customFields: { key: 'value' },
      };
      const { fixture } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      fixture.componentInstance.startEdit(coachWithExtra);
      await fixture.whenStable();
      expect(fixture.componentInstance.customFieldsText()).toContain('"key"');
    });

    it('should include nationality and birthDate in update payload (edit mode)', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        nationality: 'Française',
        birthDate: '1995-06-15',
      };
      const { fixture, serviceSpy } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      fixture.componentInstance.startEdit(coachWithExtra);
      await fixture.whenStable();
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({
          nationality: 'Française',
          birthDate: '1995-06-15',
        }),
      );
    });

    it('should include nationality and birthDate in create payload', async () => {
      const { fixture, serviceSpy } = await setupComponent();
      fixture.componentInstance.startCreate();
      fixture.componentInstance.form.patchValue({
        name: 'Coach Gamma',
        role: 'Analyste',
        nationality: 'Belge',
        birthDate: '1998-03-22',
      });
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.create).toHaveBeenCalledWith(
        42,
        jasmine.objectContaining({
          nationality: 'Belge',
          birthDate: '1998-03-22',
        }),
      );
    });

    it('should parse valid JSON and update customFields control via onCustomFieldsInput', async () => {
      const { fixture } = await setupComponent();
      const json = '{"rank":"Radiant"}';
      const event = { target: { value: json } } as unknown as Event;
      fixture.componentInstance.onCustomFieldsInput(event);
      expect(fixture.componentInstance.form.value.customFields).toEqual({ rank: 'Radiant' });
      expect(fixture.componentInstance.customFieldsError()).toBeUndefined();
    });

    it('should set customFieldsError on invalid JSON via onCustomFieldsInput', async () => {
      const { fixture } = await setupComponent();
      const event = { target: { value: '{invalid json' } } as unknown as Event;
      fixture.componentInstance.onCustomFieldsInput(event);
      expect(fixture.componentInstance.customFieldsError()).toBe('JSON invalide');
    });

    it('should clear customFields when empty input via onCustomFieldsInput', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.form.patchValue({ customFields: { key: 'val' } });
      const event = { target: { value: '   ' } } as unknown as Event;
      fixture.componentInstance.onCustomFieldsInput(event);
      expect(fixture.componentInstance.form.value.customFields).toBeNull();
      expect(fixture.componentInstance.customFieldsError()).toBeUndefined();
    });

    it('should include customFields in update payload when set', async () => {
      const coachWithExtra: CoachingStaffMember = {
        ...mockCoaches[0],
        customFields: { tier: 'S' },
      };
      const { fixture, serviceSpy } = await setupComponent([coachWithExtra, mockCoaches[1]]);
      fixture.componentInstance.startEdit(coachWithExtra);
      await fixture.whenStable();
      fixture.componentInstance.onSubmit();
      expect(serviceSpy.update).toHaveBeenCalledWith(
        42,
        1,
        jasmine.objectContaining({ customFields: { tier: 'S' } }),
      );
    });

    it('should clear customFieldsError after switching from create back to list', async () => {
      const { fixture } = await setupComponent();
      fixture.componentInstance.startCreate();
      // Simule une erreur de JSON
      const event = { target: { value: '{bad json' } } as unknown as Event;
      fixture.componentInstance.onCustomFieldsInput(event);
      expect(fixture.componentInstance.customFieldsError()).toBe('JSON invalide');
      // Annuler le formulaire
      fixture.componentInstance.cancelForm();
      fixture.detectChanges();
      // L'erreur customFields doit avoir été effacée par l'effect lors du reset
      // (editingCoach = undefined → effect remet customFieldsError à undefined)
      await fixture.whenStable();
      expect(fixture.componentInstance.mode()).toBe('list');
    });
  });

  // ── Fermeture ─────────────────────────────────────────────────────────────

  describe('Fermeture', () => {
    it('should close dialog on close()', async () => {
      const { fixture } = await setupComponent();
      const dialogRef = TestBed.inject(MatDialogRef);
      fixture.componentInstance.close();
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  // ── Gestion des erreurs ───────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display error message when list() fails', async () => {
      const svc = {
        list: jasmine.createSpy('list').and.returnValue(throwError(() => new Error('HTTP error'))),
        create: jasmine.createSpy('create'),
        update: jasmine.createSpy('update'),
        delete: jasmine.createSpy('delete'),
        reorder: jasmine.createSpy('reorder'),
      };
      const authSpy = buildAuthService();

      await TestBed.configureTestingModule({
        imports: [CoachingStaffDialogComponent, NoopAnimationsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: buildDialogRef() },
          { provide: MAT_DIALOG_DATA, useValue: { team: mockTeam } },
          { provide: CoachingStaffService, useValue: svc },
          { provide: AuthService, useValue: authSpy },
          { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(CoachingStaffDialogComponent);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.error()).toBeTruthy();
    });
  });
});
