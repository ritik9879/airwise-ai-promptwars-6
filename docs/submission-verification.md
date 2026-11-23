# AirWise AI — submission verification

**Checked:** 2026-11-24 · **Status:** audited application checkpoint `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12` is published and pushed to the selected GitHub repository; live homepage, health, route manifest, and AI assistant checks passed. This document-only status update is tracked separately from that published application checkpoint.

## Feature verification

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Outdoor air dashboard | Implemented; API path and app verified | Uses Open-Meteo CAMS-based model output and supplied U.S. AQI; separates concentrations/units, source, model status, timestamp, freshness, and missing-data states. API tests cover missing/out-of-range AQI, invalid concentrations, timestamps, and provider failure. A fresh local production request on 2026-11-24 returned HTTP 200 and modeled AQI 193 for Delhi; availability and values vary over time. |
| Recommendations and explainability | Implemented; domain-tested | Rules use rounded U.S. AQI category, household preference, and activity context. Missing/invalid AQI is not an all-clear. Decimal boundary cases and personalized household advice have test coverage. |
| Optional AI assistant | Live GenAI verified in the local production runtime; deterministic fallback tested | A fresh local production request on 2026-11-24 returned `aiAvailable:true`; the generated reply began with the exact supplied deterministic action. Automated provider-stub tests verify context separation and reject output that omits that action. This proves that the configured runtime reached the model path, not that all semantic claims are correct. The browser question and selected context are sent to the configured AI service; AirWise does not store chat. |
| Personalized daily planner | Implemented; not exhaustively scenario-tested | Accepts wake-up/work times, commute choice, exercise setting, household context, current data, and available hourly model values. It does not guess cleaner hours when hourly model values are absent. It does not collect every preference listed in the challenge prompt. |
| Indoor-air advisor | Implemented; general guidance only | Provides source reduction, cooking exhaust, dust, ventilation, and HEPA guidance. No indoor sensor integration or home-air measurement exists. |
| Mobility and impact calculator | Implemented; arithmetic and UI boundaries tested | Compares modes and separates exposure cautions from illustrative emissions estimates using 2026 UK Government factors as non-local proxies. Zero-baseline percentages are undefined; equal zero-emission modes are labeled no change. Tests cover arithmetic, limits, increased emissions, and zero-emission cases. |
| Family and community views | Implemented | Offers general, children, older-adult, and extra-precaution contexts without storing medical profiles. Community actions are suggestions; no community impacts or statistics are invented. |
| English and Hindi | Partial localization | Core navigation, search, status, dashboard AQI states, and recommendations are localized. Some assistant disclosure/fallback copy is translated; long-form planner, indoor, mobility, family, and community text remains partly English. |
| Accessibility and responsive UI | Improvements verified; full manual audit incomplete | Added skip-link focus target, visible focus styling, labels/status text, responsive drawer visibility, `aria-expanded`/`aria-controls`, focus placement/return, Tab trapping, and Escape handling. Automated tests cover skip target and drawer keyboard flow. Contrast spot-checks: muted/fine print 5.67:1 on white and 5.27:1 on app background; focus ring 5.35:1 on white, 4.97:1 on app background, and 3.50:1 on dark sidebar. These are spot checks, not a full WCAG 2.2 AA or screen-reader audit. |
| Privacy and API security | Implemented; automated checks partial | Strict validation, bounded JSON, same-origin calls, timeouts, rate limits, short in-memory caching, safe plain-text output, and server-side credentials. AI transfer is disclosed in the assistant/settings UI. Deterministic guidance remains separately visible; the model output is rejected if it does not start with it. Prefix matching is not semantic moderation and cannot prove the remaining text safe. Rate-limit counters are per process/instance and depend on proxy client-IP behavior. This is not a formal security audit. |
| Deployment | Exact audited application checkpoint published and live-checked | Published version ID: `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12`. On 2026-11-24, the public homepage returned HTTP 200 with the AirWise title, `/api/health` returned HTTP 200 and `{"status":"ok","service":"AirWise AI"}`, and `/manus-routes.json` returned HTTP 200 with the `/` route. A public assistant POST returned HTTP 200 and `aiAvailable:true`; live model text began with the exact submitted deterministic precaution. This is a point-in-time runtime verification, not a guarantee of ongoing availability or semantic safety. Public app: [airwiseai-657kapul.manus.space](https://airwiseai-657kapul.manus.space/). |
| Documentation and demo | Updated | See [README](../README.md), [data and methods](data-and-methods.md), and [demo script](demo-script.md). No recording or screenshot is claimed. |

## Challenge scenarios

| Scenario | Verification status |
| --- | --- |
| A. Household with children in severe Delhi pollution | Household-specific deterministic guidance is unit-tested; no recorded end-to-end UI walkthrough of this exact scenario. |
| B. Working professional balancing commute emissions and exposure | Mobility and impact views keep exposure separate from emissions factors; no end-to-end manual walkthrough is recorded. |
| C. Missing live data does not become a fabricated measurement | Domain/API tests cover unavailable values, provider failure, and labeled demo mode. |
| D. Hindi selection localizes supported content and assistant request | Core Hindi copy and localized recommendation/fallback are covered; long-form feature copy remains partly English. |
| E. Keyboard-only dashboard and query workflow | Skip-link target and mobile drawer keyboard flow have automated coverage; full keyboard-only audit remains open. |
| F. AI outage leaves deterministic guidance available | Provider-unavailable fallback and rejected unsafe-prefix response are covered; deterministic guidance is displayed separately from model text. |

## Reproducible checks

Final local Sandbox verification on 2026-11-24:

- `pnpm typecheck` — passed.
- `pnpm test` — passed: 4 test files, 57 tests.
- `pnpm build` — passed; TypeScript check included and Vite transformed 1,587 modules.
- `git diff --check` — passed.
- Production server (`NODE_ENV=production PORT=4177 node server/index.mjs`) — `GET /`, `GET /api/health`, and `GET /manus-routes.json` returned HTTP 200. Health body: `{"status":"ok","service":"AirWise AI"}`; route manifest declares `/`.
- Fresh local `GET /api/air?lat=28.6139&lon=77.209` — HTTP 200 with modeled-data metadata, AQI 193, and provider timestamp `2026-11-23T01:00:00.000Z` at request time. AQI is a changing modeled value, not a fixed test result.
- Local production `POST /api/assistant` — HTTP 200, `aiAvailable:true`; response began with the submitted rules-based precaution. This was a real runtime request, distinct from mocked provider tests and fallback behavior.

These checks establish local behavior at test time. The separate public checks above establish behavior of the published application checkpoint at verification time. They do not establish a full manual accessibility/security review or ongoing provider/deployment availability.

## Submission repository

The user-selected target is [github.com/ritik9879/airwise-ai-promptwars-6](https://github.com/ritik9879/airwise-ai-promptwars-6). The application checkpoint `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12` was pushed to `main`; the public repository has exactly one branch (`main`), 39 tracked files, and a 256 KiB mirror clone including Git history, well below 10 MB. A scan of all 124 reachable Git objects found zero matches for checked private-key/common-token patterns; the tracked tree contains no dotenv files except the allowed `.env.example`. Pattern scans are not proof against every possible secret format. The Manus-managed repository remains the canonical WebDev checkpoint repository; GitHub is a separate user-requested source copy. Do not automatically resubmit to PromptWars.

## Submission-compliance checklist

- [x] Selected destination URL confirmed: `https://github.com/ritik9879/airwise-ai-promptwars-6`; it was public and empty before delivery.
- [x] Push audited application checkpoint `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12` to exactly the selected GitHub repository on `main`; verify exactly one branch and repository/history under 10 MB (256 KiB mirror clone).
- [x] Scan current files and all reachable Git history for credentials; no checked-pattern matches or unauthorized dotenv files found.
- [x] TypeScript, all 57 automated tests, production build, and local endpoint/assistant smoke tests passed on 2026-11-24.
- [x] Publish the audited Manus checkpoint and verify the public homepage, health endpoint, route manifest, and assistant for the published revision.
- [x] Confirm Manus checkpoint on `main`: `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12`.
- [x] No PromptWars resubmission has been made or will be initiated automatically.
- [ ] Complete manual screen-reader, full keyboard, cross-device, and WCAG 2.2 AA review; no demo recording is claimed.
