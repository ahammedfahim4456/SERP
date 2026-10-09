import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, ArrowUpRight, BedDouble, CalendarDays,
  Check, ChevronDown, CircleHelp, Clock3, Compass, ExternalLink, Heart,
  Map, MapPin, Menu, Plane, Search, Sparkles, Star, Train, Utensils, Users, Wallet, X,
} from 'lucide-react';
import {
  explainPick, getCities, getAiCostSummary, normalizeCity, parseTripPrompt, planTripAi,
  searchFlights, searchFood, searchHotels, searchTransit, searchTripadvisor,
} from './services/api';

const popular = [
  { city: 'Goa', tag: 'Coast & calm', image: 'photo-1512343879784-a960bf40e7f2' },
  { city: 'Pondicherry', tag: 'A slower weekend', image: 'photo-1582510003544-4d00b7f74220' },
  { city: 'Jaipur', tag: 'Colourful old city', image: 'photo-1599661046827-dacff0c0f09a' },
  { city: 'Rishikesh', tag: 'By the river', image: 'photo-1605649487212-47bdab064df7' },
];

const localDate = (offset = 0, from) => {
  const date = from ? new Date(`${from}T12:00:00`) : new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dateInput = (offset) => localDate(offset);
const money = (value, currency = 'INR') => value == null || !Number.isFinite(Number(value))
  ? 'Price unavailable'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
const foodCurrency = (place) => {
  const label = String(place?.priceLabel || '').toUpperCase();
  if (/₹|\bINR\b|\bRS\.?\b/.test(label)) return 'INR';
  if (/[¥￥]|\bJPY\b/.test(label)) return 'JPY';
  if (/[€]|\bEUR\b/.test(label)) return 'EUR';
  if (/[£]|\bGBP\b/.test(label)) return 'GBP';
  if (/\$|\bUSD\b/.test(label)) return 'USD';
  return null;
};
const foodEstimate = (value, place) => {
  const currency = foodCurrency(place);
  return currency ? money(value, currency) : `~${Number(value).toLocaleString('en-IN')} (currency not listed)`;
};
const duration = (minutes) => {
  if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) return 'Time unavailable';
  const hours = Math.floor(minutes / 60);
  const mins = Number(minutes) % 60;
  return hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`;
};
function airlineCodeFor(flight) {
  const number = String(flight.segments?.[0]?.flightNumber || '').match(/^\s*([A-Z0-9]{2})/i)?.[1];
  if (number) return number.toUpperCase();
  const name = String(flight.airline || '').toLowerCase();
  const airlines = [['air india express', 'IX'], ['air india', 'AI'], ['indigo', '6E'], ['vistara', 'UK'], ['spicejet', 'SG'], ['akasa', 'QP'], ['alliance air', '9I'], ['airasia', 'I5'], ['japan airlines', 'JL'], ['ana', 'NH'], ['all nippon', 'NH'], ['emirates', 'EK'], ['qatar', 'QR'], ['singapore airlines', 'SQ'], ['thai airways', 'TG'], ['lufthansa', 'LH'], ['british airways', 'BA'], ['air france', 'AF'], ['klm', 'KL'], ['delta', 'DL'], ['united airlines', 'UA'], ['american airlines', 'AA']];
  return airlines.find(([label]) => name.includes(label))?.[1] || null;
}
const imageUrl = (id, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const errorText = (error) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

function CityField({ label, value, onChange, placeholder, icon: Icon, id }) {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setSuggestions([]); return undefined; }
    let active = true;
    const timer = window.setTimeout(() => {
      getCities(q).then((response) => {
        if (active) setSuggestions((response.cities || []).map((city) => city.displayName).filter(Boolean));
      }).catch(() => { if (active) setSuggestions([]); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [value]);

  return <label className="field-wrap" htmlFor={id}>
    <span className="field-label">{label}</span>
    <span className="field-control"><Icon size={17} aria-hidden="true" />
      <input id={id} list={`${id}-cities`} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required />
    </span>
    <datalist id={`${id}-cities`}>{suggestions.map((city) => <option value={city} key={city} />)}</datalist>
  </label>;
}

function SectionTitle({ eyebrow, title, body, action }) {
  return <div className="section-title">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{body && <p className="section-copy">{body}</p>}</div>
    {action}
  </div>;
}

function EmptyPanel({ children }) { return <div className="empty-panel">{children}</div>; }

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [trip, setTrip] = useState({
    origin: 'Chennai', destination: '', departure: dateInput(30), returnDate: dateInput(35),
    tripType: 'roundTrip', adults: 2, children: 0, childAges: [], budget: 50000,
  });
  const [activeTab, setActiveTab] = useState('flights');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedFoodId, setSelectedFoodId] = useState(null);
  const [foodResults, setFoodResults] = useState(null);
  const [foodBusy, setFoodBusy] = useState(false);
  const [foodError, setFoodError] = useState('');
  const [foodFilter, setFoodFilter] = useState('any');
  const [prompt, setPrompt] = useState('');
  const [parsing, setParsing] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [aiNotice, setAiNotice] = useState('');
  const [aiPlan, setAiPlan] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [explaining, setExplaining] = useState('');
  const [costSummary, setCostSummary] = useState(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const foodRequest = useRef(0);
  const nights = Math.max(1, Math.round((new Date(`${trip.returnDate}T12:00:00`) - new Date(`${trip.departure}T12:00:00`)) / 86400000));

  const updateTrip = (patch) => setTrip((current) => ({ ...current, ...patch }));
  const scrollTo = (id) => {
    setMobileMenu(false);
    const searchTargets = ['planner', 'live-results', 'budget-radar', 'map-route'];
    if (searchTargets.includes(id) && activePage !== 'search') {
      setActivePage('search');
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const selectedHotelResult = results?.hotels?.options?.find((hotel) => hotel.id === selectedHotel) || null;
  const selectedHotelTotal = selectedHotelResult?.totalPrice ?? (selectedHotelResult?.pricePerNight != null ? selectedHotelResult.pricePerNight * nights : null);
  const selectedFoodItem = foodResults?.options?.find((place) => place.id === selectedFoodId) || null;
  const selectedFoodEstimate = selectedFoodItem?.estimatedMealCost ?? (selectedFoodItem?.estimatedPerPerson != null ? Math.round(selectedFoodItem.estimatedPerPerson * (Number(trip.adults) + Number(trip.children))) : null);
  const selectedFoodCurrency = foodCurrency(selectedFoodItem);
  const selectedFoodCost = selectedFoodCurrency === 'INR' ? selectedFoodEstimate : null;
  const selectedTransportItem = useMemo(() => {
    const options = [
      ...(results?.flights?.options || []).map((item, index) => ({ ...item, _id: `flight-${index}`, _mode: 'flight' })),
      ...(results?.transit?.options || []).map((item, index) => ({ ...item, _id: `transit-${index}`, _mode: 'transit' })),
    ];
    return options.find((item) => item._id === selectedTransport) || null;
  }, [results, selectedTransport]);
  const selectedTransportPrice = selectedTransportItem?.price ?? selectedTransportItem?.fare ?? null;
  const selectedSpend = (selectedHotelTotal || 0) + (selectedTransportPrice || 0) + (selectedFoodCost || 0);
  const hasSelectedCost = selectedHotelTotal != null || selectedTransportPrice != null || selectedFoodCost != null;
  const budgetRemaining = Number(trip.budget || 0) - selectedSpend;
  const flightOptions = results?.flights?.options || [];
  const transitOptions = results?.transit?.options || [];
  const hotelOptions = results?.hotels?.options || [];
  const experienceOptions = results?.experiences?.recommendations || [];

  async function runSearch(event) {
    event?.preventDefault();
    setNotice('');
    setAiNotice('');
    if (!trip.origin.trim() || !trip.destination.trim()) { setNotice('Enter a departure and destination. You can type a city or country name.'); return; }
    if (trip.origin.trim().toLocaleLowerCase() === trip.destination.trim().toLocaleLowerCase()) { setNotice('Choose two different places for this trip.'); return; }
    if (!trip.departure) { setNotice('Choose a departure date.'); return; }
    if (trip.tripType === 'roundTrip' && (!trip.returnDate || trip.returnDate <= trip.departure)) { setNotice('Return date must be after your departure date.'); return; }

    setSearching(true);
    setResults(null);
    setAiPlan(null);
    setSelectedTransport(null);
    setSelectedHotel(null);
    setSelectedFoodId(null);
    setFoodResults(null);
    setCostSummary(null);
    setExplanations({});
    const returnDate = trip.tripType === 'roundTrip' ? trip.returnDate : undefined;
    const flightRequest = searchFlights(trip.origin.trim(), trip.destination.trim(), trip.departure, returnDate, Number(trip.adults), Number(trip.children));
    const originRequest = normalizeCity(trip.origin.trim());
    const destinationRequest = normalizeCity(trip.destination.trim());
    const experienceRequest = searchTripadvisor(trip.destination.trim(), Number(trip.budget));
    try {
      const [flightResult, originResult, destinationResult, experienceResult] = await Promise.allSettled([
        flightRequest, originRequest, destinationRequest, experienceRequest,
      ]);
      const origin = originResult.status === 'fulfilled' ? originResult.value : { transitQuery: trip.origin.trim() };
      const destination = destinationResult.status === 'fulfilled' ? destinationResult.value : { displayName: trip.destination.trim(), transitQuery: trip.destination.trim() };
      const hotelRequest = Number(trip.children) > 0 && trip.childAges.length !== Number(trip.children)
        ? Promise.resolve({ error: 'Enter an age for each child to search family stays.', options: [] })
        : searchHotels(destination.displayName || trip.destination.trim(), trip.departure, returnDate || localDate(1, trip.departure), Number(trip.adults), {
          children: Number(trip.children), childAges: trip.childAges.join(','), profile: 'budget', includeRentals: true, includeHostels: true, limit: 20,
        });
      const [transitResult, hotelResult] = await Promise.allSettled([
        searchTransit(origin.transitQuery || trip.origin.trim(), destination.transitQuery || trip.destination.trim()),
        hotelRequest,
      ]);
      const entry = (item) => item.status === 'fulfilled' ? item.value : { error: errorText(item.reason), options: [], recommendations: [] };
      setResults({ flights: entry(flightResult), transit: entry(transitResult), hotels: entry(hotelResult), experiences: entry(experienceResult) });
      setActiveTab('flights');
      window.setTimeout(() => scrollTo('live-results'), 60);
      if ([flightResult, transitResult, hotelResult, experienceResult].every((item) => item.status === 'rejected')) setNotice('We couldn’t find trip options just now. Please try again in a moment.');
    } catch (error) {
      setNotice(errorText(error));
    } finally {
      setSearching(false);
    }
  }

  async function applyPrompt(event) {
    event?.preventDefault();
    setAiNotice('');
    if (prompt.trim().length < 2) { setAiNotice('Add a short description of your trip first.'); return; }
    setParsing(true);
    try {
      const parsed = await parseTripPrompt(prompt.trim());
      const start = parsed.dates?.startDate || trip.departure;
      const patch = {
        origin: parsed.origin?.displayName || parsed.origin?.raw || trip.origin,
        destination: parsed.destination?.displayName || parsed.destination?.raw || trip.destination,
        departure: start,
        returnDate: parsed.dates?.endDate || localDate(Math.max(1, Number(parsed.dates?.durationDays || 3)), start),
        adults: Math.min(9, Math.max(1, Number(parsed.party?.adults || trip.adults))),
        children: Math.min(6, Math.max(0, Number(parsed.party?.children || 0))),
        budget: Math.max(1000, Number(parsed.budget || trip.budget)),
      };
      patch.childAges = Array.from({ length: patch.children }, (_, index) => parsed.party?.childAges?.[index] ?? trip.childAges?.[index] ?? '');
      updateTrip(patch);
      setAiNotice(parsed.isLiveAi ? 'Trip details filled with the AI parser. Review them and search when ready.' : 'Trip details filled with the local parser. Review the cities and dates before searching.');
    } catch (error) { setAiNotice(errorText(error)); }
    finally { setParsing(false); }
  }

  async function buildFullPlan() {
    setAiNotice('');
    if (prompt.trim().length < 2) { setAiNotice('Describe your trip first so the planner has somewhere to start.'); return; }
    setPlanning(true);
    setResults(null);
    setSelectedTransport(null);
    setSelectedHotel(null);
    setSelectedFoodId(null);
    setFoodResults(null);
    setCostSummary(null);
    try {
      const plan = await planTripAi(prompt.trim());
      setAiPlan(plan);
      const params = plan.parameters || {};
      const start = params.dates?.startDate || trip.departure;
      const planChildren = Math.min(6, Math.max(0, Number(params.party?.children || 0)));
      updateTrip({
        origin: params.origin?.displayName || trip.origin,
        destination: params.destination?.displayName || trip.destination,
        departure: start,
        returnDate: params.dates?.endDate || localDate(Math.max(1, Number(params.dates?.durationDays || 3)), start),
        adults: Math.min(9, Math.max(1, Number(params.party?.adults || trip.adults))),
        children: planChildren,
        childAges: Array.from({ length: planChildren }, (_, index) => params.party?.childAges?.[index] ?? trip.childAges?.[index] ?? ''),
        budget: Math.max(1000, Number(params.budget || trip.budget)),
      });
      const searches = plan.searchResults || {};
      setResults({
        flights: searches.flights || { options: [] },
        transit: searches.transit || { options: [] },
        hotels: searches.hotels || { options: [] },
        experiences: searches.recommendations || { recommendations: [] },
      });
      setCostSummary(plan.financialSummary || null);
      setActiveTab('flights');
      setAiNotice('The full planner returned live options and recommendations. Review the suggested picks and adjust your choices below.');
      window.setTimeout(() => scrollTo('live-results'), 60);
    } catch (error) { setAiNotice(errorText(error)); }
    finally { setPlanning(false); }
  }

  async function selectHotel(hotel) {
    setSelectedHotel(hotel.id);
    setSelectedFoodId(null);
    setFoodResults(null);
    setFoodError('');
    setCostSummary(null);
    const currentRequest = ++foodRequest.current;
    if (!hotel.coordinates) { setFoodError('This property did not include map coordinates, so nearby restaurants cannot be searched.'); return; }
    setFoodBusy(true);
    try {
      const food = await searchFood(hotel.coordinates.latitude, hotel.coordinates.longitude, {
        category: foodFilter, adults: Number(trip.adults), children: Number(trip.children), profile: 'budget', limit: 20,
      });
      if (foodRequest.current === currentRequest) setFoodResults(food);
    } catch (error) { if (foodRequest.current === currentRequest) setFoodError(errorText(error)); }
    finally { if (foodRequest.current === currentRequest) setFoodBusy(false); }
  }

  async function changeFoodFilter(filter) {
    setFoodFilter(filter);
    const hotel = selectedHotelResult;
    if (hotel?.coordinates) {
      const currentRequest = ++foodRequest.current;
      setFoodBusy(true); setFoodError('');
      try {
        const data = await searchFood(hotel.coordinates.latitude, hotel.coordinates.longitude, {
          category: filter, adults: Number(trip.adults), children: Number(trip.children), profile: 'budget', limit: 20,
        });
        if (foodRequest.current === currentRequest) setFoodResults(data);
      } catch (error) { if (foodRequest.current === currentRequest) setFoodError(errorText(error)); }
      finally { if (foodRequest.current === currentRequest) setFoodBusy(false); }
    }
  }

  async function explain(itemType, itemData, id) {
    setExplaining(id);
    try {
      const response = await explainPick(itemType, itemData, Number(trip.children) > 0 ? 'family' : 'budget', 'en');
      setExplanations((current) => ({ ...current, [id]: response.explanation }));
    } catch (error) { setExplanations((current) => ({ ...current, [id]: errorText(error) })); }
    finally { setExplaining(''); }
  }

  async function buildCostSummary() {
    if (!selectedHotelResult && !selectedTransportItem && !selectedFoodItem) { setNotice('Choose at least one flight, route, or stay before creating a cost summary.'); return; }
    setSummaryBusy(true);
    try {
      const response = await getAiCostSummary({
        destination: trip.destination, transit_cost: Math.round(Number(selectedTransportPrice || 0)),
        stay_cost: Math.round(Number(selectedHotelTotal || 0)), food_cost: Math.round(Number(selectedFoodCost || 0)), user_budget: Math.round(Number(trip.budget)),
        hotel_details: selectedHotelResult ? { name: selectedHotelResult.name, rating: selectedHotelResult.rating, price: selectedHotelTotal } : null,
        food_details: selectedFoodItem ? { currency: selectedFoodCurrency, estimate: selectedFoodEstimate, includedInTotal: selectedFoodCost != null } : null,
        transit_details: selectedTransportItem ? { name: selectedTransportItem.airline || selectedTransportItem.legs?.map((leg) => leg.title).join(' · ') || 'Selected transport', price: selectedTransportPrice } : null,
      });
      setCostSummary(response);
    } catch (error) { setNotice(errorText(error)); }
    finally { setSummaryBusy(false); }
  }

  const tabs = [
    { id: 'flights', label: 'Flights', icon: Plane, count: results ? flightOptions.length : null },
    { id: 'transit', label: 'Ground travel', icon: Train, count: results ? transitOptions.length : null },
    { id: 'stays', label: 'Stays', icon: BedDouble, count: results ? hotelOptions.length : null },
    { id: 'experiences', label: 'Experiences', icon: Compass, count: results ? experienceOptions.length : null },
    { id: 'summary', label: 'Trip summary', icon: Wallet, count: null },
  ];

  return <div className="app-shell">
    <header className="topbar">
      <a href="#home" className="brand" aria-label="Omnivoy home" onClick={(event) => { event.preventDefault(); setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><img className="brand-logo" src="/omnivoy-logo.png" alt="Omnivoy" /></a>
      <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileMenu((value) => !value)}>{mobileMenu ? <X /> : <Menu />}</button>
      <button className="mobile-search-button" type="button" aria-label="Search trips" onClick={() => scrollTo('planner')}><Search size={19}/></button>
      <nav className={mobileMenu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        <button onClick={() => scrollTo('destinations')}>Explore</button>
        <button onClick={() => scrollTo('planner')}>Plan a trip</button>
        <button onClick={() => scrollTo('budget-radar')}>Budget radar</button>
        <button onClick={() => { setActiveTab('stays'); scrollTo('live-results'); }}>Stays</button>
        <button onClick={() => { setActiveTab('experiences'); scrollTo('live-results'); }}>Experiences</button>
        <button onClick={() => scrollTo('map-route')}>Map</button>
        <a href="#help" onClick={(event) => { if (activePage !== 'home') { event.preventDefault(); setActivePage('home'); window.setTimeout(() => scrollTo('help'), 80); } }}>Guide</a>
      </nav>
      <div className="topbar-actions"><a className="quiet-link" href="#help" onClick={(event) => { if (activePage !== 'home') { event.preventDefault(); setActivePage('home'); window.setTimeout(() => scrollTo('help'), 80); } }}>How it works</a><button className="search-page-button" type="button" onClick={() => scrollTo('planner')}><Search size={16}/> <span>Search trips</span></button><button className="signin-link" type="button" onClick={() => scrollTo('planner')}>Plan a trip <ArrowUpRight size={14}/></button></div>
    </header>

    <main>
      {activePage === 'home' && <section className="hero" id="home">
        <div className="hero-backdrop" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="hero-kicker"><span /> FIND YOUR OWN WAY OUT THERE</p>
          <h1>Where can your<br/><em>money take you?</em></h1>
          <p className="hero-subtitle">A little more dreaming. A little less guesswork.<br/>Find the journey that feels like yours.</p>
          <div className="hero-points"><span><Check size={13}/> Compare real routes</span><span><Check size={13}/> Keep the whole trip in view</span></div>
        </div>
        <div className="hero-caption">A quieter morning, somewhere in the Himalayas</div>
      </section>}

      {activePage === 'search' && <div className="search-page-shell"><div className="search-page-head"><button type="button" onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ArrowRight size={15}/> Explore Omnivoy</button><div><p className="eyebrow">YOUR NEXT JOURNEY STARTS HERE</p><h1>Make the trip yours.</h1></div><p>Compare routes, places to stay and experiences for your next trip.</p></div><section className="planner-section" id="planner">
        <div className="planner-intro"><p className="eyebrow">MAKE A LITTLE ROOM FOR SOMEWHERE NEW</p><h2>Start with the feeling.<br/><em>We’ll help with the details.</em></h2><p>Search any city, region or country for routes, places to stay and things worth doing.</p></div>
        <form className="planner-card" onSubmit={runSearch}>
          <div className="trip-type-switch"><button type="button" className={trip.tripType === 'roundTrip' ? 'active' : ''} onClick={() => updateTrip({ tripType: 'roundTrip' })}>Round trip</button><button type="button" className={trip.tripType === 'oneWay' ? 'active' : ''} onClick={() => updateTrip({ tripType: 'oneWay' })}>One way</button></div>
          <div className="planner-grid planner-route">
            <CityField id="trip-origin" label="Leaving from" value={trip.origin} onChange={(origin) => updateTrip({ origin })} placeholder="City, region or country" icon={MapPin}/>
            <div className="route-divider"><ArrowRight size={17}/></div>
            <CityField id="trip-destination" label="Going to" value={trip.destination} onChange={(destination) => updateTrip({ destination })} placeholder="Type any destination" icon={MapPin}/>
          </div>
          <div className="planner-grid planner-details">
            <label className="field-wrap"><span className="field-label">Leaving</span><span className="field-control"><CalendarDays size={16}/><input aria-label="Departure date" type="date" min={localDate(0)} value={trip.departure} onChange={(event) => updateTrip({ departure: event.target.value, returnDate: trip.returnDate <= event.target.value ? localDate(2, event.target.value) : trip.returnDate })} required/></span></label>
            {trip.tripType === 'roundTrip' && <label className="field-wrap"><span className="field-label">Coming back</span><span className="field-control"><CalendarDays size={16}/><input aria-label="Return date" type="date" min={localDate(1, trip.departure)} value={trip.returnDate} onChange={(event) => updateTrip({ returnDate: event.target.value })} required/></span></label>}
            <label className="field-wrap"><span className="field-label">Travellers</span><span className="field-control"><Users size={16}/><select aria-label="Adults" value={trip.adults} onChange={(event) => updateTrip({ adults: Number(event.target.value) })}>{Array.from({ length: 9 }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count} adult{count > 1 ? 's' : ''}</option>)}</select><ChevronDown size={15}/></span></label>
            <label className="field-wrap"><span className="field-label">Children</span><span className="field-control"><Users size={16}/><select aria-label="Children" value={trip.children} onChange={(event) => { const children = Number(event.target.value); updateTrip({ children, childAges: Array.from({ length: children }, (_, index) => trip.childAges[index] ?? '') }); }}>{Array.from({ length: 7 }, (_, count) => <option key={count} value={count}>{count} child{count === 1 ? '' : 'ren'}</option>)}</select><ChevronDown size={15}/></span></label>
          </div>
          {trip.children > 0 && <div className="child-ages"><span>Age of each child</span>{trip.childAges.map((age, index) => <label key={index}><span>Child {index + 1}</span><input type="number" min="0" max="17" value={age} onChange={(event) => updateTrip({ childAges: trip.childAges.map((current, i) => i === index ? event.target.value : current) })} required aria-label={`Age of child ${index + 1}`}/></label>)}</div>}
          <div className="planner-bottom"><label className="budget-input"><span>My trip budget</span><span><b>₹</b><input type="number" min="1000" step="1000" value={trip.budget} onChange={(event) => updateTrip({ budget: Math.max(1000, Number(event.target.value) || 1000) })}/></span></label><button className="primary-button" type="submit" disabled={searching}>{searching ? <><span className="spinner"/> Looking around…</> : <>Find my way <ArrowRight size={17}/></>}</button></div>
          {notice && <p className="form-notice" role="alert">{notice}</p>}
          <details className="ai-prompt"><summary><Sparkles size={15}/> Have a trip in mind? Tell us in your own words</summary><div className="ai-prompt-body"><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="For example: a week in Japan from Chennai for two adults, under ₹1,20,000" rows={2}/><div className="ai-actions"><button type="button" className="outline-button" onClick={applyPrompt} disabled={parsing || planning}>{parsing ? 'Working…' : 'Fill trip details'} <ArrowRight size={14}/></button><button type="button" className="outline-button" onClick={buildFullPlan} disabled={planning || parsing}>{planning ? 'Planning…' : 'Build my trip plan'} <Sparkles size={14}/></button></div>{aiNotice && <p role="status">{aiNotice}</p>}</div></details>
          <p className="form-footnote">City suggestions help you find a destination quickly. You can also type a place that is not in the list.</p>
        </form>
      </section></div>}

      {activePage === 'home' && <section className="popular-strip" id="destinations"><div className="popular-heading"><div><p className="eyebrow">A FEW PLACES TO BEGIN</p><h2>Trending under your budget</h2></div><button className="text-link" type="button" onClick={() => scrollTo('planner')}>Search somewhere else <ArrowRight size={14}/></button></div>
        <div className="popular-grid">{popular.map((place) => <button key={place.city} className="destination-card" type="button" onClick={() => { updateTrip({ destination: place.city }); scrollTo('planner'); }}><img src={imageUrl(place.image, 700)} alt="" loading="lazy"/><span className="destination-overlay"/><span className="destination-copy"><small>{place.tag}</small><strong>{place.city}</strong><span>Plan a trip <ArrowUpRight size={13}/></span></span></button>)}</div>
      </section>}

      {activePage === 'search' && <section className="results-section" id="live-results">
        <SectionTitle eyebrow={activeTab === 'summary' ? 'READY WHEN YOU ARE' : 'YOUR TRIP, TAKING SHAPE'} title={activeTab === 'summary' ? 'Your trip, ready to add up.' : 'Good options, all in one place.'} body={activeTab === 'summary' ? 'Review your picks and create a clear trip cost summary.' : results ? `Options for ${trip.origin} to ${trip.destination}. Choose a flight, ground route or stay to update your trip budget.` : 'Search to compare routes, stays and experiences for your trip.'}/>
        <div className={`results-layout${activeTab === 'stays' ? ' results-layout--stays' : ''}${activeTab === 'summary' ? ' results-layout--summary' : ''}`}>
          <div className="results-main">
            <div className="result-tabs" role="tablist" aria-label="Travel results">{tabs.map(({ id, label, icon: Icon, count }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? 'selected' : ''} onClick={() => setActiveTab(id)}><Icon size={16}/>{label}{count !== null && <span>{count}</span>}</button>)}</div>
            {!results ? <EmptyPanel><Search size={20}/><strong>Your next trip starts here</strong><span>Tell us where you’re going and we’ll fetch the latest options.</span></EmptyPanel> : <div className="result-list">
              {activeTab === 'summary' && <section className="summary-workspace"><p className="eyebrow">TRIP CHECKOUT</p><h3>Your choices, one clear total.</h3><p>Review your selected route, stay and meal estimate. Then build a clear cost summary for your trip.</p><div className="summary-steps"><span><b>01</b> Choose a flight or ground route</span><span><b>02</b> Pick a place to stay</span><span><b>03</b> Add nearby food if you like</span></div><button className="primary-button" type="button" onClick={buildCostSummary} disabled={!results || summaryBusy}>{summaryBusy ? 'Putting it together…' : 'Build my cost summary'} <ArrowRight size={16}/></button>{costSummary && <p className="summary-ready" role="status">Your trip summary is ready in the budget panel.</p>}</section>}
              {activeTab === 'flights' && <>
                {results.flights?.error ? <EmptyPanel><CircleHelp size={19}/><strong>Flight search needs another look</strong><span>{results.flights.error}</span></EmptyPanel> : flightOptions.length === 0 ? <EmptyPanel><Plane size={19}/><strong>No flights returned for this search</strong><span>Try another date or check the city spelling. You can enter any city or country; searches are not limited to the suggested places.</span></EmptyPanel> : flightOptions.map((flight, index) => <FlightCard key={`${flight.airline}-${index}`} flight={flight} index={index} origin={trip.origin} destination={trip.destination} departure={trip.departure} returnDate={trip.tripType === 'roundTrip' ? trip.returnDate : undefined} selected={selectedTransport === `flight-${index}`} onSelect={() => { setSelectedTransport(selectedTransport === `flight-${index}` ? null : `flight-${index}`); setCostSummary(null); }} explanation={explanations[`flight-${index}`]} explaining={explaining === `flight-${index}`} onExplain={() => explain('flight', flight, `flight-${index}`)}/>) }
              </>}
              {activeTab === 'transit' && <>
                {results.transit?.error ? <EmptyPanel><CircleHelp size={19}/><strong>Ground travel search could not finish</strong><span>{results.transit.error}</span></EmptyPanel> : transitOptions.length === 0 ? <EmptyPanel><Train size={19}/><strong>No ground routes returned</strong><span>Ground route coverage depends on the provider and the locations you searched.</span></EmptyPanel> : transitOptions.map((item, index) => <TransitCard key={`ground-${index}`} item={item} selected={selectedTransport === `transit-${index}`} onSelect={() => { setSelectedTransport(selectedTransport === `transit-${index}` ? null : `transit-${index}`); setCostSummary(null); }} explanation={explanations[`transit-${index}`]} explaining={explaining === `transit-${index}`} onExplain={() => explain('transit', item, `transit-${index}`)}/>) }
              </>}
              {activeTab === 'stays' && <>
                {results.hotels?.error ? <EmptyPanel><CircleHelp size={19}/><strong>Stay search could not finish</strong><span>{results.hotels.error}</span></EmptyPanel> : hotelOptions.length === 0 ? <EmptyPanel><BedDouble size={19}/><strong>No stays returned for these dates</strong><span>Try different dates or a nearby destination.</span></EmptyPanel> : hotelOptions.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} nights={results.hotels.nights || nights} selected={selectedHotel === hotel.id} onSelect={() => selectHotel(hotel)} explanation={explanations[`hotel-${hotel.id}`]} explaining={explaining === `hotel-${hotel.id}`} onExplain={() => explain('hotel', hotel, `hotel-${hotel.id}`)}/>) }
                {results.hotels?.unpricedCount > 0 && <p className="muted-note">{results.hotels.unpricedCount} additional stays did not return a price for these dates.</p>}
                {selectedHotelResult && <section className="food-panel" aria-live="polite"><div className="food-heading"><div><p className="eyebrow">AROUND YOUR SELECTED STAY</p><h3>Must-try food nearby</h3><p>Google Maps places near {selectedHotelResult.name}. Distance is measured from the stay location.</p></div><label className="food-select">Food style<select value={foodFilter} onChange={(event) => changeFoodFilter(event.target.value)}><option value="any">Any cuisine</option><option value="vegetarian">Vegetarian</option><option value="family">Family friendly</option><option value="breakfast">Breakfast</option><option value="cafe">Cafés</option><option value="fine_dining">Fine dining</option></select></label></div>
                  {foodBusy ? <p className="loading-line"><span className="spinner"/> Finding places nearby…</p> : foodError ? <p className="inline-error" role="alert">{foodError}</p> : foodResults?.options?.length ? <div className="food-grid">{foodResults.options.map((place, index) => <FoodCard key={place.id} place={place} recommended={index === 0} selected={selectedFoodId === place.id} onSelect={() => setSelectedFoodId(selectedFoodId === place.id ? null : place.id)}/>)}</div> : <p className="muted-note">{foodResults ? 'No nearby food places were returned for this filter. Try another food style or expand the distance in the search.' : 'Choose a stay with a map location to find nearby restaurants.'}</p>}
                </section>}
              </>}
              {activeTab === 'experiences' && <>
                {results.experiences?.error ? <EmptyPanel><CircleHelp size={19}/><strong>Experience search could not finish</strong><span>{results.experiences.error}</span></EmptyPanel> : experienceOptions.length === 0 ? <EmptyPanel><Compass size={19}/><strong>No experiences returned</strong><span>The connected recommendation service did not return listings for this destination.</span></EmptyPanel> : experienceOptions.map((place, index) => <ExperienceCard key={`${place.title}-${index}`} place={place}/>) }
              </>}
            </div>}
          </div>
          <aside className="trip-aside" id="budget-radar">
            <div className="budget-card"><p className="eyebrow">YOUR BUDGET RADAR</p><h3>Make it all<br/>add up.</h3><p className="budget-destination">{results ? `${trip.origin} → ${trip.destination}` : 'A good trip starts with a number.'}</p><div className="budget-total"><span>Trip budget</span><strong>{money(trip.budget)}</strong></div><div className="budget-bar"><span style={{ width: `${Math.min(100, trip.budget ? selectedSpend / trip.budget * 100 : 0)}%` }}/></div><div className="budget-breakdown"><p><span><Plane size={14}/> Transport</span><b>{selectedTransportPrice != null ? money(selectedTransportPrice, selectedTransportItem?.currency || selectedTransportItem?.currencyCode || 'INR') : '—'}</b></p><p><span><BedDouble size={14}/> Stay · {results?.hotels?.nights || nights} nights</span><b>{selectedHotelTotal != null ? money(selectedHotelTotal, selectedHotelResult?.currency || 'INR') : '—'}</b></p><p><span><Utensils size={14}/> One meal · {selectedFoodItem?.name || 'choose nearby food'}</span><b>{selectedFoodItem && selectedFoodEstimate != null ? `${foodEstimate(selectedFoodEstimate, selectedFoodItem)}${selectedFoodCurrency === 'INR' ? '' : ' · not converted'}` : selectedFoodItem ? selectedFoodItem.priceLabel || 'Price unavailable' : '—'}</b></p><div className="budget-rule"/><p className="budget-left"><span>{hasSelectedCost ? (budgetRemaining >= 0 ? 'Left for the rest' : 'Over budget') : 'Choose your options'}</span><b>{hasSelectedCost ? money(Math.abs(budgetRemaining)) : '—'}</b></p></div>
              {activeTab === 'summary' && costSummary && <div className="cost-summary"><strong>{costSummary.statusBadge || costSummary.status || 'Trip estimate'}</strong><div className="summary-math"><p><span>Transport</span><b>{selectedTransportItem ? money(costSummary.breakdown?.transit ?? selectedTransportPrice) : 'Not selected'}</b></p><p><span>Stay</span><b>{selectedHotelResult ? money(costSummary.breakdown?.stay ?? selectedHotelTotal) : 'Not selected'}</b></p><p><span>Food · one group meal</span><b>{selectedFoodItem ? selectedFoodCost != null ? money(costSummary.breakdown?.food ?? selectedFoodCost) : `${foodEstimate(selectedFoodEstimate, selectedFoodItem)} · excluded (currency differs)` : 'Not selected'}</b></p><p className="summary-total"><span>Selected INR cost total</span><b>{money(costSummary.breakdown?.total ?? costSummary.totalCost ?? selectedSpend)}</b></p><p><span>Budget remaining</span><b>{money(Math.abs(costSummary.remainingMargin ?? budgetRemaining))}{(costSummary.remainingMargin ?? budgetRemaining) < 0 ? ' over' : ' left'}</b></p></div><p>{costSummary.tradeOffAnalysis || 'The estimate adds the amounts shown above.'}</p><small>Uses selected transport and stay totals. A meal is included only when its price is in INR. Other meal currencies are shown separately, without an assumed exchange rate. Taxes, extra meals and local transfers are not included.</small></div>}
              {activeTab !== 'summary' && <small className="budget-disclaimer">Only selected costs count. A meal estimate is included only when its source currency is INR; other currencies are shown separately. Taxes, extra meals and local transfers are excluded.</small>}
            </div>
            <div className="route-card" id="map-route"><div className="route-card-top"><span className="eyebrow">THE WAY THERE</span><Map size={17}/></div><div className="route-visual"><span className="route-pin from"/><span className="route-dash"/><span className="route-pin to"/></div><p className="route-label"><span>{trip.origin || 'Leaving from'}</span><ArrowRight size={14}/><span>{trip.destination || 'Going to'}</span></p>{trip.destination ? <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.origin)}&destination=${encodeURIComponent(trip.destination)}`} target="_blank" rel="noreferrer">Open route in Maps <ExternalLink size={13}/></a> : <span className="route-hint">Add a destination to preview the route.</span>}</div>
            {activeTab === 'summary' && aiPlan?.recommendedPicks && <div className="ai-picks"><p className="eyebrow">YOUR TRIP PICKS</p>{aiPlan.recommendedPicks.hotel?.data && <p><BedDouble size={13}/><span><b>{aiPlan.recommendedPicks.hotel.data.name}</b>{aiPlan.recommendedPicks.hotel.explanation && <small>{aiPlan.recommendedPicks.hotel.explanation}</small>}</span></p>}{aiPlan.recommendedPicks.transit?.data && <p><Plane size={13}/><span><b>{aiPlan.recommendedPicks.transit.mode || aiPlan.recommendedPicks.transit.data.airline || 'Recommended route'}</b>{aiPlan.recommendedPicks.transit.explanation && <small>{aiPlan.recommendedPicks.transit.explanation}</small>}</span></p>}</div>}
            {results?.flights?.error && <p className="aside-note">Flight note: {results.flights.error}</p>}
          </aside>
        </div>
      </section>}

      {activePage === 'home' && <section className="explore-section"><SectionTitle eyebrow="TAKE THE LONG WAY ROUND" title="Small moments make a trip." body="A few ideas to spark the next stop. Search any place above to see recommendations from the connected service."/><div className="explore-cards">{[
        { title: 'Find a table', copy: 'Discover nearby food after choosing a stay.', icon: Utensils, link: 'stays' },
        { title: 'Follow the road', copy: 'Compare available ground routes for your trip.', icon: Train, link: 'transit' },
        { title: 'Make it yours', copy: 'Set the budget, then see how your picks add up.', icon: Heart, link: 'budget-radar' },
      ].map(({ title, copy, icon: Icon, link }) => <button className="explore-card" key={title} type="button" onClick={() => { if (link === 'budget-radar') scrollTo(link); else { setActiveTab(link); scrollTo('live-results'); } }}><span className="explore-icon"><Icon size={18}/></span><strong>{title}</strong><p>{copy}</p><span className="explore-more">Take a look <ArrowRight size={14}/></span></button>)}</div></section>}

      {activePage === 'home' && <section className="help-section" id="help"><p className="eyebrow">A NOTE BEFORE YOU GO</p><h2>Good questions.<br/><em>Clear answers.</em></h2><div className="faq-grid"><details><summary>Can I search for any city or country?<ChevronDown size={16}/></summary><p>Yes. Suggestions help you pick a destination, and the field also accepts free text. Flights work best when the place can be matched to an airport.</p></details><details><summary>What does the budget include?<ChevronDown size={16}/></summary><p>The running total includes selected transport, stay and a chosen restaurant meal estimate. Taxes, extra meals, transfers and other fees may not be included.</p></details><details><summary>Can I book from here?<ChevronDown size={16}/></summary><p>Use a booking link when a result supplies one. Some listings open the matching search or map for more details.</p></details></div></section>}
    </main>
    <footer className="footer"><a href="#home" className="brand" aria-label="Omnivoy home" onClick={(event) => { event.preventDefault(); setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><img className="brand-logo" src="/omnivoy-logo.png" alt="Omnivoy" /></a><span>Find a little more room for somewhere new.</span><button type="button" onClick={() => scrollTo('planner')}>Plan a trip <ArrowUpRight size={13}/></button></footer>
  </div>;
}

function FlightCard({ flight, index, origin, destination, departure, returnDate, selected, onSelect, explanation, explaining, onExplain }) {
  const first = flight.segments?.[0];
  const last = flight.segments?.[flight.segments.length - 1];
  const airlineCode = airlineCodeFor(flight);
  const airlineLogo = airlineCode ? `https://www.gstatic.com/flights/airline_logos/70px/${airlineCode}.png` : null;
  const carrierMark = String(flight.airline || 'FL').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const searchUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(`${origin} to ${destination} ${departure}${returnDate ? ` ${returnDate}` : ''}`)}`;
  return <article className={`result-card ${selected ? 'is-selected' : ''}`}>
    <div className="result-card-top"><span className="airline-logo-wrap">{airlineLogo && <img src={airlineLogo} alt={`${flight.airline || 'Airline'} logo`} onError={(event) => { event.currentTarget.hidden = true; }}/>}<span aria-hidden="true">{carrierMark}</span></span><div className="result-heading"><strong>{flight.airline || 'Flight option'}</strong><span>{flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops === 1 ? '' : 's'}`} · {duration(flight.totalDurationMinutes)}</span></div><div className="result-price-block"><span>Provider quote</span><span className="result-price">{money(flight.price, flight.currency || 'INR')}</span></div></div>
    <div className="journey-times"><div><strong>{first?.departureTime?.slice(11, 16) || first?.departureTime || '—'}</strong><span>{first?.fromAirport || origin || 'Departure'}</span></div><span className="journey-line"><Plane size={14}/><i/></span><div className="align-right"><strong>{last?.arrivalTime?.slice(11, 16) || last?.arrivalTime || '—'}</strong><span>{last?.toAirport || destination || 'Arrival'}</span></div></div>
    {flight.segments?.length > 0 && <div className="flight-segments" aria-label="Flight segments">{flight.segments.map((segment, i) => <div className="flight-segment" key={`${segment.flightNumber}-${i}`}><span className="segment-leg">{segment.fromAirport || origin}<ArrowRight size={13}/>{segment.toAirport || destination}</span><span className="segment-carrier">{segment.airline || flight.airline} {segment.flightNumber || ''}{segment.durationMinutes ? ` · ${duration(segment.durationMinutes)}` : ''}</span></div>)}</div>}
    <p className="price-footnote">Provider itinerary total · {flight.priceStatus === 'provider_total' ? 'tax inclusion is not specified' : 'check price details with provider'}</p>
    {explanation && <p className="pick-explanation">{explanation}</p>}
    <div className="result-actions"><button className="select-button" type="button" aria-pressed={selected} onClick={onSelect}>{selected ? <><Check size={14}/> Added to your trip</> : 'Add to my trip'}</button><button className="why-button" type="button" onClick={onExplain} disabled={explaining}>{explaining ? 'Thinking…' : <><Sparkles size={13}/> Why this pick</>}</button><a className="result-link" href={flight.bookingLink || searchUrl} target="_blank" rel="noreferrer">View flight <ExternalLink size={12}/></a></div>
  </article>;
}

