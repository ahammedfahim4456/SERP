import React, { useState } from 'react';
import TransitOptionsSection from './TransitOptionsSection';
import HotelBookingSection from './HotelBookingSection';
import NearbyEventsSection from './NearbyEventsSection';
import { INITIAL_CITIES } from '../data/mockData';
import { Sparkles, MapPin, Compass, ArrowRight } from 'lucide-react';

export default function DestinationShowdown({
  journeyData,
  cityASelection,
  setCityASelection,
  cityBSelection,
  setCityBSelection,
}) {
  const [activeTab, setActiveTab] = useState('both'); // 'both', 'gokarna', 'pondicherry'
  const nightsCount = journeyData.durationDays - 1;
  const daysCount = journeyData.durationDays;

  const gokarna = INITIAL_CITIES.gokarna;
  const pondicherry = INITIAL_CITIES.pondicherry;

  return (
    <section id="showdown-section" className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Showdown Controls / View Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-sandal-200">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-crimson-800">
            Step 2: Live SerpApi Data Aggregation
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Destination Comparator: Gokarna vs Pondicherry
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Select transport modes & verified stays to simulate your personalized trip budget.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sandal-100 border border-sandal-300 text-xs font-bold">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'both' ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Side-by-Side (Both)
          </button>
          <button
            onClick={() => setActiveTab('gokarna')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'gokarna' ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Gokarna Focus
          </button>
          <button
            onClick={() => setActiveTab('pondicherry')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pondicherry' ? 'bg-crimson-700 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pondicherry Focus
          </button>
        </div>
      </div>

      {/* Grid for City A & City B */}
      <div className={`grid gap-8 ${activeTab === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* ===================== CITY A: GOKARNA ===================== */}
        {(activeTab === 'both' || activeTab === 'gokarna') && (
          <div className="sandal-card p-6 sm:p-7 bg-white/90 border border-sandal-300 shadow-sandal-card space-y-7">
            
            {/* City Header Card */}
            <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 group">
              <img
                src={gokarna.heroImage}
                alt="Gokarna Beach"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/30 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      Destination A • {gokarna.state}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold">{gokarna.name}</h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-crimson-700/90 text-white backdrop-blur-sm border border-crimson-500">
                    {gokarna.vibeTag}
                  </span>
                </div>
                <p className="text-xs text-stone-200 mt-1 line-clamp-1">{gokarna.tagline}</p>
              </div>
            </div>

            {/* 1. Multi-Modal Transit (Flights, Bus, Train) */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <TransitOptionsSection
                cityKey="gokarna"
                cityName="Gokarna"
                transitData={gokarna.transit}
                selectedMode={cityASelection.transitMode}
                selectedOptionId={cityASelection.transitOptionId}
                onSelectTransitMode={(mode) => {
                  const defaultOpt =
                    mode === 'flight'
                      ? gokarna.transit.flights[0]
                      : mode === 'bus'
                      ? gokarna.transit.buses[0]
                      : gokarna.transit.trains[0];
                  setCityASelection((prev) => ({
                    ...prev,
                    transitMode: mode,
                    transitOptionId: defaultOpt.id,
                    transitPrice: defaultOpt.roundTripPrice
                  }));
                }}
                onSelectOption={(id, price) => {
                  setCityASelection((prev) => ({
                    ...prev,
                    transitOptionId: id,
                    transitPrice: price
                  }));
                }}
              />
            </div>

            {/* 2. Hotel Booking (Within User Budget) */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <HotelBookingSection
                hotels={gokarna.hotels}
                selectedHotelId={cityASelection.hotelId}
                onSelectHotel={(id, pricePerNight) => {
                  setCityASelection((prev) => ({
                    ...prev,
                    hotelId: id,
                    hotelPricePerNight: pricePerNight
                  }));
                }}
                nightsCount={nightsCount}
                userBudget={journeyData.budget}
              />
            </div>

            {/* 3. Nearby Live Events & Street Reality Eats */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <NearbyEventsSection
                events={gokarna.events}
                localFood={gokarna.localFood}
                cityName="Gokarna"
              />
            </div>

          </div>
        )}

        {/* ===================== CITY B: PONDICHERRY ===================== */}
        {(activeTab === 'both' || activeTab === 'pondicherry') && (
          <div className="sandal-card p-6 sm:p-7 bg-white/90 border border-sandal-300 shadow-sandal-card space-y-7">
            
            {/* City Header Card */}
            <div className="relative rounded-2xl overflow-hidden h-44 sm:h-48 group">
              <img
                src={pondicherry.heroImage}
                alt="Pondicherry French Quarter"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/30 to-transparent"></div>
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      Destination B • {pondicherry.state}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold">{pondicherry.name}</h3>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-crimson-700/90 text-white backdrop-blur-sm border border-crimson-500">
                    {pondicherry.vibeTag}
                  </span>
                </div>
                <p className="text-xs text-stone-200 mt-1 line-clamp-1">{pondicherry.tagline}</p>
              </div>
            </div>

            {/* 1. Multi-Modal Transit (Flights, Bus, Train) */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <TransitOptionsSection
                cityKey="pondicherry"
                cityName="Pondicherry"
                transitData={pondicherry.transit}
                selectedMode={cityBSelection.transitMode}
                selectedOptionId={cityBSelection.transitOptionId}
                onSelectTransitMode={(mode) => {
                  const defaultOpt =
                    mode === 'flight'
                      ? pondicherry.transit.flights[0]
                      : mode === 'bus'
                      ? pondicherry.transit.buses[0]
                      : pondicherry.transit.trains[0];
                  setCityBSelection((prev) => ({
                    ...prev,
                    transitMode: mode,
                    transitOptionId: defaultOpt.id,
                    transitPrice: defaultOpt.roundTripPrice
                  }));
                }}
                onSelectOption={(id, price) => {
                  setCityBSelection((prev) => ({
                    ...prev,
                    transitOptionId: id,
                    transitPrice: price
                  }));
                }}
              />
            </div>

            {/* 2. Hotel Booking (Within User Budget) */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <HotelBookingSection
                hotels={pondicherry.hotels}
                selectedHotelId={cityBSelection.hotelId}
                onSelectHotel={(id, pricePerNight) => {
                  setCityBSelection((prev) => ({
                    ...prev,
                    hotelId: id,
                    hotelPricePerNight: pricePerNight
                  }));
                }}
                nightsCount={nightsCount}
                userBudget={journeyData.budget}
              />
            </div>

            {/* 3. Nearby Live Events & Street Reality Eats */}
            <div className="p-4 rounded-2xl bg-sandal-50 border border-sandal-200">
              <NearbyEventsSection
                events={pondicherry.events}
                localFood={pondicherry.localFood}
                cityName="Pondicherry"
              />
            </div>

          </div>
        )}

      </div>

    </section>
  );
}
