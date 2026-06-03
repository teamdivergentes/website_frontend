import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TrophiesService } from './trophies.service';
import { Trophy } from '../models/trophy.model';
import { environment } from '../../../environments/environment';

describe('TrophiesService', () => {
  let service: TrophiesService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/trophies`;
  const adminBase = `${environment.apiUrl}/api/admin/trophies`;

  const mockTrophy: Trophy = {
    id: 1,
    competition: 'Coupe de France LoL',
    placement: 1,
    description: 'Victoire en finale',
    date: '2025-06-15T00:00:00.000Z',
    image: null,
    featured: true,
    teamId: 2,
    teamName: 'Équipe LoL',
    teamSlug: 'equipe-lol',
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TrophiesService,
      ],
    });
    service = TestBed.inject(TrophiesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loadTrophies() appelle GET /api/trophies et popule le signal', () => {
    service.loadTrophies().subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([mockTrophy]);
    expect(service.trophies()).toEqual([mockTrophy]);
  });

  it('featuredTrophies() ne contient que les featured', () => {
    service.loadTrophies().subscribe();
    http.expectOne(base).flush([mockTrophy, { ...mockTrophy, id: 2, featured: false }]);
    expect(service.featuredTrophies().length).toBe(1);
    expect(service.featuredTrophies()[0].id).toBe(1);
  });

  it('trophiesByYear() groupe par année décroissante', () => {
    service.loadTrophies().subscribe();
    http.expectOne(base).flush([
      mockTrophy,
      { ...mockTrophy, id: 2, date: '2024-11-10T00:00:00.000Z' },
    ]);
    const groups = service.trophiesByYear();
    expect(groups.map(g => g.year)).toEqual([2025, 2024]);
    expect(groups[0].trophies.length).toBe(1);
  });

  it('getTeamTrophies() appelle GET avec teamId', () => {
    service.getTeamTrophies(2).subscribe();
    const req = http.expectOne(`${base}?teamId=2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTrophy]);
  });

  it('trophiesByYear() retourne [] si aucun trophée chargé', () => {
    expect(service.trophiesByYear()).toEqual([]);
  });

  it('getTeamTrophies() ne modifie pas le signal trophies()', () => {
    service.getTeamTrophies(2).subscribe();
    http.expectOne(`${base}?teamId=2`).flush([mockTrophy]);
    expect(service.trophies()).toEqual([]);
  });

  it('loadAdminTrophies() appelle GET /api/admin/trophies', () => {
    service.loadAdminTrophies().subscribe();
    const req = http.expectOne(adminBase);
    expect(req.request.method).toBe('GET');
    req.flush([mockTrophy]);
    expect(service.adminTrophies()).toEqual([mockTrophy]);
  });

  it('create/update/delete utilisent les endpoints admin', () => {
    service.createTrophy({ competition: 'X', placement: 1, date: '2025-01-01' }).subscribe();
    http.expectOne({ method: 'POST', url: adminBase }).flush(mockTrophy);

    service.updateTrophy(1, { featured: false }).subscribe();
    http.expectOne({ method: 'PATCH', url: `${adminBase}/1` }).flush({ ...mockTrophy, featured: false });

    service.deleteTrophy(1).subscribe();
    http.expectOne({ method: 'DELETE', url: `${adminBase}/1` }).flush(null);
  });
});
