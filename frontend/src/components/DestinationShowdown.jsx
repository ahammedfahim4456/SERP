import React, { useState } from 'react';
import TransitOptionsSection from './TransitOptionsSection';
import HotelBookingSection from './HotelBookingSection';
import NearbyEventsSection from './NearbyEventsSection';
import { INITIAL_CITIES } from '../data/mockData';
import { Wifi } from 'lucide-react';

export default function DestinationShowdown({
  journeyData,
  cityASelection,
  setCityASelection,
  cityBSelection,
  setCityBSelection,
  cityADisplay,
  cityBDisplay,
  isLiveData = false,
}) {
  const [activeTab, setActiveTab] = useState('both');
  const nightsCount = journeyData.durationDays - 1;

  const gokarna = cityADisplay || INITIAL_CITIES.gokarna;
  const pondicherry = cityBDisplay || INITIAL_CITIES.pondicherry;
  const cityAName = isLiveData ? journeyData.cityA : 'Gokarna';
  const cityBName = isLiveData ? journeyData.cityB : 'Pondicherry';

  return (
    <section id="showdown-section" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Showdown Controls / View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-sandal-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-crimson-800">
              Step 2: {isLiveData ? 'Live SerpApi Data' : 'Mock Data Preview'}
            </span>
            {isLiveData && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Wifi className="w-3 h-3" /> LIVE
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Destination Comparator: {cityAName} vs {cityBName}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {isLiveData
              ? 'Real-time data from SerpApi. Select transport modes & verified stays below.'
              : 'Select transport modes & verified stays to simulate your personalized trip budget.'}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sandal-100 border border-sandal-300 text-xs font-bold">
          {[
            { id: 'both', label: 'Side-by-Side (Both)' },
            { id: 'cityA', label: `${cityAName} Focus` },
            { id: 'cityB', label: `${cityBName} Focus` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid for City A & City B */}
      <div className={`grid gap-8 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {(activeTab === 'both' || activeTab === 'cityA') && (
          <CityColumn
            cityKey="cityA"
            cityNum="A"
            cityData={gokarna}
            cityName={cityAName}
            vibe={journeyData.vibe}
            selection={cityASelection}
            setSelection={setCityASelection}
            nightsCount={nightsCount}
            userBudget={journeyData.budget}
            isLiveData={isLiveData}
          />
        )}
        {(activeTab === 'both' || activeTab === 'cityB') && (
          <CityColumn
            cityKey="cityB"
            cityNum="B"
            cityData={pondicherry}
            cityName={cityBName}
            vibe={journeyData.vibe}
            selection={cityBSelection}
            setSelection={setCityBSelection}
            nightsCount={nightsCount}
            userBudget={journeyData.budget}
            isLiveData={isLiveData}
          />
        )}
      </div>
    </section>
  );
}

function CityColumn({
  cityKey,
  cityNum,
  cityData,
  cityName,
  vibe,
  selection,
  setSelection,
  nightsCount,
  userBudget,
  isLiveData,
}) {
  const handleTransitMode = (mode) => {
    const list = mode === 'flight' ? cityData.transit.flights : mode === 'bus' ? cityData.transit.buses : cityData.transit.trains;
    const defaultOpt = list?.[0];
    if (defaultOpt) {
      setSelection(prev => ({
        ...prev,
        transitMode: mode,
        transitOptionId: defaultOpt.id,
        transitPrice: defaultOpt.roundTripPrice,
      }));
    }
  };

  return (
    <div className="sandal-card p-6 sm:p-7 bg-white/90 border border-sandal-300 shadow-sandal-card space-y-7">
      {/* City Header Card */}
      <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 group">
        <img
          src={cityData.heroImage}
          alt={cityName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/30 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                Destination {cityNum} • {cityData.state || 'India'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">{cityName}</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-crimson-700/90 text-white backdrop-blur-sm border border-crimson-500">
              {cityData.vibeTag || vibe}
            </span>
          </div>
          <p className="text-xs text-stone-200 mt-1 line-clamp-1">{cityData.tagline}</p>
        </div>
      </div>

      {/* 1. Multi-Modal Transit */}
      <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
        <TransitOptionsSection
          cityKey={cityKey}
          cityName={cityName}
          transitData={cityData.transit}
          selectedMode={selection.transitMode}
          selectedOptionId={selection.transitOptionId}
          onSelectTransitMode={handleTransitMode}
          onSelectOption={(id, price) => setSelection(prev => ({ ...prev, transitOptionId: id, transitPrice: price }))}
        />
      </div>

      {/* 2. Hotel Booking */}
      <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
        <HotelBookingSection
          hotels={cityData.hotels}
          selectedHotelId={selection.hotelId}
          onSelectHotel={(id, pricePerNight) => setSelection(prev => ({ ...prev, hotelId: id, hotelPricePerNight: pricePerNight }))}
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
