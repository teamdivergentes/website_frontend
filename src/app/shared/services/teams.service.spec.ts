import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TeamsService } from './teams.service';
import type { Team, TeamWithMembers, TeamMember, CreateTeamDto, UpdateTeamDto, CreateMemberDto, UpdateMemberDto } from '../models';

const BASE = 'http://localhost:3000/api/teams';

const MOCK_TEAM: Team = {
  id: 1,
  name: 'DVG Valorant',
  slug: 'dvg-valorant',
  game: 'Valorant',
  active: true,
  position: 1,
};

const MOCK_TEAM_2: Team = {
  id: 2,
  name: 'DVG LoL',
  slug: 'dvg-lol',
  game: 'League of Legends',
  active: false,
  position: 2,
};

const MOCK_MEMBER: TeamMember = {
  id: 10,
  name: 'ProPlayer',
  role: 'Duelist',
  position: 1,
  joinedAt: '2024-01-01',
};

describe('TeamsService', () => {
  let service: TeamsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TeamsService,
      ],
    });
    service = TestBed.inject(TeamsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // loadTeams()
  // ------------------------------------------------------------------ //

  it('loadTeams() doit appeler GET /api/teams et populer le signal', () => {
    let result: Team[] | undefined;
    service.loadTeams().subscribe(t => (result = t));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_TEAM, MOCK_TEAM_2]);

    expect(result).toEqual([MOCK_TEAM, MOCK_TEAM_2]);
    expect(service.allTeams().length).toBe(2);
  });

  it('activeTeams computed filtre les equipes inactives', () => {
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([MOCK_TEAM, MOCK_TEAM_2]);

    // MOCK_TEAM (active: true), MOCK_TEAM_2 (active: false)
    expect(service.activeTeams().length).toBe(1);
    expect(service.activeTeams()[0].id).toBe(1);
  });

  it('allTeams computed trie par position', () => {
    const teamA: Team = { ...MOCK_TEAM, id: 3, position: 2 };
    const teamB: Team = { ...MOCK_TEAM_2, id: 4, position: 1, active: true };

    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([teamA, teamB]);

    expect(service.allTeams()[0].id).toBe(4);
    expect(service.allTeams()[1].id).toBe(3);
  });

  // ------------------------------------------------------------------ //
  // getTeamBySlug()
  // ------------------------------------------------------------------ //

  it('getTeamBySlug() doit appeler GET /api/teams/:slug', () => {
    const withMembers: TeamWithMembers = { ...MOCK_TEAM, members: [MOCK_MEMBER] };
    let result: TeamWithMembers | undefined;

    service.getTeamBySlug('dvg-valorant').subscribe(t => (result = t));

    const req = http.expectOne(`${BASE}/dvg-valorant`);
    expect(req.request.method).toBe('GET');
    req.flush(withMembers);

    expect(result).toEqual(withMembers);
    expect(result?.members.length).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // createTeam()
  // ------------------------------------------------------------------ //

  it('createTeam() doit appeler POST /api/teams et ajouter l\'equipe au signal', () => {
    // Signal vide initialement
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([]);

    const dto: CreateTeamDto = { name: 'DVG CS2', game: 'CS2' };
    const created: Team = { id: 5, ...dto, slug: 'dvg-cs2', active: true, position: 3 };
    let result: Team | undefined;

    service.createTeam(dto).subscribe(t => (result = t));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result).toEqual(created);
    expect(service.allTeams()).toContain(created);
  });

  // ------------------------------------------------------------------ //
  // updateTeam()
  // ------------------------------------------------------------------ //

  it('updateTeam() doit appeler PUT /api/teams/:id et mettre a jour le signal', () => {
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([MOCK_TEAM]);

    const dto: UpdateTeamDto = { name: 'DVG Val Updated' };
    const updated: Team = { ...MOCK_TEAM, name: 'DVG Val Updated' };
    let result: Team | undefined;

    service.updateTeam(1, dto).subscribe(t => (result = t));

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);

    expect(result).toEqual(updated);
    expect(service.allTeams()[0].name).toBe('DVG Val Updated');
  });

  it('updateTeam() ne modifie pas le signal si l\'id n\'est pas trouve', () => {
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([MOCK_TEAM]);

    const dto: UpdateTeamDto = { name: 'Inconnu' };
    service.updateTeam(999, dto).subscribe();

    const req = http.expectOne(`${BASE}/999`);
    req.flush({ id: 999, name: 'Inconnu', slug: 'inconnu', game: 'X', active: true, position: 99 });

    // Signal inchange (l'id 999 n'existe pas dans le signal)
    expect(service.allTeams().length).toBe(1);
    expect(service.allTeams()[0].id).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // deleteTeam()
  // ------------------------------------------------------------------ //

  it('deleteTeam() doit appeler DELETE /api/teams/:id et retirer du signal', () => {
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([MOCK_TEAM, MOCK_TEAM_2]);

    service.deleteTeam(1).subscribe();

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.allTeams().length).toBe(1);
    expect(service.allTeams().find(t => t.id === 1)).toBeUndefined();
  });

  // ------------------------------------------------------------------ //
  // reorderTeams()
  // ------------------------------------------------------------------ //

  it('reorderTeams() doit appeler PATCH /api/teams/reorder et mettre a jour les positions', () => {
    const teamA: Team = { ...MOCK_TEAM, id: 1, position: 1 };
    const teamB: Team = { ...MOCK_TEAM_2, id: 2, position: 2, active: true };

    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([teamA, teamB]);

    const reorder = [
      { id: 1, position: 2 },
      { id: 2, position: 1 },
    ];
    service.reorderTeams(reorder).subscribe();

    const req = http.expectOne(`${BASE}/reorder`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items: reorder });
    req.flush(null);

    const team1 = service.allTeams().find(t => t.id === 1);
    const team2 = service.allTeams().find(t => t.id === 2);
    expect(team1?.position).toBe(2);
    expect(team2?.position).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // toggleTeamActive()
  // ------------------------------------------------------------------ //

  it('toggleTeamActive() doit appeler PATCH /api/teams/:id/toggle et mettre a jour le signal', () => {
    service.loadTeams().subscribe();
    http.expectOne(BASE).flush([MOCK_TEAM]);

    const toggled: Team = { ...MOCK_TEAM, active: false };
    let result: Team | undefined;

    service.toggleTeamActive(1).subscribe(t => (result = t));

    const req = http.expectOne(`${BASE}/1/toggle`);
    expect(req.request.method).toBe('PATCH');
    req.flush(toggled);

    expect(result?.active).toBeFalse();
    expect(service.allTeams()[0].active).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // Gestion des membres
  // ------------------------------------------------------------------ //

  it('addMember() doit appeler POST /api/teams/:teamId/members', () => {
    const dto: CreateMemberDto = { name: 'Nouveau', role: 'IGL' };
    let result: TeamMember | undefined;

    service.addMember(1, dto).subscribe(m => (result = m));

    const req = http.expectOne(`${BASE}/1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ ...MOCK_MEMBER, ...dto });

    expect(result?.name).toBe('Nouveau');
  });

  it('updateMember() doit appeler PUT /api/teams/:teamId/members/:memberId', () => {
    const dto: UpdateMemberDto = { role: 'Sentinel' };
    let result: TeamMember | undefined;

    service.updateMember(1, 10, dto).subscribe(m => (result = m));

    const req = http.expectOne(`${BASE}/1/members/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush({ ...MOCK_MEMBER, role: 'Sentinel' });

    expect(result?.role).toBe('Sentinel');
  });

  it('deleteMember() doit appeler DELETE /api/teams/:teamId/members/:memberId', () => {
    service.deleteMember(1, 10).subscribe();

    const req = http.expectOne(`${BASE}/1/members/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('reorderMembers() doit appeler PATCH /api/teams/:teamId/members/reorder', () => {
    const reorder = [{ id: 10, position: 2 }];
    service.reorderMembers(1, reorder).subscribe();

    const req = http.expectOne(`${BASE}/1/members/reorder`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items: reorder });
    req.flush(null);
  });

  it('getMemberBySlug() doit appeler GET /api/members/by-slug/:slug', () => {
    let result: TeamMember | undefined;

    service.getMemberBySlug('proplayer').subscribe(m => (result = m));

    const req = http.expectOne('http://localhost:3000/api/members/by-slug/proplayer');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_MEMBER);

    expect(result).toEqual(MOCK_MEMBER);
  });
});
