import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  MapPin,
  Users,
  Building,
  Languages,
  X
} from 'lucide-react';
import { parseTripPrompt, getCities } from '../services/api';

const DEFAULT_POPULAR_CITIES = [
  'Bengaluru', 'Chennai', 'Mumbai', 'New Delhi', 'Goa',
  'Pondicherry', 'Gokarna', 'Madurai', 'Hyderabad', 'Kolkata',
  'Mysuru', 'Coimbatore', 'Kochi', 'Jaipur', 'Varanasi', 'Ooty'
];

const PRESET_BUDGETS = [8000, 15000, 25000, 40000, 60000];

const QUICK_PROMPTS = [
  { label: "👨‍👩‍👧‍👦 Family (Chennai → Madurai ₹25k)", text: "2 adults, 2 kids, Chennai to Madurai, 3 days, ₹25k budget" },
  { label: "🎒 Friends (Mumbai → Goa ₹30k)", text: "4 friends, Mumbai to Goa, 4 days, ₹30k budget" },
  { label: "🌿 தமிழ் (Coimbatore → Ooty)", text: "கோயம்புத்தூரிலிருந்து ஊட்டிக்கு 2 பேர், 2 நாட்கள், 10000 ரூபாய் பட்ஜெட்" },
  { label: "🏰 हिंदी (Delhi → Jaipur)", text: "2 वयस्क, दिल्ली से जयपुर, 3 दिन, ₹15000 बजट" },
];

