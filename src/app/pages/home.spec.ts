import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { Home } from './home';
import { sharedTestProvider } from '../../shared/tests/shared-test-provider';
import { MatchesService } from '../shared/services/matches.service';
import { Match } from '../shared/models/match.model';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let matchesServiceSpy: jasmine.SpyObj<MatchesService>;

  const mockUpcoming: Match = {
    id: 1,
    teamId: 1,
    opponentName: 'Team Rivale',
    scheduledAt: '2025-09-15T18:00:00.000Z',
    streamUrl: 'https://twitch.tv/dvg',
    scoreDvg: null,
    scoreOpponent: null,
  };

  const mockResult: Match = {
    id: 2,
    teamId: 1,
    opponentName: 'Team Alpha',
    scheduledAt: '2025-06-01T16:00:00.000Z',
    streamUrl: null,
    scoreDvg: 2,
    scoreOpponent: 1,
  };

  beforeEach(async () => {
    matchesServiceSpy = jasmine.createSpyObj('MatchesService', [
      'getUpcoming',
      'getResults',
    ]);
    // Par défaut : pas de données
    matchesServiceSpy.getUpcoming.and.returnValue(of([]));
    matchesServiceSpy.getResults.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        ...sharedTestProvider,
        { provide: MatchesService, useValue: matchesServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('affiche le bandeau match quand des données sont disponibles', async () => {
    matchesServiceSpy.getUpcoming.and.returnValue(of([mockUpcoming]));
    matchesServiceSpy.getResults.and.returnValue(of([mockResult]));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const strip = fixture.nativeElement.querySelector('.match-strip');
    expect(strip).not.toBeNull();
  });

  it("n'affiche pas le bandeau match quand il n'y a pas de données", async () => {
    // Spy déjà configuré avec of([]) par défaut
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const strip = fixture.nativeElement.querySelector('.match-strip');
    expect(strip).toBeNull();
  });

  it('affiche le skeleton pendant le chargement des matchs', () => {
    // NEVER simule une requête en attente
    matchesServiceSpy.getUpcoming.and.returnValue(NEVER);
    matchesServiceSpy.getResults.and.returnValue(NEVER);

    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.match-strip-skeleton');
    expect(skeleton).not.toBeNull();
    const strip = fixture.nativeElement.querySelector('.match-strip');
    expect(strip).toBeNull();
  });

  it('masque le skeleton et affiche le strip après la réponse', async () => {
    matchesServiceSpy.getUpcoming.and.returnValue(of([mockUpcoming]));
    matchesServiceSpy.getResults.and.returnValue(of([mockResult]));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.match-strip-skeleton');
    expect(skeleton).toBeNull();
    const strip = fixture.nativeElement.querySelector('.match-strip');
    expect(strip).not.toBeNull();
  });
});
