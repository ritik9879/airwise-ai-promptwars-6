// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.mjs';

const nativeFetch = globalThis.fetch;
async function withServer(run) {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try { return await run(`http://127.0.0.1:${port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('AirWise API', () => {
  it('exposes an unauthenticated health check', async () => withServer(async (base) => {
    const response = await nativeFetch(`${base}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok', service: 'AirWise AI' });
  }));
  it('rejects invalid coordinates before making an external request', async () => {
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream);
    await withServer(async (base) => { const response = await nativeFetch(`${base}/api/air?lat=300&lon=181`); expect(response.status).toBe(400); expect(upstream).not.toHaveBeenCalled(); });
  });
  it('normalizes provider AQI, pollutant concentration units, timestamps, and model metadata', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ latitude: 28.6, longitude: 77.2, timezone: 'Asia/Kolkata', current: { time: 1795287600, us_aqi: 126, pm2_5: 42.3, pm10: 80, nitrogen_dioxide: null, ozone: 10, sulphur_dioxide: 2, carbon_monoxide: 200 }, hourly: { time: [1795287600, 1795291200], us_aqi: [126, 110] } }), { status: 200 })));
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/air?lat=28.61&lon=77.21`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject({ aqi: 126, standard: 'US AQI', dataKind: 'modeled', place: { timezone: 'Asia/Kolkata' }, timestamps: { current: new Date(1795287600 * 1000).toISOString() } });
      expect(data.pollutants.pm2_5).toBe(42.3);
      expect(data.pollutants.nitrogen_dioxide).toBeNull();
      expect(data.hourly).toHaveLength(2);
      expect(data.sourceNote).toContain('not a local ground-station');
    });
  });
  it('does not create a measurement when the current AQI is missing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ current: { time: 1795287600, pm2_5: 20 }, hourly: { time: [], us_aqi: [] } }), { status: 200 })));
    await withServer(async (base) => { const response = await nativeFetch(`${base}/api/air?lat=12.3&lon=45.6`); const data = await response.json(); expect(data.aqi).toBeNull(); expect(data.pollutants.pm2_5).toBe(20); });
  });
  it('returns an unavailable response instead of substituting data on provider failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    await withServer(async (base) => { const response = await nativeFetch(`${base}/api/air?lat=16.2&lon=74.1`); expect(response.status).toBe(502); expect((await response.json()).error).toContain('No live value has been substituted'); });
  });
  it('gracefully disables AI when the server-side service is absent and rejects oversized questions', async () => {
    vi.stubEnv('MANUS_API_URL', ''); vi.stubEnv('MANUS_API_KEY', '');
    await withServer(async (base) => {
      const valid = await nativeFetch(`${base}/api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'Can my child play?', language: 'en', context: { location: 'Delhi', aqi: null, deterministicAction: 'Check local data.' } }) });
      expect(await valid.json()).toMatchObject({ answer: null, aiAvailable: false });
      const invalid = await nativeFetch(`${base}/api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'x'.repeat(501), language: 'en', context: {} }) });
      expect(invalid.status).toBe(400);
    });
  });
});
