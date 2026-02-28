import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnalyticsAdminService } from './analytics-admin.service';
import {
  OverviewResponse,
  VisitorsResponse,
  RealtimeResponse
} from '../models';

const START = '2026-02-01';
const END   = '2026-02-28';

// FIX ALPHA-001 : mock aligné sur la structure backend (MetricWithComparison, previousPeriod)
const mockOverview: OverviewResponse = {
  period: { startDate: START, endDate: END },
  previousPeriod: { startDate: '2026-01-01', endDate: '2026-01-31' },
  metrics: {
    totalUsers:         { value: 1200, previous: 1000, changePercent: 20 },
    newUsers:           { value: 400,  previous: 350,  changePercent: 14.3 },
    sessions:           { value: 1800, previous: 1600, changePercent: 12.5 },
    pageViews:          { value: 5000, previous: 4200, changePercent: 19 },
    avgSessionDuration: { value: 142,  previous: 130,  changePercent: 9.2 },
    bounceRate:         { value: 45.3, previous: 47,   changePercent: -3.6 }
  }
};

const mockRealtime: RealtimeResponse = {
  activeUsers: 12,
  byPage: [{ page: '/', activeUsers: 5 }],
  byCountry: [{ country: 'France', activeUsers: 8 }],
  byDevice: [{ device: 'desktop', activeUsers: 10 }],
  updatedAt: new Date().toISOString()
};

describe('AnalyticsAdminService', () => {
  let service: AnalyticsAdminService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AnalyticsAdminService
      ]
    });
    service = TestBed.inject(AnalyticsAdminService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  describe('getOverview()', () => {
    it('doit appeler GET /api/admin/analytics/overview avec les bons paramètres', () => {
      service.getOverview(START, END).subscribe(data => {
        // FIX ALPHA-001 : accès via .value (MetricWithComparison)
        expect(data.metrics.totalUsers.value).toBe(1200);
        expect(data.metrics.bounceRate.value).toBe(45.3);
      });

      const req = httpTesting.expectOne(r =>
        r.url.includes('/api/admin/analytics/overview') &&
        r.params.get('startDate') === START &&
        r.params.get('endDate') === END
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockOverview);
    });

    it('doit propager une erreur HTTP 503', () => {
      service.getOverview('2026-02-01', '2026-02-28').subscribe({
        error: (err) => expect(err.status).toBe(503)
      });
      const req = httpTesting.expectOne(r => r.url.includes('/overview'));
      req.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('getVisitors()', () => {
    it('doit appeler GET /api/admin/analytics/visitors', () => {
      // FIX : DailyVisitorData inclut maintenant pageViews
      const mockVisitors: VisitorsResponse = {
        period: { startDate: START, endDate: END },
        data: [{ date: START, totalUsers: 50, newUsers: 20, sessions: 70, pageViews: 120 }]
      };

      service.getVisitors(START, END).subscribe(data => {
        expect(data.data.length).toBe(1);
      });

      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/visitors'));
      expect(req.request.method).toBe('GET');
      req.flush(mockVisitors);
    });
  });

  describe('getTopPages()', () => {
    it('doit appeler GET /api/admin/analytics/top-pages', () => {
      service.getTopPages(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/top-pages'));
      expect(req.request.method).toBe('GET');
      // FIX ALPHA-001 : champ data (pas pages)
      req.flush({ period: { startDate: START, endDate: END }, data: [] });
    });
  });

  describe('getTrafficSources()', () => {
    it('doit appeler GET /api/admin/analytics/traffic-sources', () => {
      service.getTrafficSources(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/traffic-sources'));
      expect(req.request.method).toBe('GET');
      // FIX ALPHA-001 : champs data + byChannel (pas channels + sources)
      req.flush({ period: { startDate: START, endDate: END }, data: [], byChannel: [] });
    });
  });

  describe('getGeography()', () => {
    it('doit appeler GET /api/admin/analytics/geography', () => {
      service.getGeography(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/geography'));
      expect(req.request.method).toBe('GET');
      // FIX ALPHA-001 : champs byCountry + byCity (pas countries)
      req.flush({ period: { startDate: START, endDate: END }, byCountry: [], byCity: [] });
    });
  });

  describe('getDevices()', () => {
    it('doit appeler GET /api/admin/analytics/devices', () => {
      service.getDevices(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/devices'));
      expect(req.request.method).toBe('GET');
      // FIX ALPHA-001 : champs byCategory + byBrowser (pas devices + browsers)
      req.flush({ period: { startDate: START, endDate: END }, byCategory: [], byBrowser: [] });
    });
  });

  describe('getRealtime()', () => {
    it('doit appeler GET /api/admin/analytics/realtime sans paramètres de date', () => {
      service.getRealtime().subscribe(data => {
        expect(data.activeUsers).toBe(12);
        // FIX ALPHA-001 : champ byPage (pas activePages)
        expect(data.byPage.length).toBe(1);
      });

      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/realtime'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockRealtime);
    });
  });
});
