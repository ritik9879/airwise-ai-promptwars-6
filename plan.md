# AirWise AI — Implementation Plan

## Goal and scope

Build a deployable, responsive urban air-quality decision-support app for PromptWars Challenge 6. The first release prioritizes accurate, clearly labeled environmental observations, deterministic and explainable safety guidance, personalized plans, and reliable fallback behavior. It implements the requested dashboard, assistant, planner, indoor advisor, mobility and impact tools, family protection, bilingual key UI, and community actions without accounts, persistent personal profiles, or unsupported health claims.

## Architecture and implementation

Use a compact TypeScript application with Vite/React for the browser and a small Node.js/Express server for API proxying and secure AI requests. Keep domain logic in pure TypeScript modules shared by tests and application services. Use Open-Meteo geocoding for location search and its Air Quality API for explicitly sourced model-based current/hourly air-quality output; always label this source as modeled CAMS-based data rather than a local sensor/station reading. Use the provider's supplied U.S. AQI fields and PM concentration units; do not derive a second AQI standard or silently substitute demonstration data. Distinguish current provider values from the hourly model series and do not make unsupported forecasts. Mark provider outage as unavailable, with a deliberate, labeled demo-mode option only.

The server serves the production SPA, `/api/health`, location/air-quality proxy endpoints with bounded input, timeouts and short in-memory response caching, and `/api/assistant`. The assistant uses the project-provided Manus LLM service from server-side environment variables only. It receives a bounded, structured context assembled from current selected data and explicit lifestyle preferences. It may explain or personalize deterministic recommendations; it cannot replace AQI/risk rules or invent readings. Validate request sizes and response shape, handle missing credentials/network/model output, and return deterministic help when AI is unavailable. No user profile or conversation is stored.

The U.S. AQI is the one labeled standard. Preserve provider-supplied overall `us_aqi` and pollutants. Where a pollutant-specific AQI is unavailable, show the pollutant concentration with units, not an AQI conversion. Severity rules drive outdoor activity precautions, ventilation decisions, and family-mode adjustments, with transparent "Why AirWise recommends this" explanations including measurement, user context, rule, expected benefit, and uncertainty. Do not present general advice as medical advice.

Implement mobility/emissions estimates with explicit configurable per-passenger-kilometre assumptions, readable formulas, and comparison caveats. Treat modeled transport emissions and exposure as separate dimensions. Walking/cycling should not be recommended for exposure during severe pollution. Build the daily planner using the current observation and general precautions; if hourly provider data exists, show the returned model hours as forecast guidance, not observations, and never invent a better hour. Indoor tips are guidance only, not indoor measurements. English and Hindi strings cover key navigation, controls, risk and feature descriptions; AI replies may be requested in either language.

## Project structure

- `src/`: React application, page sections, shared accessible controls, language strings, state/hooks, and styling.
- `src/domain/`: pure AQI/category, recommendation, family-precaution, stale-data and emissions calculation modules.
- `src/services/`: typed browser API client and environmental response normalization.
- `server/`: Express API routes, Open-Meteo client, server-side Manus LLM client, validation, rate limiting, caching, and static production serving.
- `tests/`: Vitest tests for domain logic, request validation, response fallback and app interactions.
- `public/manus-routes.json`: route manifest synchronized to the SPA's actual page route(s).
- `docs/`: data, decision rules, assumptions, and demo walkthrough/checklist.
- Root files: package manifests/lockfile, deployment Dockerfile, `.env.example`, `.gitignore`, `README.md`, `LICENSE`, `plan.md`, and `TODO.md`.

## Delivery and dependencies

Keep the dependency set intentionally small: React, TypeScript, Vite, Express, Zod, Lucide icons, and Vitest/Testing Library as needed. Use the available Node package manager pinned in `package.json` and a committed lockfile; inspect lifecycle scripts and follow the package manager's current policy before installing. No browser credential is required for Open-Meteo; server-side LLM access uses supplied Manus runtime variables, never a committed key.

Provide a self-contained container build that installs locked dependencies, builds the client, and serves the application/API on `PORT` (default 3000). Provide a health route. Prepare the project's Webdev hybrid/static build and server deploy declarations only after paths and commands match the implemented project. Do not assert that public GitHub, deployment, external API availability, or hosted build succeeded unless the corresponding operation is actually completed and observed.

## Design

- **Design Movement:** Editorial environmental intelligence, combining an air-monitoring instrument panel with calm civic-service typography.
- **Core Principles:** Measurement before advice; visibly distinguish live/model/demo/unavailable states; make every recommendation explainable; prioritize calm, accessible, mobile-first controls.
- **Color Philosophy:** Deep navy provides a stable instrument-like frame; off-white surfaces and slate text support long reading; emerald marks clean/positive actions, cyan marks data/context, and amber/red/purple signal escalating AQI risk. Color is always paired with labels and icons.
- **Layout Paradigm:** A compact top-level navigation and split workspace: a live-condition overview anchors the page, while a persistent action rail and tabbed feature workspaces expose deeper tools without a crowded marketing landing page. Collapse navigation and stack metric cards on mobile.
- **Signature Elements:** A custom AirWise airflow mark built from three offset arcs; a segmented AQI meter with a prominent numeric readout and text category; compact "Why AirWise recommends this" reasoning cards.
- **Interaction Philosophy:** Immediate, reversible changes to location, language, household context, and activity preferences update deterministic recommendations visibly. Explicit loading, empty, stale and error states preserve trust. No decorative controls.
- **Animation:** Brief opacity/position transitions for panel changes and progress; respect `prefers-reduced-motion`; never animate severity in a way that obscures status.
- **Typography System:** Use a crisp sans-serif UI family with strong tabular numerals for AQI values; set a clear display/section/body/label hierarchy and ensure Hindi glyph coverage through system fallbacks.
- **Brand Essence:** An evidence-led air-quality co-pilot for households making everyday urban choices; **clear, grounded, protective**.
- **Brand Voice:** Direct, reassuring, non-alarmist, and explicit about uncertainty. Examples: “The current model indicates elevated particle pollution.” “Keep strenuous activity indoors; the best hour cannot be confirmed from available data.”
- **Wordmark & Logo:** An ownable three-arc airflow symbol feeding into a small leaf-shaped terminal, paired with a custom-spaced AirWise wordmark; render as lightweight SVG/CSS rather than a large raster asset.
- **Signature Brand Color:** Deep teal `#0B6B63`, paired with the requested deep navy `#0B1220`, emerald `#10B981`, cyan `#06B6D4`, off-white `#F8FAFC`, amber `#F59E0B`, and red `#EF4444`.
