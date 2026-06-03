import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TrophyDialogComponent } from './trophy-dialog.component';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { TeamsService } from '../../../shared/services/teams.service';
import { Trophy } from '../../../shared/models/trophy.model';
import { Team } from '../../../shared/models';

const mockTrophy: Trophy = {
  id: 7,
  competition: 'Coupe de France LoL',
  placement: 1,
  description: 'Belle victoire',
  date: '2025-06-15T00:00:00.000Z',
  image: '/uploads/trophy.jpg',
  featured: true,
  teamId: 2,
  teamName: 'Équipe LoL',
  teamSlug: 'equipe-lol',
  active: true,
};

describe('TrophyDialogComponent', () => {
  let component: TrophyDialogComponent;
  let fixture: ComponentFixture<TrophyDialogComponent>;
  let trophiesServiceSpy: jasmine.SpyObj<TrophiesService>;
  let teamsServiceSpy: jasmine.SpyObj<TeamsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TrophyDialogComponent>>;

  function setupComponent(trophy?: Trophy): void {
    const teamsSignal = signal<Team[]>([]);
    trophiesServiceSpy = jasmine.createSpyObj('TrophiesService', [
      'createTrophy', 'updateTrophy',
    ]);
    teamsServiceSpy = jasmine.createSpyObj(
      'TeamsService',
      ['loadTeams'],
      { allTeams: teamsSignal.asReadonly() },
    );
    teamsServiceSpy.loadTeams.and.returnValue(of([]));
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [TrophyDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TrophiesService, useValue: trophiesServiceSpy },
        { provide: TeamsService, useValue: teamsServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { trophy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrophyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ─── Mode création ────────────────────────────────────────────────────────

  describe('Mode création', () => {
    beforeEach(() => setupComponent(undefined));

    it('doit créer le composant en mode création', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBeFalse();
    });

    it('invalide si compétition vide', () => {
      component.form.get('competition')!.setValue('');
      component.form.get('competition')!.markAsTouched();
      expect(component.form.get('competition')!.hasError('required')).toBeTrue();
    });

    it('appelle createTrophy avec image null quand le champ image est vide', () => {
      trophiesServiceSpy.createTrophy.and.returnValue(of({ ...mockTrophy, id: 99 }));
      component.form.patchValue({
        competition: 'LFL 2025',
        placement: 2,
        date: '2025-08-01',
        image: '',
        description: '',
        teamId: null,
        teamLabel: '',
        featured: false,
        active: true,
      });
      component.save();
      expect(trophiesServiceSpy.createTrophy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ image: null }),
      );
    });
  });

  // ─── Mode édition ─────────────────────────────────────────────────────────

  describe('Mode édition', () => {
    beforeEach(() => setupComponent(mockTrophy));

    it('doit créer le composant en mode édition', () => {
      expect(component).toBeTruthy();
      expect(component.isEdit()).toBeTrue();
    });

    it('initialise le formulaire avec les valeurs du trophée', () => {
      expect(component.form.get('competition')!.value).toBe('Coupe de France LoL');
      expect(component.form.get('placement')!.value).toBe(1);
    });

    it('envoie image: null dans le DTO quand le champ image est vidé en édition', () => {
      trophiesServiceSpy.updateTrophy.and.returnValue(of({ ...mockTrophy, image: null }));
      // Simuler que l'utilisateur retire l'image
      component.form.patchValue({ image: '' });
      component.save();
      const dto = trophiesServiceSpy.updateTrophy.calls.mostRecent().args[1];
      expect(dto.image).toBeNull();
    });

    it('envoie description: null dans le DTO quand la description est vidée', () => {
      trophiesServiceSpy.updateTrophy.and.returnValue(of({ ...mockTrophy, description: null }));
      component.form.patchValue({ description: '' });
      component.save();
      const dto = trophiesServiceSpy.updateTrophy.calls.mostRecent().args[1];
      expect(dto.description).toBeNull();
    });

    it('envoie teamId null dans le DTO quand aucune equipe est selectionnee', () => {
      trophiesServiceSpy.updateTrophy.and.returnValue(of({ ...mockTrophy, teamId: null }));
      component.form.patchValue({ teamId: null });
      component.save();
      const dto = trophiesServiceSpy.updateTrophy.calls.mostRecent().args[1];
      expect(dto.teamId).toBeNull();
    });

    it('envoie teamLabel: null dans le DTO quand le libellé libre est vidé', () => {
      trophiesServiceSpy.updateTrophy.and.returnValue(of({ ...mockTrophy }));
      component.form.patchValue({ teamLabel: '' });
      component.save();
      const dto = trophiesServiceSpy.updateTrophy.calls.mostRecent().args[1];
      expect(dto.teamLabel).toBeNull();
    });

    it('ne touche pas au DTO si le formulaire est invalide', () => {
      component.form.get('competition')!.setValue('');
      component.save();
      expect(trophiesServiceSpy.updateTrophy).not.toHaveBeenCalled();
    });

    it('affiche le message erreur API sur echec', () => {
      trophiesServiceSpy.updateTrophy.and.returnValue(
        throwError(() => ({ error: { message: 'Équipe introuvable' } })),
      );
      component.save();
      expect(component.error()).toBe('Équipe introuvable');
    });

    it('ferme le dialog avec le résultat sur succès', () => {
      const updated = { ...mockTrophy, competition: 'Mis à jour' };
      trophiesServiceSpy.updateTrophy.and.returnValue(of(updated));
      component.save();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(updated);
    });
  });
});
