import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SponsorsService } from './sponsors.service';
import { Sponsor, SponsorTier, LinkType, SponsorsGrouped } from '../models';

describe('SponsorsService', () => {
  let service: SponsorsService;
  let httpMock: HttpTestingController;

  const mockSponsor: Sponsor = {
    id: 1,
    name: 'Test Sponsor',
    slug: 'test-sponsor',
    description: 'Test description',
    tier: SponsorTier.PRINCIPAL,
    position: 0,
    active: true,
    images: [
      {
        id: 1,
        url: 'https://example.com/image.png',
        alt: 'Test image',
        isPrimary: true,
        position: 0
      }
    ],
    links: [
      {
        id: 1,
        url: 'https://example.com',
        label: 'Website',
        type: LinkType.WEBSITE,
        isPrimary: true
      }
    ],
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockSponsorsGrouped: SponsorsGrouped = {
    principal: [mockSponsor],
    secondary: [],
    tertiary: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SponsorsService]
    });

    service = TestBed.inject(SponsorsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadSponsors', () => {
    it('should load sponsors grouped by tier', (done) => {
      service.loadSponsors().subscribe({
        next: (data) => {
          expect(data).toEqual(mockSponsorsGrouped);
          expect(service.principal()).toEqual([mockSponsor]);
          expect(service.secondary()).toEqual([]);
          expect(service.tertiary()).toEqual([]);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors');
      expect(req.request.method).toBe('GET');
      req.flush(mockSponsorsGrouped);
    });

    it('should update signals on successful load', (done) => {
      expect(service.principal()).toEqual([]);

      service.loadSponsors().subscribe({
        next: () => {
          expect(service.principal()).toEqual([mockSponsor]);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors');
      req.flush(mockSponsorsGrouped);
    });
  });

  describe('createSponsor', () => {
    it('should create a sponsor', (done) => {
      const dto = {
        name: 'New Sponsor',
        tier: SponsorTier.SECONDARY
      };

      service.createSponsor(dto).subscribe({
        next: (sponsor) => {
          expect(sponsor.name).toBe('New Sponsor');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockSponsor, ...dto });
    });
  });

  describe('updateSponsor', () => {
    it('should update a sponsor', (done) => {
      const dto = { name: 'Updated Name' };

      service.updateSponsor(1, dto).subscribe({
        next: (sponsor) => {
          expect(sponsor.name).toBe('Updated Name');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockSponsor, ...dto });
    });
  });

  describe('deleteSponsor', () => {
    it('should delete a sponsor', (done) => {
      service.deleteSponsor(1).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('toggleSponsorActive', () => {
    it('should toggle sponsor active status', (done) => {
      service.toggleSponsorActive(1).subscribe({
        next: (sponsor) => {
          expect(sponsor).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/toggle');
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockSponsor, active: false });
    });
  });

  describe('reorderInTier', () => {
    it('should reorder sponsors in a tier', (done) => {
      service.reorderInTier(SponsorTier.PRINCIPAL, [2, 1, 3]).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/reorder');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        tier: SponsorTier.PRINCIPAL,
        orderedIds: [2, 1, 3]
      });
      req.flush(null);
    });
  });

  describe('Images management', () => {
    it('should add an image', (done) => {
      const dto = { url: 'https://example.com/new.png', alt: 'New image' };

      service.addImage(1, dto).subscribe({
        next: (image) => {
          expect(image.url).toBe(dto.url);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...dto, isPrimary: false, position: 1 });
    });

    it('should remove an image', (done) => {
      service.removeImage(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images/2');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should set primary image', (done) => {
      service.setPrimaryImage(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images/2/primary');
      expect(req.request.method).toBe('PATCH');
      req.flush(null);
    });
  });

  describe('Links management', () => {
    it('should add a link', (done) => {
      const dto = {
        url: 'https://twitter.com/test',
        label: 'Twitter',
        type: LinkType.TWITTER
      };

      service.addLink(1, dto).subscribe({
        next: (link) => {
          expect(link.url).toBe(dto.url);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...dto, isPrimary: false });
    });

    it('should update a link', (done) => {
      const dto = { label: 'Updated Label' };

      service.updateLink(1, 2, dto).subscribe({
        next: (link) => {
          expect(link).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links/2');
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockSponsor.links[0], ...dto });
    });

    it('should remove a link', (done) => {
      service.removeLink(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links/2');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
