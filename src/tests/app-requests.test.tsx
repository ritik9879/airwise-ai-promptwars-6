import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { Assistant } from '../components/Assistant';
import { getRecommendation } from '../domain/recommendations';
import { askAssistant, fetchAir, searchPlaces } from '../services/api';
import type { AirQuality, Place } from '../types';

vi.mock('../services/api', () => ({
  askAssistant: vi.fn(),
  fetchAir: vi.fn(),
  searchPlaces: vi.fn(),
}));

const delhi: Place = { id: 'delhi', name: 'Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 };
const mumbai: Place = { id: 'mumbai', name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.8777 };

function airFor(place: Place, aqi: number): AirQuality {
  return {
    place,
    aqi,
    pollutants: { pm2_5: null, pm10: null, nitrogen_dioxide: null, ozone: null, sulphur_dioxide: null, carbon_monoxide: null },
    timestamps: { current: null, fetchedAt: '' },
    hourly: [],
    standard: 'US AQI',
    source: 'Test fixture',
    dataKind: 'modeled',
    sourceNote: 'Test fixture only.',
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe('assistant context and request ordering', () => {
  it('sends the actual AQI band to the assistant and labels live generated output', async () => {
    vi.mocked(askAssistant).mockResolvedValue({ answer: 'Reduce outdoor exertion.', aiAvailable: true });
    const air = airFor(delhi, 212);
    render(<Assistant air={air} household="general" recommendation={getRecommendation({ aqi: 212, household: 'general' })} language="en" />);

    fireEvent.change(screen.getByLabelText('Ask a question'), { target: { value: 'What should my family do?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect(await screen.findByText('AI-generated explanation · based on context shown')).toBeTruthy();
    expect(screen.getByRole('note', { name: 'Rules-based precaution' })).toHaveTextContent('Keep outdoor time as short as practical and move exercise or play indoors. Follow current local public-health advice for severe episodes.');
    expect(screen.getByText(/When you submit, your question and selected context/)).toBeInTheDocument();
    expect(askAssistant).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        aqi: 212,
        category: 'Very unhealthy (212 U.S. AQI)',
        dataKind: 'modeled',
        measurementTime: null,
        household: 'general',
        activity: 'routine',
      }),
    }));
  });

  it('shows deterministic guidance and an availability notice when AI is unavailable', async () => {
    vi.mocked(askAssistant).mockResolvedValue({
      answer: null,
      aiAvailable: false,
      notice: 'AI guidance is temporarily unavailable; use the deterministic recommendation shown with your air data.',
    });
    const air = airFor(delhi, 212);
    const recommendation = getRecommendation({ aqi: 212, household: 'general' });
    render(<Assistant air={air} household="general" recommendation={recommendation} language="en" />);

    fireEvent.change(screen.getByLabelText('Ask a question'), { target: { value: 'What should I do?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));

    expect((await screen.findByRole('status')).textContent).toContain('AI guidance is temporarily unavailable');
    expect(screen.getAllByText(recommendation.action)).toHaveLength(2);
    expect(screen.queryByText('AI-generated explanation · based on context shown')).toBeNull();
  });

  it('discards an older air response after a newer location has loaded', async () => {
    const oldResponse = deferred<AirQuality>();
    vi.mocked(fetchAir)
      .mockReturnValueOnce(oldResponse.promise)
      .mockResolvedValueOnce(airFor(mumbai, 220));
    vi.mocked(searchPlaces).mockResolvedValue({ results: [mumbai] });

    render(<App />);
    await waitFor(() => expect(fetchAir).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Search a city or place'), { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { name: 'Mumbai, Maharashtra' })).toBeTruthy();
    await act(async () => { oldResponse.resolve(airFor(delhi, 212)); });
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Mumbai, Maharashtra' })).toBeTruthy());
    expect(screen.getByText('220')).toBeTruthy();
    expect(screen.queryByText('212')).toBeNull();
  });

  it('ignores an old one-result search after the user changes the query', async () => {
    const oldSearch = deferred<{ results: Place[] }>();
    vi.mocked(fetchAir).mockResolvedValue(airFor(delhi, 80));
    vi.mocked(searchPlaces).mockReturnValueOnce(oldSearch.promise);
    render(<App />);
    const input = screen.getByLabelText('Search a city or place');
    fireEvent.change(input, { target: { value: 'Oldtown' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(searchPlaces).toHaveBeenCalledWith('Oldtown'));

    fireEvent.change(input, { target: { value: 'Delhi' } });
    await act(async () => { oldSearch.resolve({ results: [{ ...mumbai, id: 'stale', name: 'Stale City' }] }); });

    expect(input).toHaveValue('Delhi');
    expect(screen.queryByRole('heading', { name: 'Stale City, Maharashtra' })).toBeNull();
    expect(fetchAir).toHaveBeenCalledTimes(1);
  });

  it('ignores delayed geolocation after the user starts a newer city search', async () => {
    let succeed!: (position: GeolocationPosition) => void;
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (success: typeof succeed) => { succeed = success; } } });
    vi.mocked(fetchAir).mockResolvedValue(airFor(delhi, 80));
    vi.mocked(searchPlaces).mockResolvedValue({ results: [mumbai] });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    const input = screen.getByLabelText('Search a city or place');
    fireEvent.change(input, { target: { value: 'Mumbai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('heading', { name: 'Mumbai, Maharashtra' })).toBeInTheDocument();

    await act(async () => { succeed({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition); });
    expect(screen.getByRole('heading', { name: 'Mumbai, Maharashtra' })).toBeInTheDocument();
    expect(fetchAir).toHaveBeenCalledTimes(2);
  });

  it('manages mobile navigation keyboard focus, trapping, Escape, and focus return', async () => {
    vi.mocked(fetchAir).mockResolvedValue(airFor(delhi, 80));
    render(<App />);
    const menu = screen.getByRole('button', { name: 'Open menu' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(menu);
    const first = screen.getByRole('button', { name: 'Overview' });
    const last = screen.getByRole('button', { name: 'Data & settings' });
    expect(screen.getByRole('button', { name: 'Close menu' }).getAttribute('aria-expanded')).toBe('true');
    expect(first).toHaveFocus();
    expect(document.getElementById('primary-navigation')).toBeTruthy();
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(menu).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Escape' });
    await waitFor(() => expect(menu).toHaveAttribute('aria-expanded', 'false'));
    expect(menu).toHaveFocus();
  });
});