function TransitCard({ item, selected, onSelect, explanation, explaining, onExplain }) {
  const name = item.legs?.map((leg) => leg.title).filter(Boolean).join(' · ') || item.mainMode || 'Ground travel option';
  return <article className={`result-card ${selected ? 'is-selected' : ''}`}><div className="result-card-top"><span className="result-icon"><Train size={17}/></span><div className="result-heading"><strong>{name}</strong><span>{item.legs?.map((leg) => leg.operator || leg.mode).filter(Boolean).join(' · ') || item.mainMode || 'Ground travel'}</span></div><span className="result-price">{item.fare != null ? money(item.fare, item.currency || 'INR') : 'Fare unavailable'}</span></div><div className="transit-meta"><span><Clock3 size={13}/>{duration(item.durationMinutes)}</span>{item.departureTime && <span>Leaves {item.departureTime}</span>}{item.arrivalTime && <span>Arrives {item.arrivalTime}</span>}</div>{item.legs?.length > 0 && <div className="segment-row">{item.legs.map((leg, i) => <span key={`${leg.title}-${i}`}>{leg.fromName || 'Start'} → {leg.toName || 'End'}</span>)}</div>}{explanation && <p className="pick-explanation">{explanation}</p>}<div className="result-actions"><button className="select-button" type="button" aria-pressed={selected} onClick={onSelect}>{selected ? <><Check size={14}/> Added to your trip</> : 'Add to my trip'}</button><button className="why-button" type="button" onClick={onExplain} disabled={explaining}>{explaining ? 'Thinking…' : <><Sparkles size={13}/> Why this pick</>}</button></div></article>;
}

