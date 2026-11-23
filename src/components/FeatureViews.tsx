import { useMemo, useState } from 'react';
import { ArrowRightLeft, Check, CircleHelp, Leaf, ShieldCheck, SlidersHorizontal, Wind } from 'lucide-react';
import { compareTrip, FACTOR_VERSION, FACTORS_KG_PER_KM, MODE_LABELS, tripEmissionsKg, type Mode } from '../domain/emissions';
import { makeDailyActions, type Household } from '../domain/recommendations';
import { aqiBand } from '../domain/aqi';
import type { AirQuality } from '../types';

const modes: Mode[] = ['car', 'bus', 'metro', 'walk', 'cycle', 'carpool'];
const modeGuidance: Record<Mode, string> = { car: 'Private vehicle. Emissions are treated per vehicle-kilometre for a single occupant.', bus: 'Shared bus service. Per-passenger estimate uses average local-bus occupancy.', metro: 'Rail proxy. Actual local metro energy mix and occupancy may differ.', walk: 'Zero direct travel emissions in this estimate. Consider the current outdoor AQI before choosing.', cycle: 'Zero direct travel emissions in this estimate. Consider the current outdoor AQI before choosing.', carpool: 'Same average-car factor divided by an assumed two occupants; coordination and route detours are excluded.' };

export function Planner({ air, household, exercise }: { air: AirQuality | null; household: Household; exercise: boolean }) {
  const [wake, setWake] = useState('07:00'); const [start, setStart] = useState('09:00'); const [commute, setCommute] = useState('Transit if practical');
  const actions = makeDailyActions({ aqi: air?.aqi ?? null, household, activity: exercise ? 'vigorous' : 'routine' }, Boolean(air?.hourly.length));
  const best = air?.hourly.filter((p) => p.aqi != null).slice(0, 12).sort((a, b) => (a.aqi ?? 999) - (b.aqi ?? 999))[0];
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">PERSONALIZED ROUTINE</p><h1>Make room for cleaner choices.</h1><p>Build a practical plan from your schedule and the available outdoor-air context.</p></div><span className="ai-pill"><SlidersHorizontal size={15}/> Updates with your preferences</span></div><section className="tool-layout"><article className="card form-card"><p className="eyebrow">YOUR DAY</p><h2>Tell us what fits</h2><div className="field-row"><label>Usual wake-up time<input type="time" value={wake} onChange={(e) => setWake(e.target.value)}/></label><label>Work or school starts<input type="time" value={start} onChange={(e) => setStart(e.target.value)}/></label></div><label>Commute preference<select value={commute} onChange={(e) => setCommute(e.target.value)}><option>Transit if practical</option><option>Carpool when available</option><option>Walk or cycle when conditions are suitable</option><option>Private car</option><option>Work or learn from home</option></select></label><p className="fineprint">Schedule details stay in this browser session and are not saved to an account.</p></article><article className="card plan-card"><div className="card-head"><div><p className="eyebrow">TODAY’S ACTION PLAN</p><h2>Small, useful steps</h2></div><span className="plan-mark"><Check size={15}/> Ready</span></div><ol className="timeline"><li><time>{wake}</time><div><strong>Start gently</strong><p>{air?.aqi == null ? 'Check a trusted local reading before a long outdoor workout.' : (air.aqi > 100 ? 'Choose a light indoor start; current pollution argues against a strenuous outdoor session.' : 'Outdoor time may fit your usual morning. Recheck conditions before a long session.')}</p></div></li><li><time>{start}</time><div><strong>Plan your trip</strong><p>{commute === 'Private car' ? 'If driving is necessary, combine errands and avoid unnecessary idling.' : 'Prefer a lower-emission commute when it is available and safe; avoid exposed walking/cycling during severe pollution.'}</p></div></li><li><time>Midday</time><div><strong>Keep the indoor air calm</strong><p>Use the kitchen exhaust while cooking, reduce smoke sources, and clean settled dust with a damp cloth.</p></div></li><li><time>Evening</time><div><strong>Choose activity by conditions</strong><p>{best ? `Lowest returned model AQI in the next hours: ${best.time.replace('T', ' ')} (${Math.round(best.aqi!)}). This is a model estimate, not a guarantee.` : 'No hourly model series is available, so AirWise will not guess a cleaner hour.'}</p></div></li></ol><p className="plan-source">{air?.hourly.length ? 'Timing references the provider’s model series.' : 'Based on current conditions and general precautions.'}</p></article></section></div>;
}

