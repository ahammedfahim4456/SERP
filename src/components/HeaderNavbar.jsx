import React from 'react';
import { Compass, Sparkles, User, Key, ShieldCheck, Flame } from 'lucide-react';

export default function HeaderNavbar({ currentUser, onOpenAuth, onOpenCredits, apiCreditsLeft = 246 }) {
  return (
    <header className="sticky top-0 z-40 bg-sandal-50/90 backdrop-blur-md border-b border-sandal-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-crimson-800 to-crimson-600 flex items-center justify-center text-white shadow-md shadow-crimson-900/20 ring-2 ring-crimson-200/50">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-2xl text-stone-900 tracking-tight">
                True<span className="text-crimson-700">Trip</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-crimson-100 text-crimson-800 border border-crimson-200">
                SerpApi 2026
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">True Trip Cost & Local Vibe Comparator</p>
          </div>
        </div>

        {/* Center Hackathon Highlight */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-sandal-100 border border-sandal-300 text-xs text-stone-700">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-stone-900">SerpApi India Hackathon:</span>
          <span>Travel & Local Discovery</span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          
          {/* SerpApi Credit Counter */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-sandal-200 shadow-sm text-xs">
            <Key className="w-3.5 h-3.5 text-crimson-600" />
            <span className="text-stone-500 font-medium">SerpApi Credits:</span>
            <span className="font-bold text-stone-900">{apiCreditsLeft}/250</span>
          </div>

          {/* Credits & Flow Diagram Button */}
          <button
            onClick={onOpenCredits}
            className="text-xs font-semibold text-stone-600 hover:text-crimson-800 px-3 py-1.5 rounded-xl hover:bg-sandal-100 transition-colors"
          >
            Team Credits
          </button>

          {/* Login / User Status */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sandal-200/70 hover:bg-sandal-200 text-stone-800 border border-sandal-300 transition-all font-medium text-xs sm:text-sm shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-crimson-700 text-white flex items-center justify-center text-xs font-bold">
              {currentUser.avatarText}
            </div>
            <span className="hidden sm:inline">{currentUser.name}</span>
            <span className="text-stone-400 text-xs">▼</span>
          </button>

        </div>

      </div>
    </header>
  );
}
