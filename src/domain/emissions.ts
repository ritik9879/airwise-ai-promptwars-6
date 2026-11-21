export type Mode = 'car' | 'bus' | 'metro' | 'walk' | 'cycle' | 'carpool';
export const FACTOR_VERSION = 'UK Government GHG Conversion Factors 2026';
export const FACTORS_KG_PER_KM: Record<Mode, number> = {
  car: 0.17265,       // average car, per vehicle-km
  bus: 0.10151,       // average local bus, per passenger-km
  metro: 0.01549,     // London Underground proxy, per passenger-km
  walk: 0,
  cycle: 0,
  carpool: 0.17265 / 2, // average car divided by an explicit two-person occupancy assumption
};
export const MODE_LABELS: Record<Mode, string> = { car: 'Drive alone', bus: 'Local bus', metro: 'Metro / rail proxy', walk: 'Walk', cycle: 'Cycle', carpool: 'Carpool (2 people)' };

export function tripEmissionsKg(distanceKm: number, mode: Mode): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > 1000) throw new RangeError('Distance must be between 0 and 1,000 km.');
  return distanceKm * FACTORS_KG_PER_KM[mode];
}

export function compareTrip(distanceKm: number, baseline: Mode, alternative: Mode) {
  const baselineKg = tripEmissionsKg(distanceKm, baseline);
  const alternativeKg = tripEmissionsKg(distanceKm, alternative);
  const avoidedKg = baselineKg - alternativeKg;
  return { baselineKg, alternativeKg, avoidedKg, percent: baselineKg > 0 ? (avoidedKg / baselineKg) * 100 : 0 };
}
