import { aqiBand } from './aqi';

export type Household = 'general' | 'children' | 'older' | 'extra-care';
export type AirContext = { aqi: number | null; household: Household; activity?: 'routine' | 'vigorous' | 'commute' };
export type Recommendation = { title: string; action: string; why: string; rule: string; benefit: string; uncertainty: string; priority: 'low' | 'medium' | 'high' };

export function getRecommendation({ aqi, household, activity = 'routine' }: AirContext): Recommendation {
  const band = aqiBand(aqi);
  const vulnerable = household !== 'general';
  if (aqi == null || !band) {
    return {
      title: 'Use the general precaution checklist',
      action: 'Live air-quality data is unavailable. Avoid treating this as an all-clear; check a trusted local source before strenuous outdoor activity.',
      why: 'No valid current AQI is available for the selected location.',
      rule: 'When measurement data is missing, AirWise does not infer pollution severity.',
      benefit: 'Avoids false reassurance while still offering a practical next step.',
      uncertainty: 'Local conditions may differ; no current measurement is displayed.',
      priority: 'medium',
    };
  }
  const value = Math.round(aqi);
  const contextNote = vulnerable ? ' Your selected household context includes people who may benefit from extra precaution.' : '';
  if (value <= 50) {
    return { title: 'Outdoor plans look reasonable', action: 'Normal outdoor activity is generally reasonable. Keep checking local conditions if anyone is unusually sensitive.', why: `The supplied U.S. AQI is ${value} (${band.category}).${contextNote}`, rule: 'US AQI 0–50: Good.', benefit: 'Keeps normal routines possible while maintaining awareness.', uncertainty: 'This is outdoor modeled air-quality data, not a household indoor reading or medical assessment.', priority: 'low' };
  }
  if (value <= 100) {
    return { title: vulnerable ? 'Keep strenuous activity flexible' : 'Plan with a little extra awareness', action: vulnerable ? 'Consider shorter or less intense outdoor exercise for children, older adults, or anyone who prefers extra precautions.' : 'Most routines can continue; consider reducing prolonged, strenuous activity if you notice discomfort.', why: `The supplied U.S. AQI is ${value} (${band.category}).${contextNote}`, rule: vulnerable ? 'US AQI 51–100 with a sensitive-household preference: recommend extra caution for prolonged vigorous activity.' : 'US AQI 51–100: Moderate.', benefit: 'Reduces prolonged exposure while preserving practical daily activity.', uncertainty: 'Individual sensitivity varies; this is general guidance, not medical advice.', priority: vulnerable ? 'medium' : 'low' };
  }
  if (value <= 150) {
    return { title: 'Move vigorous activity indoors if possible', action: vulnerable ? 'Choose an indoor activity for children, older adults, or household members who selected extra precautions. Keep outdoor exertion brief and easy.' : 'Reduce prolonged or heavy outdoor exertion; consider an indoor alternative for a workout.', why: `The supplied U.S. AQI is ${value} (${band.category}).${contextNote}`, rule: 'US AQI 101–150: Unhealthy for Sensitive Groups.', benefit: 'Limits the most exposure-intensive activity for groups flagged by the AQI category.', uncertainty: 'The provider supplies a modeled outdoor index; AirWise does not know personal health status or indoor air quality.', priority: 'high' };
  }
  if (value <= 200) {
    const vigorous = activity === 'vigorous';
    return { title: 'Shift strenuous outdoor time indoors', action: vigorous ? 'Skip the outdoor workout today; choose an indoor session or a lighter activity.' : 'Reduce prolonged or strenuous outdoor activity. If outdoor time is necessary, keep it brief and choose a lower-traffic route when practical.', why: `The supplied U.S. AQI is ${value} (${band.category}).${contextNote}`, rule: 'US AQI 151–200: Unhealthy.', benefit: 'Cuts exposure during the highest-breathing-rate activities.', uncertainty: 'Route-level pollution and indoor conditions are not measured by this app.', priority: 'high' };
  }
  return { title: 'Minimize outdoor exertion', action: 'Keep outdoor time as short as practical and move exercise or play indoors. Follow current local public-health advice for severe episodes.', why: `The supplied U.S. AQI is ${value} (${band.category}).${contextNote}`, rule: value <= 300 ? 'US AQI 201–300: Very Unhealthy.' : 'US AQI 301+: Hazardous.', benefit: 'Reduces time spent outdoors during very high modeled pollution.', uncertainty: 'This is general environmental guidance. Seek local public-health or clinical advice for individual concerns.', priority: 'high' };
}

export function makeDailyActions(context: AirContext, hasHourly: boolean): string[] {
  const recommendation = getRecommendation(context);
  const actions = [recommendation.action];
  const validBand = aqiBand(context.aqi);
  const roundedAqi = context.aqi == null ? null : Math.round(context.aqi);
  if (validBand && roundedAqi !== null && roundedAqi > 100) {
    actions.push(hasHourly ? 'Use the displayed modeled hourly series to compare timing; treat it as guidance, not a guarantee.' : 'No hourly series is available, so AirWise will not guess a cleaner time.');
    actions.push('Keep windows closed while outdoor pollution is elevated when practical; ventilate with outdoor air when conditions improve.');
  } else if (validBand) {
    actions.push('Ventilate when it is comfortable and outdoor conditions remain favorable.');
  } else {
    actions.push('Check a trusted local air-quality source before planning prolonged outdoor exercise.');
  }
  actions.push('Use a lower-emission commute if it is safe, available, and practical for this trip.');
  return actions;
}
