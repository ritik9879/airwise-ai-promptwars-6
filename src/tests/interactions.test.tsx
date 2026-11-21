import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from '../components/Dashboard';
import { FamilyMode } from '../components/FeatureViews';
import { getRecommendation } from '../domain/recommendations';
import type { AirQuality } from '../types';

const rec = getRecommendation({ aqi: null, household: 'general' });
const sample: AirQuality = { place: { id: 'x', name: 'Sample City', latitude: 0, longitude: 0 }, aqi: 155, pollutants: { pm2_5: 33, pm10: 54, nitrogen_dioxide: 4, ozone: 12, sulphur_dioxide: 2, carbon_monoxide: 100 }, timestamps: { current: null, fetchedAt: '' }, hourly: [], standard: 'US AQI', source: 'AirWise illustrative sample dataset', dataKind: 'modeled', sourceNote: 'Sample only; not live.' };

describe('accessible critical interactions', () => {
  it('shows unavailable state without rendering a fabricated live number', () => {
    render(<Dashboard air={null} loading={false} error={null} demo={false} recommendation={rec} onDemo={() => {}}/>);
    expect(screen.getByText(/no live reading is available/i)).toBeInTheDocument();
    expect(screen.queryByText('162')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo data/i })).toBeInTheDocument();
  });
  it('labels sample measurements as demonstration data', () => {
    render(<Dashboard air={sample} loading={false} error={null} demo recommendation={getRecommendation({ aqi: sample.aqi, household: 'general' })} onDemo={() => {}}/>);
    expect(screen.getByText('Demonstration sample')).toBeInTheDocument();
    expect(screen.getByText('Illustrative sample — not live')).toBeInTheDocument();
    expect(screen.getByText('155')).toBeInTheDocument();
  });
  it('updates household preference with an operable, announced button', () => {
    let selected: 'general'|'children'|'older'|'extra-care' = 'general';
    const { rerender } = render(<FamilyMode household={selected} setHousehold={(v) => { selected = v; }}/ >);
    const children = screen.getByRole('button', { name: /children at home/i });
    expect(children).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(children);
    expect(selected).toBe('children');
    rerender(<FamilyMode household={selected} setHousehold={(v) => { selected = v; }}/ >);
    expect(screen.getByRole('button', { name: /children at home/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
