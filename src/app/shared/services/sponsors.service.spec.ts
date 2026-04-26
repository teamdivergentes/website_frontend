import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SponsorsService } from './sponsors.service';
import { Sponsor, LinkType, ImageLayout } from '../models';

describe('SponsorsService', () => {
  let service: SponsorsService;
  let httpMock: HttpTestingController;

  const mockSponsor: Sponsor = {
    id: 1,
    name: 'Test Sponsor',
    slug: 'test-sponsor',
    description: 'Test description',
    position: 0,
    active: true,
    imageLayout: ImageLayout.LAYOUT_1,
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        SponsorsService
      ]
    });

    service = TestBed.inject(SponsorsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('loadSponsors', () => {
    it('should load the sponsors list', (done) => {
      service.loadSponsors().subscribe({
        next: (data) => {
          expect(data).toEqual([mockSponsor]);
          expect(service.sponsors()).toEqual([mockSponsor]);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors');
      expect(req.request.method).toBe('GET');
      req.flush([mockSponsor]);
    });

    it('should initialise sponsors signal to empty array', () => {
      expect(service.sponsors()).toEqual([]);
    });

    it('should update sponsors signal on successful load', (done) => {
      service.loadSponsors().subscribe({
        next: () => {
          expect(service.sponsors()).toEqual([mockSponsor]);
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/api/sponsors');
      req.flush([mockSponsor]);
    });
  });

  describe('createSponsor', () => {
    it('should POST a new sponsor and trigger a reload', (done) => {
      const dto = { name: 'New Sponsor' };

      service.createSponsor(dto).subscribe({
        next: (sponsor) => {
          expect(sponsor.name).toBe('New Sponsor');
          done();
        }
      });

      const createReq = httpMock.expectOne('http://localhost:3000/api/sponsors');
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body).toEqual(dto);
      createReq.flush({ ...mockSponsor, ...dto });

      // Absorb the reload triggered by tap()
      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('updateSponsor', () => {
    it('should PUT sponsor changes and trigger a reload', (done) => {
      const dto = { name: 'Updated Name' };

      service.updateSponsor(1, dto).subscribe({
        next: (sponsor) => {
          expect(sponsor.name).toBe('Updated Name');
          done();
        }
      });

      const updateReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1');
      expect(updateReq.request.method).toBe('PUT');
      expect(updateReq.request.body).toEqual(dto);
      updateReq.flush({ ...mockSponsor, ...dto });

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('deleteSponsor', () => {
    it('should DELETE a sponsor and trigger a reload', (done) => {
      service.deleteSponsor(1).subscribe({
        next: () => {
          done();
        }
      });

      const deleteReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('toggleSponsorActive', () => {
    it('should PATCH toggle and trigger a reload', (done) => {
      service.toggleSponsorActive(1).subscribe({
        next: (sponsor) => {
          expect(sponsor).toBeDefined();
          done();
        }
      });

      const toggleReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/toggle');
      expect(toggleReq.request.method).toBe('PATCH');
      toggleReq.flush({ ...mockSponsor, active: false });

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('reorder', () => {
    it('should PATCH reorder with orderedIds and trigger a reload', (done) => {
      service.reorder([2, 1, 3]).subscribe({
        next: () => {
          done();
        }
      });

      const reorderReq = httpMock.expectOne('http://localhost:3000/api/sponsors/reorder');
      expect(reorderReq.request.method).toBe('PATCH');
      expect(reorderReq.request.body).toEqual({ orderedIds: [2, 1, 3] });
      reorderReq.flush(null);

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('Images management', () => {
    it('should POST a new image and trigger a reload', (done) => {
      const dto = { url: 'https://example.com/new.png', alt: 'New image' };

      service.addImage(1, dto).subscribe({
        next: (image) => {
          expect(image.url).toBe(dto.url);
          done();
        }
      });

      const addReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images');
      expect(addReq.request.method).toBe('POST');
      addReq.flush({ id: 2, ...dto, isPrimary: false, position: 1 });

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });

    it('should DELETE an image and trigger a reload', (done) => {
      service.removeImage(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const deleteReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images/2');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });

    it('should PATCH set primary image and trigger a reload', (done) => {
      service.setPrimaryImage(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const primaryReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/images/2/primary');
      expect(primaryReq.request.method).toBe('PATCH');
      primaryReq.flush(null);

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });

  describe('Links management', () => {
    it('should POST a new link and trigger a reload', (done) => {
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

      const addReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links');
      expect(addReq.request.method).toBe('POST');
      addReq.flush({ id: 2, ...dto, isPrimary: false });

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });

    it('should PUT link changes and trigger a reload', (done) => {
      const dto = { label: 'Updated Label' };

      service.updateLink(1, 2, dto).subscribe({
        next: (link) => {
          expect(link).toBeDefined();
          done();
        }
      });

      const updateReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links/2');
      expect(updateReq.request.method).toBe('PUT');
      updateReq.flush({ ...mockSponsor.links[0], ...dto });

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });

    it('should DELETE a link and trigger a reload', (done) => {
      service.removeLink(1, 2).subscribe({
        next: () => {
          done();
        }
      });

      const deleteReq = httpMock.expectOne('http://localhost:3000/api/sponsors/1/links/2');
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      const reloadReq = httpMock.expectOne('http://localhost:3000/api/sponsors/admin/all');
      reloadReq.flush([mockSponsor]);
    });
  });
});
