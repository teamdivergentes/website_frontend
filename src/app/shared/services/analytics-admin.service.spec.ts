import { TestBed } from '@angular/core/testing';
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

const mockOverview: OverviewResponse = {
  period: { startDate: START, endDate: END },
  metrics: {
    totalUsers: 1200,
    newUsers: 400,
    sessions: 1800,
    pageViews: 5000,
    avgSessionDuration: 142,
    bounceRate: 45.3
  },
  comparison: {
    totalUsers: { value: 1000, change: 20 },
    newUsers: { value: 350, change: 14.3 },
    sessions: { value: 1600, change: 12.5 },
    pageViews: { value: 4200, change: 19 },
    avgSessionDuration: { value: 130, change: 9.2 },
    bounceRate: { value: 47, change: -3.6 }
  }
};

const mockRealtime: RealtimeResponse = {
  activeUsers: 12,
  activePages: [{ page: '/', activeUsers: 5 }],
  updatedAt: new Date().toISOString()
};

describe('AnalyticsAdminService', () => {
  let service: AnalyticsAdminService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
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
        expect(data.metrics.totalUsers).toBe(1200);
        expect(data.metrics.bounceRate).toBe(45.3);
      });

      const req = httpTesting.expectOne(r =>
        r.url.includes('/api/admin/analytics/overview') &&
        r.params.get('startDate') === START &&
        r.params.get('endDate') === END
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockOverview);
    });
  });

  describe('getVisitors()', () => {
    it('doit appeler GET /api/admin/analytics/visitors', () => {
      const mockVisitors: VisitorsResponse = {
        period: { startDate: START, endDate: END },
        data: [{ date: START, totalUsers: 50, newUsers: 20, sessions: 70 }]
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
      req.flush({ period: { startDate: START, endDate: END }, pages: [] });
    });
  });

  describe('getTrafficSources()', () => {
    it('doit appeler GET /api/admin/analytics/traffic-sources', () => {
      service.getTrafficSources(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/traffic-sources'));
      expect(req.request.method).toBe('GET');
      req.flush({ period: { startDate: START, endDate: END }, channels: [], sources: [] });
    });
  });

  describe('getGeography()', () => {
    it('doit appeler GET /api/admin/analytics/geography', () => {
      service.getGeography(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/geography'));
      expect(req.request.method).toBe('GET');
      req.flush({ period: { startDate: START, endDate: END }, countries: [] });
    });
  });

  describe('getDevices()', () => {
    it('doit appeler GET /api/admin/analytics/devices', () => {
      service.getDevices(START, END).subscribe();
      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/devices'));
      expect(req.request.method).toBe('GET');
      req.flush({ period: { startDate: START, endDate: END }, devices: [], browsers: [] });
    });
  });

  describe('getRealtime()', () => {
    it('doit appeler GET /api/admin/analytics/realtime sans paramètres de date', () => {
      service.getRealtime().subscribe(data => {
        expect(data.activeUsers).toBe(12);
      });

      const req = httpTesting.expectOne(r => r.url.includes('/api/admin/analytics/realtime'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockRealtime);
    });
  });
});
