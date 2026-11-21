# AirWise AI — 2–3 minute demo walkthrough

## Walkthrough

**0:00–0:20 — Start with the dashboard.** Introduce AirWise as an urban air-quality decision assistant. Point out the data-status badge, selected location, U.S. AQI label, source, update time, pollutant concentrations and units. Say explicitly that Open-Meteo returns CAMS-based modeled data, not a local station reading. If live service is unavailable, switch to the clearly labeled fictional sample and call it a demo sample.

**0:20–0:40 — Change location.** Search for Delhi or another city, choose a result, then show the refreshed observation. Demonstrate browser location only if permission is available. Show the error/unavailable state if the provider is offline; do not narrate a made-up AQI value.

**0:40–1:00 — Explain one recommendation.** Expand “Why AirWise recommends this.” Tie the action to the supplied U.S. AQI range and household context. State the benefit and uncertainty. Show the hourly model series only as provider-model guidance, not a certain forecast.

**1:00–1:25 — Personalize a day.** Open Daily planner. Change wake/work times or commute preferences. Show how an AQI-aware exercise and travel suggestion changes. Point out that no cleaner hour is guessed when hourly data is missing.

**1:25–1:45 — Improve indoor conditions.** Show ventilation, cooking exhaust, dust and filtration tips. Clarify that no indoor sensor is assumed and filtration is not a cure-all.

**1:45–2:05 — Compare travel and impact.** Select a trip distance and mode. Separate CO₂e estimates from exposure advice; show the UK 2026 factor assumptions and caveat that they are not Delhi-specific. Change scenarios in the impact calculator.

**2:05–2:25 — Family, community, and language.** Select children/older-adult/extra-precaution context, point out no diagnoses are requested, add a community action, and toggle English/Hindi.

**2:25–2:45 — Ask the assistant.** Use a short prompt such as “Can my child play outside today?” Point out that AI uses the current context when available, but critical advice remains deterministic. If AI is not configured, show its truthful fallback. End on the mobile layout if a real mobile preview is available.

## Recording checklist

- Use a location with a successful provider response, or explicitly identify the demo sample as fictional.
- Ensure no API keys, environment files, personal data, or developer tools are visible.
- Show data source, standard, units, freshness, and uncertainty on screen.
- Demonstrate one preference change and one explainability panel.
- Show assistant fallback if LLM service is unavailable; do not claim it answered with a live model unless verified.
- Show actual mobile viewport only when captured from the running app.
- Do not add an unverified deployment/demo link or claim unsupported data coverage.
