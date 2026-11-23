import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import App from '../App';
import { Dashboard } from '../components/Dashboard';
import { FamilyMode, ImpactCalculator } from '../components/FeatureViews';
import { getRecommendation } from '../domain/recommendations';
import type { AirQuality } from '../types';

vi.mock('../services/api', () => ({
  fetchAir: vi.fn().mockRejectedValue(new Error('Unavailable in this test.')),
  searchPlaces: vi.fn(),
}));

const rec = getRecommendation({ aqi: null, household: 'general' });
const sample: AirQuality = { place: { id: 'x', name: 'Sample City', latitude: 0, longitude: 0 }, aqi: 155, pollutants: { pm2_5: 33, pm10: 54, nitrogen_dioxide: 4, ozone: 12, sulphur_dioxide: 2, carbon_monoxide: 100 }, timestamps: { current: null, fetchedAt: '' }, hourly: [], standard: 'US AQI', source: 'AirWise illustrative sample dataset', dataKind: 'modeled', sourceNote: 'Sample only; not live.' };

describe('accessible critical interactions', () => {
  it('provides a focusable main landmark for the skip-navigation link', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });
  it('does not label the dashboard unavailable while data is still loading', () => {
    render(<Dashboard air={null} loading error={null} demo={false} recommendation={rec} onDemo={() => {}}/>);
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading air-quality data');
    expect(screen.queryByText('Data unavailable')).toBeNull();
  });
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
  it('does not show a misleading percentage when the baseline has zero emissions', () => {
    render(<ImpactCalculator />);
    fireEvent.change(screen.getByLabelText('Baseline scenario'), { target: { value: 'walk' } });
    expect(screen.getByRole('img', { name: /baseline emissions are zero/i })).toBeInTheDocument();
    expect(screen.getByText('Percentage comparison is undefined when baseline emissions are zero.')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
  it('labels equal zero-emissions modes as no change, not 0% savings', () => {
    render(<ImpactCalculator />);
    fireEvent.change(screen.getByLabelText('Baseline scenario'), { target: { value: 'walk' } });
    fireEvent.change(screen.getByLabelText('Alternative scenario'), { target: { value: 'cycle' } });
    expect(screen.getByRole('heading', { name: /0\.00 kg CO₂e no change/i })).toBeInTheDocument();
    expect(screen.getByText('Percentage comparison is undefined when baseline emissions are zero.')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
