import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, NEVER } from 'rxjs';
import { TrophiesAdminComponent } from './trophies-admin.component';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { Trophy } from '../../../shared/models/trophy.model';

describe('TrophiesAdminComponent', () => {
  let fixture: ComponentFixture<TrophiesAdminComponent>;
  let component: TrophiesAdminComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;

  const trophy: Trophy = {
    id: 1, competition: 'Coupe de France LoL', placement: 1,
    description: null, date: '2025-06-15T00:00:00.000Z', image: null,
    featured: false, teamId: 2, teamName: 'Équipe LoL', teamSlug: 'equipe-lol',
    active: true,
  };

  beforeEach(async () => {
    const trophiesSignal = signal<Trophy[]>([trophy]);
    const serviceSpy = jasmine.createSpyObj(
      'TrophiesService',
      ['loadAdminTrophies', 'updateTrophy', 'deleteTrophy'],
      { adminTrophies: trophiesSignal.asReadonly() },
    );
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [TrophiesAdminComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: TrophiesService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
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
});
