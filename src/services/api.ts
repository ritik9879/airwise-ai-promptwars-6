import type { AirQuality, Place } from '../types';
import type { Household } from '../domain/recommendations';

export type AssistantContext = {
  location: string;
  aqi: number | null;
  category: string;
  dataKind: 'modeled' | 'unavailable';
  measurementTime: string | null;
  household: Household;
  activity: string;
  deterministicAction: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `Request failed (${response.status}).`);
  return body as T;
}

export const searchPlaces = (query: string) => api<{ results: Place[] }>(`/api/geocode?q=${encodeURIComponent(query)}`);
export const fetchAir = (lat: number, lon: number) => api<AirQuality>(`/api/air?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
export const askAssistant = (payload: { question: string; language: 'en' | 'hi'; context: AssistantContext }) =>
  api<{ answer: string | null; aiAvailable: boolean; notice?: string }>('/api/assistant', { method: 'POST', body: JSON.stringify(payload) });
