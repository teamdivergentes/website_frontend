import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { StaffService } from './staff.service';
import { StaffCategory } from '../models';
import type { StaffMember, CreateStaffDto, UpdateStaffDto } from '../models';

const BASE = 'http://localhost:3000/api/staff';

const MOCK_ADMIN: StaffMember = {
  id: 1,
  name: 'Admin One',
  role: 'Fondateur',
  category: StaffCategory.ADMIN,
  position: 1,
};

const MOCK_HEADSTAFF: StaffMember = {
  id: 2,
  name: 'Head One',
  role: 'Manager',
  category: StaffCategory.HEADSTAFF,
  position: 1,
};

const MOCK_AMBASSADOR: StaffMember = {
  id: 3,
  name: 'Ambi One',
  role: 'Ambassadeur',
  category: StaffCategory.AMBASSADOR,
  position: 1,
};

describe('StaffService', () => {
  let service: StaffService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        StaffService,
      ],
    });
    service = TestBed.inject(StaffService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // loadStaff()
  // ------------------------------------------------------------------ //

  it('loadStaff() doit appeler GET /api/staff et populer le signal', () => {
    let result: StaffMember[] | undefined;
    service.loadStaff().subscribe(s => (result = s));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_ADMIN, MOCK_HEADSTAFF, MOCK_AMBASSADOR]);

    expect(result?.length).toBe(3);
    expect(service.allStaff().length).toBe(3);
  });

  it('loadStaff() retourne un tableau vide si l\'API renvoie []', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([]);

    expect(service.allStaff()).toEqual([]);
  });

  // ------------------------------------------------------------------ //
  // Computed signals par categorie
  // ------------------------------------------------------------------ //

  it('admins computed filtre les membres ADMIN et trie par position', () => {
    const admin2: StaffMember = { ...MOCK_ADMIN, id: 10, position: 2 };
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([admin2, MOCK_ADMIN, MOCK_HEADSTAFF]);

    expect(service.admins().length).toBe(2);
    expect(service.admins()[0].id).toBe(1); // position 1 en premier
    expect(service.admins()[1].id).toBe(10); // position 2
  });

  it('headstaff computed filtre les membres HEADSTAFF', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([MOCK_ADMIN, MOCK_HEADSTAFF]);

    expect(service.headstaff().length).toBe(1);
    expect(service.headstaff()[0].id).toBe(2);
  });

  it('ambassadors computed filtre les membres AMBASSADOR', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([MOCK_ADMIN, MOCK_AMBASSADOR]);

    expect(service.ambassadors().length).toBe(1);
    expect(service.ambassadors()[0].id).toBe(3);
  });

  // ------------------------------------------------------------------ //
  // getStaffMember()
  // ------------------------------------------------------------------ //

  it('getStaffMember() doit appeler GET /api/staff/:id', () => {
    let result: StaffMember | undefined;
    service.getStaffMember(1).subscribe(m => (result = m));

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_ADMIN);

    expect(result).toEqual(MOCK_ADMIN);
  });

  // ------------------------------------------------------------------ //
  // createMember()
  // ------------------------------------------------------------------ //

  it('createMember() doit appeler POST /api/staff et ajouter au signal', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([]);

    const dto: CreateStaffDto = {
      name: 'Nouveau',
      role: 'Graphiste',
      category: StaffCategory.HEADSTAFF,
    };
    const created: StaffMember = { id: 99, ...dto, position: 5 };
    let result: StaffMember | undefined;

    service.createMember(dto).subscribe(m => (result = m));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);

    expect(result).toEqual(created);
    expect(service.allStaff()).toContain(created);
  });

  // ------------------------------------------------------------------ //
  // updateMember()
  // ------------------------------------------------------------------ //

  it('updateMember() doit appeler PUT /api/staff/:id et mettre a jour le signal', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([MOCK_ADMIN]);

    const dto: UpdateStaffDto = { role: 'Co-Fondateur' };
    const updated: StaffMember = { ...MOCK_ADMIN, role: 'Co-Fondateur' };
    let result: StaffMember | undefined;

    service.updateMember(1, dto).subscribe(m => (result = m));

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);

    expect(result).toEqual(updated);
    expect(service.allStaff()[0].role).toBe('Co-Fondateur');
  });

  it('updateMember() ne modifie pas le signal si l\'id n\'existe pas', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([MOCK_ADMIN]);

    const dto: UpdateStaffDto = { role: 'Fantome' };
    service.updateMember(999, dto).subscribe();

    const req = http.expectOne(`${BASE}/999`);
    req.flush({ id: 999, name: 'X', role: 'Fantome', category: StaffCategory.ADMIN, position: 99 });

    // Signal inchange
    expect(service.allStaff().length).toBe(1);
    expect(service.allStaff()[0].id).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // deleteMember()
  // ------------------------------------------------------------------ //

  it('deleteMember() doit appeler DELETE /api/staff/:id et retirer du signal', () => {
    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([MOCK_ADMIN, MOCK_HEADSTAFF]);

    service.deleteMember(1).subscribe();

    const req = http.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.allStaff().length).toBe(1);
    expect(service.allStaff().find(m => m.id === 1)).toBeUndefined();
  });

  // ------------------------------------------------------------------ //
  // reorderMembers()
  // ------------------------------------------------------------------ //

  it('reorderMembers() doit appeler PATCH /api/staff/reorder et mettre a jour les positions', () => {
    const m1: StaffMember = { ...MOCK_ADMIN, id: 1, position: 1 };
    const m2: StaffMember = { ...MOCK_HEADSTAFF, id: 2, position: 2 };

    service.loadStaff().subscribe();
    http.expectOne(BASE).flush([m1, m2]);

    const reorder = [
      { id: 1, position: 2 },
      { id: 2, position: 1 },
    ];
    service.reorderMembers(reorder).subscribe();

    const req = http.expectOne(`${BASE}/reorder`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ items: reorder });
    req.flush(null);

    const staff1 = service.allStaff().find(m => m.id === 1);
    const staff2 = service.allStaff().find(m => m.id === 2);
    expect(staff1?.position).toBe(2);
    expect(staff2?.position).toBe(1);
  });
});