export function IndoorAdvisor({ air }: { air: AirQuality | null }) {
  const elevated = air?.aqi != null && air.aqi > 100;
  const items = [
    { title: 'Ventilate with intention', body: elevated ? 'When outdoor pollution is elevated, keep windows closed when practical. Ventilate when the outdoor reading improves; do not assume a particular hour is cleaner unless model data supports it.' : 'If outdoor conditions are favorable, a short period of fresh-air ventilation can help. Recheck local outdoor air first.', tag: 'Condition-aware' },
    { title: 'Use the kitchen exhaust', body: 'Run a range hood vented outdoors while cooking and briefly afterward. If one is not available, use a safe exhaust fan where practical.', tag: 'Source reduction' },
    { title: 'Reduce particle sources', body: 'Avoid indoor smoking, candles, incense, and unnecessary combustion. Lower-temperature cooking and preventing burnt food can reduce particle generation.', tag: 'Low cost' },
    { title: 'Clean dust without stirring it', body: 'Use a damp cloth or wet mop for settled dust. Follow equipment instructions if vacuuming, and avoid dry sweeping during high-particle periods.', tag: 'Practical' },
    { title: 'Consider a room-sized HEPA purifier', body: 'Choose a particle-cleaner CADR suited to the room size and replace filters as specified. Filtration supplements source control and clean-air ventilation; it does not remove every pollutant.', tag: 'Budget choice' },
  ];
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">HOME ENVIRONMENT</p><h1>Make indoor air a little easier.</h1><p>Practical steps for particles—without pretending we can see inside your home.</p></div><span className="ai-pill"><Wind size={15}/> No indoor sensor assumed</span></div><div className="card context-strip"><ShieldCheck size={20}/><div><strong>{elevated ? 'Outdoor particles are elevated' : air?.aqi == null ? 'Outdoor reading unavailable' : 'Indoor air is not measured'}</strong><p>{elevated ? 'Window guidance reflects the available outdoor AQI; it is not an indoor measurement.' : 'These are general source-control suggestions. AirWise has no indoor pollutant reading for your home.'}</p></div></div><div className="indoor-grid">{items.map((item, i) => <article className="card indoor-tip" key={item.title}><span className="tip-index">0{i + 1}</span><span className="tip-tag">{item.tag}</span><h2>{item.title}</h2><p>{item.body}</p></article>)}</div><p className="fineprint source-note">Guidance adapted from U.S. EPA consumer information about indoor particulate sources and home air cleaners. Local building codes, combustion appliances, and ventilation design vary.</p></div>;
}

export function Mobility({ air }: { air: AirQuality | null }) {
  const [distance, setDistance] = useState(8); const [mode, setMode] = useState<Mode>('metro');
  const direct = tripEmissionsKg(distance, mode); const solo = tripEmissionsKg(distance, 'car');
  const exposureCaution = (mode === 'walk' || mode === 'cycle') && (air?.aqi ?? 0) > 150;
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">LOWER-EMISSION TRAVEL</p><h1>Compare the trip, not just the mode.</h1><p>Emissions and personal exposure are different trade-offs. Both belong in the decision.</p></div><span className="ai-pill"><Leaf size={15}/> Estimates, not measurements</span></div><section className="tool-layout"><article className="card form-card"><p className="eyebrow">YOUR ROUTE</p><h2>What are you considering?</h2><label>One-way distance <span className="range-value">{distance} km</span><input type="range" min="1" max="50" value={distance} onChange={(e) => setDistance(Number(e.target.value))} aria-label="One-way trip distance in kilometres"/></label><label>Travel mode<select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>{modes.map((m) => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}</select></label><div className="mobility-caution"><CircleHelp size={17}/><span>{exposureCaution ? 'At this AQI, outdoor walking/cycling can increase exposure. Consider indoor or motorized transit options if available.' : air?.aqi == null ? 'Current AQI is unavailable. Check a local source before choosing prolonged outdoor travel.' : `Current context: ${Math.round(air.aqi)} U.S. AQI. Consider personal exposure as well as emissions.`}</span></div></article><article className="card comparison-card"><p className="eyebrow">ESTIMATED DIRECT + UPSTREAM GHG</p><h2>{MODE_LABELS[mode]}</h2><div className="emission-total">{direct.toFixed(2)}<span> kg CO₂e / one-way trip</span></div><div className="compare-row"><div><span>Solo car baseline</span><strong>{solo.toFixed(2)} kg</strong></div><ArrowRightLeft size={18}/><div><span>Your selection</span><strong>{direct.toFixed(2)} kg</strong></div></div><p className="factor-note">Factor: {modeGuidance[mode]}</p><details className="factor-details"><summary>Show factor and limitations</summary><p>{FACTOR_VERSION} factors: solo average car 0.17265 kg CO₂e/vehicle-km; average local bus 0.10151 kg CO₂e/passenger-km; London Underground proxy 0.01549 kg CO₂e/passenger-km. Carpool divides the car factor by an assumed two occupants. Walking/cycling count zero direct travel emissions only.</p><p>These UK-average factors are illustrative proxies, not location-specific Indian transit data. They exclude route differences and mode availability; actual vehicle, occupancy, electricity mix, and operation change results.</p></details></article></section></div>;
}

