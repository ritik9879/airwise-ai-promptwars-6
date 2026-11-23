import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bot, Check, ChevronDown, Compass, HeartHandshake, Home, Leaf, MapPin, Menu, Navigation, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Wind, X } from 'lucide-react';
import { Assistant } from './components/Assistant';
import { Dashboard } from './components/Dashboard';
import { Community, FamilyMode, ImpactCalculator, IndoorAdvisor, Mobility, Planner, Settings } from './components/FeatureViews';
import { getRecommendation, type Household } from './domain/recommendations';
import { fetchAir, searchPlaces } from './services/api';
import { copy, type Language } from './i18n';
import type { AirQuality, Place } from './types';

type View = 'dashboard'|'planner'|'indoor'|'mobility'|'impact'|'family'|'community'|'assistant'|'settings';
const DELHI: Place = { id: 'delhi-default', name: 'Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 };
const DEMO_AIR: AirQuality = { place: DELHI, aqi: 162, pollutants: { pm2_5: 71.2, pm10: 119, nitrogen_dioxide: 21.4, ozone: 28, sulphur_dioxide: 12.7, carbon_monoxide: 481 }, timestamps: { current: null, fetchedAt: '' }, hourly: [], standard: 'US AQI', source: 'AirWise illustrative sample dataset', dataKind: 'modeled', sourceNote: 'Demonstration sample only. It is fictional and is not a report of current conditions.' };
const navItems: Array<{ id: View; icon: typeof Activity; en: string }> = [
  { id: 'dashboard', icon: Activity, en: 'Overview' }, { id: 'planner', icon: SlidersHorizontal, en: 'Daily planner' }, { id: 'indoor', icon: Home, en: 'Indoor air' }, { id: 'mobility', icon: Compass, en: 'Eco mobility' }, { id: 'impact', icon: Leaf, en: 'Impact calculator' }, { id: 'family', icon: ShieldCheck, en: 'Family mode' }, { id: 'community', icon: HeartHandshake, en: 'Community actions' }, { id: 'assistant', icon: Bot, en: 'AI assistant' }, { id: 'settings', icon: Settings2, en: 'Data & settings' },
];

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [place, setPlace] = useState<Place>(DELHI);
  const [air, setAir] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('airwise-language') === 'hi' ? 'hi' : 'en');
  const [household, setHousehold] = useState<Household>('general');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exercise, setExercise] = useState(true);
  const refreshSequence = useRef(0);
  const searchSequence = useRef(0);
  const locationSequence = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const firstNavItemRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileOpen = useRef(false);
  const t = copy[language];

  async function refresh(selected = place) {
    const requestId = ++refreshSequence.current;
    setDemo(false); setLoading(true); setError(null); setAir(null);
    try {
      const result = await fetchAir(selected.latitude, selected.longitude);
      if (requestId === refreshSequence.current) setAir({ ...result, place: { ...selected, timezone: result.place.timezone ?? selected.timezone } });
    } catch (err) {
      if (requestId === refreshSequence.current) setError(err instanceof Error ? err.message : 'Air-quality data could not be loaded.');
    } finally {
      if (requestId === refreshSequence.current) setLoading(false);
    }
  }
  useEffect(() => { void refresh(DELHI); }, []);
  useEffect(() => {
    if (mobileOpen) firstNavItemRef.current?.focus();
    else if (wasMobileOpen.current) mobileMenuButtonRef.current?.focus();
    wasMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  const recommendation = useMemo(() => getRecommendation({ aqi: air?.aqi ?? null, household, activity: exercise ? 'vigorous' : 'routine' }), [air?.aqi, household, exercise]);
  function setLang(next: Language) { setLanguage(next); localStorage.setItem('airwise-language', next); }
  async function submitSearch(event: React.FormEvent) {
    event.preventDefault(); const q = query.trim();
    const requestId = ++searchSequence.current;
    locationSequence.current += 1;
    if (q.length < 2) { setSearching(false); setSearchError('Enter at least two characters.'); return; }
    setSearching(true); setSearchError(''); setSuggestions([]);
    try {
      const result = await searchPlaces(q);
      if (requestId !== searchSequence.current) return;
      if (!result.results.length) setSearchError('No places found. Try a nearby city name.');
      else if (result.results.length === 1) choosePlace(result.results[0]);
      else setSuggestions(result.results);
    } catch (err) {
      if (requestId === searchSequence.current) setSearchError(err instanceof Error ? err.message : 'Location search is unavailable.');
    } finally {
      if (requestId === searchSequence.current) setSearching(false);
    }
  }
  function choosePlace(next: Place) {
    searchSequence.current += 1; locationSequence.current += 1;
    setPlace(next); setQuery(''); setSuggestions([]); setSearching(false); setSearchError(''); setView('dashboard'); setMobileOpen(false); void refresh(next);
  }
  function locate() {
    const requestId = ++locationSequence.current;
    searchSequence.current += 1;
    setSearching(false); setSuggestions([]); setSearchError('');
    if (!navigator.geolocation) { setSearchError('This browser does not provide location access. Search for a city instead.'); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      if (requestId !== locationSequence.current) return;
      const next: Place = { id: 'browser-location', name: 'Your location', latitude: position.coords.latitude, longitude: position.coords.longitude };
      choosePlace(next);
    }, () => { if (requestId === locationSequence.current) setSearchError('Location permission was not granted. You can still search for a city.'); }, { timeout: 8000, maximumAge: 300_000 });
  }
  function showDemo() { refreshSequence.current += 1; searchSequence.current += 1; locationSequence.current += 1; setSearching(false); setSuggestions([]); setAir(DEMO_AIR); setPlace(DELHI); setDemo(true); setError(null); setLoading(false); }
  function handleMobileNavigationKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!mobileOpen) return;
    if (event.key === 'Escape') { event.preventDefault(); setMobileOpen(false); return; }
    if (event.key !== 'Tab') return;
    const items = sidebarRef.current?.querySelectorAll<HTMLButtonElement>('.nav-item');
    const close = mobileMenuButtonRef.current;
    if (!items?.length || !close) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); close.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); close.focus(); }
    else if (event.shiftKey && document.activeElement === close) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === close) { event.preventDefault(); first.focus(); }
  }

  return <div className="app-shell" onKeyDown={handleMobileNavigationKeyDown}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside ref={sidebarRef} id="primary-navigation" className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Primary navigation">
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span/><span/><span/></div><span className="brand-name">AirWise<span>AI</span></span></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="side-nav">{navItems.map(({ id, icon: Icon }, index) => <button ref={index === 0 ? firstNavItemRef : undefined} key={id} className={`nav-item ${view === id ? 'active' : ''}`} aria-current={view === id ? 'page' : undefined} onClick={() => { setView(id); setMobileOpen(false); }}><Icon size={18} strokeWidth={view === id ? 2.2 : 1.8}/><span>{t.nav[id]}</span>{id === 'assistant' && <span className="nav-new" aria-label="AI enabled">AI</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-air"><span className="air-ring"><Wind size={17}/></span><div><strong>AirWise intelligence</strong><span>Clearer choices, daily</span></div><span className="tiny-live" aria-label={loading ? 'Updating' : air ? 'Data loaded' : 'No data'} /></div><div className="side-footer"><span>PromptWars · Challenge 6</span><span>Made for breathing room</span></div></div>
    </aside>
    {mobileOpen && <button className="scrim" aria-label="Close navigation" tabIndex={-1} onClick={() => setMobileOpen(false)}/>}
    <div className="main-column">
      <header className="topbar"><button ref={mobileMenuButtonRef} className="mobile-menu" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} aria-controls="primary-navigation">{mobileOpen ? <X/> : <Menu/>}</button><div className="breadcrumb"><span>AirWise AI</span><span className="crumb-separator">/</span><strong>{t.nav[view]}</strong></div><div className="top-actions"><form className="location-search" onSubmit={submitSearch} role="search"><label className="sr-only" htmlFor="location-search">{t.search}</label><Search size={16}/><input id="location-search" value={query} onChange={(e) => { searchSequence.current += 1; locationSequence.current += 1; setSearching(false); setQuery(e.target.value); setSuggestions([]); setSearchError(''); }} placeholder={t.search} maxLength={80}/><button type="submit" disabled={searching} aria-label={t.searchButton}>{searching ? '…' : <span className="search-key">↵</span>}</button>{suggestions.length > 0 && <div className="search-results" role="listbox" aria-label="Location results">{suggestions.map((result) => <button type="button" role="option" aria-selected="false" key={result.id} onClick={() => choosePlace(result)}><MapPin size={15}/><span><strong>{result.name}</strong><small>{[result.admin1, result.country].filter(Boolean).join(', ')}</small></span></button>)}</div>}</form><button className="locate-button" onClick={locate} title="Use browser location" aria-label={t.locate}><Navigation size={17}/></button><button className="language-toggle" onClick={() => setLang(language === 'en' ? 'hi' : 'en')} aria-label="Change language">{language === 'en' ? 'HI' : 'EN'}<ChevronDown size={13}/></button><button className="avatar-button" onClick={() => setView('family')} aria-label="Open family preferences">R</button></div></header>
      {searchError && <div className="global-alert" role="status">{searchError}<button onClick={() => setSearchError('')} aria-label="Dismiss">×</button></div>}
      <main id="main-content" className="content-area" tabIndex={-1}>
        {view === 'dashboard' && <Dashboard air={air} loading={loading} error={error} demo={demo} recommendation={recommendation} language={language} onDemo={showDemo}/>}
        {view === 'planner' && <Planner air={air} household={household} exercise={exercise}/>}
        {view === 'indoor' && <IndoorAdvisor air={air}/>}
        {view === 'mobility' && <Mobility air={air}/>}
        {view === 'impact' && <ImpactCalculator/>}
        {view === 'family' && <FamilyMode household={household} setHousehold={setHousehold}/>}
        {view === 'community' && <Community/>}
        {view === 'assistant' && <Assistant air={air} household={household} recommendation={recommendation} language={language} activity={exercise ? 'vigorous' : 'routine'}/>}
        {view === 'settings' && <Settings air={air} demo={demo} language={language} setLanguage={setLang} onRefresh={() => void refresh()} onDemo={showDemo}/>}
      </main>
      <footer className="app-footer"><span>AirWise AI · Breathe Smarter. Live Better.</span><span>Environmental guidance only · not medical advice</span></footer>
    </div>
  </div>;
}

export default App;
