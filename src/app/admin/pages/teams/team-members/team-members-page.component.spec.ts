import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { TeamMembersPageComponent } from './team-members-page.component';
import { TeamMemberFormComponent } from './components/team-member-form/team-member-form.component';
import { TeamsService } from '../../../../shared/services';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { AdminNotifier } from '../../../shared/admin-notifier.service';
import type { Team, TeamMember, TeamWithMembers } from '../../../../shared/models';

const TEAM: Team = {
  id: 3,
  name: 'DVG Valorant',
  slug: 'dvg-valorant',
  game: 'Valorant',
  active: true,
  position: 0,
};

const OTHER_TEAM: Team = { ...TEAM, id: 4, name: 'DVG LoL', slug: 'dvg-lol' };

const makeMember = (id: number, name: string, position: number): TeamMember => ({
  id,
  name,
  role: 'Duelliste',
  position,
  joinedAt: '2024-01-01T00:00:00Z',
});

const MEMBERS: TeamMember[] = [
  makeMember(10, 'Alpha', 0),
  makeMember(11, 'Beta', 1),
  makeMember(12, 'Gamma', 2),
];

const detail = (members: TeamMember[]): TeamWithMembers => ({ ...TEAM, members });

describe('TeamMembersPageComponent', () => {
  let fixture: ComponentFixture<TeamMembersPageComponent>;
  let component: TeamMembersPageComponent;
  let service: jasmine.SpyObj<TeamsService>;
  let confirm: jasmine.SpyObj<AdminConfirmService>;
  let notifier: jasmine.SpyObj<AdminNotifier>;
  let router: jasmine.SpyObj<Router>;

  /** Monte la page sur l'identifiant d'equipe passe dans l'URL. */
  async function setup(id: string): Promise<void> {
    service = jasmine.createSpyObj('TeamsService', [
      'loadTeams',
      'getTeamBySlug',
      'addMember',
      'updateMember',
      'deleteMember',
      'reorderMembers',
    ]);
    service.loadTeams.and.returnValue(of([TEAM, OTHER_TEAM]));
    service.getTeamBySlug.and.returnValue(of(detail(MEMBERS)));
    service.addMember.and.returnValue(of(makeMember(13, 'Delta', 3)));
    service.updateMember.and.returnValue(of(MEMBERS[0]));
    service.deleteMember.and.returnValue(of(undefined));
    service.reorderMembers.and.returnValue(of(undefined));

    confirm = jasmine.createSpyObj('AdminConfirmService', ['delete', 'discardChanges']);
    confirm.delete.and.returnValue(of(true));

    notifier = jasmine.createSpyObj('AdminNotifier', ['saved', 'deleted', 'error']);

    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TeamMembersPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TeamsService, useValue: service },
        { provide: AdminConfirmService, useValue: confirm },
        { provide: AdminNotifier, useValue: notifier },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamMembersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  describe('au chargement', () => {
    beforeEach(async () => setup('3'));

    it('résout l’équipe de l’URL et charge ses membres triés', () => {
      expect(service.getTeamBySlug).toHaveBeenCalledWith('dvg-valorant');
      expect(component.members().map(m => m.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
      expect(component.loading()).toBeFalse();
    });

    it('affiche le nom de l’équipe, seul repère quand on arrive par une URL partagée', () => {
      expect(component.title()).toBe('Membres de DVG Valorant');
      const heading: HTMLElement = fixture.nativeElement.querySelector('h1');
      expect(heading.textContent).toContain('DVG Valorant');
    });

    it('rend une région aria-live pour les annonces de réordonnancement', () => {
      expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).not.toBeNull();
    });
  });

  // ── Identifiant inconnu ───────────────────────────────────────────────────

  describe('quand l’identifiant d’équipe est inconnu', () => {
    beforeEach(async () => setup('999'));

    it('affiche une erreur plutôt qu’une équipe vide', () => {
      // Sans cela, une URL fausse et une equipe sans joueur se ressemblent.
      expect(component.loadError()).toBeDefined();
      expect(service.getTeamBySlug).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('app-team-member-form')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="error-retry"]')).not.toBeNull();
    });

    it('réessaie le chargement à la demande', async () => {
      service.loadTeams.and.returnValue(of([{ ...TEAM, id: 999 }, OTHER_TEAM]));

      component.loadTeam();
      await fixture.whenStable();

      expect(component.loadError()).toBeUndefined();
      expect(service.getTeamBySlug).toHaveBeenCalled();
    });

    it('signale aussi un échec réseau sur la liste des équipes', async () => {
      service.loadTeams.and.returnValue(throwError(() => new Error('offline')));

      component.loadTeam();

      expect(component.loadError()).toBe('Impossible de charger cette équipe.');
      expect(component.loading()).toBeFalse();
    });
  });

  // ── Ajout / edition / suppression ─────────────────────────────────────────

  describe('mutations', () => {
    beforeEach(async () => setup('3'));

    it('ajoute un membre et recharge la liste', () => {
      service.getTeamBySlug.calls.reset();

      component.onMemberSaved({
        data: { name: 'Delta', role: 'Sentinelle' },
      });

      expect(service.addMember).toHaveBeenCalledWith(3, { name: 'Delta', role: 'Sentinelle' });
      expect(notifier.saved).toHaveBeenCalledWith('Membre', 'create', 'm');
      expect(service.getTeamBySlug).toHaveBeenCalledTimes(1);
    });

    it('met à jour un membre existant', () => {
      component.onMemberSaved({
        data: { name: 'Alpha+', role: 'Duelliste' },
        editingMember: MEMBERS[0],
      });

      expect(service.updateMember).toHaveBeenCalledWith(3, 10, {
        name: 'Alpha+',
        role: 'Duelliste',
      });
      expect(notifier.saved).toHaveBeenCalledWith('Membre', 'edit', 'm');
      expect(component.editingMember()).toBeUndefined();
    });

    it('reste sur la page et affiche l’erreur quand l’enregistrement échoue', () => {
      service.addMember.and.returnValue(throwError(() => new Error('boom')));

      component.onMemberSaved({ data: { name: 'Delta', role: 'Sentinelle' } });

      expect(component.error()).toBe("Erreur lors de l'enregistrement");
      expect(component.saving()).toBeFalse();
    });

    it('supprime un membre après confirmation', () => {
      component.confirmDelete(MEMBERS[1]);

      expect(confirm.delete).toHaveBeenCalledWith('ce membre', 'Beta');
      expect(service.deleteMember).toHaveBeenCalledWith(3, 11);
      expect(notifier.deleted).toHaveBeenCalledWith('Membre', 'm');
    });

    it('ne supprime rien si la confirmation est refusée', () => {
      confirm.delete.and.returnValue(of(false));

      component.confirmDelete(MEMBERS[1]);

      expect(service.deleteMember).not.toHaveBeenCalled();
    });
  });

  // ── Reordonnancement, delegue a createReorder() ───────────────────────────

  describe('réordonnancement', () => {
    beforeEach(async () => setup('3'));

    it('persiste le nouvel ordre avec les positions recalculées', () => {
      component.onReorder(2, 0);

      expect(service.reorderMembers).toHaveBeenCalledWith(3, [
        { id: 12, position: 0 },
        { id: 10, position: 1 },
        { id: 11, position: 2 },
      ]);
      expect(component.members().map(m => m.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
      expect(component.liveMessage()).toContain('Gamma');
    });

    it('n’appelle pas l’API quand la position ne change pas', () => {
      component.onDrop({ previousIndex: 1, currentIndex: 1 });

      expect(service.reorderMembers).not.toHaveBeenCalled();
    });

    it('bloque un second appel tant que le premier est en vol (SEC-PR206-001)', () => {
      // La garde manquait a cet ecran : un double-clic y declenchait deux
      // appels concurrents sur la meme collection.
      service.reorderMembers.and.returnValue(new Subject<void>().asObservable());

      component.onReorder(0, 1);
      component.onReorder(1, 2);

      expect(service.reorderMembers).toHaveBeenCalledTimes(1);
    });

    it('annonce l’échec et recharge la liste depuis le serveur', () => {
      service.reorderMembers.and.returnValue(throwError(() => new Error('500')));
      service.getTeamBySlug.calls.reset();

      component.onReorder(0, 1);

      expect(component.liveMessage()).toContain('Echec');
      expect(component.error()).toBe('Erreur lors de la réorganisation');
      expect(service.getTeamBySlug).toHaveBeenCalledTimes(1);
    });

    it('déplace au clavier sans persister avant le dépôt (grab & move ARIA)', () => {
      const grab = new KeyboardEvent('keydown', { key: ' ' });
      component.onHandleKeydown(grab, 0);
      expect(component.grabbedIndex()).toBe(0);

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      expect(component.members().map(m => m.name)).toEqual(['Beta', 'Alpha', 'Gamma']);
      expect(service.reorderMembers).not.toHaveBeenCalled();

      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 1);
      expect(component.grabbedIndex()).toBe(-1);
      expect(service.reorderMembers).toHaveBeenCalledTimes(1);
    });

    it('restaure l’ordre d’origine sur Échap', () => {
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }), 1);

      expect(component.members().map(m => m.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
      expect(service.reorderMembers).not.toHaveBeenCalled();
    });
  });

  // ── Garde de sortie ───────────────────────────────────────────────────────

  describe('garde de sortie', () => {
    beforeEach(async () => setup('3'));

    it('ne retient pas une page intacte', () => {
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('retient une saisie non enregistrée du formulaire enfant', () => {
      const form = fixture.debugElement.query(By.directive(TeamMemberFormComponent))
        .componentInstance as TeamMemberFormComponent;
      form.form.patchValue({ name: 'Brouillon' });
      form.form.markAsDirty();

      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('ne retient plus rien après un enregistrement réussi', () => {
      const form = fixture.debugElement.query(By.directive(TeamMemberFormComponent))
        .componentInstance as TeamMemberFormComponent;
      form.form.patchValue({ name: 'Delta', role: 'Sentinelle' });
      form.form.markAsDirty();

      component.onMemberSaved({ data: { name: 'Delta', role: 'Sentinelle' } });

      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('retient un déplacement au clavier encore saisi', () => {
      // Specifique a cet ecran : la liste enfant porte un etat volatil que
      // `form.dirty` ne voit pas. Le mouvement n'est persiste qu'au depot.
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);

      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('ne retient plus le déplacement une fois déposé', () => {
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 0);
      component.onHandleKeydown(new KeyboardEvent('keydown', { key: ' ' }), 1);

      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });

  // ── Retour a la liste ─────────────────────────────────────────────────────

  it('revient à la liste des équipes depuis le bouton de retour', async () => {
    await setup('3');

    const back: HTMLButtonElement = fixture.nativeElement.querySelector('.back-button');
    back.click();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/teams']);
  });
});
