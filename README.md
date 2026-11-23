# AirWise AI

**Breathe Smarter. Live Better.**

AirWise AI is a PromptWars Challenge 6 — Urban Air Quality Assistant project. It helps families and communities turn sourced outdoor-air data into explainable daily actions, indoor-air improvements, lower-emission travel comparisons, and practical household precautions.

## Challenge and solution

Winter smog and urban air pollution make routine choices difficult: whether to exercise outside, how to commute, when to ventilate, and how to protect people who prefer extra precaution. AirWise pairs provider-supplied air-quality data with deterministic rules and transparent limitations. A server-side AI assistant may explain the selected context, while a separate rules-based precaution remains visible. The server rejects an AI answer that does not begin with that precaution; this lexical check and model instruction do not guarantee that the rest of an answer is semantically safe. Missing data remains missing; the optional sample mode is clearly labeled as fictional demonstration data.

## Features

- Search places, select a location manually, or request browser geolocation permission.
- View U.S. AQI, its category, pollutant concentrations and units, source attribution, timestamp/freshness, model output explanation, and available hourly model series.
- Receive AQI- and household-aware routine recommendations with “Why AirWise recommends this” decision details.
- Use a personalized day planner, practical indoor-air advisor, family preference mode, community action list, English/Hindi interface, and contextual assistant.
- Compare car, local-bus, metro-proxy, walk, cycle, and carpool estimates. Run an impact what-if scenario using explicit factors and caveats. Keep exposure advice separate from emissions comparison.
- Use a responsive interface with semantic controls, keyboard-visible focus, reduced-motion support, non-color-only AQI status, form labels, and screen-reader descriptions.

## Architecture

The browser is a React/TypeScript single-page app built with Vite. A compact Express server serves the application and same-origin API routes. The server proxies Open-Meteo geocoding and air-quality data with validation, request timeouts, short caches, and rate limits; malformed and oversized JSON receive bounded JSON errors. The assistant uses the project-provided Manus chat-completions API only from the server. Its bounded browser-supplied context includes AQI band, modeled-data provenance, timestamp availability, household preference, and deterministic guidance; it is passed as untrusted user data, separate from the system instructions. The submitted question and selected context go to the configured AI service; AirWise does not save chat. Rate limits are in-memory per process/instance and depend on the deployment proxy's client-IP forwarding behavior. Domain rules for AQI categories, freshness, recommendations, and impact calculations live in pure testable modules. No database or account system is used.

```text
src/
  App.tsx                    app state, location, preferences, navigation
  components/                dashboard, assistant, and feature views
  domain/                    AQI, freshness, recommendation, emissions rules
  services/                  typed same-origin API client
  tests/                     domain and interaction tests
server/
  app.mjs                    validated API, proxy, cache, timeout, fallback
  index.mjs                  Vite development and production server entrypoint
docs/
  data-and-methods.md        sources, decisions, factor values and limitations
  demo-script.md             walkthrough and recording checklist
public/manus-routes.json     declared browser route
```

## Data sources and decision logic

AirWise requests Open-Meteo's U.S. AQI fields and pollutant concentrations. Open-Meteo describes its air-quality product as CAMS-based modeled output at regional grid resolution. The dashboard therefore labels it as modeled, not a neighborhood monitoring-station measurement or indoor reading. The supplied `us_aqi` index is used directly; pollutant concentrations remain in µg/m³ and are never converted or mislabeled as AQI. Provider times are requested as Unix timestamps, normalized server-side to UTC ISO timestamps for freshness checks, and formatted for display using the returned location timezone where available. The U.S. AQI categories are Good (0–50), Moderate (51–100), Unhealthy for Sensitive Groups (101–150), Unhealthy (151–200), Very Unhealthy (201–300), and Hazardous (301–500).

Deterministic rules use the U.S. AQI and user-selected general household/activity preferences. AQI outside the U.S. 0–500 range and invalid concentrations are treated as unavailable; missing AQI does not become an all-clear. When no hourly model values are returned, the planner does not guess a cleaner hour. The assistant is instructed to treat its question and all browser-supplied context as unverified, distinguish absent data, and avoid unsupported predictions/diagnoses. The server requires an AI reply to start with the deterministic action, and the action remains visible outside the chat answer; neither is a guarantee against every misleading continuation. See [data and methods](docs/data-and-methods.md) for thresholds, freshness, privacy, source links, and assumptions.

