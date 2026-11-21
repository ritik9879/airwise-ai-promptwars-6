import { ArrowDownRight, ArrowUpRight, Info, Wind } from 'lucide-react';
import { aqiBand, dataFreshness, formatConcentration } from '../domain/aqi';
import type { Recommendation } from '../domain/recommendations';
import type { AirQuality, PollutantKey } from '../types';
import { copy, localizedRecommendation, type Language } from '../i18n';

const labels: Record<PollutantKey, string> = { pm2_5: 'PM2.5', pm10: 'PM10', nitrogen_dioxide: 'NO₂', ozone: 'O₃', sulphur_dioxide: 'SO₂', carbon_monoxide: 'CO' };
const pollutants: PollutantKey[] = ['pm2_5', 'pm10', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide', 'carbon_monoxide'];

function AqiArc({ value, color }: { value: number | null; color: string }) {
  const clamped = value == null ? 0 : Math.min(500, value);
  const degrees = (clamped / 500) * 180;
  return <div className="aqi-arc" aria-hidden="true"><div className="aqi-arc-track" /><div className="aqi-arc-fill" style={{ '--fill': `${degrees}deg`, '--arc-color': color } as React.CSSProperties} /><div className="aqi-arc-center"><Wind size={19} /><span>US AQI</span></div></div>;
}

function hourLabel(timestamp: string, timezone?: string) {
  if (!timestamp) return '';
  try { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone || undefined }).format(new Date(timestamp)); }
  catch { return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
}

