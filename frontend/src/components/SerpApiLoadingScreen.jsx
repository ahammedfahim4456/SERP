import React, { useEffect, useState, useRef } from 'react';
import { Plane, Train, Hotel, Compass, CheckCircle2, Database, AlertTriangle } from 'lucide-react';
import { searchFlights, searchTransit, searchHotels, searchTripadvisor } from '../services/api';

/**
 * Sequential real API calls to backend -> SerpApi (or cache) for N destinations.
 */
export default function SerpApiLoadingScreen({ onFinishLoading, journeyData }) {
  const [steps, setSteps] = useState([]);
  const started = useRef(false);

  // Flight IATA mappings for common Indian cities
  const CITY_IATA = {
    Bengaluru: 'BLR', Bangalore: 'BLR', Chennai: 'MAA', Madras: 'MAA',
    Mumbai: 'BOM', Bombay: 'BOM', Delhi: 'DEL', 'New Delhi': 'DEL',
    Hyderabad: 'HYD', Pune: 'PNQ', Kolkata: 'CCU', Gokarna: 'GOX',
    Pondicherry: 'PNY', Puducherry: 'PNY', Madurai: 'IXM', Kochi: 'COK',
    Goa: 'GOI', Panaji: 'GOI', Jaipur: 'JAI', Varanasi: 'VNS',
    Ooty: 'CJB', Coimbatore: 'CJB', Mysuru: 'MYQ', Kodaikanal: 'IXM',
    Thiruvananthapuram: 'TRV', Trivandrum: 'TRV',
  };

  const getIata = (city) => {
    if (!city) return 'BLR';
    if (CITY_IATA[city]) return CITY_IATA[city];
    const match = Object.keys(CITY_IATA).find(k => k.toLowerCase() === city.toLowerCase());
    if (match) return CITY_IATA[match];
    return city.length === 3 ? city.toUpperCase() : 'MAA';
  };

  const originIATA = getIata(journeyData.origin);

  const destinations = journeyData.destinations && journeyData.destinations.length > 0
    ? journeyData.destinations
    : [journeyData.cityA || 'Gokarna', journeyData.cityB || 'Pondicherry'];

  // Dynamically create steps for all N destination cities
  const STEP_DEFS = [];
  destinations.forEach((destCity, idx) => {
    const destIATA = getIata(destCity);

    // 1. Flights
    STEP_DEFS.push({
      id: `flights_${idx}`,
      icon: Plane,
      engine: 'google_flights',
      cityName: destCity,
      title: `Flights → ${destCity}`,
      detail: `Searching ${originIATA} → ${destIATA}...`,
      run: () => searchFlights(originIATA, destIATA,
        journeyData.startDate, journeyData.endDate, journeyData.travelers || 1),
      key: `flights_${destCity}`,
      destCity,
      category: 'flights',
    });

    // 2. Hotels
    STEP_DEFS.push({
      id: `hotels_${idx}`,
      icon: Hotel,
      engine: 'google_hotels',
      cityName: destCity,
      title: `Hotels & Rentals in ${destCity}`,
      detail: `Filtering stays within ₹${Math.round(journeyData.budget * 0.4)} allowance...`,
      run: () => searchHotels(destCity, journeyData.startDate, journeyData.endDate,
        journeyData.travelers || 1, { profile: 'budget', limit: 10 }),
      key: `hotels_${destCity}`,
      destCity,
      category: 'hotels',
    });

    // 3. Transit (Trains & Buses)
    STEP_DEFS.push({
      id: `transit_${idx}`,
      icon: Train,
      engine: 'google_maps_directions',
      cityName: destCity,
      title: `Transit → ${destCity}`,
      detail: `Trains + buses from ${journeyData.origin}...`,
      run: () => searchTransit(`${journeyData.origin} Central`, `${destCity} Bus Station`),
      key: `transit_${destCity}`,
      destCity,
      category: 'transit',
    });

    // 4. TripAdvisor
    STEP_DEFS.push({
      id: `tripadvisor_${idx}`,
      icon: Compass,
      engine: 'tripadvisor',
      cityName: destCity,
      title: `TripAdvisor Tips → ${destCity}`,
      detail: `Top traveler picks matching ₹${Number(journeyData.budget || 15000).toLocaleString('en-IN')} budget...`,
      run: () => searchTripadvisor(destCity, journeyData.budget),
      key: `tripadvisor_${destCity}`,
      destCity,
      category: 'tripadvisor',
    });
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Initialize step statuses
    setSteps(STEP_DEFS.map(s => ({ ...s, status: 'pending', cached: null, data: null })));

    const results = {};

    (async () => {
      for (let i = 0; i < STEP_DEFS.length; i++) {
        const step = STEP_DEFS[i];
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running' } : s
        ));

        try {
          const data = await step.run();
          results[step.key] = data;
          setSteps(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'done', cached: data?.cached, data } : s
          ));
        } catch (err) {
          console.error(`Step ${step.id} failed:`, err);
          results[step.key] = null;
          setSteps(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', errorMsg: err.message } : s
          ));
        }
      }

      // Group results by destination city
      const citiesData = {};
      destinations.forEach(dest => {
        citiesData[dest] = {
          flights: results[`flights_${dest}`],
          hotels: results[`hotels_${dest}`],
          transit: results[`transit_${dest}`],
          tripadvisor: results[`tripadvisor_${dest}`],
        };
      });

      const cityAData = citiesData[destinations[0]];
      const cityBData = citiesData[destinations[1]] || citiesData[destinations[0]];

      // Small delay so user sees the final checkmarks
      setTimeout(() => {
        onFinishLoading({ citiesData, cityAData, cityBData });
      }, 700);
    })();
  }, []);

  const doneCount = steps.filter(s => s.status === 'done' || s.status === 'error').length;
  const progressPercent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const cacheHits = steps.filter(s => s.cached === true).length;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="sandal-card p-8 bg-white border border-sandal-300 shadow-2xl relative overflow-hidden">

        {/* Subtle Sandalwood background shimmer */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-100/40 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            <span>Live SerpApi Search — {destinations.length} Destinations</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Querying Live Travel Data
          </h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Departing from <span className="font-semibold text-stone-800">{journeyData.origin}</span> ➔ Comparing{' '}
            <span className="font-semibold text-stone-800">{destinations.join(' vs ')}</span>
          </p>
          {cacheHits > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              ⚡ {cacheHits} cache hit{cacheHits > 1 ? 's' : ''} — no extra API credits used
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-stone-600 mb-2">
            <span>Fetching real routes & stays ({doneCount}/{steps.length})...</span>
            <span className="text-crimson-700">{progressPercent}%</span>
          </div>
          <div className="h-3 w-full bg-sandal-200 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-crimson-700 to-crimson-600 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Step-by-step progress cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {steps.map((step) => {
            const Icon = step.icon;
            const isDone = step.status === 'done';
            const isActive = step.status === 'running';
            const isError = step.status === 'error';

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : isError
                    ? 'bg-red-50/60 border-red-200 text-red-900'
                    : isActive
                    ? 'bg-crimson-50/70 border-crimson-300 ring-2 ring-crimson-400/20'
                    : 'bg-sandal-50 border-sandal-200 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isError
                        ? 'bg-red-500 text-white'
                        : isActive
                        ? 'bg-crimson-700 text-white animate-pulse'
                        : 'bg-sandal-200 text-stone-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> :
                     isError ? <AlertTriangle className="w-5 h-5" /> :
                     <Icon className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {step.title}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-crimson-700 mt-0.5">
                      engine: {step.engine}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                      {isError ? step.errorMsg : step.detail}
                    </div>
                    {isDone && (
                      <div className={`text-[10px] font-bold mt-1 ${step.cached ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {step.cached ? '⚡ Cache HIT' : '🌐 Fresh fetch (1 API credit)'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Skip button */}
        <div className="text-center pt-2">
          <button
            onClick={() => onFinishLoading(null)}
            className="text-xs font-semibold text-stone-500 hover:text-crimson-800 underline decoration-dotted transition-colors cursor-pointer"
          >
            Skip & Use Verified Preview Data Instead ➔
          </button>
        </div>

      </div>
    </div>
  );
}