Transport factors are based on the 2026 UK Government GHG Conversion Factors workbook: average car 0.17265 kg CO₂e/vehicle-km; average local bus 0.10151 kg CO₂e/passenger-km; London Underground 0.01549 kg CO₂e/passenger-km as a metro proxy. Carpool assumes two occupants. Walk/cycle include zero direct trip-operation emissions only. These UK-average values are illustrative and not local Delhi estimates. Actual emissions vary with fleet, occupancy, route and electricity mix. Estimates are not measured reductions.

## Requirements

- Node.js 22 or compatible.
- Corepack with pnpm 11.25.0 (pinned in `package.json`).
- No separate API key is needed for Open-Meteo's non-commercial endpoint or the project-managed Manus AI service. AI answers are available only when runtime service variables are provided; deterministic help remains usable without them.

## Install and run locally

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

The development server listens on `http://localhost:3000`. For a production build and local production server:

```bash
pnpm build
NODE_ENV=production PORT=3000 pnpm start
```

## Environment variables

Copy `.env.example` only if you need a local environment file. Never commit `.env` or put a private key into `VITE_*` variables. In Manus Cloud, the server reads the platform-provided `MANUS_API_URL` and `MANUS_API_KEY` at runtime. AirWise does not require a user-supplied Gemini/OpenAI key. If a self-managed deployment does not supply the Manus variables, the assistant transparently falls back to deterministic guidance. Open-Meteo endpoints are public and contain no secret in browser code because calls pass through the server.

## Tests

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Verification results and the date of the latest run are maintained in the [feature and submission verification matrix](docs/submission-verification.md). Automated checks do not replace manual assistive-technology or all-device review.

## Deployment

A Dockerfile builds the client and starts the Express server on `PORT` (default 3000); `/api/health` is an unauthenticated health check. The managed container deployment is [airwiseai-657kapul.manus.space](https://airwiseai-657kapul.manus.space/). The deployment and live assistant are checked separately from local build/tests; see the [verification matrix](docs/submission-verification.md) for the latest evidence and limits.

## Public source repository

The selected public source repository is [github.com/ritik9879/airwise-ai-promptwars-6](https://github.com/ritik9879/airwise-ai-promptwars-6). It is separate from the Manus-managed deployment repository. Branch count, Git-history size, and credential-scan evidence are recorded in [the submission verification matrix](docs/submission-verification.md). Updating source does not automatically resubmit the project to PromptWars.

## Security, privacy, and accessibility

The server validates inputs, limits JSON payloads and requests, applies upstream timeouts, uses short in-memory caches, bounds assistant output, and normalizes AQI outside 0–500, invalid concentrations, and unrepresentable timestamps to unavailable values. Same-origin API calls avoid permissive CORS. Private Manus credentials remain server-side. Browser-supplied assistant context is untrusted and separated from system instructions; AI output is rendered as plain React text rather than injected HTML. A server-side lexical gate rejects answers that omit the deterministic action, which is also presented separately; neither a prompt nor a prefix match can prove that the remainder is safe. Rate-limit counters are in-memory per application process/instance, not shared across replicas; correct per-client behavior depends on trusted reverse-proxy IP configuration. AirWise does not store user accounts, chat history, medical records, or household profiles. The selected language alone is remembered in local storage; other preferences stay in memory. Project-level website analytics injection is disabled. Platform or CDN analytics may still remain.

The interface provides semantic landmarks and controls, skip navigation that programmatically focuses the main landmark, visible keyboard focus, labels, live status messages where applicable, explicit status words in addition to color, responsive layout, and `prefers-reduced-motion`. The mobile navigation toggle exposes its expanded state and controlled navigation region. Focus, muted text, and fine-print tokens were contrast spot-checked and improved; this was not an exhaustive color audit. Automated interaction checks and a keyboard skip-link check supplement, but do not replace, manual assistive-technology review.

## Limitations and future work

CAMS model grids may not represent street-level exposure. Open-Meteo coverage and model timing can vary by location, and its current field is not a regulatory station observation. No indoor or route-level sensors are used. No medical diagnosis or personal clinical advice is provided. English and Hindi cover key controls and navigation; not every long-form guidance paragraph is translated yet. Mobility estimates are UK factors used as generic proxies and should be replaced with current local factors before use as a city-level emissions accounting tool. Community effects are not quantified. Future work could add local monitoring feeds, region-specific transit factors, verified public-health translation, more multilingual coverage, and automated accessibility audits.

## Demo

See [the demo script and recording checklist](docs/demo-script.md). No recording or public demo URL is claimed until one is actually produced.

## License

MIT — see [LICENSE](LICENSE).