export default function JourneyDetails({
  journeyData,
  onChangeJourney,
  onEnterSearch,
  isLoading
}) {
  const [availableCities, setAvailableCities] = useState(DEFAULT_POPULAR_CITIES);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeAiPlan, setActiveAiPlan] = useState(null);

  // Load cities from backend API on mount
  useEffect(() => {
    getCities()
      .then(res => {
        if (res?.cities?.length > 0) {
          const names = res.cities.map(c => c.displayName);
          setAvailableCities(Array.from(new Set([...names, ...DEFAULT_POPULAR_CITIES])));
        }
      })
      .catch(() => {
        // Fallback to default popular list
      });
  }, []);

  // Ensure destinations array exists in journeyData
  const destinations = journeyData.destinations && journeyData.destinations.length > 0
    ? journeyData.destinations
    : [journeyData.cityA || 'Gokarna', journeyData.cityB || 'Pondicherry'];

  // Handle adding a destination city (N cities supported)
  const handleAddDestination = () => {
    const unused = availableCities.find(c => c !== journeyData.origin && !destinations.includes(c)) || 'Goa';
    const newDestinations = [...destinations, unused];
    onChangeJourney({
      ...journeyData,
      destinations: newDestinations,
      cityA: newDestinations[0] || 'Gokarna',
      cityB: newDestinations[1] || newDestinations[0] || 'Pondicherry',
    });
  };

  // Handle removing a destination city
  const handleRemoveDestination = (index) => {
    if (destinations.length <= 1) return; // Keep at least one destination
    const newDestinations = destinations.filter((_, idx) => idx !== index);
    onChangeJourney({
      ...journeyData,
      destinations: newDestinations,
      cityA: newDestinations[0] || 'Gokarna',
      cityB: newDestinations[1] || newDestinations[0] || 'Pondicherry',
    });
  };

  // Handle editing a specific destination city
  const handleUpdateDestination = (index, value) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    onChangeJourney({
      ...journeyData,
      destinations: newDestinations,
      cityA: newDestinations[0] || 'Gokarna',
      cityB: newDestinations[1] || newDestinations[0] || 'Pondicherry',
    });
  };

  // Handle date changes and auto-sync duration
  const handleStartDateChange = (newStart) => {
    let newEnd = journeyData.endDate;
    if (newStart && newEnd && newStart > newEnd) {
      // Push end date forward
      const d = new Date(newStart);
      d.setDate(d.getDate() + Math.max(1, journeyData.durationDays || 3));
      newEnd = d.toISOString().split('T')[0];
    }
    const days = calculateDays(newStart, newEnd) || journeyData.durationDays;
    onChangeJourney({
      ...journeyData,
      startDate: newStart,
      endDate: newEnd,
      durationDays: days,
    });
  };

  const handleEndDateChange = (newEnd) => {
    const days = calculateDays(journeyData.startDate, newEnd) || journeyData.durationDays;
    onChangeJourney({
      ...journeyData,
      endDate: newEnd,
      durationDays: Math.max(1, days),
    });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 3;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // AI Prompt Parsing -> Directly update journey AND directly trigger search
  const handleApplyAiPrompt = async (customText) => {
    const textToParse = customText || aiPrompt;
    if (!textToParse.trim() || isParsing) return;
    setIsParsing(true);

    try {
      const parsed = await parseTripPrompt(textToParse);

      // Determine destinations from AI response
      let parsedDestinations = [];
      if (parsed.destinations && parsed.destinations.length > 0) {
        parsedDestinations = parsed.destinations;
      } else if (parsed.destination?.displayName) {
        parsedDestinations = [parsed.destination.displayName];
        // If user already had a second destination, keep or add a comparator
        if (destinations.length > 1 && destinations[1] !== parsed.destination.displayName) {
          parsedDestinations.push(destinations[1]);
        }
      } else {
        parsedDestinations = destinations;
      }

      const updatedJourney = {
        ...journeyData,
        origin: parsed.origin?.displayName || journeyData.origin,
        destinations: parsedDestinations,
        cityA: parsedDestinations[0] || 'Gokarna',
        cityB: parsedDestinations[1] || parsedDestinations[0] || 'Pondicherry',
        budget: parsed.budget || journeyData.budget,
        durationDays: parsed.dates?.durationDays || journeyData.durationDays,
        travelers: (parsed.party?.adults || 1) + (parsed.party?.children || 0),
        startDate: parsed.dates?.startDate || journeyData.startDate,
        endDate: parsed.dates?.endDate || journeyData.endDate,
      };

      // 1. Update state
      onChangeJourney(updatedJourney);

      // 2. Set persistent active plan (NO cooldown / NO setTimeout!)
      setActiveAiPlan({
        prompt: textToParse,
        lang: parsed.detectedLanguage || 'en',
        parsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // 3. Directly apply and trigger search immediately!
      if (typeof onEnterSearch === 'function') {
        onEnterSearch(updatedJourney);
      }
    } catch (err) {
      console.error('Failed to parse AI prompt:', err);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <section id="journey-details-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Container Box */}
      <div className="sandal-card p-6 sm:p-8 bg-gradient-to-b from-white/95 to-sandal-50/90 border border-sandal-300 shadow-sandal-card">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-sandal-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-crimson-600"></span>
              <span className="text-xs uppercase font-extrabold tracking-widest text-crimson-800">
                Step 1: User Travel Details & Comparator Setup
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Configure Cities, Travel Dates & Budget
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Add any number of destination cities to compare in real time via SerpApi and Gemini AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full AI Travel Assistant Active</span>
            </span>
          </div>
        </div>

        {/* ─── AI Natural Language Planner Bar (Tracks 1, 4, 5) ─── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-sandal-100/90 border-2 border-emerald-300/80 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Trip Planner — Type Naturally (English / தமிழ் / हिंदी)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <Languages className="w-3.5 h-3.5 text-emerald-700" />
              <span>Auto-detects language & executes search</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyAiPrompt()}
              placeholder="e.g. 2 adults, 2 kids, Chennai to Madurai, 3 days, ₹25k budget (or in தமிழ் / हिंदी)"
              className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none shadow-inner"
            />
            <button
              onClick={() => handleApplyAiPrompt()}
              disabled={isParsing || !aiPrompt.trim()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer shrink-0"
            >
              {isParsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isParsing ? 'Parsing & Searching...' : 'AI Auto-Fill & Search'}</span>
            </button>
          </div>

          {/* Quick Preset Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-emerald-200/60">
            <span className="text-[11px] font-bold text-stone-500">Quick Test Prompts:</span>
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiPrompt(p.text);
                  handleApplyAiPrompt(p.text);
                }}
                className="text-xs bg-white hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg border border-stone-200 transition-all font-medium shadow-2xs cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Persistent Active AI Plan Banner (NO Cooldown, Stays Permanently) */}
          {activeAiPlan && (
            <div className="mt-3 p-3 bg-white/95 border-2 border-emerald-400 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-xs text-stone-800">
                  <span className="font-bold text-emerald-900">
                    Active AI Plan ({activeAiPlan.lang.toUpperCase()}):
                  </span>{' '}
                  <span className="font-semibold text-stone-900">
                    {journeyData.origin} ➔ {destinations.join(' vs ')}
                  </span>{' '}
                  • {journeyData.durationDays} Days • {journeyData.travelers} Travelers •{' '}
                  <span className="font-bold text-crimson-800">
                    ₹{journeyData.budget.toLocaleString('en-IN')} Budget
                  </span>
                  <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Applied Directly to Search
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveAiPlan(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg transition-colors self-end sm:self-center"
                title="Dismiss AI summary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ─── Remodeled User Details Entry Section (Uncollapsed & Clean) ─── */}
        <div className="space-y-6 mb-8">
          
          {/* Row 1: Departing Origin & Total Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Origin City Card */}
            <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-crimson-700" />
                  <label className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Departing City (Origin)
                  </label>
                </div>
                <span className="text-[11px] font-semibold text-stone-500 bg-sandal-100 px-2 py-0.5 rounded-md">
                  Searchable API
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  list="popular-origins-list"
                  value={journeyData.origin}
                  onChange={(e) => onChangeJourney({ ...journeyData, origin: e.target.value })}
                  placeholder="Type or select departure city (e.g. Chennai, Bengaluru, Mumbai)"
                  className="w-full px-4 py-2.5 rounded-xl bg-sandal-50 border border-sandal-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:bg-white"
                />
                <datalist id="popular-origins-list">
                  {availableCities.map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>

              {/* Quick suggestions pills for origin */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-stone-400 font-medium">Quick Hubs:</span>
                {['Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad'].map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => onChangeJourney({ ...journeyData, origin: city })}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                      journeyData.origin === city
                        ? 'bg-crimson-700 text-white font-bold'
                        : 'bg-sandal-100 text-stone-700 hover:bg-sandal-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Budget Card */}
            <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-crimson-700" />
                  <label className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Total Travel Wallet / Budget
                  </label>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-crimson-800">
                    ₹{Number(journeyData.budget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="5000"
                max="80000"
                step="1000"
                value={journeyData.budget}
                onChange={(e) => onChangeJourney({ ...journeyData, budget: Number(e.target.value) })}
                className="w-full accent-crimson-700 cursor-pointer h-2 bg-sandal-200 rounded-lg"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-400 font-medium">Quick Presets:</span>
                {PRESET_BUDGETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onChangeJourney({ ...journeyData, budget: amt })}
                    className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium transition-all ${
                      journeyData.budget === amt
                        ? 'bg-crimson-700 text-white font-bold shadow-2xs'
                        : 'bg-sandal-100 text-stone-700 hover:bg-sandal-200 border border-sandal-200'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Destination Cities to Compare (N Cities Supported Dynamically!) */}
          <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-sandal-200">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-crimson-700" />
                  <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Destination Cities Comparator (Add N Cities)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Compare 2 or more destination cities side-by-side with live flights, transit, and hotel costs.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddDestination}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-crimson-50 hover:bg-crimson-100 text-crimson-800 border border-crimson-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Destination</span>
              </button>
            </div>

            {/* Destination inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {destinations.map((city, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-sandal-50/80 border border-sandal-300 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-extrabold text-stone-500 tracking-wider">
                      Destination {index + 1}
                    </span>
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDestination(index)}
                        className="text-stone-400 hover:text-crimson-700 p-1 rounded transition-colors"
                        title="Remove destination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    list={`city-list-${index}`}
                    value={city}
                    onChange={(e) => handleUpdateDestination(index, e.target.value)}
                    placeholder="Enter city name (e.g. Goa, Madurai, Ooty)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-sandal-300 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-crimson-600"
                  />
                  <datalist id={`city-list-${index}`}>
                    {availableCities.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>

                  {/* Suggestion pill shortcut */}
                  <div className="flex flex-wrap gap-1">
                    {['Goa', 'Pondicherry', 'Madurai', 'Gokarna', 'Ooty'].filter(c => c !== city).slice(0, 3).map(sugg => (
                      <button
                        key={sugg}
                        type="button"
                        onClick={() => handleUpdateDestination(index, sugg)}
                        className="text-[10px] bg-white hover:bg-sandal-200 text-stone-600 px-1.5 py-0.5 rounded border border-sandal-200"
                      >
                        {sugg}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Editable Travel Dates & Party Travelers (NO Event Selection!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Travel Dates Picker */}
            <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-crimson-700" />
                  <label className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Travel Dates (Editable)
                  </label>
                </div>
                <span className="text-[11px] font-bold text-crimson-800 bg-crimson-50 px-2 py-0.5 rounded-md border border-crimson-200">
                  {journeyData.durationDays} Days / {Math.max(1, journeyData.durationDays - 1)} Nights
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs text-stone-500 block mb-1 font-medium">Departure Date</label>
                  <input
                    type="date"
                    value={journeyData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sandal-50 border border-sandal-300 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-crimson-600"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1 font-medium">Return Date</label>
                  <input
                    type="date"
                    value={journeyData.endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-sandal-50 border border-sandal-300 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-crimson-600"
                  />
                </div>
              </div>
            </div>

            {/* Party & Travelers Card */}
            <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-crimson-700" />
                  <label className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                    Travelers / Party Size
                  </label>
                </div>
                <span className="text-base font-extrabold text-stone-900">
                  {journeyData.travelers || 1} Person{journeyData.travelers > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[1, 2, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChangeJourney({ ...journeyData, travelers: num })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      journeyData.travelers === num
                        ? 'bg-crimson-700 text-white shadow-sm'
                        : 'bg-sandal-50 text-stone-700 hover:bg-sandal-100 border border-sandal-200'
                    }`}
                  >
                    {num === 1 ? 'Solo (1)' : num === 2 ? 'Couple / 2' : 'Group (4+)'}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-stone-500 italic pt-1">
                SerpApi queries will automatically multiply per-passenger train, bus and flight tickets accordingly.
              </p>
            </div>

          </div>

        </div>

        {/* ─── Search Execution Action Bar ─── */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sandal-200">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>
              Real-Time Engines: <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">google_flights</code>,{' '}
              <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">google_hotels</code>,{' '}
              <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">tripadvisor</code>,{' '}
              <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">gemini-3.8-flash</code>
            </span>
          </div>

          <button
            onClick={() => onEnterSearch(journeyData)}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 hover:from-crimson-800 hover:to-crimson-950 text-white font-extrabold text-base shadow-xl shadow-crimson-900/30 hover:shadow-crimson-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running Real-Time Comparison...</span>
              </>
            ) : (
              <>
                <span>Compare Real Costs ({destinations.length} Cities)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
