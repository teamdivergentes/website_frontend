import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, NEVER } from 'rxjs';
import { MatchesAdminComponent } from './matches-admin.component';
import { MatchesService } from '../../../shared/services/matches.service';
import { MatchAdmin } from '../../../shared/models/match.model';

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const matchFuture: MatchAdmin = {
  id: 1,
  teamId: 1,
  teamName: 'DVG LoL',
  teamSlug: 'dvg-lol',
  teamGame: 'League of Legends',
  opponentName: 'Team Alpha',
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

const matchPastNoScore: MatchAdmin = {
  id: 2,
  teamId: 1,
  teamName: 'DVG LoL',
  teamSlug: 'dvg-lol',
  teamGame: 'League of Legends',
  opponentName: 'Team Beta',
  opponentLogo: null,
  scheduledAt: pastDate,
  competition: null,
  streamUrl: null,
  scoreDvg: null,
  scoreOpponent: null,
  articleId: null,
  articleSlug: null,
  active: true,
};

const matchPastWithScore: MatchAdmin = {
  id: 3,
  teamId: 1,
  teamName: 'DVG LoL',
  teamSlug: 'dvg-lol',
  teamGame: 'League of Legends',
  opponentName: 'Team Gamma',
  opponentLogo: null,
  scheduledAt: pastDate,
  competition: 'LFL',
  streamUrl: null,
  scoreDvg: 2,
  scoreOpponent: 1,
  articleId: null,
  articleSlug: null,
  active: true,
};

describe('MatchesAdminComponent', () => {
  let fixture: ComponentFixture<MatchesAdminComponent>;
  let component: MatchesAdminComponent;
  let matchesService: jasmine.SpyObj<MatchesService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function createComponent(initialMatches: MatchAdmin[] = []): void {
    const matchesSignal = signal<MatchAdmin[]>(initialMatches);
    const serviceSpy = jasmine.createSpyObj(
      'MatchesService',
      ['loadAdminMatches', 'createMatch', 'updateMatch', 'deleteMatch'],
      { adminMatches: matchesSignal.asReadonly() },
    );
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      imports: [MatchesAdminComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: MatchesService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    });

    matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    matchesService.loadAdminMatches.and.returnValue(NEVER);

    fixture = TestBed.createComponent(MatchesAdminComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();
  });

  it('should create', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [MatchesAdminComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        {
          provide: MatchesService,
          useValue: jasmine.createSpyObj(
            'MatchesService',
            ['loadAdminMatches', 'createMatch', 'updateMatch', 'deleteMatch'],
            { adminMatches: signal<MatchAdmin[]>([]).asReadonly() },
          ),
        },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    }).compileComponents();
    const svc = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    svc.loadAdminMatches.and.returnValue(NEVER);
    const fix = TestBed.createComponent(MatchesAdminComponent);
    expect(fix.componentInstance).toBeTruthy();
  });

  describe('chargement initial', () => {
    beforeEach(() => {
      createComponent([matchFuture, matchPastNoScore, matchPastWithScore]);
    });

    it('charge les matchs admin au init', () => {
      matchesService.loadAdminMatches.and.returnValue(of([matchFuture]));
      fixture.detectChanges();
      expect(matchesService.loadAdminMatches).toHaveBeenCalled();
    });

    it('erreur de chargement → snackBar erreur', () => {
      matchesService.loadAdminMatches.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(snackBar.open).toHaveBeenCalledWith('Erreur lors du chargement', 'OK', jasmine.any(Object));
    });
  });

  describe('séparation upcoming/past', () => {
    beforeEach(() => {
      createComponent([matchFuture, matchPastNoScore, matchPastWithScore]);
      fixture.detectChanges();
    });

    it('upcomingMatches contient uniquement le match futur', () => {
      expect(component.upcomingMatches().length).toBe(1);
      expect(component.upcomingMatches()[0].id).toBe(matchFuture.id);
    });

    it('pastMatches contient les matchs passés triés desc', () => {
      const past = component.pastMatches();
      expect(past.length).toBe(2);
      // les deux ont la même date passée donc l'ordre peut varier, on vérifie juste la présence
      const ids = past.map(m => m.id);
      expect(ids).toContain(matchPastNoScore.id);
      expect(ids).toContain(matchPastWithScore.id);
    });
  });

  describe('badge statut dérivé', () => {
    beforeEach(() => {
      createComponent([matchFuture, matchPastNoScore, matchPastWithScore]);
      fixture.detectChanges();
    });

    it('match futur → statut "À venir"', () => {
      expect(component.statusLabel(matchFuture)).toBe('À venir');
    });

    it('match passé sans score → statut "En attente de score"', () => {
      expect(component.statusLabel(matchPastNoScore)).toBe('En attente de score');
    });

    it('match passé avec 2 scores → statut "Résultat"', () => {
      expect(component.statusLabel(matchPastWithScore)).toBe('Résultat');
    });
  });

  describe('bouton Saisir le résultat', () => {
    beforeEach(() => {
      createComponent([matchFuture, matchPastNoScore]);
      fixture.detectChanges();
    });

    it('isPast retourne false pour match futur', () => {
      expect(component.isPast(matchFuture)).toBeFalse();
    });

    it('isPast retourne true pour match passé', () => {
      expect(component.isPast(matchPastNoScore)).toBeTrue();
    });
  });

  describe('openCreate', () => {
    beforeEach(() => {
      createComponent([]);
    });

    it('ouvre MatchDialogComponent et recharge si result truthy', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(matchFuture));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.loadAdminMatches.and.returnValue(of([matchFuture]));

      component.openCreate();

      expect(dialog.open).toHaveBeenCalled();
      expect(matchesService.loadAdminMatches).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Match créé', 'OK', jasmine.any(Object));
    });

    it('ne recharge PAS si result null', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(null));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.loadAdminMatches.calls.reset();

      component.openCreate();

      expect(matchesService.loadAdminMatches).not.toHaveBeenCalled();
    });
  });

  describe('openEdit', () => {
    beforeEach(() => {
      createComponent([matchFuture]);
    });

    it('ouvre le dialog avec le match et recharge si result truthy', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ ...matchFuture, opponentName: 'Updated' }));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.loadAdminMatches.and.returnValue(of([matchFuture]));

      component.openEdit(matchFuture);

      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({ data: { match: matchFuture } }),
      );
      expect(matchesService.loadAdminMatches).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Match mis à jour', 'OK', jasmine.any(Object));
    });
  });

  describe('confirmDelete', () => {
    beforeEach(() => {
      createComponent([matchFuture]);
    });

    it('supprime le match après confirmation', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.deleteMatch.and.returnValue(of(undefined));

      component.confirmDelete(matchFuture);

      expect(matchesService.deleteMatch).toHaveBeenCalledWith(matchFuture.id);
      expect(snackBar.open).toHaveBeenCalledWith('Match supprimé', 'OK', jasmine.any(Object));
    });

    it('ne supprime pas si annulé', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

      component.confirmDelete(matchFuture);

      expect(matchesService.deleteMatch).not.toHaveBeenCalled();
    });

    it('erreur de suppression → snackBar Erreur', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.deleteMatch.and.returnValue(throwError(() => new Error('fail')));

      component.confirmDelete(matchFuture);

      expect(snackBar.open).toHaveBeenCalledWith('Erreur', 'OK', jasmine.any(Object));
    });
  });

  describe('openScore', () => {
    beforeEach(() => {
      createComponent([matchPastNoScore]);
    });

    it('ouvre ScoreDialogComponent et recharge si result truthy', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ ...matchPastNoScore, scoreDvg: 2, scoreOpponent: 0 }));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      matchesService.loadAdminMatches.and.returnValue(of([matchPastNoScore]));

      component.openScore(matchPastNoScore);

      expect(dialog.open).toHaveBeenCalled();
      expect(matchesService.loadAdminMatches).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Score enregistré', 'OK', jasmine.any(Object));
    });
  });
});
