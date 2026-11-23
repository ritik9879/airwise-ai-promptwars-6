# Data sources and decision methods

## Outdoor air data

AirWise requests the Open-Meteo Air Quality API's `current` fields, including `us_aqi`, `pm2_5`, `pm10`, `nitrogen_dioxide`, `ozone`, `sulphur_dioxide`, and `carbon_monoxide`, and the hourly `us_aqi` series when available. Concentrations are kept in the API's reported µg/m³ units; the supplied U.S. AQI is treated as a separate index. AirWise does not calculate AQI from concentration fields and does not mix U.S. and European AQI.

Open-Meteo documents its product as CAMS European/global forecast/model output with different grid resolutions. Therefore the app identifies current values as **provider model output**, not as a local regulatory monitor or household sensor. The API request uses `timeformat=unixtime`; the provider defines these values as seconds since 1970-01-01 00:00 UTC. The server converts them to UTC ISO timestamps for stable freshness parsing across browser time zones. The current timestamp and chart-hour labels are then formatted with the provider-returned IANA location timezone when available, which preserves daylight-saving-time behavior. The provider's current timestamp determines the freshness badge: up to 90 minutes is live/current model output, over 90 minutes through six hours is recently updated, older is stale, and missing/invalid timestamps are unavailable. The server caches geocoding for one hour and air results for five minutes; these cache durations do not change the provider timestamp.

When no current AQI exists, AirWise displays no AQI value. When the provider errors or times out, the API returns unavailable/error state. The optional demonstration sample is a fictional interface example and is visibly labeled as not live. It is not used as a fallback silently.

## AQI and deterministic advice

AirWise uses the U.S. AQI category labels and supplied `us_aqi`. Display categories follow the U.S. ranges: Good 0–50, Moderate 51–100, Unhealthy for Sensitive Groups 101–150, Unhealthy 151–200, Very Unhealthy 201–300, and Hazardous 301–500. Concentrations use µg/m³ and are never labeled as AQI. The provider's `us_aqi` remains the authority for the numeric index; local display rules categorize that value.

The deterministic recommendation engine bases its primary action on the U.S. AQI category and the user-selected household preference/activity. Missing AQI never becomes an all-clear. For elevated pollution, it advises reducing prolonged/heavy exertion, especially for vulnerable household contexts, and shifting exercise/play indoors when practical. It never diagnoses or prescribes treatment. AirWise does not know indoor air measurements, route-specific pollution, individual sensitivity, or medical history.

Hourly model values are surfaced as model guidance and can be used to compare returned hours. They are not described as observations or guarantees. If no hourly values exist, AirWise explicitly declines to guess a cleaner time.

## Indoor-air guidance

Indoor guidance is general consumer information on source reduction, safer ventilation choices, cooking exhaust, damp dusting, avoiding indoor smoke/combustion, and appropriately sized particle filtration. Outdoor AQI may condition window advice; the app does not claim to know indoor concentrations. A portable HEPA-style cleaner is presented as a supplement, not a substitute for source control, suitable clean-air ventilation, or addressing moisture problems.

## Transport comparison and personal impact

The calculator uses figures transcribed from the UK Government's **2026 GHG Conversion Factors, Business travel — land** workbook, which reports activity-based CO₂e factors. Values are:

- Average car: 0.17265 kg CO₂e per vehicle-kilometre. The calculator treats one car trip as one vehicle with one driver.
- Average local bus: 0.10151 kg CO₂e per passenger-kilometre.
- London Underground: 0.01549 kg CO₂e per passenger-kilometre, used as a named metro/rail proxy.
- Carpool: average-car factor divided by a declared two occupants.
- Walking and cycling: zero **direct trip-operation** emissions in this small calculator; embodied vehicle, food, infrastructure, and other lifecycle emissions are excluded.

These are UK-average illustrative factors, not a location-specific estimate for Delhi or another city. Local vehicle fleet, route distance, passenger load, grid mix, occupancy, traffic, and operating conditions can materially change the values. Baseline and alternative outputs are modeled estimates, not measured reductions. Emissions are shown separately from exposure: during severe pollution, the interface cautions against outdoor walking/cycling even where estimated direct emissions are zero.

## AI and privacy

When the project runtime provides the AI service, it receives the user's question plus bounded context: selected location, available AQI/category, explicit modeled-or-unavailable data kind, provider measurement timestamp (or null), household preference, activity, language, and deterministic action. The assistant screen discloses this transfer before submission. Both the question and every browser-supplied context field are treated as untrusted, unverified user data and sent in a user message separate from the system instructions. The model is instructed to preserve the deterministic action; the server also rejects a response unless it begins with that exact action. This is a lexical prefix check, not semantic moderation: a reply could still contradict the action later in its text. The deterministic precaution remains separately visible in the UI, and AI text is explicitly labeled. The assistant must not claim browser-supplied values were independently verified. The timestamp may be unavailable; in that case the assistant must not imply freshness. Modeled data must not be described as a station or indoor reading. The model is instructed to avoid unsupported measurements, forecasts, diagnoses, and HTML. The server validates the request with a strict schema, limits body size, applies a timeout, bounds response length, and rate limits requests. Rate-limit counters are in-memory and per process/instance, so they are neither shared across replicas nor persistent after restart; fairness depends on proxy/IP behavior. Express does not enable `trust proxy` here, so deployment client-IP forwarding should be verified rather than assumed. If no service is configured or upstream fails, it returns deterministic guidance that the interface labels separately from generated text. AirWise does not persist chat or household/planner preferences. The selected language is stored locally in the browser; other preferences remain in memory for the active session.

## References

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — variables, units, domains, spatial/temporal coverage, and attribution.
- [U.S. EPA AQI Breakpoints](https://aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html) — U.S. AQI pollutant categories and concentration breakpoints.
- [UK Government GHG Conversion Factors 2026](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026) — activity-based annual conversion factors and workbook.
- [UK Government journey emissions methodology](https://www.gov.uk/government/publications/transport-energy-and-environment-statistics-notes-and-definitions/journey-emissions-comparisons-methodology-and-guidance) — passenger/vehicle-kilometre use and limitations of comparisons.
- [U.S. EPA Guide to Air Cleaners in the Home](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home) — filtration selection, sizing, and limitations.
- [U.S. EPA Sources of Indoor Particulate Matter](https://www.epa.gov/indoor-air-quality-iaq/sources-indoor-particulate-matter-pm) — source control, cooking, ventilation, dust, and combustion cautions.
