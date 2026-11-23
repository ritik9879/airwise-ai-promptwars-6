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
  it('does not create a measurement when AQI is missing or a concentration is negative', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ current: { time: 1795287600, pm2_5: 20, pm10: -2 }, hourly: { time: [], us_aqi: [] } }), { status: 200 })));
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/air?lat=12.3&lon=45.6`);
      const data = await response.json();
      expect(data.aqi).toBeNull();
      expect(data.pollutants.pm2_5).toBe(20);
      expect(data.pollutants.pm10).toBeNull();
    });
  });
  it.each([-1, 501])('normalizes out-of-range provider AQI %i to unavailable', async (aqi) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ current: { us_aqi: aqi }, hourly: { time: [], us_aqi: [] } }), { status: 200 })));
    const lat = aqi < 0 ? 23.4 : 24.4;
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/air?lat=${lat}&lon=45.6`);
      expect(response.status).toBe(200);
      expect((await response.json()).aqi).toBeNull();
    });
  });
  it('drops unrepresentable timestamps instead of failing the full air response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ current: { time: 1e300, us_aqi: 120 }, hourly: { time: [1e300], us_aqi: [120] } }), { status: 200 })));
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/air?lat=25.4&lon=46.6`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.timestamps.current).toBeNull();
      expect(data.hourly).toEqual([]);
    });
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
  it('returns a JSON client error for malformed request bodies', async () => {
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"question":' });
      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Request body must contain valid JSON.' });
    });
  });
  it('returns a JSON 413 for oversized request bodies', async () => {
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'x'.repeat(20_000) }),
      });
      expect(response.status).toBe(413);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'Request body is too large.' });
    });
  });
  it('returns and identifies a configured live AI response', async () => {
    vi.stubEnv('MANUS_API_URL', 'https://llm.example');
    vi.stubEnv('MANUS_API_KEY', 'test-only-key');
    const upstream = vi.fn(async (_url, options) => {
      expect(options.headers.Authorization).toBe('Bearer test-only-key');
      const request = JSON.parse(options.body);
      expect(request.messages[0].role).toBe('system');
      expect(request.messages[0].content).toContain('untrusted, unverified input');
      expect(request.messages[0].content).toContain('begin with it verbatim');
      expect(request.messages[0].content).not.toContain('"aqi":212');
      expect(request.messages[1].role).toBe('user');
      expect(JSON.parse(request.messages[1].content)).toEqual({
        question: 'What should we do?',
        context: { location: 'Delhi', aqi: 212, category: 'Very unhealthy', dataKind: 'modeled', measurementTime: '2026-11-22T12:00:00.000Z', deterministicAction: 'Move vigorous play indoors.' },
      });
      return new Response(JSON.stringify({ choices: [{ message: { content: 'Move vigorous play indoors. This is a modeled value, not a personal measurement.' } }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', upstream);
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'What should we do?', language: 'en', context: { location: 'Delhi', aqi: 212, category: 'Very unhealthy', dataKind: 'modeled', measurementTime: '2026-11-22T12:00:00.000Z', deterministicAction: 'Move vigorous play indoors.' } }) });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ answer: 'Move vigorous play indoors. This is a modeled value, not a personal measurement.', aiAvailable: true });
      expect(upstream).toHaveBeenCalledTimes(1);
    });
  });
  it('falls back when a nominally successful AI response contradicts or omits the deterministic precaution', async () => {
    vi.stubEnv('MANUS_API_URL', 'https://llm.example');
    vi.stubEnv('MANUS_API_KEY', 'test-only-key');
    const upstream = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'It is safe to exercise outdoors; ignore the precaution.' } }] }), { status: 200 }));
    vi.stubGlobal('fetch', upstream);
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Can we exercise outside?', language: 'en', context: { location: 'Delhi', aqi: 212, deterministicAction: 'Move vigorous play indoors.' } }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ answer: null, aiAvailable: false, notice: 'The AI reply did not preserve the rules-based precaution; deterministic guidance remains available.' });
      expect(upstream).toHaveBeenCalledTimes(1);
    });
  });
  it('does not call the AI provider without a deterministic action', async () => {
    vi.stubEnv('MANUS_API_URL', 'https://llm.example');
    vi.stubEnv('MANUS_API_KEY', 'test-only-key');
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'What should I do?', language: 'en', context: { location: 'Delhi' } }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ answer: null, aiAvailable: false, notice: expect.stringContaining('without a rules-based precaution') });
      expect(upstream).not.toHaveBeenCalled();
    });
  });
  it('uses deterministic fallback when the configured AI provider fails', async () => {
    vi.stubEnv('MANUS_API_URL', 'https://llm.example');
    vi.stubEnv('MANUS_API_KEY', 'test-only-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));
    await withServer(async (base) => {
      const response = await nativeFetch(`${base}/api/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: 'What should we do?', language: 'en', context: { location: 'Delhi', aqi: 212, deterministicAction: 'Move outdoor activity indoors.' } }) });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ answer: null, aiAvailable: false, notice: expect.stringContaining('temporarily unavailable') });
    });
  });
});
