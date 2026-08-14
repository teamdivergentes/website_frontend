import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, NEVER } from 'rxjs';
import { TrophiesAdminComponent } from './trophies-admin.component';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { TrophyAdmin } from '../../../shared/models/trophy.model';

describe('TrophiesAdminComponent', () => {
  let fixture: ComponentFixture<TrophiesAdminComponent>;
  let component: TrophiesAdminComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const trophy: TrophyAdmin = {
    id: 1, competition: 'Coupe de France LoL', placement: 1,
    description: null, date: '2025-06-15T00:00:00.000Z', image: null,
    featured: false, teamId: 2, teamName: 'Équipe LoL', teamSlug: 'equipe-lol',
    active: true,
  };

  beforeEach(async () => {
    const trophiesSignal = signal<TrophyAdmin[]>([trophy]);
    const serviceSpy = jasmine.createSpyObj(
      'TrophiesService',
      ['loadAdminTrophies', 'updateTrophy', 'deleteTrophy', 'createTrophy'],
      { adminTrophies: trophiesSignal.asReadonly() },
    );
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [TrophiesAdminComponent],
      providers: [
      // La page lit `queryParamMap` pour l'ouverture depuis la palette de commandes.
      provideRouter([]),
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: TrophiesService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    trophiesService.loadAdminTrophies.and.returnValue(NEVER);
    fixture = TestBed.createComponent(TrophiesAdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('charge les trophées admin au init', () => {
    trophiesService.loadAdminTrophies.and.returnValue(of([trophy]));
    fixture.detectChanges();
    expect(trophiesService.loadAdminTrophies).toHaveBeenCalled();
  });

  it('toggleFeatured appelle updateTrophy avec featured inversé', () => {
    trophiesService.updateTrophy.and.returnValue(of({ ...trophy, featured: true }));
    component.toggleFeatured(trophy);
    expect(trophiesService.updateTrophy).toHaveBeenCalledWith(1, { featured: true });
  });

  it('toggleFeatured en erreur → snackBar Erreur', () => {
    trophiesService.updateTrophy.and.returnValue(throwError(() => new Error('fail')));
    component.toggleFeatured(trophy);
    expect(snackBar.open).toHaveBeenCalledWith('Erreur', 'OK', jasmine.any(Object));
  });

  describe('openCreate', () => {
    it('ouvre le dialog et recharge si result truthy', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(trophy));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      trophiesService.loadAdminTrophies.and.returnValue(of([trophy]));

      component.openCreate();

      expect(dialog.open).toHaveBeenCalled();
      expect(trophiesService.loadAdminTrophies).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Trophée créé', 'OK', jasmine.any(Object));
    });

    it('ne recharge PAS si result null', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(null));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

      component.openCreate();

      expect(dialog.open).toHaveBeenCalled();
      expect(trophiesService.loadAdminTrophies).not.toHaveBeenCalled();
    });
  });

  describe('openEdit', () => {
    it('ouvre le dialog avec le trophée et recharge si result truthy', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of({ ...trophy, competition: 'Updated' }));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      trophiesService.loadAdminTrophies.and.returnValue(of([trophy]));

      component.openEdit(trophy);

      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({ data: { trophy } }),
      );
      expect(trophiesService.loadAdminTrophies).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Trophée mis à jour', 'OK', jasmine.any(Object));
    });

    it('ne recharge PAS si result undefined', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(undefined));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

      component.openEdit(trophy);

      expect(trophiesService.loadAdminTrophies).not.toHaveBeenCalled();
    });
  });

  describe('confirmDelete', () => {
    it('supprime le trophée après confirmation', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      trophiesService.deleteTrophy.and.returnValue(of(undefined));

      component.confirmDelete(trophy);

      expect(trophiesService.deleteTrophy).toHaveBeenCalledWith(1);
      expect(snackBar.open).toHaveBeenCalledWith('Trophée supprimé', 'OK', jasmine.any(Object));
    });

    it('ne supprime pas si annulé (of(false))', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(false));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

      component.confirmDelete(trophy);

      expect(trophiesService.deleteTrophy).not.toHaveBeenCalled();
    });

    it('confirmDelete confirmé mais deleteTrophy en erreur → snackBar Erreur', () => {
      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of(true));
      dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
      trophiesService.deleteTrophy.and.returnValue(throwError(() => new Error('fail')));

      component.confirmDelete(trophy);

      expect(trophiesService.deleteTrophy).toHaveBeenCalledWith(1);
      expect(snackBar.open).toHaveBeenCalledWith('Erreur', 'OK', jasmine.any(Object));
    });
  });
});
