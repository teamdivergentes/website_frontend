import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TrophiesService } from './trophies.service';
import { Trophy, TrophyAdmin } from '../models/trophy.model';
import { environment } from '../../../environments/environment';

describe('TrophiesService', () => {
  let service: TrophiesService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/trophies`;
  const adminBase = `${environment.apiUrl}/api/admin/trophies`;

  // Contrat public : pas de champ active
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
  };

  // Contrat admin : inclut active
  const mockAdmin: TrophyAdmin = {
    ...mockTrophy,
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
    req.flush([mockAdmin]);
    expect(service.adminTrophies()).toEqual([mockAdmin]);
  });

  it('create/update/delete utilisent les endpoints admin', () => {
    service.createTrophy({ competition: 'X', placement: 1, date: '2025-01-01' }).subscribe();
    const createReq = http.expectOne({ method: 'POST', url: adminBase });
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.url).toBe(adminBase);
    createReq.flush(mockAdmin);

    service.updateTrophy(1, { featured: false }).subscribe();
    const updateReq = http.expectOne({ method: 'PATCH', url: `${adminBase}/1` });
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.url).toBe(`${adminBase}/1`);
    updateReq.flush({ ...mockAdmin, featured: false });

    service.deleteTrophy(1).subscribe();
    const deleteReq = http.expectOne({ method: 'DELETE', url: `${adminBase}/1` });
    expect(deleteReq.request.method).toBe('DELETE');
    expect(deleteReq.request.url).toBe(`${adminBase}/1`);
    deleteReq.flush(null);
  });

  describe('état des signaux admin après mutations', () => {
    it('createTrophy() ajoute le trophée dans adminTrophies()', () => {
      service.createTrophy({ competition: 'Nouveau', placement: 2, date: '2025-03-01' }).subscribe();
      const newTrophy: TrophyAdmin = { ...mockAdmin, id: 99, competition: 'Nouveau' };
      http.expectOne({ method: 'POST', url: adminBase }).flush(newTrophy);
      expect(service.adminTrophies().find(t => t.id === 99)).toEqual(newTrophy);
    });

    it('updateTrophy() remplace le trophée mis à jour dans adminTrophies()', () => {
      // Prépare le signal avec un trophée existant
      service.loadAdminTrophies().subscribe();
      http.expectOne(adminBase).flush([mockAdmin]);
      expect(service.adminTrophies().length).toBe(1);

      const updated: TrophyAdmin = { ...mockAdmin, competition: 'Modifié' };
      service.updateTrophy(1, { competition: 'Modifié' }).subscribe();
      http.expectOne({ method: 'PATCH', url: `${adminBase}/1` }).flush(updated);

      expect(service.adminTrophies().length).toBe(1);
      expect(service.adminTrophies()[0].competition).toBe('Modifié');
    });

    it('deleteTrophy() retire le trophée de adminTrophies()', () => {
      service.loadAdminTrophies().subscribe();
      http.expectOne(adminBase).flush([mockAdmin]);
      expect(service.adminTrophies().length).toBe(1);

      service.deleteTrophy(1).subscribe();
      http.expectOne({ method: 'DELETE', url: `${adminBase}/1` }).flush(null);

      expect(service.adminTrophies().length).toBe(0);
    });
  });
});
