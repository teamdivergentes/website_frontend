import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatchesService } from './matches.service';
import { Match, MatchAdmin } from '../models/match.model';
import { environment } from '../../../environments/environment';

describe('MatchesService', () => {
  let service: MatchesService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/matches`;
  const adminBase = `${environment.apiUrl}/api/admin/matches`;

  const mockMatch: Match = {
    id: 1,
    teamId: 2,
    teamName: 'Team Alpha',
    teamSlug: 'team-alpha',
    teamGame: 'valorant',
    opponentName: 'Team Rivale',
    opponentLogo: null,
    scheduledAt: '2025-09-15T18:00:00.000Z',
    competition: 'Coupe de France',
    streamUrl: 'https://twitch.tv/dvg',
    scoreDvg: null,
    scoreOpponent: null,
    articleId: null,
    articleSlug: null,
  };

  const mockMatchResult: Match = {
    ...mockMatch,
    id: 2,
    scheduledAt: '2025-06-01T16:00:00.000Z',
    streamUrl: null,
    scoreDvg: 2,
    scoreOpponent: 1,
    articleSlug: 'victoire-coupe-france',
  };

  const mockAdmin: MatchAdmin = {
    ...mockMatch,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MatchesService,
      ],
    });
    service = TestBed.inject(MatchesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ============================================================
  // getUpcoming
  // ============================================================

  it('getUpcoming() appelle GET /api/matches?status=upcoming', () => {
    service.getUpcoming().subscribe();
    const req = http.expectOne(`${base}?status=upcoming`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMatch]);
  });

  it('getUpcoming() passe limit et teamId en query params', () => {
    service.getUpcoming(1, 2).subscribe();
    const req = http.expectOne(`${base}?status=upcoming&limit=1&teamId=2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMatch]);
  });

  it('getUpcoming() ne modifie aucun signal admin', () => {
    service.getUpcoming(1).subscribe();
    http.expectOne(`${base}?status=upcoming&limit=1`).flush([mockMatch]);
    expect(service.adminMatches()).toEqual([]);
  });

  // ============================================================
  // getResults
  // ============================================================

  it('getResults() appelle GET /api/matches?status=past', () => {
    service.getResults().subscribe();
    const req = http.expectOne(`${base}?status=past`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMatchResult]);
  });

  it('getResults() passe limit et teamId en query params', () => {
    service.getResults(3, 2).subscribe();
    const req = http.expectOne(`${base}?status=past&limit=3&teamId=2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockMatchResult]);
  });

  it('getResults() ne modifie aucun signal admin', () => {
    service.getResults(2).subscribe();
    http.expectOne(`${base}?status=past&limit=2`).flush([mockMatchResult]);
    expect(service.adminMatches()).toEqual([]);
  });

  // ============================================================
  // loadAdminMatches
  // ============================================================

  it('loadAdminMatches() appelle GET /api/admin/matches et popule le signal', () => {
    service.loadAdminMatches().subscribe();
    const req = http.expectOne(adminBase);
    expect(req.request.method).toBe('GET');
    req.flush([mockAdmin]);
    expect(service.adminMatches()).toEqual([mockAdmin]);
  });

  // ============================================================
  // Mutations admin + état du signal
  // ============================================================

  it('createMatch() POST /api/admin/matches et ajoute dans le signal', () => {
    service
      .createMatch({
        teamId: 2,
        opponentName: 'Nouveau',
        scheduledAt: '2025-10-01T18:00:00.000Z',
      })
      .subscribe();
    const newMatch: MatchAdmin = { ...mockAdmin, id: 99, opponentName: 'Nouveau' };
    http.expectOne({ method: 'POST', url: adminBase }).flush(newMatch);
    expect(service.adminMatches().find(m => m.id === 99)).toEqual(newMatch);
  });

  it('updateMatch() PATCH /api/admin/matches/:id et met à jour le signal', () => {
    service.loadAdminMatches().subscribe();
    http.expectOne(adminBase).flush([mockAdmin]);
    expect(service.adminMatches().length).toBe(1);

    const updated: MatchAdmin = { ...mockAdmin, opponentName: 'Modifié' };
    service.updateMatch(1, { opponentName: 'Modifié' }).subscribe();
    http.expectOne({ method: 'PATCH', url: `${adminBase}/1` }).flush(updated);

    expect(service.adminMatches().length).toBe(1);
    expect(service.adminMatches()[0].opponentName).toBe('Modifié');
  });

  it('deleteMatch() DELETE /api/admin/matches/:id et retire du signal', () => {
    service.loadAdminMatches().subscribe();
    http.expectOne(adminBase).flush([mockAdmin]);
    expect(service.adminMatches().length).toBe(1);

    service.deleteMatch(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${adminBase}/1` }).flush(null);

    expect(service.adminMatches().length).toBe(0);
  });
});
