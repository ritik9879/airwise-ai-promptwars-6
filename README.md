# AirWise AI

**Breathe Smarter. Live Better.**

AirWise AI is a PromptWars Challenge 6 — Urban Air Quality Assistant project. It helps families and communities turn sourced outdoor-air data into explainable daily actions, indoor-air improvements, lower-emission travel comparisons, and practical household precautions.

## Challenge and solution

Winter smog and urban air pollution make routine choices difficult: whether to exercise outside, how to commute, when to ventilate, and how to protect people who prefer extra precaution. AirWise pairs provider-supplied air-quality data with deterministic rules and transparent limitations. A server-side AI assistant may personalize the explanation, but it cannot override the safety rules or invent measurements. Missing data remains missing; the optional sample mode is clearly labeled as fictional demonstration data.

## Features

- Search places, select a location manually, or request browser geolocation permission.
- View U.S. AQI, its category, pollutant concentrations and units, source attribution, timestamp/freshness, model output explanation, and available hourly model series.
- Receive AQI- and household-aware routine recommendations with “Why AirWise recommends this” decision details.
- Use a personalized day planner, practical indoor-air advisor, family preference mode, community action list, English/Hindi interface, and contextual assistant.
- Compare car, local-bus, metro-proxy, walk, cycle, and carpool estimates. Run an impact what-if scenario using explicit factors and caveats. Keep exposure advice separate from emissions comparison.
- Use a responsive interface with semantic controls, keyboard-visible focus, reduced-motion support, non-color-only AQI status, form labels, and screen-reader descriptions.

## Architecture

The browser is a React/TypeScript single-page app built with Vite. A compact Express server serves the application and same-origin API routes. The server proxies Open-Meteo geocoding and air-quality data with validation, request timeouts, short caches, and rate limits. The assistant uses the project-provided Manus chat-completions API only from the server. Domain rules for AQI categories, freshness, recommendations, and impact calculations live in pure testable modules. No database, account system, or stored chat history is used.

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

Deterministic rules use the U.S. AQI and user-selected general household/activity preferences. Missing AQI does not become an all-clear. When no hourly model values are returned, the planner does not guess a cleaner hour. The assistant receives bounded structured context and is instructed to distinguish absent data, avoid unsupported predictions/diagnoses, and defer to deterministic actions. See [data and methods](docs/data-and-methods.md) for thresholds, freshness, privacy, source links, and assumptions.

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

Verified in the current Sandbox on 2026-11-21: `pnpm typecheck` passed; `pnpm test` passed (3 test files, 30 tests); `pnpm build` passed (Vite production bundle: 1587 modules). A live `/api/health` request returned `{"status":"ok","service":"AirWise AI"}`, and `/manus-routes.json` returned the single `/` route. One earlier Open-Meteo request for Delhi successfully returned modeled U.S. AQI and pollutant fields; this is a one-time observation, not a provider-availability guarantee. The API fixtures verify Unix-to-ISO timestamp normalization, while the browser formats both the current timestamp and chart labels in the selected location's timezone. Automated checks do not replace manual assistive-technology or all-device review. See the [feature and submission verification matrix](docs/submission-verification.md) for per-area evidence and unverified items.

## Deployment

A Dockerfile builds the client and starts the Express server on `PORT` (default 3000); `/api/health` is an unauthenticated health check. The managed container deployment is configured to use `Dockerfile` and `/api/health`, but it has **not** been published. Automatic publication is off, and there is no live deployment URL to report.

## Public source repository

Source is available at [github.com/ritik9879/airwise-ai-promptwars-challenge-6](https://github.com/ritik9879/airwise-ai-promptwars-challenge-6). The repository is public; GitHub's branch listing contains exactly one branch, `main`. The checked-out source tree measured 388 KB excluding Git metadata, dependencies, and generated build output. The GitHub repository-size API reported 0 KB; both measurements are below the challenge's 10 MB limit. The repository contains source, tests, documentation, and deployment files, but no `.env` file or detected credential strings.

## Security, privacy, and accessibility

The server validates inputs, limits JSON payloads and requests, applies upstream timeouts, uses short in-memory caches, and bounds assistant output. Same-origin API calls avoid permissive CORS. Private Manus credentials remain server-side. AI output is rendered as plain React text rather than injected HTML. AirWise does not store user accounts, chat history, medical records, or household profiles. The selected language alone is remembered in local storage; other preferences stay in memory. Project-level website analytics injection is disabled. Platform or CDN analytics may still remain.

The interface provides semantic landmarks and controls, skip navigation, visible keyboard focus, labels, `aria-live` updates, explicit status words in addition to color, responsive layout, and `prefers-reduced-motion`. Automated interaction checks supplement, but do not replace, manual assistive-technology review.

## Limitations and future work

CAMS model grids may not represent street-level exposure. Open-Meteo coverage and model timing can vary by location, and its current field is not a regulatory station observation. No indoor or route-level sensors are used. No medical diagnosis or personal clinical advice is provided. English and Hindi cover key controls and navigation; not every long-form guidance paragraph is translated yet. Mobility estimates are UK factors used as generic proxies and should be replaced with current local factors before use as a city-level emissions accounting tool. Community effects are not quantified. Future work could add local monitoring feeds, region-specific transit factors, verified public-health translation, more multilingual coverage, and automated accessibility audits.

## Demo

See [the demo script and recording checklist](docs/demo-script.md). No recording or public demo URL is claimed until one is actually produced.

## License

MIT — see [LICENSE](LICENSE).
