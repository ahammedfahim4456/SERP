import React, { useEffect, useMemo, useState } from 'react';
import { useLenis } from 'lenis/react';
import { ArrowLeftRight, CalendarDays, ChevronDown, Hotel, MapPin, Plane, Search, Train, Bus, Clock3, Star, ArrowRight, LoaderCircle, AlertCircle, Sparkles, Compass, ShieldCheck, Headphones, LockKeyhole, Play, Users, CalendarCheck } from 'lucide-react';
import HeaderNavbar from './components/HeaderNavbar';
import { getCities, searchFlights, searchHotels, searchTransit, normalizeCity, parseTripPrompt } from './services/api';

const localDate = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const localDateFrom = (value, offset = 1) => {
  if (!value) return localDate(offset);
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const DEFAULT_CITIES = ['Bengaluru', 'Chennai', 'Mumbai', 'New Delhi', 'Hyderabad', 'Goa', 'Pondicherry', 'Madurai', 'Kochi', 'Jaipur', 'Kolkata', 'Coimbatore'];
const POPULAR_DESTINATIONS = [
  { name: 'Goa', region: 'India · Coast', city: 'Goa', rating: '4.9', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kerala', region: 'India · Backwaters', city: 'Kochi', rating: '4.9', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80' },
  { name: 'Jaipur', region: 'India · Heritage', city: 'Jaipur', rating: '4.8', image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=600&q=80' },
  { name: 'Kashmir', region: 'India · Mountains', city: 'Srinagar', rating: '4.9', image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80' },
];
const money = value => value == null || !Number.isFinite(Number(value)) ? null : `₹${Number(value).toLocaleString('en-IN')}`;
function airlineCodeFor(flight) {
  const numberCode = String(flight.segments?.[0]?.flightNumber || '').match(/^([A-Z0-9]{2})/i)?.[1];
  if (numberCode) return numberCode.toUpperCase();
  const name = String(flight.airline || '').toLowerCase();
  const carriers = [['indigo', '6E'], ['air india express', 'IX'], ['air india', 'AI'], ['vistara', 'UK'], ['spicejet', 'SG'], ['akasa', 'QP'], ['airasia', 'I5'], ['alliance air', '9I']];
  return carriers.find(([label]) => name.includes(label))?.[1] || null;
}

export default function App() {
  const lenis = useLenis();
  const [cities, setCities] = useState(DEFAULT_CITIES);
  const [journey, setJourney] = useState({ origin: 'Bengaluru', destination: 'Goa', startDate: localDate(7), endDate: localDate(10), tripType: 'roundTrip', travelers: 1 });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [data, setData] = useState({ flights: null, transit: null, hotels: null });
  const [activeMode, setActiveMode] = useState('flight');
  const [hotelSort, setHotelSort] = useState('recommended');
  const [activeStayType, setActiveStayType] = useState('all');
  const [tripPrompt, setTripPrompt] = useState('');
  const [isParsingPrompt, setIsParsingPrompt] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [parseNotice, setParseNotice] = useState('');
  const [activeSearchTab, setActiveSearchTab] = useState('flights');
  const [detailsSplash, setDetailsSplash] = useState(null);

  function scrollToElement(id, options = {}) {
    const target = document.getElementById(id);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -24, ...options, ...(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { immediate: true } : {}) });
    else target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function splashTravelDetails(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const id = performance.now();
    setDetailsSplash({ id, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    window.setTimeout(() => setDetailsSplash(current => current?.id === id ? null : current), 1250);
  }

  useEffect(() => {
    getCities().then(result => {
      const names = (result?.cities || []).map(city => city.displayName).filter(Boolean);
      if (names.length) setCities([...new Set([...names, ...DEFAULT_CITIES])]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.tt-hero');
    let frame = 0;
    let revealObserver = null;
    const updateScrollProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!hero) return;
        const progress = Math.max(0, Math.min(1, window.scrollY / Math.max(window.innerHeight, 1)));
        hero.style.setProperty('--hero-scroll-y', `${(progress * 26).toFixed(1)}px`);
        hero.style.setProperty('--hero-scale', (1.025 + progress * 0.095).toFixed(3));
        hero.style.setProperty('--hero-content-y', `${(progress * -14).toFixed(1)}px`);
        document.querySelectorAll('[data-scroll-reveal]:not(.is-revealed)').forEach(target => {
          if (target.getBoundingClientRect().top > window.innerHeight * 0.95) return;
          target.classList.add('is-revealed');
          revealObserver?.unobserve(target);
        });
      });
    };
    const targets = document.querySelectorAll('[data-scroll-reveal]:not(.is-revealed)');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-revealed'));
    } else {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // Reveal items that enter the viewport and items passed during a large scroll jump.
          if (!entry.isIntersecting && entry.boundingClientRect.top > window.innerHeight) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
      targets.forEach(target => {
        if (target.getBoundingClientRect().top <= window.innerHeight * 0.95) target.classList.add('is-revealed');
        else revealObserver.observe(target);
      });
    }
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    return () => {
      revealObserver?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, [hasSearched]);

  const hotelCheckOut = journey.tripType === 'roundTrip' ? journey.endDate : localDateFrom(journey.startDate, 1);
  const nights = Math.max(1, Math.ceil((new Date(`${hotelCheckOut}T00:00:00`) - new Date(`${journey.startDate}T00:00:00`)) / 86400000));
  const update = patch => setJourney(current => ({ ...current, ...patch }));

  async function applyTripPrompt(event) {
    event?.preventDefault();
    setPromptError('');
    setParseNotice('');
    if (!tripPrompt.trim()) return setPromptError('Describe your trip first.');
    setIsParsingPrompt(true);
    try {
      const parsed = await parseTripPrompt(tripPrompt.trim());
      const origin = parsed.origin?.displayName || parsed.origin?.raw;
      const destination = parsed.destination?.displayName || parsed.destination?.raw;
      const startDate = parsed.dates?.startDate;
      const endDate = parsed.dates?.endDate;
      const adults = Number(parsed.party?.adults);
      const patch = {};
      if (origin) patch.origin = origin;
      if (destination) patch.destination = destination;
      if (startDate) patch.startDate = startDate;
      if (endDate) patch.endDate = endDate;
      if (Number.isInteger(adults) && adults >= 1 && adults <= 9) patch.travelers = adults;
      if (Object.keys(patch).length) update(patch);
      setParseNotice(`${parsed.isLiveAi ? `Parsed with Gemini${parsed.aiModel ? ` (${parsed.aiModel})` : ''}` : 'Parsed with the rule-based fallback'} · Review the fields below before searching.`);
    } catch (error) {
      setPromptError(error.message || 'Could not interpret that trip description. Try a shorter description.');
    } finally {
      setIsParsingPrompt(false);
    }
  }

  async function runSearch(event) {
    event?.preventDefault();
    setSearchError('');
    if (!journey.origin.trim() || !journey.destination.trim()) return setSearchError('Enter both your departure and destination cities.');
    if (journey.origin.trim().toLowerCase() === journey.destination.trim().toLowerCase()) return setSearchError('Choose two different cities for this trip.');
    if (!journey.startDate || (journey.tripType === 'roundTrip' && !journey.endDate)) return setSearchError('Choose your travel dates.');
    if (journey.tripType === 'roundTrip' && journey.endDate <= journey.startDate) return setSearchError('Your return date must be after the departure date.');
    setIsSearching(true);
    setHasSearched(true);
    setData({ flights: null, transit: null, hotels: null });
    try {
      const [origin, destination] = await Promise.all([normalizeCity(journey.origin.trim()), normalizeCity(journey.destination.trim())]);
      const returnDate = journey.tripType === 'roundTrip' ? journey.endDate : null;
      const settled = await Promise.allSettled([
        searchFlights(origin.iataCode, destination.iataCode, journey.startDate, returnDate, journey.travelers),
        searchTransit(origin.transitQuery, destination.transitQuery),
        searchHotels(destination.displayName, journey.startDate, hotelCheckOut, journey.travelers, { profile: 'budget', includeRentals: true, limit: 10 }),
      ]);
      const results = settled.map(result => result.status === 'fulfilled' ? result.value : { error: result.reason?.message || 'Search failed' });
      setData({ flights: results[0], transit: results[1], hotels: results[2] });
      if (results.every(result => result.error)) setSearchError('We could not load travel results. Please check your cities and try again.');
      scrollToElement(activeSearchTab === 'stays' ? 'accommodation-results' : 'results', { offset: -20 });
    } catch (error) {
      setSearchError(error.message || 'Unable to resolve one of those cities. Please choose a city from the suggestions.');
    } finally {
      setIsSearching(false);
    }
  }

  const transportItems = useMemo(() => {
    const flights = (data.flights?.options || []).map((item, index) => ({ ...item, mode: 'flight', id: `flight-${index}`, price: item.price, title: item.airline || 'Flight', detail: item.segments?.map(segment => `${segment.fromAirport || ''} → ${segment.toAirport || ''}`).filter(Boolean).join(' · ') || `${journey.origin} → ${journey.destination}`, duration: item.totalDurationMinutes, subdetail: item.stops === 0 ? 'Nonstop' : `${item.stops} stop${item.stops === 1 ? '' : 's'}`, airlineCode: airlineCodeFor(item) }));
    const ground = (data.transit?.options || []).map((item, index) => {
      const mode = item.mainMode === 'train' || item.legs?.some(leg => leg.mode === 'train') ? 'train' : 'bus';
      return { ...item, mode, id: `transit-${index}`, price: item.fare, title: item.legs?.map(leg => leg.title).join(' · ') || (mode === 'train' ? 'Train service' : 'Bus service'), detail: item.legs?.map(leg => `${leg.fromName || journey.origin} → ${leg.toName || journey.destination}`).join(' · ') || `${journey.origin} → ${journey.destination}`, duration: item.durationMinutes, subdetail: item.legs?.[0]?.operator || (mode === 'train' ? 'Rail service' : 'Bus service') };
    });
    return [...flights, ...ground];
  }, [data, journey.origin, journey.destination]);
  const modes = [
    { id: 'flight', label: 'Flights', icon: Plane },
    { id: 'train', label: 'Trains', icon: Train },
    { id: 'bus', label: 'Buses', icon: Bus },
  ];
  const visibleTransport = transportItems.filter(item => item.mode === activeMode);
  const rawHotels = (data.hotels?.options || []).filter(hotel => activeStayType === 'all' || hotel.kind === activeStayType);
  const hotels = [...rawHotels].sort((a, b) => {
    if (hotelSort === 'price-low') return (a.pricePerNight ?? Infinity) - (b.pricePerNight ?? Infinity);
    if (hotelSort === 'price-high') return (b.pricePerNight ?? -Infinity) - (a.pricePerNight ?? -Infinity);
    if (hotelSort === 'rating') return (b.rating ?? -Infinity) - (a.rating ?? -Infinity);
    if (hotelSort === 'reviews') return (b.reviewCount ?? -Infinity) - (a.reviewCount ?? -Infinity);
    if (hotelSort === 'recommended') return (b.score ?? -Infinity) - (a.score ?? -Infinity);
    return 0;
  });

  return (
    <div id="top" className="min-h-screen bg-[#071719] text-white selection:bg-teal-300 selection:text-slate-950">
      <section className="tt-hero relative isolate min-h-[820px] overflow-hidden sm:min-h-[860px]">
        <div className="tt-hero-image absolute inset-0 -z-20" />
        <div className="tt-hero-shade absolute inset-0 -z-10" />
        <HeaderNavbar />
        <main className="mx-auto grid min-h-[730px] max-w-[1440px] gap-10 px-5 pb-8 pt-28 sm:px-8 min-[720px]:min-h-[700px] min-[720px]:grid-cols-[minmax(0,1fr)_350px] min-[720px]:items-center min-[720px]:gap-6 lg:px-12 lg:pb-14 lg:pt-24">
          <div className="tt-scroll-reveal flex min-w-0 flex-col justify-center" data-scroll-reveal>
            <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.28em] text-teal-200 sm:text-xs"><span className="h-px w-8 bg-teal-300"/>The world is waiting</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[.94] tracking-[-.045em] text-white drop-shadow sm:text-6xl lg:text-[76px]">Adventures<br/>That Stay<br/><span className="italic">With You</span></h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/75 sm:text-base">Discover extraordinary places and unforgettable journeys. Compare the ways to get there, then make the trip yours.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#popular-destinations" className="inline-flex items-center gap-3 rounded-full bg-teal-300 px-5 py-3 text-xs font-bold text-slate-950 transition hover:bg-teal-200">Explore destinations <ArrowRight size={15}/></a>
              <a href="#journey-details-section" className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40"><Play size={12} fill="currentColor"/></span>Start planning</a>
            </div>
            <div id="popular-destinations" className="mt-8 max-w-[660px] scroll-mt-24">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Popular getaways</h2><span className="text-[10px] font-semibold text-teal-200">Choose a destination</span></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POPULAR_DESTINATIONS.map((place, index) => <button key={place.name} type="button" data-scroll-reveal style={{ transitionDelay: `${index * 80}ms` }} onClick={() => { update({ destination: place.city }); scrollToElement('journey-details-section', { offset: -36 }); }} className="tt-destination-card tt-scroll-reveal group relative h-[104px] overflow-hidden rounded-xl border border-white/15 text-left sm:h-[112px]"><img src={place.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"/><span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"/><span className="absolute inset-x-2 bottom-2"><span className="block text-xs font-bold">{place.name}</span><span className="mt-0.5 flex items-center justify-between text-[9px] text-white/70"><span>{place.region}</span><span className="inline-flex items-center gap-1"><Star size={9} fill="currentColor" className="text-amber-300"/>{place.rating}</span></span></span></button>)}
              </div>
            </div>
          </div>

          <form id="journey-details-section" onSubmit={runSearch} onPointerDown={splashTravelDetails} className={`tt-search-panel tt-scroll-reveal relative w-full scroll-mt-24 rounded-3xl border border-white/15 p-5 shadow-2xl backdrop-blur-2xl sm:p-6 ${detailsSplash ? 'tt-splash-active' : ''}`} data-scroll-reveal>
            {detailsSplash && <span key={detailsSplash.id} aria-hidden="true" className="tt-splash-effect" style={{ '--splash-x': `${detailsSplash.x}px`, '--splash-y': `${detailsSplash.y}px` }} />}
            <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-teal-200">Your next escape</p><h2 className="mt-1 text-2xl font-bold">Where to next?</h2><p className="mt-1 text-xs text-white/60">Find your perfect trip</p></div>
            <div className="mb-5 grid grid-cols-3 rounded-xl border border-white/10 bg-black/15 p-1" role="tablist" aria-label="Search category">
              {[['flights', Plane, 'Flights'], ['stays', Hotel, 'Stays'], ['planner', Sparkles, 'AI planner']].map(([id, Icon, label]) => <button key={id} type="button" role="tab" aria-selected={activeSearchTab === id} onClick={() => setActiveSearchTab(id)} className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold transition ${activeSearchTab === id ? 'bg-teal-300 text-slate-950' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}><Icon size={15}/>{label}</button>)}
            </div>
            {activeSearchTab === 'planner' && <div className="mb-3 rounded-xl border border-white/10 bg-black/15 p-3"><label htmlFor="trip-prompt" className="mb-1.5 block text-[10px] font-semibold text-teal-100">Describe your trip</label><div className="flex gap-2"><input id="trip-prompt" value={tripPrompt} onChange={event => setTripPrompt(event.target.value)} maxLength={1000} placeholder="e.g. 2 adults from Bengaluru to Goa…" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"/><button type="button" onClick={applyTripPrompt} disabled={isParsingPrompt} aria-label="Fill trip details from description" className="shrink-0 rounded-lg bg-white/10 p-2 text-teal-100 hover:bg-white/20 disabled:opacity-50">{isParsingPrompt ? <LoaderCircle size={15} className="animate-spin"/> : <ArrowRight size={15}/>}</button></div>{promptError && <p role="alert" className="mt-2 text-[10px] text-rose-200">{promptError}</p>}{parseNotice && <p role="status" className="mt-2 text-[10px] text-teal-100">{parseNotice}</p>}</div>}
            <div className="grid gap-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2"><HeroCityField label="From" id="origin-city" value={journey.origin} cities={cities} onChange={origin => update({ origin })}/><button type="button" aria-label="Swap cities" onClick={() => update({ origin: journey.destination, destination: journey.origin })} className="mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:bg-white/10"><ArrowLeftRight size={15}/></button><HeroCityField label="To" id="destination-city" value={journey.destination} cities={cities} onChange={destination => update({ destination })}/></div>
              <div className="grid grid-cols-2 gap-2"><HeroDateField label="Departure" value={journey.startDate} min={localDate(0)} onChange={startDate => update({ startDate, ...(journey.endDate <= startDate ? { endDate: localDateFrom(startDate, 1) } : {}) })}/><HeroDateField label="Return" value={journey.endDate} min={journey.startDate || localDate(0)} disabled={journey.tripType === 'oneWay'} onChange={endDate => update({ endDate })}/></div>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5"><div className="flex items-center gap-2 text-xs text-white/75"><Users size={14} className="text-teal-200"/>Travelers</div><select aria-label="Travelers" value={journey.travelers} onChange={event => update({ travelers: Number(event.target.value) })} className="bg-transparent text-xs font-semibold text-white outline-none [&>option]:text-slate-900">{[1,2,3,4,5,6,7,8,9].map(count => <option value={count} key={count}>{count} {count === 1 ? 'adult' : 'adults'}</option>)}</select><span className="mx-1 h-4 w-px bg-white/15"/><div className="flex rounded-lg bg-white/10 p-0.5">{[['roundTrip','Round'],['oneWay','One way']].map(([value,label]) => <button key={value} type="button" aria-pressed={journey.tripType === value} onClick={() => update({ tripType: value })} className={`rounded-md px-2 py-1 text-[9px] font-semibold ${journey.tripType === value ? 'bg-white text-slate-900' : 'text-white/65'}`}>{label}</button>)}</div></div>
            </div>
            {searchError && <p role="alert" className="mt-3 text-xs font-medium text-rose-200">{searchError}</p>}
            <button disabled={isSearching} type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-300 px-5 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-teal-950/20 transition hover:bg-teal-200 disabled:cursor-wait disabled:opacity-70">{isSearching ? <LoaderCircle className="animate-spin" size={16}/> : <Search size={16} />}{isSearching ? 'Searching live options…' : activeSearchTab === 'stays' ? 'Search stays & travel' : 'Search flights & travel'}<ArrowRight size={15}/></button>
            <p className="mt-3 text-center text-[9px] text-white/45">Compare live flights, ground routes, and places to stay</p>
          </form>
        </main>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 pb-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/75"><Compass size={15} className="text-teal-200"/>Make room for the unexpected</div>
          <div className="tt-benefits tt-scroll-reveal flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 px-4 py-3 backdrop-blur-xl sm:gap-x-7 sm:px-6" data-scroll-reveal><Benefit icon={ShieldCheck} title="Thoughtful picks"/><Benefit icon={Headphones} title="Easy planning"/><Benefit icon={CalendarCheck} title="Flexible dates"/><Benefit icon={LockKeyhole} title="Secure search"/></div>
        </div>
        <div className="tt-stats tt-scroll-reveal mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-white/10 px-5 py-5 sm:gap-x-16 lg:gap-x-24" data-scroll-reveal>
          <Stat number="03" label="Travel modes"/><Stat number="02" label="Stay types"/><Stat number="AI" label="Trip helper"/><Stat number="INR" label="Price display"/>
        </div>
      </section>

      {hasSearched && <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-slate-900 sm:px-6 lg:px-8">
        <section id="results" className="tt-scroll-reveal scroll-mt-24 pt-10" data-scroll-reveal>
          <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-500">Your itinerary</p><h2 className="mt-1 text-2xl font-bold">{journey.origin} <span className="text-rose-700">→</span> {journey.destination}</h2><p className="mt-1 text-sm text-slate-500">{journey.startDate}{journey.tripType === 'roundTrip' ? ` — ${journey.endDate} · ${nights} night${nights === 1 ? '' : 's'}` : ' · One way'}</p></div>

          <section className="tt-scroll-reveal mb-9 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-scroll-reveal>
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Getting there</p><div className="mt-1 flex items-center gap-2"><Plane size={18} className="text-rose-700"/><h3 className="text-lg font-bold">Travel options</h3></div><p className="mt-1 text-sm text-slate-500">Available routes from {journey.origin} to {journey.destination}</p></div>
              <div className="flex w-fit gap-1 rounded-xl bg-slate-100 p-1">{modes.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveMode(id)} aria-pressed={activeMode === id} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeMode === id ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Icon size={16}/>{label}<span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px]">{transportItems.filter(item => item.mode === id).length}</span></button>)}</div>
            </div>
            {isSearching ? <LoadingPlaceholder /> : data[activeMode === 'flight' ? 'flights' : 'transit']?.error ? <EmptyState message={data[activeMode === 'flight' ? 'flights' : 'transit'].error} /> : visibleTransport.length === 0 ? <EmptyState message={`No ${activeMode === 'flight' ? 'flight' : activeMode} options were returned for these dates and cities.`} /> : <div className="grid gap-3">{visibleTransport.map(item => <TransportCard item={item} key={item.id} />)}</div>}
          </section>

          <section id="accommodation-results" className="tt-scroll-reveal scroll-mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-scroll-reveal>
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Accommodation</p><div className="mt-1 flex items-center gap-2"><Hotel size={18} className="text-rose-700"/><h3 className="text-lg font-bold">Places to stay in {journey.destination}</h3></div><p className="mt-1 text-sm text-slate-500">{journey.tripType === 'oneWay' ? `One night · ${journey.startDate} to ${hotelCheckOut}` : `${journey.startDate} to ${journey.endDate} · ${nights} night${nights === 1 ? '' : 's'}`}</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter stay type" value={activeStayType} onChange={e => setActiveStayType(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium"><option value="all">All stay types</option><option value="hotel">Hotels</option><option value="rental">Homes & rentals</option></select><label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-500"><ChevronDown size={15}/><select aria-label="Sort stays" value={hotelSort} onChange={e => setHotelSort(e.target.value)} className="max-w-48 bg-transparent py-2 font-medium text-slate-800 outline-none"><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Guest rating</option><option value="reviews">Most reviewed</option></select></label></div></div>
            {isSearching ? <LoadingPlaceholder /> : data.hotels?.unavailableReason ? <EmptyState message={data.hotels.unavailableReason} /> : data.hotels?.error ? <EmptyState message={data.hotels.error} /> : hotels.length === 0 ? <EmptyState message="No stays were returned for this destination and date range." /> : <div className="grid gap-3 md:grid-cols-2">{hotels.map(hotel => <HotelCard hotel={hotel} key={hotel.id} nights={nights} />)}</div>}
            {data.hotels?.unpricedCount > 0 && <p className="mt-3 text-xs text-slate-500">{data.hotels.unpricedCount} more properties did not include a price for these dates.</p>}
          </section>
        </section>
      </main>}
      <footer id="about-truetrip" className="border-t border-white/10 bg-[#071719] py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} TrueTrip · Plan a trip that stays with you</footer>
    </div>
  );
}

function HeroCityField({ label, value, cities, onChange, id }) {
  return <label htmlFor={id} className="min-w-0"><span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-white/55">{label}</span><span className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-black/15 px-2.5 focus-within:border-teal-200/60"><MapPin size={13} className="shrink-0 text-teal-200"/><input id={id} list={`${id}-options`} value={value} onChange={event => onChange(event.target.value)} autoComplete="off" placeholder="Choose city" className="min-w-0 w-full bg-transparent text-xs font-semibold text-white outline-none placeholder:font-normal placeholder:text-white/35"/><datalist id={`${id}-options`}>{cities.map(city => <option value={city} key={city}/>)}</datalist></span></label>;
}
function HeroDateField({ label, value, min, disabled, onChange }) {
  return <label className="min-w-0"><span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-white/55">{label}</span><span className={`flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-black/15 px-2.5 focus-within:border-teal-200/60 ${disabled ? 'opacity-40' : ''}`}><CalendarDays size={13} className="shrink-0 text-teal-200"/><input type="date" value={value} min={min} disabled={disabled} onChange={event => onChange(event.target.value)} className="min-w-0 w-full bg-transparent text-[10px] font-semibold text-white outline-none [color-scheme:dark]"/></span></label>;
}
function Benefit({ icon: Icon, title }) {
  return <div className="flex items-center gap-2 text-[10px] font-medium text-white/75"><Icon size={16} className="text-teal-200"/>{title}</div>;
}
function Stat({ number, label }) {
  return <div className="min-w-16 text-center"><strong className="block text-sm font-bold text-teal-200">{number}</strong><span className="mt-1 block text-[9px] text-white/50">{label}</span></div>;
}
function LoadingPlaceholder() { return <div className="grid gap-3 sm:grid-cols-2"><div className="h-28 animate-pulse rounded-xl bg-slate-100"/><div className="h-28 animate-pulse rounded-xl bg-slate-100"/></div>; }
function EmptyState({ message }) { return <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm text-slate-600">{message}</div>; }
function TransportCard({ item }) {
  const mins = Number(item.duration || 0);
  const duration = mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : null;
  return <article className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-rose-200 hover:shadow-sm sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-50 text-rose-700">{item.mode === 'flight' ? <><Plane size={19}/>{item.airlineCode && <img src={`https://www.gstatic.com/flights/airline_logos/70px/${item.airlineCode}.png`} alt={`${item.title} logo`} loading="lazy" referrerPolicy="no-referrer" onError={event => event.currentTarget.remove()} className="absolute inset-0 h-full w-full bg-white object-contain p-1"/>}</> : item.mode === 'train' ? <Train size={19}/> : <Bus size={19}/>}</div><div className="min-w-0"><h4 className="truncate font-bold">{item.title}</h4><p className="mt-1 truncate text-sm text-slate-500">{item.detail}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{item.subdetail}</span>{duration && <span className="inline-flex items-center gap-1"><Clock3 size={13}/>{duration}</span>}{item.category === 'best' && <span>Recommended route</span>}</div></div></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right"><div className="text-lg font-bold text-slate-900">{money(item.price) || 'Price unavailable'}</div>{item.price != null && <p className="text-xs text-slate-500">per traveler</p>}</div></article>;
}
function HotelCard({ hotel, nights }) {
  const price = hotel.pricePerNight;
  const total = hotel.totalPrice ?? (price != null ? price * nights : null);
  const image = hotel.imageUrl || hotel.thumbnail || hotel.image;
  return <article className="overflow-hidden rounded-xl border border-slate-200 transition hover:border-rose-200 hover:shadow-sm"><div className="flex h-full min-h-36"><div className="relative flex w-28 shrink-0 items-center justify-center bg-slate-100 text-slate-400 sm:w-36"><Hotel size={30}/>{image && <img src={image} alt={`${hotel.name}`} loading="lazy" referrerPolicy="no-referrer" onError={event => event.currentTarget.remove()} className="absolute inset-0 h-full w-full object-cover"/>}</div><div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3"><div><div className="flex items-start justify-between gap-2"><h4 className="line-clamp-2 text-sm font-bold">{hotel.name}</h4>{hotel.rating != null && <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-1 text-xs font-bold text-amber-800"><Star size={12} fill="currentColor"/>{hotel.rating}</span>}</div><p className="mt-1 text-xs capitalize text-slate-500">{hotel.kind || 'stay'}{hotel.starClass ? ` · ${hotel.starClass} star` : ''}{hotel.reviewCount ? ` · ${Number(hotel.reviewCount).toLocaleString('en-IN')} reviews` : ''}</p><div className="mt-2 flex flex-wrap gap-1">{(hotel.amenities || hotel.features || []).slice(0, 3).map((amenity, index) => <span key={index} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{String(amenity).replaceAll('_', ' ')}</span>)}</div></div><div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-2"><div><p className="text-xs text-slate-500">{price != null ? `${money(price)} / night` : 'Price unavailable'}</p>{total != null && <p className="mt-0.5 text-xs font-semibold text-slate-800">{money(total)} total · {nights} night{nights === 1 ? '' : 's'}</p>}</div>{hotel.website && <a href={hotel.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 hover:underline">View stay <ArrowRight size={13}/></a>}</div></div></div></article>;
}
