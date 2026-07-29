import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { MatchDialogComponent, scoresPairedValidator } from './match-dialog.component';
import { MatchesService } from '../../../shared/services/matches.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { MatchAdmin } from '../../../shared/models/match.model';
import { Team } from '../../../shared/models';
import { FormBuilder, FormGroup } from '@angular/forms';

const futureDate = new Date(Date.now() + 86400000).toISOString();

const matchEdit: MatchAdmin = {
  id: 10,
  teamId: 1,
  teamName: 'DVG LoL',
  teamSlug: 'dvg-lol',
  teamGame: 'League of Legends',
  opponentName: 'Team Omega',
  opponentLogo: null,
  scheduledAt: futureDate,
  competition: 'LFL',
  streamUrl: null,
  scoreDvg: null,
  scoreOpponent: null,
  articleId: null,
  articleSlug: null,
  active: true,
};

const mockTeams: Team[] = [
  { id: 1, name: 'DVG LoL', slug: 'dvg-lol', active: true, position: 1, game: 'League of Legends' },
];

/* ===== Tests unitaires du validator ===== */
describe('scoresPairedValidator', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('valide si les deux scores sont null', () => {
    const group: FormGroup = fb.group(
      { scoreDvg: [null], scoreOpponent: [null] },
      { validators: scoresPairedValidator() },
    );
    expect(group.errors).toBeNull();
  });

  it('valide si les deux scores sont renseignés', () => {
    const group: FormGroup = fb.group(
      { scoreDvg: [2], scoreOpponent: [1] },
      { validators: scoresPairedValidator() },
    );
    expect(group.errors).toBeNull();
  });

  it('invalide si seulement scoreDvg est renseigné', () => {
    const group: FormGroup = fb.group(
      { scoreDvg: [2], scoreOpponent: [null] },
      { validators: scoresPairedValidator() },
    );
    expect(group.errors?.['scoresPaired']).toBeTrue();
  });

  it('invalide si seulement scoreOpponent est renseigné', () => {
    const group: FormGroup = fb.group(
      { scoreDvg: [null], scoreOpponent: [3] },
      { validators: scoresPairedValidator() },
    );
    expect(group.errors?.['scoresPaired']).toBeTrue();
  });
});

/* ===== Tests du composant ===== */
describe('MatchDialogComponent', () => {
  let component: MatchDialogComponent;
  let fixture: ComponentFixture<MatchDialogComponent>;
  let matchesServiceSpy: jasmine.SpyObj<MatchesService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MatchDialogComponent>>;

  function setupComponent(match?: MatchAdmin): void {
    const teamsSignal = signal<Team[]>(mockTeams);
    const teamsSpy = jasmine.createSpyObj(
      'TeamsService',
      ['loadTeams'],
      { allTeams: teamsSignal.asReadonly() },
    );
    teamsSpy.loadTeams.and.returnValue(of(mockTeams));
    matchesServiceSpy = jasmine.createSpyObj('MatchesService', ['createMatch', 'updateMatch']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [MatchDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatchesService, useValue: matchesServiceSpy },
        { provide: TeamsService, useValue: teamsSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { match } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /* ─── Mode création ───────────────────────────────────────────────────── */
  describe('Mode création', () => {
    beforeEach(() => setupComponent(undefined));

    it('doit créer le composant en mode création', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBeFalse();
    });

    it('onLogoRemoved positionne opponentLogo à null (jamais chaîne vide)', () => {
      component.form.patchValue({ opponentLogo: '/uploads/logo.png' });
      component.onLogoRemoved();
      expect(component.form.get('opponentLogo')!.value).toBeNull();
    });

    it('formulaire invalide si teamId absent', () => {
      component.form.patchValue({ teamId: null, opponentName: 'Toto', scheduledAt: '2025-12-01T14:00' });
      expect(component.form.invalid).toBeTrue();
    });

    it('formulaire invalide si opponentName absent', () => {
      component.form.patchValue({ teamId: 1, opponentName: '', scheduledAt: '2025-12-01T14:00' });
      expect(component.form.invalid).toBeTrue();
    });

    it('formulaire invalide si un seul score renseigné (validator scoresPaired)', () => {
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Toto',
        scheduledAt: '2025-12-01T14:00',
        scoreDvg: 2,
        scoreOpponent: null,
      });
      expect(component.form.hasError('scoresPaired')).toBeTrue();
    });

    it('formulaire valide avec deux scores renseignés', () => {
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Toto',
        scheduledAt: '2025-12-01T14:00',
        scoreDvg: 2,
        scoreOpponent: 0,
        competition: null,
        streamUrl: null,
        articleId: null,
        opponentLogo: null,
        active: true,
      });
      expect(component.form.valid).toBeTrue();
    });

    it('save appelle createMatch et ferme le dialog', () => {
      matchesServiceSpy.createMatch.and.returnValue(of(matchEdit));
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Toto',
        scheduledAt: '2025-12-01T14:00',
        scoreDvg: null,
        scoreOpponent: null,
        competition: null,
        streamUrl: null,
        articleId: null,
        opponentLogo: null,
        active: true,
      });

      component.save();

      expect(matchesServiceSpy.createMatch).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(matchEdit);
    });

    it('opponentLogo null si le champ est vide (jamais de chaîne vide)', () => {
      matchesServiceSpy.createMatch.and.returnValue(of(matchEdit));
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Toto',
        scheduledAt: '2025-12-01T14:00',
        scoreDvg: null,
        scoreOpponent: null,
        competition: null,
        streamUrl: null,
        articleId: null,
        opponentLogo: '',
        active: true,
      });

      component.save();

      const dto = matchesServiceSpy.createMatch.calls.mostRecent().args[0];
      expect(dto.opponentLogo).toBeNull();
    });

    it('affiche erreur API sur échec de création', () => {
      matchesServiceSpy.createMatch.and.returnValue(
        throwError(() => ({ error: { message: 'Erreur serveur' } })),
      );
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Toto',
        scheduledAt: '2025-12-01T14:00',
        scoreDvg: null,
        scoreOpponent: null,
        competition: null,
        streamUrl: null,
        articleId: null,
        opponentLogo: null,
        active: true,
      });

      component.save();

      expect(component.error()).toBe('Erreur serveur');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('cancel ferme le dialog avec null', () => {
      component.cancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  /* ─── Mode édition ────────────────────────────────────────────────────── */
  describe('Mode édition', () => {
    beforeEach(() => setupComponent(matchEdit));

    it('doit créer le composant en mode édition', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBeTrue();
    });

    it('initialise scheduledAt depuis la date du match', () => {
      expect(component.form.get('scheduledAt')!.value).toBe(futureDate.slice(0, 16));
    });

    it('save appelle updateMatch avec id du match', () => {
      matchesServiceSpy.updateMatch.and.returnValue(of(matchEdit));
      component.form.patchValue({
        teamId: 1,
        opponentName: 'Updated',
        scheduledAt: futureDate.slice(0, 16),
        scoreDvg: null,
        scoreOpponent: null,
        competition: 'LFL',
        streamUrl: null,
        articleId: null,
        opponentLogo: null,
        active: true,
      });

      component.save();

      expect(matchesServiceSpy.updateMatch).toHaveBeenCalledWith(matchEdit.id, jasmine.any(Object));
      expect(dialogRefSpy.close).toHaveBeenCalledWith(matchEdit);
    });
  });
});
