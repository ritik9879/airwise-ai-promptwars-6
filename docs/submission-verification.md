# AirWise AI — submission verification

**Checked:** 2026-11-22 · **Status:** source submission prepared; production deployment published and live-checked.

## Feature verification

| Area | Status | Evidence and limits |
| --- | --- | --- |
| Outdoor air dashboard | Implemented; API path and app verified | Uses Open-Meteo model output and the supplied U.S. AQI field; separates pollutant concentrations and units; labels source, model status, timestamp, freshness, and missing-data states. API normalization and missing-data tests pass. One live Delhi request succeeded during development; ongoing provider availability is not guaranteed. |
| Recommendations and explainability | Implemented; domain-tested | Rules use AQI bands, household preference, and activity context. Missing AQI is not an all-clear. The dashboard explains the measurement, rule, expected benefit, and uncertainty. Domain tests cover thresholds, household-dependent advice, and unavailable data. |
| Optional AI assistant | Implemented with deterministic fallback; live model availability not verified | Uses a server-side Manus service path only when runtime variables exist. Input validation, bounded output, and service-unavailable fallback are tested. AI secrets are not placed in browser code. No live LLM call was made as part of final verification. |
| Personalized daily planner | Implemented; not exhaustively scenario-tested | Accepts wake-up/work times, commute choice, exercise setting, household context, current data, and available hourly model values. It explicitly declines to guess a cleaner hour when hourly values are missing. It does not collect every preference listed in the challenge prompt. |
| Indoor-air advisor | Implemented; general guidance only | Provides source reduction, cooking exhaust, dust, ventilation, and HEPA guidance. It does not claim to measure a home's indoor air. No indoor sensor integration exists. |
| Mobility and impact calculator | Implemented; arithmetic tested | Compares modes and distinguishes exposure cautions from illustrative emissions estimates. Factors are 2026 UK Government values used as non-local proxies. Negative savings now display an emissions increase. Tests cover arithmetic, bounds, and increased emissions. |
| Family and community views | Implemented | Offers general, children, older-adult, and extra-precaution contexts without storing medical profiles. Community actions are suggestions; no community impacts or statistics are invented. Preferences remain in session memory. |
| English and Hindi | Partial localization | Core navigation, search, status, dashboard AQI states and recommendations, and fallback assistant guidance can be localized. Long-form planner, indoor, mobility, family, and community copy remains partly English. |
| Accessibility and responsive UI | Implemented in code; manual audit incomplete | Includes semantic regions, skip navigation, form labels, status text beyond color, visible focus, responsive navigation/layout, chart descriptions, and reduced-motion styles. Automated UI tests pass. Full keyboard-only, screen-reader, contrast, and WCAG 2.2 AA audits were not completed. |
| Privacy and API security | Implemented; automated checks partial | API input validation, rate limits, timeouts, small request bounds, short in-memory caches, safe plain-text AI rendering, no chat/database persistence, and server-side credentials. Project-level website analytics injection is disabled; platform/CDN analytics may remain. This is not a formal security audit. |
| Deployment | Published; public endpoints verified | The live app is [airwiseai-657kapul.manus.space](https://airwiseai-657kapul.manus.space/). On 2026-11-22, the homepage and `/api/health` returned HTTP 200; the health endpoint returned `{"status":"ok","service":"AirWise AI"}`. This confirms availability at verification time, not a long-term uptime guarantee. |
| Documentation and demo | Prepared | See [README](../README.md), [data and methods](data-and-methods.md), and [demo script](demo-script.md). No recording or screenshot is claimed. |

## Challenge scenarios

| Scenario | Verification status |
| --- | --- |
| A. Household with children in severe Delhi pollution | The deterministic rules support a cautious household-specific response; related AQI/household rules have unit coverage. No full UI walkthrough of this exact scenario was recorded. |
| B. Working professional balancing commute emissions and exposure | Mobility and impact views keep exposure separate from emissions factors. The two-view workflow was not manually recorded end to end. |
| C. Missing live data does not become a fabricated measurement | Automated domain and API tests verify missing/unavailable values remain unavailable and the demo is labeled. |
| D. Hindi selection localizes supported content and assistant request | Hindi core copy and a Hindi deterministic fallback are covered; remaining feature copy is only partly translated. |
| E. Keyboard-only dashboard and query workflow | Semantic controls and focus styles are implemented; a complete keyboard-only manual audit is still open. |
| F. AI outage leaves deterministic guidance available | The no-service API fallback and assistant fallback path are implemented; API fallback is covered by automated tests. |

## Reproducible checks

Final Sandbox verification on 2026-11-22:

- `pnpm typecheck` — passed.
- `pnpm test` — passed: 3 test files, 30 tests.
- `pnpm build` — passed: Vite transformed 1,587 modules.
- Production server (`NODE_ENV=production PORT=4177 node server/index.mjs`) — started; `/` returned HTTP 200.
- `GET /api/health` — returned `{"status":"ok","service":"AirWise AI"}` locally and on the public deployment.
- `GET /manus-routes.json` — returned the single SPA route `/` locally and on the public deployment.

These checks establish the application build and test status. The live deployment was separately verified by public HTTPS requests; they do not replace a complete manual accessibility or security audit.

## Submission repository

The requested repository is [public on GitHub](https://github.com/ritik9879/airwise-ai-promptwars) (GitHub API `private: false`, `visibility: public`); its branch listing contains exactly `main`, and the public page returned HTTP 200. GitHub's repository API reported `size: 0` KB. An independent clean `git clone --mirror` contained 74 reachable objects, a 98.55 KiB pack, and occupied 228 KiB including Git metadata and history—well below the 10 MB limit. The remote tree contains all 46 project files, including the required source, tests, docs, lockfile, environment example, Dockerfile, and license. A scan of every reachable historical blob found no `.env`/credential files and no matches for common API-key/token patterns. The managed Webdev repository remains canonical; this public GitHub repository is a separate source mirror, not a repository switch.

## Submission-compliance checklist

- [x] Public GitHub repository created and verified: [AirWise AI](https://github.com/ritik9879/airwise-ai-promptwars); repository metadata reports `private: false` and `visibility: public`.
- [x] Exactly one repository branch verified: `main`.
- [x] Repository including Git history is below 10 MB: independent mirror clone measured 228 KiB total with a 98.55 KiB Git pack; GitHub API reported 0 KB.
- [x] All 46 remote tree entries and essential source, tests, setup instructions, environment example, Dockerfile, license, methods, demo, and verification files are present.
- [x] `.gitignore` excludes `.env`; `.env.example` has blank placeholders; no `.env` or credential-pattern matches were found in the complete reachable history.
- [x] TypeScript check, all 30 automated tests, production build, health endpoint, and route manifest passed.
- [x] Deployment state is reported accurately: the live deployment URL and HTTP 200 checks are documented; availability is not represented as a guarantee.
- [ ] Complete manual keyboard-only, screen-reader, cross-device, and WCAG 2.2 AA review remains outstanding.
- [ ] A demo recording has not been made; the repository contains only the recording script and checklist.
