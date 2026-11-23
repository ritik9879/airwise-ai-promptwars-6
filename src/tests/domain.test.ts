import { describe, expect, it } from 'vitest';
import { aqiBand, dataFreshness, formatConcentration } from '../domain/aqi';
import { compareTrip, tripEmissionsKg } from '../domain/emissions';
import { getRecommendation, makeDailyActions } from '../domain/recommendations';
import { localizedRecommendation } from '../i18n';

describe('US AQI presentation rules', () => {
  it.each([[0, 'Good'], [50, 'Good'], [51, 'Moderate'], [100, 'Moderate'], [101, 'Unhealthy for sensitive groups'], [150, 'Unhealthy for sensitive groups'], [151, 'Unhealthy'], [201, 'Very unhealthy'], [301, 'Hazardous']])('categorizes AQI %i consistently', (aqi, category) => {
    expect(aqiBand(aqi)?.category).toBe(category);
  });
  it.each([[50.4, 'Good'], [50.5, 'Moderate'], [100.4, 'Moderate'], [100.5, 'Unhealthy for sensitive groups'], [200.4, 'Unhealthy'], [200.5, 'Very unhealthy']])('rounds AQI %s before categorizing it', (aqi, category) => {
    expect(aqiBand(aqi)?.category).toBe(category);
  });
  it('categorizes the maximum and rejects missing, invalid, or out-of-range values', () => {
    expect(aqiBand(500)?.category).toBe('Hazardous');
    expect(aqiBand(null)).toBeNull();
    expect(aqiBand(Number.NaN)).toBeNull();
    expect(aqiBand(-1)).toBeNull();
    expect(aqiBand(501)).toBeNull();
  });
  it('labels pollutant concentrations with the right unit, not as AQI', () => { expect(formatConcentration(12.34)).toBe('12.3 µg/m³'); expect(formatConcentration(null)).toBe('—'); });
});

describe('data freshness', () => {
  const now = Date.parse('2026-11-21T12:00:00Z');
  it('marks current, recent, and stale timestamps', () => {
    expect(dataFreshness('2026-11-21T11:30:00Z', now)).toBe('live');
    expect(dataFreshness('2026-11-21T09:00:00Z', now)).toBe('recent');
    expect(dataFreshness('2026-11-21T04:00:00Z', now)).toBe('stale');
  });
  it('treats missing, malformed, or implausibly future timestamps as unavailable', () => {
    expect(dataFreshness(null, now)).toBe('unavailable');
    expect(dataFreshness('not a time', now)).toBe('unavailable');
    expect(dataFreshness('2026-11-21T14:00:00Z', now)).toBe('unavailable');
  });
});

describe('deterministic recommendations', () => {
  it('does not infer an all-clear when AQI is missing', () => {
    const result = getRecommendation({ aqi: null, household: 'children' });
    expect(result.action).toContain('unavailable');
    expect(result.uncertainty).toContain('no current measurement');
  });
  it('localizes missing-data guidance without implying clean air', () => {
    const result = localizedRecommendation(getRecommendation({ aqi: null, household: 'general' }), null, 'hi');
    expect(result.action).toContain('लाइव वायु गुणवत्ता डेटा उपलब्ध नहीं');
    expect(result.uncertainty).toContain('कोई वर्तमान माप उपलब्ध नहीं');
  });
  it('adapts advice to AQI and household preferences', () => {
    expect(getRecommendation({ aqi: 42, household: 'general' }).priority).toBe('low');
    expect(getRecommendation({ aqi: 110, household: 'children' }).rule).toContain('101–150');
    expect(getRecommendation({ aqi: 175, household: 'general', activity: 'vigorous' }).action).toContain('Skip the outdoor workout');
    expect(getRecommendation({ aqi: 230, household: 'older' }).priority).toBe('high');
  });
  it('keeps displayed rounded AQI bands and daily actions consistent at decimal boundaries', () => {
    expect(getRecommendation({ aqi: 50.4, household: 'general' }).rule).toContain('0–50');
    expect(getRecommendation({ aqi: 50.5, household: 'general' }).rule).toContain('51–100');
    expect(makeDailyActions({ aqi: 100.4, household: 'general' }, false).join(' ')).not.toContain('Keep windows closed');
    expect(makeDailyActions({ aqi: 100.5, household: 'general' }, false).join(' ')).toContain('Keep windows closed');
    expect(makeDailyActions({ aqi: 501, household: 'general' }, false).join(' ')).toContain('data is unavailable');
  });
  it('does not invent a cleaner hour without an hourly series', () => {
    expect(makeDailyActions({ aqi: 170, household: 'general' }, false).join(' ')).toContain('will not guess a cleaner time');
  });
});

describe('emissions estimates', () => {
  it('calculates baseline, alternative, avoided amount, and percentage transparently', () => {
    const result = compareTrip(10, 'car', 'bus');
    expect(result.baselineKg).toBeCloseTo(1.7265);
    expect(result.alternativeKg).toBeCloseTo(1.0151);
    expect(result.avoidedKg).toBeCloseTo(0.7114);
    expect(result.percent).toBeCloseTo(41.21, 1);
  });
  it('reports increased emissions as negative avoided emissions and percentage', () => {
    const result = compareTrip(10, 'bus', 'car');
    expect(result.avoidedKg).toBeCloseTo(-0.7114);
    expect(result.percent).toBeCloseTo(-70.08, 1);
  });
  it('uses explicit carpool occupancy and zero direct travel emissions for active modes', () => {
    expect(tripEmissionsKg(10, 'carpool')).toBeCloseTo(tripEmissionsKg(10, 'car') / 2);
    expect(tripEmissionsKg(10, 'walk')).toBe(0);
    expect(tripEmissionsKg(10, 'cycle')).toBe(0);
  });
  it('rejects invalid or implausibly large distances', () => {
    expect(() => tripEmissionsKg(-1, 'car')).toThrow(RangeError);
    expect(() => tripEmissionsKg(Number.NaN, 'car')).toThrow(RangeError);
    expect(() => tripEmissionsKg(Number.POSITIVE_INFINITY, 'car')).toThrow(RangeError);
    expect(() => tripEmissionsKg(1001, 'car')).toThrow(RangeError);
  });
  it('accepts the exact distance limits and handles a zero-emission baseline', () => {
    expect(tripEmissionsKg(0, 'car')).toBe(0);
    expect(tripEmissionsKg(1000, 'car')).toBeCloseTo(172.65);
    const result = compareTrip(10, 'walk', 'bus');
    expect(result.baselineKg).toBe(0);
    expect(result.alternativeKg).toBeCloseTo(1.0151);
    expect(result.avoidedKg).toBeCloseTo(-1.0151);
    expect(result.percent).toBeNull();
    expect(compareTrip(0, 'car', 'bus').percent).toBeNull();
    expect(compareTrip(10, 'walk', 'cycle')).toMatchObject({ baselineKg: 0, alternativeKg: 0, avoidedKg: 0, percent: null });
  });
});
