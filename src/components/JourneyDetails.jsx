import React from 'react';
import { Calendar, Wallet, Users, Compass, Sparkles, MapPin, ArrowRight, RefreshCw } from 'lucide-react';

export default function JourneyDetails({
  journeyData,
  onChangeJourney,
  onEnterSearch,
  isLoading
}) {
  const PRESET_BUDGETS = [8000, 15000, 25000, 40000];
  const POPULAR_ORIGINS = ['Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune'];

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
                Step 1: Journey Details
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Configure Your Showdown & Wallet
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Interactive sentence bar & side branches: Dates & Budget
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600 bg-sandal-100 px-3 py-1.5 rounded-xl border border-sandal-300">
              ⚡ Multi-Modal: Flights + Bus + Train
            </span>
          </div>
        </div>

        {/* 1. Mad-Libs Natural Sentence Bar (As specified in complete.md line 233-237) */}
        <div className="p-5 rounded-2xl bg-sandal-100/90 border border-sandal-300 mb-8 leading-loose text-base sm:text-lg text-stone-800 font-medium">
          <span className="text-stone-500">I am departing from </span>
          <select
            value={journeyData.origin}
            onChange={(e) => onChangeJourney({ ...journeyData, origin: e.target.value })}
            className="inline-block bg-white text-crimson-800 font-bold px-3 py-1 rounded-xl border border-sandal-300 shadow-sm mx-1 focus:ring-2 focus:ring-crimson-600 outline-none text-sm sm:text-base cursor-pointer"
          >
            {POPULAR_ORIGINS.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <span className="text-stone-500"> with a total budget of </span>
          <span className="inline-block bg-crimson-700 text-white font-bold px-3 py-1 rounded-xl shadow-sm mx-1 text-sm sm:text-base">
            ₹{journeyData.budget.toLocaleString('en-IN')}
          </span>

          <span className="text-stone-500"> for </span>
          <select
            value={journeyData.durationDays}
            onChange={(e) => onChangeJourney({ ...journeyData, durationDays: Number(e.target.value) })}
            className="inline-block bg-white text-stone-900 font-bold px-3 py-1 rounded-xl border border-sandal-300 shadow-sm mx-1 focus:ring-2 focus:ring-crimson-600 outline-none text-sm sm:text-base cursor-pointer"
          >
            <option value={2}>2 Days / 1 Night (Quick Weekend)</option>
            <option value={3}>3 Days / 2 Nights (Long Weekend)</option>
            <option value={4}>4 Days / 3 Nights (Extended Holiday)</option>
            <option value={5}>5 Days / 4 Nights (Deep Exploration)</option>
          </select>

          <span className="text-stone-500"> looking for </span>
          <select
            value={journeyData.vibe}
            onChange={(e) => onChangeJourney({ ...journeyData, vibe: e.target.value })}
            className="inline-block bg-white text-stone-900 font-bold px-3 py-1 rounded-xl border border-sandal-300 shadow-sm mx-1 focus:ring-2 focus:ring-crimson-600 outline-none text-sm sm:text-base cursor-pointer"
          >
            <option value="Beach & Cliffs">🏖️ Beach & Cliffs</option>
            <option value="Heritage & Cafes">☕ French Quarters & Heritage Cafes</option>
            <option value="Budget Backpacking">🎒 Budget Backpacking & Hostels</option>
            <option value="Nightlife & Events">🎉 Live Music & Nightlife</option>
          </select>

          <span className="text-stone-500">. Compare </span>
          <span className="inline-block bg-sandal-200/90 text-crimson-900 font-extrabold px-3 py-1 rounded-xl border border-sandal-300 mx-1 text-sm sm:text-base">
            Gokarna
          </span>
          <span className="text-stone-500"> vs </span>
          <span className="inline-block bg-sandal-200/90 text-crimson-900 font-extrabold px-3 py-1 rounded-xl border border-sandal-300 mx-1 text-sm sm:text-base">
            Pondicherry
          </span>
          <span className="text-stone-500">!</span>
        </div>

        {/* 2. Side Branches: Date & User Budget Controls (as per user architecture diagram) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Branch 1: Travel Date Picker */}
          <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-crimson-700" />
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Side Branch: Travel Dates
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-stone-500 bg-sandal-100 px-2 py-0.5 rounded-md">
                google_events synced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-stone-500 block mb-1 font-medium">Departure Date</label>
                <input
                  type="date"
                  value={journeyData.startDate}
                  onChange={(e) => onChangeJourney({ ...journeyData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-sandal-50 border border-sandal-300 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-crimson-600"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1 font-medium">Return Date</label>
                <input
                  type="date"
                  value={journeyData.endDate}
                  onChange={(e) => onChangeJourney({ ...journeyData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-sandal-50 border border-sandal-300 text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-crimson-600"
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-500 italic">
              SerpApi will automatically filter live concerts, flea markets and night events for these exact travel dates.
            </p>
          </div>

          {/* Branch 2: User Budget Slider & Presets */}
          <div className="p-5 rounded-2xl bg-white border border-sandal-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-crimson-700" />
                <h3 className="font-bold text-sm text-stone-900 uppercase tracking-wide">
                  Side Branch: User Total Budget
                </h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-crimson-800">
                  ₹{journeyData.budget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="pt-2">
              <input
                type="range"
                min="5000"
                max="50000"
                step="1000"
                value={journeyData.budget}
                onChange={(e) => onChangeJourney({ ...journeyData, budget: Number(e.target.value) })}
                className="w-full accent-crimson-700 cursor-pointer h-2 bg-sandal-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-1">
                <span>₹5,000 (Shoestring)</span>
                <span>₹25,000 (Comfort)</span>
                <span>₹50,000+ (Luxury)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-stone-500 font-medium">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_BUDGETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onChangeJourney({ ...journeyData, budget: amt })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      journeyData.budget === amt
                        ? 'bg-crimson-700 text-white shadow-sm'
                        : 'bg-sandal-100 text-stone-700 hover:bg-sandal-200 border border-sandal-200'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 3. The "Enter Button" (as per user architecture diagram) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-sandal-200">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Targeting SerpApi engines: <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">google_flights</code>, <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">google_hotels</code>, <code className="bg-sandal-100 px-1 py-0.5 rounded text-stone-800">google_events</code></span>
          </div>

          <button
            onClick={onEnterSearch}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-crimson-700 via-crimson-800 to-crimson-900 hover:from-crimson-800 hover:to-crimson-950 text-white font-extrabold text-base shadow-xl shadow-crimson-900/30 hover:shadow-crimson-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running SerpApi Search Step...</span>
              </>
            ) : (
              <>
                <span>Enter / Run SerpApi Comparator</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
