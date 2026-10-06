import React from 'react';
import { ArrowRight, CheckCircle2, Award } from 'lucide-react';

export default function HeroSection({ onScrollToJourney }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14 px-4 sm:px-6 lg:px-8 border-b border-sandal-200">
      
      {/* Background Sandalwood Texture & Subtle Warm Glow */}
      <div className="absolute inset-0 sandal-paper-texture opacity-70 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-crimson-200/40 via-sandal-300/30 to-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto text-center space-y-6">

        {/* Hackathon Track Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-crimson-50 border border-crimson-200/80 shadow-sm">
          <Award className="w-4 h-4 text-crimson-700" />
          <span className="text-xs font-bold text-crimson-800 tracking-wide uppercase">
            SerpApi India Hackathon 2026 • Travel & Local Discovery Track
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight leading-[1.15]">
          Stop opening 15 browser tabs.<br />
          Discover the <span className="text-crimson-700 underline decoration-crimson-300 decoration-wavy decoration-2">True Trip Math</span> & Weekend Vibe.
        </h1>

        {/* Subtitle addressing the core problem from complete.md */}
        <p className="max-w-3xl mx-auto text-stone-600 text-base sm:text-lg leading-relaxed font-normal">
          Most travel apps trick you with cheap ₹3,500 flights, only for you to get stung by ₹6,000/night hotels and ₹1,500 dinners. 
          We pull live <span className="font-semibold text-stone-800">Flights, Trains, Buses, Verified Stays, Local Eats & Live Gigs</span> via SerpApi to calculate your pocket reality upfront.
        </p>

        {/* Value Matrix Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandal-100 border border-sandal-300 text-xs text-stone-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-crimson-700" />
            <span>Side-by-Side City Showdown</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandal-100 border border-sandal-300 text-xs text-stone-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-crimson-700" />
            <span>Traffic-Light Budget Meter</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandal-100 border border-sandal-300 text-xs text-stone-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-crimson-700" />
            <span>Live google_events for exact dates</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sandal-100 border border-sandal-300 text-xs text-stone-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-crimson-700" />
            <span>Dual AI Chatbots (Budget CA vs Local Scout)</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4 flex items-center justify-center gap-4">
          <button
            onClick={onScrollToJourney}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-crimson-700 to-crimson-800 hover:from-crimson-800 hover:to-crimson-900 text-white font-bold text-base shadow-xl shadow-crimson-900/25 hover:shadow-crimson-900/35 hover:-translate-y-0.5 transition-all"
          >
            <span>Start Destination Comparator</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}