export function ImpactCalculator() {
  const [distance, setDistance] = useState(10);
  const [baseline, setBaseline] = useState<Mode>('car');
  const [alternative, setAlternative] = useState<Mode>('bus');
  const result = useMemo(() => compareTrip(distance, baseline, alternative), [distance, baseline, alternative]);
  const increase = result.avoidedKg < 0;
  const noChange = result.avoidedKg === 0;
  const percentage = result.percent === null ? null : Math.abs(result.percent);
  const percentageDescription = percentage === null
    ? 'Percentage difference unavailable because baseline emissions are zero.'
    : noChange ? 'No estimated emissions change.' : `Estimated emissions ${increase ? 'increase' : 'reduction'} ${percentage.toFixed(0)} percent.`;

  return (
    <div className="view-stack">
      <div className="page-intro">
        <div>
          <p className="eyebrow">WHAT-IF SIMULATOR</p>
          <h1>See what a small switch could change.</h1>
          <p>Compare estimated trip emissions under transparent assumptions.</p>
        </div>
        <span className="ai-pill"><ArrowRightLeft size={15} /> Change any input</span>
      </div>
      <section className="tool-layout">
        <article className="card form-card">
          <p className="eyebrow">SCENARIO A → B</p>
          <h2>Set up a comparison</h2>
          <label>
            Trip distance <span className="range-value">{distance} km</span>
            <input type="range" min="1" max="50" value={distance} onChange={(event) => setDistance(Number(event.target.value))} aria-label="Scenario trip distance in kilometres" />
          </label>
          <label>
            Baseline scenario
            <select value={baseline} onChange={(event) => setBaseline(event.target.value as Mode)}>
              {modes.map((mode) => <option key={mode} value={mode}>{MODE_LABELS[mode]}</option>)}
            </select>
          </label>
          <label>
            Alternative scenario
            <select value={alternative} onChange={(event) => setAlternative(event.target.value as Mode)}>
              {modes.map((mode) => <option key={mode} value={mode}>{MODE_LABELS[mode]}</option>)}
            </select>
          </label>
        </article>
        <article className="card impact-result">
          <p className="eyebrow">ESTIMATED PER TRIP</p>
          <h2>{Math.abs(result.avoidedKg).toFixed(2)} <span>kg CO₂e {noChange ? 'no change' : increase ? 'increase' : 'avoided'}</span></h2>
          <div className="impact-bar" role="img" aria-label={percentageDescription}>
            <span style={{ width: `${Math.max(2, Math.min(100, percentage ?? 2))}%` }} />
          </div>
          <div className="impact-numbers">
            <div><span>Scenario A</span><strong>{result.baselineKg.toFixed(2)} kg</strong></div>
            <div><span>Scenario B</span><strong>{result.alternativeKg.toFixed(2)} kg</strong></div>
            <div><span>Difference</span><strong>{percentage === null ? '—' : noChange ? '0% change' : `${increase ? '+' : '−'}${percentage.toFixed(0)}%`}</strong></div>
          </div>
          {percentage === null && <p className="fineprint">Percentage comparison is undefined when baseline emissions are zero.</p>}
          <p className="estimate-label"><Leaf size={16} /> Estimated, not measured</p>
          <details className="factor-details">
            <summary>How this is calculated</summary>
            <p>Distance × mode factor = estimated CO₂e per passenger trip. {FACTOR_VERSION} factors are shown in the mobility advisor. Carpool assumes two occupants; walking and cycling exclude lifecycle emissions. A negative avoided amount means scenario B emits more than scenario A.</p>
          </details>
        </article>
      </section>
    </div>
  );
}

export function FamilyMode({ household, setHousehold }: { household: Household; setHousehold: (value: Household) => void }) {
  const options: Array<{ value: Household; title: string; text: string }> = [
    { value: 'general', title: 'General household', text: 'Baseline public AQI guidance for everyday routines.' },
    { value: 'children', title: 'Children at home', text: 'Extra care around prolonged outdoor play and vigorous activity.' },
    { value: 'older', title: 'Older adults at home', text: 'Extra care around long or strenuous outdoor activity.' },
    { value: 'extra-care', title: 'Extra respiratory precautions', text: 'A general preference for more cautious exposure guidance; no diagnosis or condition is stored.' },
  ];
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">HOUSEHOLD PREFERENCES</p><h1>Protect the people who share your air.</h1><p>Choose a general context so the deterministic advice can adapt.</p></div><span className="ai-pill"><ShieldCheck size={15}/> Private by default</span></div><div className="family-grid">{options.map((option) => <button className={`card family-option ${household === option.value ? 'selected' : ''}`} key={option.value} onClick={() => setHousehold(option.value)} aria-pressed={household === option.value}><span className="family-radio">{household === option.value && <Check size={14}/>}</span><strong>{option.title}</strong><span>{option.text}</span></button>)}</div><div className="card privacy-card"><ShieldCheck size={21}/><div><strong>Preference only — no medical profile</strong><p>This choice changes only the guidance shown during this browser session. AirWise does not ask for names, diagnoses, medications, or other medical details.</p></div></div></div>;
}

