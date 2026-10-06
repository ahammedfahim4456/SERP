import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Key, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, currentUser, onSelectUser }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('team'); // 'team' or 'custom'
  const [customName, setCustomName] = useState('');
  const [customOrigin, setCustomOrigin] = useState('Bengaluru');

  const TEAM_PROFILES = [
    { id: 'guest', name: 'Explorer Guest', role: 'Weekend Traveler', avatarText: 'EG', origin: 'Bengaluru' },
    { id: 'm1', name: 'Member 1 (Flight Scout)', role: 'google_flights module', avatarText: 'M1', origin: 'Bengaluru' },
    { id: 'm2', name: 'Member 2 (Stay Finder)', role: 'google_hotels module', avatarText: 'M2', origin: 'Chennai' },
    { id: 'm3', name: 'Member 3 (Local Discovery)', role: 'google_events & local', avatarText: 'M3', origin: 'Pune' },
    { id: 'm4', name: 'Member 4 (Budget CA & AI)', role: 'Gemini Dual Bots', avatarText: 'M4', origin: 'Mumbai' },
    { id: 'm5', name: 'Member 5 (UI & Lead)', role: 'Full Stack & Submission', avatarText: 'M5', origin: 'Hyderabad' }
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onSelectUser({
      id: 'custom-' + Date.now(),
      name: customName,
      role: 'Registered Traveler',
      avatarText: customName.substring(0, 2).toUpperCase(),
      origin: customOrigin
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-sandal-50 rounded-2xl border border-sandal-300 shadow-2xl overflow-hidden">
        
        {/* Header with Sandalwood & Crimson styling */}
        <div className="px-6 py-5 bg-gradient-to-r from-sandal-200 to-sandal-100 border-b border-sandal-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-700 text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">User Authentication & Profile</h3>
              <p className="text-xs text-stone-600">Login / Loading Screen Architecture Step</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-sandal-300/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Persona quick switch */}
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-2">
              Select Fast Login Persona
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {TEAM_PROFILES.map((p) => {
                const isSelected = currentUser.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectUser(p);
                      onClose();
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-crimson-50 border-crimson-600 ring-2 ring-crimson-500/20'
                        : 'bg-white border-sandal-200 hover:border-sandal-400 hover:bg-sandal-100/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-crimson-700 text-white' : 'bg-sandal-200 text-stone-700'
                    }`}>
                      {p.avatarText}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-stone-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{p.role}</div>
                      <div className="text-[10px] text-crimson-700 font-medium">📍 {p.origin}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Traveler Sign In */}
          <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-sandal-200">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-2">
              Or Custom Sign-In (Simulated Auth)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name (e.g. Priya Sharma)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sandal-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-stone-800 placeholder-stone-400"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Home City (e.g. Bengaluru)"
                  value={customOrigin}
                  onChange={(e) => setCustomOrigin(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-sandal-300 text-sm focus:outline-none focus:ring-2 focus:ring-crimson-600 focus:border-transparent text-stone-800 placeholder-stone-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white font-semibold text-sm shadow-md shadow-crimson-800/20 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          </form>

          {/* SerpApi Environment Notice */}
          <div className="p-3 rounded-xl bg-sandal-100 border border-sandal-200 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-crimson-700" />
              <span>Sandbox Mode: SerpApi 250 Free Credits Active</span>
            </div>
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
