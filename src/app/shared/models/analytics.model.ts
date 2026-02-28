/**
 * Modèles pour le dashboard Analytics (Google Analytics Data API)
 * Alignés sur les structures de réponse du backend (source de vérité).
 */

// ─── Overview ────────────────────────────────────────────────────────────────

/** Métrique avec valeur actuelle, valeur précédente et % de variation */
export interface MetricWithComparison {
  value: number;
  previous: number;
  changePercent: number;
}

export interface OverviewMetrics {
  totalUsers: MetricWithComparison;
  newUsers: MetricWithComparison;
  sessions: MetricWithComparison;
  pageViews: MetricWithComparison;
  avgSessionDuration: MetricWithComparison; // en secondes
  bounceRate: MetricWithComparison; // en %
}

export interface OverviewResponse {
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string };
  metrics: OverviewMetrics;
}

// ─── Visitors (timeline) ─────────────────────────────────────────────────────

export interface DailyVisitorData {
  date: string;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
}

export interface VisitorsResponse {
  period: { startDate: string; endDate: string };
  data: DailyVisitorData[];
}

// ─── Top Pages ────────────────────────────────────────────────────────────────

export interface PageData {
  path: string;
  title: string;
  pageViews: number;
  totalUsers: number;
  avgSessionDuration: number; // en secondes
  bounceRate: number; // en %
}

export interface TopPagesResponse {
  period: { startDate: string; endDate: string };
  data: PageData[];
}

// ─── Traffic Sources ──────────────────────────────────────────────────────────

export interface TrafficChannel {
  channel: string;
  sessions: number;
  totalUsers: number;
  bounceRate: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  totalUsers: number;
  bounceRate: number;
}

export interface TrafficSourcesResponse {
  period: { startDate: string; endDate: string };
  data: TrafficSource[];
  byChannel: TrafficChannel[];
}

// ─── Geography ────────────────────────────────────────────────────────────────

export interface GeoCountry {
  country: string;
  countryId: string;
  totalUsers: number;
  sessions: number;
}

export interface GeoCity {
  city: string;
  totalUsers: number;
  sessions: number;
}

export interface GeoResponse {
  period: { startDate: string; endDate: string };
  byCountry: GeoCountry[];
  byCity: GeoCity[];
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export interface DeviceData {
  category: string; // desktop, mobile, tablet
  totalUsers: number;
  sessions: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  totalUsers: number;
  sessions: number;
  percentage: number;
}

export interface DevicesResponse {
  period: { startDate: string; endDate: string };
  byCategory: DeviceData[];
  byBrowser: BrowserData[];
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export interface ActivePage {
  page: string;
  activeUsers: number;
}

export interface RealtimeResponse {
  activeUsers: number;
  byPage: ActivePage[];
  byCountry: { country: string; activeUsers: number }[];
  byDevice: { device: string; activeUsers: number }[];
  updatedAt: string;
}

// ─── Date Range ───────────────────────────────────────────────────────────────

export interface DateRange {
  startDate: string; // format YYYY-MM-DD
  endDate: string;   // format YYYY-MM-DD
}

export type DateRangePreset = 'today' | '7days' | '30days' | '3months' | 'custom';