function HotelCard({ hotel, nights, selected, onSelect, explanation, explaining, onExplain }) {
  const [imageMode, setImageMode] = useState(hotel.imageUrl ? 'property' : 'representative');
  const placeholder = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80';
  return <article className={`stay-card ${selected ? 'is-selected' : ''}`}><div className="stay-photo">{imageMode === 'unavailable' ? <div className="stay-photo-fallback"><BedDouble size={28}/><span>Property photo unavailable</span></div> : <img src={imageMode === 'property' ? hotel.imageUrl : placeholder} alt={imageMode === 'property' ? `${hotel.name} property photo` : `Representative stay photo; not a photo of ${hotel.name}`} loading="lazy" onError={() => setImageMode((mode) => mode === 'property' ? 'representative' : 'unavailable')}/>}<span>{hotel.kind || 'Stay'}</span><small>{imageMode === 'property' ? 'Property photo' : 'Representative photo'}</small></div><div className="stay-content"><div className="stay-card-head"><div><h3>{hotel.name}</h3><p>{hotel.starClass ? `${hotel.starClass} star stay · ` : ''}{hotel.rating != null ? <><Star size={12} fill="currentColor"/> {hotel.rating.toFixed(1)}</> : 'Rating unavailable'}{hotel.reviewCount != null ? ` · ${Number(hotel.reviewCount).toLocaleString('en-IN')} reviews` : ''}</p></div><div className="stay-price">{hotel.pricePerNight != null ? <><strong>{money(hotel.pricePerNight, hotel.currency || 'INR')}</strong><span>per night</span></> : <strong>Price unavailable</strong>}</div></div><div className="amenities">{(hotel.features || hotel.amenities || []).slice(0, 4).map((tag, i) => <span key={`${tag}-${i}`}>{String(tag).replaceAll('_', ' ')}</span>)}</div><div className="stay-total">{hotel.totalPrice != null ? `${money(hotel.totalPrice, hotel.currency || 'INR')} total · ${hotel.nights || nights} nights` : 'Total price not provided'}{hotel.website && <a href={hotel.website} target="_blank" rel="noreferrer">Property site <ExternalLink size={12}/></a>}</div>{explanation && <p className="pick-explanation">{explanation}</p>}<div className="result-actions"><button className="select-button" type="button" onClick={onSelect} aria-pressed={selected}>{selected ? <><Utensils size={14}/> Nearby food selected</> : <><Utensils size={14}/> Choose stay & find food</>}</button><button className="why-button" type="button" onClick={onExplain} disabled={explaining}>{explaining ? 'Thinking…' : <><Sparkles size={13}/> Why this pick</>}</button><a className="result-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name)}`} target="_blank" rel="noreferrer">Map & reviews <ExternalLink size={12}/></a></div></div></article>;
}

