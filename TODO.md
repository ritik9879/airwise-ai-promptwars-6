# AirWise AI — Delivery Outcomes

## Current implementation status — 2026-11-24
- **Verified:** existing Vite/React + Express app retained and improved: modeled Open-Meteo AQI and unavailable states, deterministic personalized recommendations, server-side AI with deterministic fallback and precaution prefix gate, daily planner, indoor guidance, mobility/impact calculations, family/community views, core English/Hindi copy, privacy disclosure, keyboard/mobile navigation, API protections, Docker deployment, and documentation.
- **Automated verification:** `pnpm typecheck` passed; `pnpm test` passed (57 tests across 4 files); `pnpm build` passed (Vite transformed 1,587 modules); `git diff --check` passed. Local production `/`, `/api/health`, and `/manus-routes.json` returned HTTP 200. A fresh local modeled Delhi request returned AQI 193 at its request time. A local production assistant request returned `aiAvailable:true` and began with the deterministic precaution. These are time-specific checks; they do not guarantee ongoing provider availability or fully safe AI prose.
- **Known partial coverage:** long-form English/Hindi translation remains incomplete; challenge scenarios are not all manually walkthrough-tested; screen-reader, cross-device, full keyboard, and WCAG 2.2 AA audits remain incomplete. Contrast values in the verification matrix are spot checks only. Rate limiting is per process/instance, not shared among replicas. No submission video is claimed.
- **Delivery state:** audited application checkpoint `74e9ce9d98f7e32d90dbcd18e06ef1e8a0eb1e12` is published and pushed to `main` of the user-selected public repository [AirWise AI on GitHub](https://github.com/ritik9879/airwise-ai-promptwars-6). The repository has one branch, 39 tracked files, and a 308 KiB mirror clone including Git history; the reachable-history secret-pattern scan found no matches (see [verification evidence](docs/submission-verification.md)). The live deployment [airwiseai-657kapul.manus.space](https://airwiseai-657kapul.manus.space/) returned HTTP 200 for homepage, health, and route manifest. Its public assistant returned `aiAvailable:true` and began with the exact deterministic precaution. Auto-publish is off. No PromptWars resubmission has been made.

## Live air-quality dashboard and environmental data
- Display location name, current AQI and labeled AQI category, PM2.5, PM10, other available pollutants, data source, last-updated timestamp, pollution-severity explanation, and contextual recommendations.
- Use a reputable environmental data provider, choose one AQI standard, label it explicitly, and apply its thresholds consistently. Do not mix AQI standards or confuse pollutant concentrations with AQI values.
- Provide location search, manual location selection, optional browser geolocation with permission, loading and error states, stale-data warnings, and API-failure handling.
- Never display fabricated live AQI values. If the provider is unavailable, show unavailable state or a clearly labeled demonstration mode using sample data.
- Show confidence/status as live, recently updated, stale, estimated, demonstration data, or unavailable. Clearly distinguish provider-modeled data from sensor measurements and observations from forecasts.

## Environmental assistant and explainability
- Provide a conversational assistant for outdoor play, commuting, bedroom air, winter smog, outdoor workouts, and family exposure questions.
- Consider selected location, available AQI and pollutant concentrations, lifestyle, household preferences, outdoor activity, transport preferences, indoor environment, and data availability.
- Use supported LLM through secure server-side integration; never expose API credentials in frontend code. Apply structured context, prompt-injection defenses, sensible request/response limits, validated output, safe rendering, and graceful fallbacks.
- The assistant must not invent environmental measurements or unsupported predictions. Responses provide a direct answer, explanation based on available data, practical actions, and relevant uncertainty/limitations.
- Health-related responses provide general precautions, not personal diagnosis or treatment. Deterministic safety/environmental rules govern critical guidance; GenAI personalizes and explains.
- Every important recommendation has a section titled **Why AirWise recommends this**, covering the relevant environmental measurement, user context/preference, decision rule, expected benefit, and uncertainty/limitation.

## Personalized daily planner
- Let users enter location, typical wake-up time, work/school hours, commute preferences, outdoor exercise preferences, household composition, and indoor activity preferences.
- Generate an actionable daily routine including morning ventilation considerations, outdoor exercise alternatives, lower-emission commute options, indoor cleaning suggestions, school travel precautions, and evening activity planning.
- Use observations and forecasts only when supported. Do not invent hourly AQI forecasts. If hourly forecasts are unavailable, explicitly state that recommendations use current conditions and general precautions. Show the reasoning behind each recommendation.

## Indoor air advisor
- Give practical, budget-conscious guidance on ventilation, indoor particle sources, cooking emissions, dust management, wet cleaning, purifier use, HEPA filtration, avoiding indoor smoke, and maintaining indoor environments during smog.
- Distinguish verified guidance from general suggestions. Never claim indoor pollutant concentrations are known without indoor sensor measurements.

## Mobility advisor and impact calculator
- Compare private car, bus, metro, walking, cycling, and carpooling using trip distance, available options, environmental conditions, preferences, approximate emissions, and practical exposure considerations.
- Do not assume walking or cycling is preferable during severe pollution. Use transparent emission factors, clearly label estimates, and show assumptions and limitations.
- Estimate baseline emissions, alternative emissions, emissions avoided, and percentage difference for selected lifestyle changes, including solo-car replacement by transit, carpooling, avoiding unnecessary vehicle trips, or lower-emission alternatives. Explain the calculation and document assumptions. Do not present estimates as measured real-world reductions.
- Support what-if comparison of two routines and distinguish transport emissions from personal exposure considerations.

## Family and community modes
- Offer optional general-adult, children, older-adult, and extra-respiratory-precaution household contexts without collecting unnecessary sensitive medical information.
- Provide general precautionary guidance, explain it, and avoid medical diagnosis.
- Offer practical community actions for shared commuting, reduced vehicle idling, cleaner neighborhood practices, school awareness, household pollution reduction, and community air-quality awareness. Explain individual versus community action without invented community statistics.

## Language, accessibility, responsive design
- Provide English and Hindi for important interface elements, with clear natural translations; where practical, support assistant replies in either language and ensure language switching does not break layout.
- Target WCAG 2.2 AA practices: semantic HTML, keyboard navigation, visible focus, screen-reader labels, accessible validation, adequate contrast, responsive typography, reduced-motion support, clear errors, non-color-only AQI indicators, and accessible chart descriptions.
- Test key workflows with keyboard navigation. Ensure desktop and mobile use, responsive navigation, and meaningful actions for every interactive control.

## Security, reliability, and performance
- Keep API keys in environment variables; include `.env.example` placeholders and never commit a real `.env`.
- Validate inputs; apply request timeouts, error handling, appropriately restricted CORS, safe AI text rendering, no unsafe HTML injection, no unnecessary personal-data storage, and no sensitive data in logs. Add practical rate limiting.
- Cache efficiently with documented freshness, never indefinitely for live environmental data. Optimize initial load, bundle size, API calls, AI calls, and responsive interactions.
- Avoid unnecessary databases, authentication, background infrastructure, or unrelated functionality.

## Verification and documented submission
- Create and execute automated tests for AQI categorization, pollutant units, missing data, stale-data behavior, preference changes, recommendations, impact calculations, API failures, invalid inputs, AI response handling, accessibility-critical interactions, and responsive navigation.
- Exercise realistic scenarios: (A) family with children in severe Delhi winter smog receives cautious explainable advice; (B) working professional receives commuting advice with emissions and exposure distinguished; (C) missing live data never becomes a fabricated measurement; (D) Hindi selection localizes supported content and AI response request; (E) keyboard-only dashboard/query workflow is usable; (F) AI outage leaves deterministic guidance available.
- Run tests and report actual results; never claim unexecuted checks passed.
- README explains challenge, problem, solution, features, architecture/stack, setup, environment variables, commands, AI decision approach, data sources, assumptions/limitations, testing, deployment, screenshots/demo only if real, security/privacy, accessibility, and future work. Do not include fake badges, results, metrics, or links.
- Prepare a 2–3 minute demo script and recording checklist covering dashboard, location, AQI, assistant, planner, indoor advice, mobility, impact calculator, explanations, and responsive interface. Do not fabricate a video link.
- Keep source complete, exclude build outputs/dependencies/secrets/caches, and keep the repository below 10 MB. Prepare exactly one Git branch and public repository only if authorized and actually created. Deployment status and any URLs must reflect checked results.
- Final handoff includes source, folder structure, run instructions, actual GitHub/deployment URLs only if created, test results, architecture, environment guide, demo script, submission-compliance checklist, known limitations, and a feature verification table.
