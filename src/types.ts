export type Place = { id: string; name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone?: string };
export type PollutantKey = 'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'ozone' | 'sulphur_dioxide' | 'carbon_monoxide';
export type AirQuality = {
  place: Place;
  aqi: number | null;
  pollutants: Record<PollutantKey, number | null>;
  timestamps: { current: string | null; fetchedAt: string };
  hourly: Array<{ time: string; aqi: number | null }>;
  standard: 'US AQI';
  source: string;
  dataKind: 'modeled';
  sourceNote: string;
};