function dateTimeLabel(timestamp: string | null, timezone: string | undefined, language: Language) {
  if (!timestamp) return language === 'hi' ? 'समय उपलब्ध नहीं' : 'Time unavailable';
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: timezone || undefined };
  try { return new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : undefined, options).format(new Date(timestamp)); }
  catch { return new Date(timestamp).toLocaleString(language === 'hi' ? 'hi-IN' : undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
}

function HourlyChart({ air, language }: { air: AirQuality; language: Language }) {
  const points = air.hourly.slice(0, 24);
  const values = points.map((point) => point.aqi).filter((value): value is number => value !== null);
  if (values.length < 2) return <div className="chart-empty">{language === 'hi' ? 'इस स्थान के लिए प्रति-घंटा मॉडल डेटा उपलब्ध नहीं है।' : 'Hourly model output is not available for this location.'}</div>;
  const min = Math.max(0, Math.min(...values) - 12);
  const max = Math.max(min + 12, Math.max(...values) + 12);
  const coords = points.map((point, index) => point.aqi === null ? null : `${(index / (points.length - 1)) * 100},${92 - ((point.aqi - min) / (max - min)) * 78}`).filter(Boolean);
  const line = coords.join(' ');
  const path = points.map((point, index) => {
    if (point.aqi === null) return '';
    const x = (index / (points.length - 1)) * 100;
    const y = 92 - ((point.aqi - min) / (max - min)) * 78;
    return `${index === 0 || points[index - 1]?.aqi === null ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const first = points[0]?.time ?? '';
  const last = points[points.length - 1]?.time ?? '';
  return <figure className="chart-wrap" aria-label={`Modeled hourly US AQI from ${first} through ${last}`}><svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Modeled U.S. AQI changes from ${Math.round(values[0])} to ${Math.round(values[values.length - 1])} across the returned hours`}><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0c9380" stopOpacity=".17"/><stop offset="1" stopColor="#0c9380" stopOpacity="0"/></linearGradient></defs><path d={`${path} L100,100 L0,100 Z`} fill="url(#area)"/><path d={path} fill="none" stroke="#0c9380" strokeWidth="2.3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/><polyline points={line} fill="none" stroke="transparent" strokeWidth="16" vectorEffect="non-scaling-stroke" /></svg><div className="chart-hours"><span>{hourLabel(first, air.place.timezone) || (language === 'hi' ? 'अभी' : 'Now')}</span><span>{hourLabel(points[Math.floor(points.length / 2)]?.time ?? '', air.place.timezone)}</span><span>{hourLabel(last, air.place.timezone)}</span></div><figcaption>{language === 'hi' ? 'प्रदाता का मॉडल-आधारित प्रति-घंटा क्रम · गारंटीकृत पूर्वानुमान नहीं' : 'Provider-model hourly series · not a guaranteed forecast'}</figcaption></figure>;
}

export function WhyCard({ recommendation, language = 'en' }: { recommendation: Recommendation; language?: Language }) {
  const labels = language === 'hi' ? ['AirWise यह सुझाव क्यों देता है', 'निर्णय का तर्क देखें', 'माप और संदर्भ', 'निर्णय नियम', 'अपेक्षित लाभ', 'सीमा'] : ['Why AirWise recommends this', 'See the decision logic', 'Measurement & context', 'Decision rule', 'Expected benefit', 'Limit'];
  return <section className={`why-card priority-${recommendation.priority}`} aria-labelledby="why-title"><div className="why-icon"><Info size={17}/></div><div><p className="eyebrow" id="why-title">{labels[0]}</p><h3>{recommendation.title}</h3><p>{recommendation.action}</p><details><summary>{labels[1]}</summary><dl className="reason-list"><dt>{labels[2]}</dt><dd>{recommendation.why}</dd><dt>{labels[3]}</dt><dd>{recommendation.rule}</dd><dt>{labels[4]}</dt><dd>{recommendation.benefit}</dd><dt>{labels[5]}</dt><dd>{recommendation.uncertainty}</dd></dl></details></div></section>;
}

export function Dashboard({ air, loading, error, demo, recommendation, language = 'en', onDemo }: { air: AirQuality | null; loading: boolean; error: string | null; demo: boolean; recommendation: Recommendation; language?: Language; onDemo: () => void }) {
  const t = copy[language];
  const band = aqiBand(air?.aqi);
  const freshness = demo ? 'demo' : dataFreshness(air?.timestamps.current);
  const freshnessText = freshness === 'live' ? (language === 'hi' ? 'वर्तमान मॉडल डेटा' : 'Current model output') : freshness === 'recent' ? (language === 'hi' ? 'हाल में अपडेट मॉडल डेटा' : 'Recently updated model output') : freshness === 'stale' ? (language === 'hi' ? 'मॉडल डेटा 6 घंटे से पुराना है' : 'Model timestamp is over 6 hours old') : freshness === 'demo' ? (language === 'hi' ? 'केवल नमूना — लाइव नहीं' : 'Illustrative sample — not live') : t.status.unavailable;
  const localized = localizedRecommendation(recommendation, air?.aqi, language);
  const badge = demo ? t.status.demo : freshness === 'unavailable' ? t.status.unavailable : freshness === 'stale' ? t.status.stale : freshness === 'recent' ? t.status.recent : t.status.live;
  return <div className="view-stack">
    <div className="page-intro"><div><p className="eyebrow">{language === 'hi' ? 'वायु गुणवत्ता सारांश' : 'AIR QUALITY SNAPSHOT'}</p><h1>{language === 'hi' ? 'आज की हवा, साफ़ समझें।' : 'Your day, in the clear.'}</h1><p>{language === 'hi' ? 'बाहरी हवा के अनुसार आज के विकल्प समझें।' : 'See what the outdoor air suggests for the choices ahead.'}</p></div><span className={`data-badge badge-${freshness}`}><span className="status-dot"/>{badge}</span></div>
    {loading && <div className="notice loading-notice" role="status"><span className="spinner"/>{'Loading air-quality data…'}</div>}
    {error && !loading && <div className="notice error-notice" role="alert"><Info size={17}/><div><strong>Couldn’t load the current data</strong><p>{error}</p><button className="text-button" onClick={onDemo}>View clearly labeled sample data</button></div></div>}
    {!air && !loading && !error && <div className="notice"><Info size={17}/><p>No live reading is available. AirWise will not substitute a made-up value.</p><button className="text-button" onClick={onDemo}>View labeled demo data</button></div>}
    {air && <>
      <section className="overview-grid" aria-label={language === 'hi' ? 'वर्तमान बाहरी वायु गुणवत्ता' : 'Current outdoor air quality'}>
        <article className="card aqi-card"><div className="card-head"><div><p className="eyebrow">{language === 'hi' ? 'वर्तमान बाहरी हवा' : 'CURRENT OUTDOOR AIR'}</p><h2>{air.place.name}{air.place.admin1 ? `, ${air.place.admin1}` : ''}</h2></div><span className="small-status">{demo ? (language === 'hi' ? 'नमूना' : 'Sample') : (language === 'hi' ? 'मॉडल' : 'Model')}</span></div><div className="aqi-reading"><AqiArc value={air.aqi} color={band?.color ?? '#94a3b8'}/><div className="aqi-value"><span className="aqi-number" style={{ color: band?.color }}>{air.aqi == null ? '—' : Math.round(air.aqi)}</span><span className="aqi-label">{band?.category ?? (language === 'hi' ? 'उपलब्ध नहीं' : 'Unavailable')}</span><span className="aqi-unit">{language === 'hi' ? 'U.S. वायु गुणवत्ता सूचकांक' : 'U.S. Air Quality Index'}</span></div></div><p className="aqi-summary">{air.aqi == null ? (language === 'hi' ? 'इस स्थान के लिए वर्तमान सूचकांक उपलब्ध नहीं है।' : 'No current index was returned for this location.') : band?.category === 'Good' ? (language === 'hi' ? 'वायु गुणवत्ता संतोषजनक है। अधिकांश लोग अपनी सामान्य बाहरी दिनचर्या रख सकते हैं।' : 'Air quality is satisfactory. Most people can enjoy their usual outdoor routine.') : band?.category === 'Moderate' ? (language === 'hi' ? 'वायु गुणवत्ता स्वीकार्य है। असामान्य रूप से संवेदनशील लोग अतिरिक्त सावधानी रख सकते हैं।' : 'Air quality is acceptable. Some unusually sensitive people may want to take extra care.') : language === 'hi' ? `वायु गुणवत्ता ${band?.category.toLowerCase()} श्रेणी में है। नीचे दिए गए सावधानी सुझावों पर विचार करें।` : `Air quality is in the ${band?.category.toLowerCase()} range. Consider the tailored precautions below.`}</p><div className="card-foot"><span><span className={`status-dot status-${freshness}`}/>{freshnessText}</span><span>{demo ? (language === 'hi' ? 'केवल नमूना' : 'Sample only') : dateTimeLabel(air.timestamps.current, air.place.timezone, language)}</span></div></article>
        <article className="card pollutant-card"><div className="card-head"><div><p className="eyebrow">POLLUTANTS</p><h2>What’s in the air</h2></div><Wind size={20} className="muted-icon"/></div><p className="muted small">Concentrations · µg/m³</p><div className="pollutant-grid">{pollutants.map((key) => <div className="pollutant" key={key}><span>{labels[key]}</span><strong>{formatConcentration(air.pollutants[key]).replace(' µg/m³', '')}</strong><small>µg/m³</small></div>)}</div><div className="note-line"><Info size={14}/><span>Concentrations are not AQI values.</span></div></article>
      </section>
      <section className="lower-grid"><article className="card trend-card"><div className="card-head"><div><p className="eyebrow">{language === 'hi' ? 'आगे का रुझान' : 'UP NEXT'}</p><h2>{language === 'hi' ? 'दिन भर की हवा' : 'Air through the day'}</h2><p className="muted small">{language === 'hi' ? 'समय-संकेत को मार्गदर्शन मानें, वादा नहीं।' : 'Use timing as a guide, not a promise.'}</p></div><span className="chart-chip"><span className="chart-key"/>{language === 'hi' ? 'मॉडल AQI' : 'Modeled AQI'}</span></div><HourlyChart air={air} language={language}/></article><div className="recommendation-column"><WhyCard recommendation={localized} language={language}/><div className="source-card"><span className="source-icon"><Info size={16}/></span><div><strong>{language === 'hi' ? 'डेटा का अर्थ' : 'Know what this is'}</strong><p>{demo ? (language === 'hi' ? 'यह काल्पनिक प्रदर्शन नमूना है; यह वर्तमान स्थानीय स्थिति नहीं बताता।' : 'This is a fictional demonstration sample; it does not describe current local conditions.') : air.sourceNote}</p><span>{air.source}</span></div></div></div></section>
    </>}
  </div>;
}
