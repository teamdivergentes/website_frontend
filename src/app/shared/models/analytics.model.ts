/**
 * Modèles pour le dashboard Analytics (Google Analytics Data API)
 */

// ─── Overview ────────────────────────────────────────────────────────────────

export interface MetricComparison {
  value: number;
  change: number; // % de changement par rapport à la période précédente
}

export interface OverviewMetrics {
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDuration: number; // en secondes
  bounceRate: number; // en %
}

export interface OverviewComparison {
  totalUsers: MetricComparison;
  newUsers: MetricComparison;
  sessions: MetricComparison;
  pageViews: MetricComparison;
  avgSessionDuration: MetricComparison;
  bounceRate: MetricComparison;
}

export interface OverviewResponse {
  period: { startDate: string; endDate: string };
  metrics: OverviewMetrics;
  comparison: OverviewComparison;
}

// ─── Visitors (timeline) ─────────────────────────────────────────────────────

export interface DailyVisitorData {
  date: string;
  totalUsers: number;
  newUsers: number;
  sessions: number;
}

export interface VisitorsResponse {
  period: { startDate: string; endDate: string };
  data: DailyVisitorData[];
}

// ─── Top Pages ────────────────────────────────────────────────────────────────

export interface PageData {
  page: string;
  pageViews: number;
  uniquePageViews: number;
  avgTimeOnPage: number; // en secondes
  bounceRate: number; // en %
}

export interface TopPagesResponse {
  period: { startDate: string; endDate: string };
  pages: PageData[];
}

// ─── Traffic Sources ──────────────────────────────────────────────────────────

export interface TrafficChannel {
  channel: string;
  sessions: number;
  percentage: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
}

export interface TrafficSourcesResponse {
  period: { startDate: string; endDate: string };
  channels: TrafficChannel[];
  sources: TrafficSource[];
}

// ─── Geography ────────────────────────────────────────────────────────────────

export interface GeoCountry {
  country: string;
  countryCode: string;
  users: number;
  sessions: number;
}

export interface GeoResponse {
  period: { startDate: string; endDate: string };
  countries: GeoCountry[];
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export interface DeviceData {
  category: string; // desktop, mobile, tablet
  users: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  users: number;
  percentage: number;
}

export interface DevicesResponse {
  period: { startDate: string; endDate: string };
  devices: DeviceData[];
  browsers: BrowserData[];
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export interface ActivePage {
  page: string;
  activeUsers: number;
}

export interface RealtimeResponse {
  activeUsers: number;
  activePages: ActivePage[];
  updatedAt: string;
}

// ─── Date Range ───────────────────────────────────────────────────────────────

export interface DateRange {
  startDate: string; // format YYYY-MM-DD
  endDate: string;   // format YYYY-MM-DD
}

export type DateRangePreset = 'today' | '7days' | '30days' | '3months' | 'custom';
