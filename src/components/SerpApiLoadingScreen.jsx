import React, { useEffect, useState } from 'react';
import { Plane, Bus, Train, Hotel, Calendar, Sparkles, CheckCircle2, ShieldCheck, Database } from 'lucide-react';

export default function SerpApiLoadingScreen({ onFinishLoading, journeyData }) {
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    {
      id: 'flights',
      icon: Plane,
      engine: 'google_flights',
      title: 'Scraping Roundtrip Flight Fares',
      detail: `Searching BLR -> GOX / PNY for ${journeyData.startDate} to ${journeyData.endDate}...`,
    },
    {
      id: 'bus_train',
      icon: Train,
      engine: 'intercity_transit & irctc',
      title: 'Comparing Volvo Buses & Express Trains',
      detail: 'Benchmarking sleeper bus routes and Vande Bharat 3A tariffs...',
    },
    {
      id: 'hotels',
      icon: Hotel,
      engine: 'google_hotels',
      title: 'Filtering Stays Within User Budget',
      detail: `Matching rating > 4.5★ under ₹${Math.round(journeyData.budget * 0.4)} stay allowance...`,
    },
    {
      id: 'events',
      icon: Calendar,
      engine: 'google_events & google_local',
      title: 'Gathering Live Events & Street Reality Food',
      detail: 'Extracting live music gigs, flea markets & top authentic cafes...',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            onFinishLoading();
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 100));

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-fadeIn">
      <div className="sandal-card p-8 bg-white border border-sandal-300 shadow-2xl relative overflow-hidden">
        
        {/* Subtle Sandalwood background shimmer */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-crimson-100/40 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            <span>SerpAPI Search Step: Round trip, budget + ratings</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            Querying Live Travel Data
          </h3>
          <p className="text-xs sm:text-sm text-stone-500">
            Synchronizing live fares and ratings from SerpApi for <span className="font-semibold text-stone-800">{journeyData.origin} ➔ Gokarna vs Pondicherry</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-stone-600 mb-2">
            <span>Aggregating Multi-Modal Engine Data...</span>
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
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
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
                        : isActive
                        ? 'bg-crimson-700 text-white animate-pulse'
                        : 'bg-sandal-200 text-stone-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {step.title}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-crimson-700 mt-0.5">
                      engine: {step.engine}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                      {step.detail}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Skip button for fast preview */}
        <div className="text-center pt-2">
          <button
            onClick={onFinishLoading}
            className="text-xs font-semibold text-stone-500 hover:text-crimson-800 underline decoration-dotted transition-colors"
          >
            Skip Animation & View Destination Showdown ➔
          </button>
        </div>

      </div>
    </div>
  );
}