function FoodCard({ place, recommended, selected, onSelect }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.id)}`;
  return <article className={`food-card ${selected ? 'is-selected' : ''}`}><div className="food-photo">{place.thumbnail ? <img src={place.thumbnail} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }}/> : <Utensils size={20}/>}</div><div><div className="food-name-row"><strong>{place.name}</strong>{place.rating != null && <span><Star size={12} fill="currentColor"/> {place.rating.toFixed(1)}</span>}</div><p>{place.type || place.address || 'Restaurant'}{place.distanceKm != null ? ` · ${place.distanceKm.toFixed(1)} km away` : ''}</p>{recommended && <span className="must-try-badge">Must-try nearby</span>}<div className="food-card-foot"><span>{place.priceLabel || (place.estimatedPerPerson != null ? `About ${foodEstimate(place.estimatedPerPerson, place)} / person` : 'Price not listed')}{place.reviewCount != null ? ` · ${Number(place.reviewCount).toLocaleString('en-IN')} reviews` : ''}</span><a href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} in Google Maps`}><ExternalLink size={14}/></a></div><button className="food-select-button" type="button" aria-pressed={selected} onClick={onSelect}>{selected ? 'Meal estimate selected' : place.estimatedMealCost != null ? `Add meal estimate · ${foodEstimate(place.estimatedMealCost, place)}` : 'Add to budget'}</button></div></article>;
}

function ExperienceCard({ place }) {
  return <article className="experience-card">{place.thumbnailUrl ? <img src={place.thumbnailUrl} alt="" loading="lazy"/> : <div className="experience-placeholder"><Compass size={24}/></div>}<div className="experience-copy"><p className="eyebrow">{place.category || 'A place to remember'}</p><h3>{place.title}</h3><p>{place.description || place.location || 'Explore this recommendation for your destination.'}</p>{place.location && <span className="experience-location"><MapPin size={12}/>{place.location}</span>}<div className="experience-bottom">{place.rating != null && <span><Star size={12} fill="currentColor"/> {place.rating}{place.reviewCount != null ? ` · ${Number(place.reviewCount).toLocaleString('en-IN')} reviews` : ''}</span>}{place.link && <a href={place.link} target="_blank" rel="noreferrer">Take a closer look <ArrowUpRight size={13}/></a>}</div></div></article>;
}