export function Community() {
  const [done, setDone] = useState<string[]>([]);
  const actions = [{ id: 'rideshare', title: 'Offer a shared commute', body: 'Coordinate one recurring ride with a neighbor or colleague to reduce separate vehicle trips.' }, { id: 'idling', title: 'Reduce idling near school gates', body: 'Ask for a no-idling reminder at drop-off points and choose a safe waiting place away from exhaust.' }, { id: 'school', title: 'Share a school air-quality note', body: 'Help families find official local air-quality information and agree on a clear outdoor-activity plan.' }, { id: 'cleaner', title: 'Choose cleaner household practices', body: 'Encourage damp dusting, less indoor smoke, and safe kitchen exhaust use across the neighborhood.' }];
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">COMMUNITY ACTION</p><h1>Cleaner air is a shared effort.</h1><p>Small individual choices help. Coordinated action can address more sources together.</p></div><span className="ai-pill"><Leaf size={15}/> No invented statistics</span></div><div className="community-list">{actions.map((action) => { const checked = done.includes(action.id); return <article className="card community-action" key={action.id}><div className={`action-check ${checked ? 'checked' : ''}`}>{checked && <Check size={17}/>}</div><div><h2>{action.title}</h2><p>{action.body}</p><span className="fineprint">A practical suggestion—not a measured community impact.</span></div><button className="secondary-button" onClick={() => setDone((old) => checked ? old.filter((v) => v !== action.id) : [...old, action.id])}>{checked ? 'Added to my list' : 'Add to my list'}</button></article>; })}</div><div className="card community-foot"><strong>Personal and community actions are different.</strong><p>A household can change its own routes and indoor sources. Community coordination can support shared travel, school practices, and local awareness. AirWise does not estimate neighborhood-wide pollution reductions.</p></div></div>;
}

export function Settings({ air, demo, language, setLanguage, onRefresh, onDemo }: { air: AirQuality | null; demo: boolean; language: 'en'|'hi'; setLanguage: (v: 'en'|'hi')=>void; onRefresh: ()=>void; onDemo: ()=>void }) {
  return <div className="view-stack"><div className="page-intro"><div><p className="eyebrow">TRANSPARENCY & CONTROLS</p><h1>Data you can understand.</h1><p>See what AirWise uses, what it estimates, and what stays local.</p></div><span className="ai-pill"><CircleHelp size={15}/> Open methods</span></div><div className="settings-grid"><section className="card settings-panel"><p className="eyebrow">LANGUAGE</p><h2>Choose your interface</h2><div className="language-buttons"><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button><button className={language === 'hi' ? 'active' : ''} onClick={() => setLanguage('hi')}>हिन्दी</button></div><p className="fineprint">Key navigation and status labels are translated. Assistant replies can be requested in the selected language.</p></section><section className="card settings-panel"><p className="eyebrow">AIR-QUALITY SOURCE</p><h2>Provider & confidence</h2><p>{air?.source ?? 'Open-Meteo Air Quality API'}</p><p className="fineprint">U.S. AQI and pollutant values are CAMS-based modeled output on a regional grid, not a local monitoring station or indoor sensor. Current endpoint results refresh in a short cache; a stale timestamp is labeled.</p><div className="source-controls"><button className="secondary-button" onClick={onRefresh}>Refresh air data</button><button className="text-button" onClick={onDemo}>Switch to sample demo</button></div></section><section className="card settings-panel"><p className="eyebrow">AI & PRIVACY</p><h2>Bounded use of AI</h2><p>When available, a server-side language model personalizes and explains guidance using the question and selected context. On submit, your question, selected location, available AQI, household preference, activity preference, language, and rules-based precaution are sent to the configured AI service; check that service's privacy terms before sharing anything sensitive. Deterministic AQI rules remain the source of critical precautions.</p><p className="fineprint">AirWise does not save chat, create an account, or store a personal medical profile. AI responses may be incomplete; verify important decisions with local public-health sources. Avoid sharing personal medical details.</p></section><section className="card settings-panel"><p className="eyebrow">ESTIMATES</p><h2>Transport assumptions</h2><p>Impact and mode comparisons use 2026 UK Government factors as transparent illustrative proxies. They are not measured and may not reflect local vehicles, occupancy, energy mix, route, or transit options.</p><p className="fineprint">Walking/cycling are zero direct travel emissions only. Carpool uses two occupants. Personal exposure is considered separately from CO₂e.</p></section></div></div>;
}
