import React, { useState } from 'react';
import TransitOptionsSection from './TransitOptionsSection';
import HotelBookingSection from './HotelBookingSection';
import NearbyEventsSection from './NearbyEventsSection';
import { INITIAL_CITIES } from '../data/mockData';
import { Wifi, Sparkles, Compass } from 'lucide-react';

export default function DestinationShowdown({
  journeyData,
  citiesList = null,
  cityASelection,
  setCityASelection,
  cityBSelection,
  setCityBSelection,
  cityADisplay,
  cityBDisplay,
  isLiveData = false,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const nightsCount = Math.max(1, (journeyData.durationDays || 3) - 1);

  // Normalize list of destination columns to support N cities dynamically
  const columns = citiesList && citiesList.length > 0
    ? citiesList
    : [
        {
          id: 'cityA',
          num: '1',
          name: isLiveData ? (journeyData.destinations?.[0] || journeyData.cityA || 'Gokarna') : 'Gokarna',
          data: cityADisplay || INITIAL_CITIES.gokarna,
          selection: cityASelection,
          setSelection: setCityASelection,
        },
        {
          id: 'cityB',
          num: '2',
          name: isLiveData ? (journeyData.destinations?.[1] || journeyData.cityB || 'Pondicherry') : 'Pondicherry',
          data: cityBDisplay || INITIAL_CITIES.pondicherry,
          selection: cityBSelection,
          setSelection: setCityBSelection,
        },
      ];

  const cityNamesHeader = columns.map(c => c.name).join(' vs ');

  return (
    <section id="showdown-section" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Showdown Controls / View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-sandal-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-crimson-800">
              Step 2: {isLiveData ? 'Live SerpApi & AI Verified Data' : 'Live Comparator Preview'}
            </span>
            {isLiveData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Wifi className="w-3 h-3" /> LIVE SERPAPI
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            Destination Comparator: {cityNamesHeader}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {isLiveData
              ? `Real-time data for ${columns.length} destinations. Select transit & verified stays below to calculate live math.`
              : 'Select transit modes & verified stays to simulate your personalized trip budget.'}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-sandal-100 border border-sandal-300 text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Side-by-Side (All {columns.length})
          </button>
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveTab(col.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === col.id ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {col.name} Only
            </button>
          ))}
        </div>
      </div>

      {/* Grid for N Cities */}
      <div className={`grid gap-8 ${
        activeTab === 'all'
          ? columns.length > 2
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1'
      }`}>
        {columns
          .filter(col => activeTab === 'all' || activeTab === col.id)
          .map((col) => (
            <CityColumn
              key={col.id}
              cityKey={col.id}
              cityNum={col.num}
              cityData={col.data}
              cityName={col.name}
              originName={journeyData.origin}
              vibe={journeyData.vibe || 'Travel'}
              selection={col.selection}
              setSelection={col.setSelection}
              nightsCount={nightsCount}
              userBudget={journeyData.budget}
              isLiveData={isLiveData}
            />
          ))}
      </div>
    </section>
  );
}

function CityColumn({
  cityKey,
  cityNum,
  cityData,
  cityName,
  originName = 'Bengaluru',
  vibe,
  selection = {},
  setSelection,
  nightsCount,
  userBudget,
  isLiveData,
}) {
  const handleTransitMode = (mode) => {
    const list = mode === 'flight'
      ? (cityData.transit?.flights || [])
      : mode === 'bus'
      ? (cityData.transit?.buses || [])
      : (cityData.transit?.trains || []);
    const defaultOpt = list?.[0];
    if (setSelection) {
      setSelection(prev => ({
        ...prev,
        transitMode: mode,
        transitOptionId: defaultOpt?.id || '',
        transitPrice: Number(defaultOpt?.roundTripPrice || 0),
      }));
    }
  };

  const minHotelPrice = cityData.hotels?.[0]?.pricePerNight || 1200;

  return (
    <div className="sandal-card p-6 sm:p-7 bg-white/90 border border-sandal-300 shadow-sandal-card space-y-6">
      {/* City Header Card */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 group">
        <img
          src={cityData.heroImage || 'https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&w=800&q=80'}
          alt={cityName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/35 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                Destination {cityNum} • {cityData.state || 'India'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">{cityName}</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-crimson-700/90 text-white backdrop-blur-sm border border-crimson-500">
              {cityData.vibeTag || 'Verified Pick'}
            </span>
          </div>
          <p className="text-xs text-stone-200 mt-1 line-clamp-1">{cityData.tagline}</p>
        </div>
      </div>

      {/* ─── Track 2: AI "Why This Pick" Highlight Box ─── */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50/80 border border-emerald-300 text-xs shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI "Why This Pick" Recommendation</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
            Track 2 Active
          </span>
        </div>
        <p className="text-stone-700 leading-snug">
          <strong>Why choose {cityName} from {originName}:</strong> Best-in-class value for leisure and cultural stays. Offers verified accommodations starting at ₹{Number(minHotelPrice).toLocaleString('en-IN')}/night and flexible multi-modal connectivity.
        </p>
      </div>

      {/* 1. Multi-Modal Transit */}
      <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
        <TransitOptionsSection
          cityKey={cityKey}
          cityName={cityName}
          transitData={cityData.transit || { flights: [], buses: [], trains: [] }}
          selectedMode={(selection.transitMode || 'bus').toLowerCase()}
          selectedOptionId={selection.transitOptionId}
          onSelectTransitMode={handleTransitMode}
          onSelectOption={(id, price) => setSelection && setSelection(prev => ({ ...prev, transitOptionId: id, transitPrice: Number(price || 0) }))}
        />
      </div>

      {/* 2. Hotel Booking */}
      <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
        <HotelBookingSection
          hotels={cityData.hotels || []}
          selectedHotelId={selection.hotelId}
          onSelectHotel={(id, pricePerNight) => setSelection && setSelection(prev => ({ ...prev, hotelId: id, hotelPricePerNight: pricePerNight }))}
          nightsCount={nightsCount}
          userBudget={userBudget}
          isLiveData={isLiveData}
          cityName={cityName}
          tripadvisorRecommendations={cityData.tripadvisorRecommendations || []}
        />
      </div>

      {/* 3. Nearby Live Events */}
      {(cityData.events?.length > 0 || cityData.localFood?.length > 0) && (
        <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
          <NearbyEventsSection
            events={cityData.events || []}
            localFood={cityData.localFood || []}
            cityName={cityName}
          />
        </div>
      )}
    </div>
  );
}
