# AirWise AI — submission verification

**Checked:** 2026-11-21 · **Status:** source submission prepared; production deployment not published.

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
| Deployment | Prepared, not published | Managed container configuration uses `Dockerfile` and `/api/health`. A Dockerfile is present. `publishing.auto_publish` is off; no production build/deployment was published or live-tested, so there is no deployment URL. |
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

Final Sandbox verification on 2026-11-21:

- `pnpm typecheck` — passed.
- `pnpm test` — passed: 3 test files, 30 tests.
- `pnpm build` — passed: Vite transformed 1,587 modules.
- `GET /api/health` — returned `{"status":"ok","service":"AirWise AI"}`.
- `GET /manus-routes.json` — returned the single SPA route `/`.

These results establish the development build and checks, not a production deployment or complete manual accessibility review.

## Submission repository

The source mirror is [public on GitHub](https://github.com/ritik9879/airwise-ai-promptwars-challenge-6). The GitHub branch listing returned exactly `main`. The GitHub repository-size API returned `0` KB; the checked-out source tree measured 380 KB excluding `.git`, dependencies, and generated output. A credential-marker scan found no likely API keys or tokens, and only `.env.example` is present. The managed Webdev repository remains canonical; this public GitHub repository is a separate source mirror, not a repository switch.

## Submission-compliance checklist

- [x] Public GitHub repository created and verified: [AirWise AI](https://github.com/ritik9879/airwise-ai-promptwars-challenge-6).
- [x] Exactly one repository branch verified: `main`.
- [x] Size remains below 10 MB: GitHub's API returned 0 KB; the checked-out project source measured 380 KB, excluding Git metadata, installed dependencies, and build output.
- [x] Source, tests, setup instructions, environment example, Dockerfile, license, data/method notes, demo script, and verification notes are present.
- [x] `.env` is ignored and absent; `.env.example` contains placeholders; no likely credential strings were detected in the committed source scan.
- [x] TypeScript check, all 30 automated tests, production build, health endpoint, and route manifest passed.
- [x] Deployment state is reported accurately: container configuration is ready, publication has not occurred, auto-publish is off, and no production URL is claimed.
- [ ] Complete manual keyboard-only, screen-reader, cross-device, and WCAG 2.2 AA review remains outstanding.
- [ ] A demo recording has not been made; the repository contains only the recording script and checklist.
