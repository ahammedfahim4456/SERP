import React, { useState, useEffect } from 'react';
import HeaderNavbar from './components/HeaderNavbar';
import AuthModal from './components/AuthModal';
import HeroSection from './components/HeroSection';
import JourneyDetails from './components/JourneyDetails';
import SerpApiLoadingScreen from './components/SerpApiLoadingScreen';
import DestinationShowdown from './components/DestinationShowdown';
import BudgetComparatorSection from './components/BudgetComparatorSection';
import DualAiChatbotSection from './components/DualAiChatbotSection';
import ClientTestimonialsSection from './components/ClientTestimonialsSection';
import EndCreditsSection from './components/EndCreditsSection';
import ArchitectureModal from './components/ArchitectureModal';
import { INITIAL_CITIES } from './data/mockData';
import { getUsage } from './services/api';

export default function App() {
  // Current user state (simulated auth)
  const [currentUser, setCurrentUser] = useState({
    id: 'm5',
    name: 'Member 5 (UI & Lead)',
    role: 'Full Stack & Submission',
    avatarText: 'M5',
    origin: 'Bengaluru'
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [apiCreditsUsed, setApiCreditsUsed] = useState(0);

  // Live data from the backend (null = use mock data)
  const [liveData, setLiveData] = useState(null);

  // Journey parameters
  const [journeyData, setJourneyData] = useState({
    origin: 'Bengaluru',
    cityA: 'Gokarna',
    cityB: 'Pondicherry',
    startDate: '2026-10-11',
    endDate: '2026-10-14',
    durationDays: 3,
    budget: 15000,
    vibe: 'Beach & Cliffs',
    travelers: 1
  });

  // Fetch usage on mount
  useEffect(() => {
    getUsage()
      .then(d => setApiCreditsUsed(d.serpapiCallsThisMonth || 0))
      .catch(() => {});
  }, [hasSearched]);

  // Build the display data: live API data or mock
  const cityADisplay = liveData ? buildCityDisplay(liveData.cityAData, journeyData.cityA) : INITIAL_CITIES.gokarna;
  const cityBDisplay = liveData ? buildCityDisplay(liveData.cityBData, journeyData.cityB) : INITIAL_CITIES.pondicherry;

  // Selection states for City A
  const [cityASelection, setCityASelection] = useState({
    transitMode: 'train',
    transitOptionId: INITIAL_CITIES.gokarna.transit.trains[0].id,
    transitPrice: INITIAL_CITIES.gokarna.transit.trains[0].roundTripPrice,
    hotelId: INITIAL_CITIES.gokarna.hotels[1].id,
    hotelPricePerNight: INITIAL_CITIES.gokarna.hotels[1].pricePerNight,
  });

  // Selection states for City B
  const [cityBSelection, setCityBSelection] = useState({
    transitMode: 'bus',
    transitOptionId: INITIAL_CITIES.pondicherry.transit.buses[0].id,
    transitPrice: INITIAL_CITIES.pondicherry.transit.buses[0].roundTripPrice,
    hotelId: INITIAL_CITIES.pondicherry.hotels[1].id,
    hotelPricePerNight: INITIAL_CITIES.pondicherry.hotels[1].pricePerNight,
  });

  // Handle Enter Search
  const handleEnterSearch = () => {
    setIsLoadingSearch(true);
  };

  const handleFinishLoading = (result) => {
    setIsLoadingSearch(false);
    setHasSearched(true);

    if (result && result.cityAData && result.cityBData) {
      setLiveData(result);
      const selA = getInitialSelection(buildCityDisplay(result.cityAData, journeyData.cityA));
      const selB = getInitialSelection(buildCityDisplay(result.cityBData, journeyData.cityB));
      if (selA) setCityASelection(selA);
      if (selB) setCityBSelection(selB);
    }
    // else: null result = user skipped, keep mock data

    // Smooth scroll to showdown
    setTimeout(() => {
      const elem = document.getElementById('showdown-section');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToJourney = () => {
    const elem = document.getElementById('journey-details-section');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  // Math Calculations
  const nightsCount = journeyData.durationDays - 1;
  const daysCount = journeyData.durationDays;

  const cityAStats = calculateStats(
    cityASelection,
    liveData ? 500 : INITIAL_CITIES.gokarna.estimatedDailyFood,
    daysCount,
    nightsCount
  );
  const cityBStats = calculateStats(
    cityBSelection,
    liveData ? 550 : INITIAL_CITIES.pondicherry.estimatedDailyFood,
    daysCount,
    nightsCount
  );

  return (
    <div className="min-h-screen bg-sandal-50 text-stone-900 selection:bg-crimson-600 selection:text-white">
      
      {/* 1. Header & Navigation with credit counter & auth */}
      <HeaderNavbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCredits={() => {
          const el = document.getElementById('credits-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        apiCreditsLeft={90 - apiCreditsUsed}
      />

      {/* 2. Hero Section */}
      <HeroSection onScrollToJourney={scrollToJourney} />

      {/* 3. Journey Details (with side branches: Date, User budget, & Enter button) */}
      <JourneyDetails
        journeyData={journeyData}
        onChangeJourney={setJourneyData}
        onEnterSearch={handleEnterSearch}
        isLoading={isLoadingSearch}
      />

      {/* 4. Loading (SerpAPI search step: Real API calls) */}
      {isLoadingSearch && (
        <SerpApiLoadingScreen
          journeyData={journeyData}
          onFinishLoading={handleFinishLoading}
        />
      )}

      {/* 5. Destination Showdown (Transit: Flight / Bus / Train, Hotels, Nearby Events) */}
      {hasSearched && (
        <>
          <DestinationShowdown
            journeyData={journeyData}
            cityASelection={cityASelection}
            setCityASelection={setCityASelection}
            cityBSelection={cityBSelection}
            setCityBSelection={setCityBSelection}
            cityADisplay={cityADisplay}
            cityBDisplay={cityBDisplay}
            isLiveData={!!liveData}
          />

          {/* 6. Traffic-Light Budget Meter & True Pocket Damage Showdown */}
          <BudgetComparatorSection
            userBudget={journeyData.budget}
            daysCount={daysCount}
            nightsCount={nightsCount}
            cityAStats={cityAStats}
            cityBStats={cityBStats}
            cityAName={liveData ? journeyData.cityA : 'Gokarna'}
            cityBName={liveData ? journeyData.cityB : 'Pondicherry'}
          />

          {/* 7. Dual AI Chatbot Debate (Rohan CA vs Maya Scout via Gemini) */}
          <DualAiChatbotSection
            cityAStats={cityAStats}
            cityBStats={cityBStats}
            userBudget={journeyData.budget}
            originCity={journeyData.origin}
          />

          {/* 8. Client Testimonials */}
          <ClientTestimonialsSection />
        </>
      )}

      {/* 9. End Credits */}
      <EndCreditsSection onOpenArchDiagram={() => setIsArchOpen(true)} />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
      />

      <ArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />

    </div>
  );
}


// ─── Transform backend response → frontend shape ──────────────────────────
function buildCityDisplay(data, cityName) {
  const flights = transformFlights(data.flights);
  const hotels = transformHotels(data.hotels);
  const transit = transformTransit(data.transit);

  return {
    name: cityName,
    state: '',
    tagline: data.flights?.cached || data.hotels?.cached ? '⚡ Cached result' : '🌐 Fresh from SerpApi',
    vibeTag: '🔴 Live',
    heroImage: 'https://images.unsplash.com/photo-1620619767323-b95a89183081?auto=format&fit=crop&w=800&q=80',
    estimatedDailyFood: 500,
    transit: {
      flights,
      trains: transit.filter(t => t._mode === 'train'),
      buses: transit.filter(t => t._mode === 'bus'),
    },
    hotels,
    events: [],  // events not fetched currently
    localFood: [], // food not fetched currently
    tripadvisorRecommendations: (data.tripadvisor?.recommendations || []).map(r => ({
      title: r.title,
      category: r.category || 'Top Recommendation',
      rating: r.rating || 4.7,
      reviews: r.reviewCount || 1000,
      badge: 'TripAdvisor Verified',
      note: r.description || `Recommended highlight in ${cityName}`,
    })),
  };
}

function transformFlights(resp) {
  if (!resp || !resp.options) return [];
  return resp.options.map((opt, i) => ({
    id: `fl_live_${i}`,
    airline: opt.airline || 'Unknown Airline',
    route: opt.segments?.map(s => `${s.fromAirport || '?'} → ${s.toAirport || '?'}`).join(' → ') || '–',
    departure: opt.segments?.[0]?.departureTime || '–',
    arrival: opt.segments?.[opt.segments.length - 1]?.arrivalTime || '–',
    duration: `${Math.floor(opt.totalDurationMinutes / 60)}h ${opt.totalDurationMinutes % 60}m`,
    roundTripPrice: opt.price || 0,
    stops: opt.stops === 0 ? 'Non-stop' : `${opt.stops} stop${opt.stops > 1 ? 's' : ''}`,
    badge: opt.category === 'best' ? '⭐ Best Option' : null,
    isCheapest: i === 0,
  }));
}

function transformHotels(resp) {
  if (!resp || !resp.options) return [];
  return resp.options.map((opt, i) => ({
    id: opt.id || `ht_live_${i}`,
    name: opt.name,
    kind: opt.kind || (opt.type?.toLowerCase().includes('rental') ? 'rental' : 'hotel'),
    type: opt.kind === 'rental' ? 'Vacation Rental / Homestay' : `${opt.starClass || ''}★ Hotel`.trim(),
    rating: opt.rating || 0,
    reviewsCount: opt.reviewCount || 0,
    pricePerNight: opt.pricePerNight || 0,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    amenities: opt.amenities?.slice(0, 4) || opt.features?.map(f => f.replace(/_/g, ' ')) || [],
    badge: opt.labels?.[0] || opt.deal || (opt.score >= 70 ? '🔥 High Score' : null),
    serpRank: `#${i + 1} SerpApi`,
    totalPrice: opt.totalPrice,
    score: opt.score,
    reasons: opt.reasons || [],
    coordinates: opt.coordinates,
    website: opt.website,
  }));
}

function transformTransit(resp) {
  if (!resp || !resp.options) return [];
  return resp.options.map((opt, i) => {
    const mode = opt.mainMode || (opt.legs?.[0]?.mode) || 'other';
    const isTrain = mode === 'train' || mode === 'rail';
    return {
      id: `tr_live_${i}`,
      _mode: isTrain ? 'train' : 'bus',
      name: opt.legs?.map(l => l.title).join(' → ') || 'Transit Option',
      operator: opt.legs?.[0]?.operator || opt.legs?.[0]?.title || '–',
      class: mode,
      type: mode,
      departure: opt.departureTime || '–',
      arrival: opt.arrivalTime || '–',
      duration: opt.durationMinutes ? `${Math.floor(opt.durationMinutes / 60)}h ${opt.durationMinutes % 60}m` : '–',
      roundTripPrice: opt.fare ? Math.round(opt.fare * 2) : 0,
      badge: i === 0 ? 'Recommended' : null,
      isCheapest: i === 0,
    };
  });
}

function getInitialSelection(cityDisplay) {
  const flight = cityDisplay.transit.flights[0];
  const train = cityDisplay.transit.trains[0];
  const transit = flight ? { mode: 'flight', opt: flight } : train ? { mode: 'train', opt: train } : null;
  if (!transit) return null;
  return {
    transitMode: transit.mode,
    transitOptionId: transit.opt.id,
    transitPrice: transit.opt.roundTripPrice,
    hotelId: cityDisplay.hotels[0]?.id || '',
    hotelPricePerNight: cityDisplay.hotels[0]?.pricePerNight || 0,
  };
}

function calculateStats(selection, dailyFood, daysCount, nightsCount) {
  const foodTotal = dailyFood * daysCount;
  const stayTotal = selection.hotelPricePerNight * nightsCount;
  return {
    transitMode: selection.transitMode.toUpperCase(),
    transitPrice: selection.transitPrice,
    nightlyRate: selection.hotelPricePerNight,
    stayTotal,
    foodTotal,
    totalCost: selection.transitPrice + stayTotal + foodTotal,
  };
}
