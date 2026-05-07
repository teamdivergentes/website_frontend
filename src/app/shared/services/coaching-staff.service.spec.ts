import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CoachingStaffService } from './coaching-staff.service';
import type { CoachingStaffMember, CreateCoachingStaffDto, UpdateCoachingStaffDto } from '../models';

const API_URL = 'http://localhost:3000';
const BASE_ADMIN = `${API_URL}/api/admin`;

const mockCoach: CoachingStaffMember = {
  id: 1,
  name: 'HeadCoach',
  role: 'Head Coach',
  position: 0,
  teamId: 42,
};

describe('CoachingStaffService', () => {
  let service: CoachingStaffService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CoachingStaffService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CoachingStaffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list()', () => {
    it('should GET the coaching staff of a team', () => {
      const coaches = [mockCoach];
      service.list(42).subscribe(res => expect(res).toEqual(coaches));

      const req = httpMock.expectOne(`${BASE_ADMIN}/teams/42/coaching-staff`);
      expect(req.request.method).toBe('GET');
      req.flush(coaches);
    });
  });

  describe('create()', () => {
    it('should POST a new coach', () => {
      const dto: CreateCoachingStaffDto = { name: 'NewCoach', role: 'Analyste' };
      service.create(42, dto).subscribe(res => expect(res).toEqual(mockCoach));

      const req = httpMock.expectOne(`${BASE_ADMIN}/teams/42/coaching-staff`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockCoach);
    });
  });

  describe('update()', () => {
    it('should PATCH an existing coach', () => {
      const dto: UpdateCoachingStaffDto = { role: 'Manager' };
      const updated = { ...mockCoach, role: 'Manager' };
      service.update(42, 1, dto).subscribe(res => expect(res).toEqual(updated));

      const req = httpMock.expectOne(`${BASE_ADMIN}/teams/42/coaching-staff/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(updated);
    });
  });

  describe('delete()', () => {
    it('should DELETE a coach via teams/:teamId/coaching-staff/:id (anti-IDOR)', () => {
      service.delete(42, 1).subscribe(res => expect(res).toBeNull());

      const req = httpMock.expectOne(`${BASE_ADMIN}/teams/42/coaching-staff/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('reorder()', () => {
    it('should PATCH the reorder endpoint with items', () => {
      const items = [{ id: 1, position: 0 }, { id: 2, position: 1 }];
      service.reorder(42, items).subscribe(res =>
        expect(res).toEqual({ message: 'Ordre mis à jour avec succès' })
      );

      const req = httpMock.expectOne(`${BASE_ADMIN}/teams/42/coaching-staff/reorder`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ items });
      req.flush({ message: 'Ordre mis à jour avec succès' });
    });
  });
});
