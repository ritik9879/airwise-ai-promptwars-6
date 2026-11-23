export type AqiCategory = 'Good' | 'Moderate' | 'Unhealthy for sensitive groups' | 'Unhealthy' | 'Very unhealthy' | 'Hazardous';

export type AqiBand = {
  category: AqiCategory;
  low: number;
  high: number;
  color: string;
  short: string;
};

export const AQI_BANDS: AqiBand[] = [
  { category: 'Good', low: 0, high: 50, color: '#16866c', short: 'Good' },
  { category: 'Moderate', low: 51, high: 100, color: '#c28a12', short: 'Moderate' },
  { category: 'Unhealthy for sensitive groups', low: 101, high: 150, color: '#dd6b21', short: 'Sensitive groups' },
  { category: 'Unhealthy', low: 151, high: 200, color: '#c43d50', short: 'Unhealthy' },
  { category: 'Very unhealthy', low: 201, high: 300, color: '#8054b8', short: 'Very unhealthy' },
  { category: 'Hazardous', low: 301, high: 500, color: '#7a263a', short: 'Hazardous' },
];

export function aqiBand(value: number | null | undefined): AqiBand | null {
  if (value == null || !Number.isFinite(value) || value < 0 || value > 500) return null;
  const displayedIndex = Math.round(value);
  return AQI_BANDS.find((band) => displayedIndex <= band.high) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

export type Freshness = 'live' | 'recent' | 'stale' | 'unavailable';

export function dataFreshness(timestamp: string | null | undefined, now = Date.now()): Freshness {
  if (!timestamp) return 'unavailable';
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed) || parsed > now + 60 * 60 * 1000) return 'unavailable';
  const ageMinutes = Math.max(0, now - parsed) / 60_000;
  if (ageMinutes <= 90) return 'live';
  if (ageMinutes <= 360) return 'recent';
  return 'stale';
}

export function formatConcentration(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} µg/m³`;
}
