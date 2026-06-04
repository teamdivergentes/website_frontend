import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ScoreDialogComponent } from './score-dialog.component';
import { MatchesService } from '../../../shared/services/matches.service';
import { MatchAdmin } from '../../../shared/models/match.model';

const pastDate = new Date(Date.now() - 86400000).toISOString();

const matchPast: MatchAdmin = {
  id: 5,
  teamId: 1,
  teamName: 'DVG LoL',
  teamSlug: 'dvg-lol',
  teamGame: 'League of Legends',
  opponentName: 'Team Delta',
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

describe('ScoreDialogComponent', () => {
  let fixture: ComponentFixture<ScoreDialogComponent>;
  let component: ScoreDialogComponent;
  let matchesService: jasmine.SpyObj<MatchesService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ScoreDialogComponent>>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('MatchesService', ['updateMatch']);
    const refSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ScoreDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: MatchesService, useValue: serviceSpy },
        { provide: MatDialogRef, useValue: refSpy },
        { provide: MAT_DIALOG_DATA, useValue: { match: matchPast } },
      ],
    }).compileComponents();

    matchesService = TestBed.inject(MatchesService) as jasmine.SpyObj<MatchesService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ScoreDialogComponent>>;

    fixture = TestBed.createComponent(ScoreDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formulaire invalide si aucun score renseigné', () => {
    component.form.setValue({ scoreDvg: null, scoreOpponent: null });
    expect(component.form.invalid).toBeTrue();
  });

  it('formulaire valide avec 2 scores entiers', () => {
    component.form.setValue({ scoreDvg: 2, scoreOpponent: 1 });
    expect(component.form.valid).toBeTrue();
  });

  it('save appelle updateMatch avec les 2 scores et ferme le dialog', () => {
    const updated = { ...matchPast, scoreDvg: 3, scoreOpponent: 0 };
    matchesService.updateMatch.and.returnValue(of(updated as MatchAdmin));
    component.form.setValue({ scoreDvg: 3, scoreOpponent: 0 });

    component.save();

    expect(matchesService.updateMatch).toHaveBeenCalledWith(matchPast.id, {
      scoreDvg: 3,
      scoreOpponent: 0,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(updated);
  });

  it('save → erreur API → affiche error banner et ne ferme pas', () => {
    matchesService.updateMatch.and.returnValue(throwError(() => ({ error: { message: 'Erreur serveur' } })));
    component.form.setValue({ scoreDvg: 1, scoreOpponent: 1 });

    component.save();

    expect(component.error()).toBe('Erreur serveur');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('cancel ferme le dialog avec null', () => {
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
