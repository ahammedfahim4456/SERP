import React, { useState } from 'react';
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
  const [hasSearched, setHasSearched] = useState(true);

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

  // Selection states for City A (Gokarna)
  const [cityASelection, setCityASelection] = useState({
    transitMode: 'train', // 'flight', 'bus', 'train'
    transitOptionId: INITIAL_CITIES.gokarna.transit.trains[0].id,
    transitPrice: INITIAL_CITIES.gokarna.transit.trains[0].roundTripPrice,
    hotelId: INITIAL_CITIES.gokarna.hotels[1].id,
    hotelPricePerNight: INITIAL_CITIES.gokarna.hotels[1].pricePerNight,
  });

  // Selection states for City B (Pondicherry)
  const [cityBSelection, setCityBSelection] = useState({
    transitMode: 'bus', // 'flight', 'bus', 'train'
    transitOptionId: INITIAL_CITIES.pondicherry.transit.buses[0].id,
    transitPrice: INITIAL_CITIES.pondicherry.transit.buses[0].roundTripPrice,
    hotelId: INITIAL_CITIES.pondicherry.hotels[1].id,
    hotelPricePerNight: INITIAL_CITIES.pondicherry.hotels[1].pricePerNight,
  });

  // Handle Enter Search
  const handleEnterSearch = () => {
    setIsLoadingSearch(true);
  };

  const handleFinishLoading = () => {
    setIsLoadingSearch(false);
    setHasSearched(true);
    // Smooth scroll to showdown
    const elem = document.getElementById('showdown-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToJourney = () => {
    const elem = document.getElementById('journey-details-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Math Calculations for City A (Gokarna)
  const nightsCount = journeyData.durationDays - 1;
  const daysCount = journeyData.durationDays;

  const cityAFoodTotal = INITIAL_CITIES.gokarna.estimatedDailyFood * daysCount;
  const cityAStayTotal = cityASelection.hotelPricePerNight * nightsCount;
  const cityATotal = cityASelection.transitPrice + cityAStayTotal + cityAFoodTotal;

  const cityAStats = {
    transitMode: cityASelection.transitMode.toUpperCase(),
    transitPrice: cityASelection.transitPrice,
    nightlyRate: cityASelection.hotelPricePerNight,
    stayTotal: cityAStayTotal,
    foodTotal: cityAFoodTotal,
    totalCost: cityATotal
  };

  // Math Calculations for City B (Pondicherry)
  const cityBFoodTotal = INITIAL_CITIES.pondicherry.estimatedDailyFood * daysCount;
  const cityBStayTotal = cityBSelection.hotelPricePerNight * nightsCount;
  const cityBTotal = cityBSelection.transitPrice + cityBStayTotal + cityBFoodTotal;

  const cityBStats = {
    transitMode: cityBSelection.transitMode.toUpperCase(),
    transitPrice: cityBSelection.transitPrice,
    nightlyRate: cityBSelection.hotelPricePerNight,
    stayTotal: cityBStayTotal,
    foodTotal: cityBFoodTotal,
    totalCost: cityBTotal
  };

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
        apiCreditsLeft={246}
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

      {/* 4. Loading (SerpAPI search step: Round trip, budget + ratings) */}
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
          />

          {/* 6. Traffic-Light Budget Meter & True Pocket Damage Showdown */}
          <BudgetComparatorSection
            userBudget={journeyData.budget}
            daysCount={daysCount}
            nightsCount={nightsCount}
            cityAStats={cityAStats}
            cityBStats={cityBStats}
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
