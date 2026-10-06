import React from 'react';
import { Compass, Layers } from 'lucide-react';
import { HACKATHON_CREDITS } from '../data/mockData';

export default function EndCreditsSection({ onOpenArchDiagram }) {
  return (
    <footer id="credits-section" className="bg-gradient-to-b from-sandal-100 to-sandal-200 border-t border-sandal-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Banner */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-sandal-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-crimson-800 text-white flex items-center justify-center shadow-lg shadow-crimson-900/20">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-2xl text-stone-900">
                  True<span className="text-crimson-700">Trip</span>
                </span>
                <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-crimson-100 text-crimson-800 border border-crimson-200">
                  Hackathon 2026
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium mt-0.5">
                {HACKATHON_CREDITS.eventName} • {HACKATHON_CREDITS.track}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenArchDiagram}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-sandal-300 hover:border-crimson-600 text-stone-800 font-bold text-xs shadow-sm hover:shadow transition-all"
            >
              <Layers className="w-4 h-4 text-crimson-700" />
              <span>View User Architecture Diagram</span>
            </button>
          </div>
        </div>

        {/* 5-Member Hackathon Team Roles */}
        <div>
          <h3 className="font-serif font-bold text-lg text-stone-900 mb-4 flex items-center gap-2">
            <span>5-Member Development Team Breakdown</span>
            <span className="text-xs font-normal text-stone-500 font-sans">(As outlined in Complete.md)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {HACKATHON_CREDITS.team.map((t, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/90 border border-sandal-300 shadow-sm space-y-1 hover:border-crimson-400 transition-all"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-crimson-700 font-mono">
                  {t.role.split(' ')[0]} {t.role.split(' ')[1]}
                </div>
                <div className="font-bold text-xs text-stone-900">
                  {t.role.replace(/Member \d /, '')}
                </div>
                <div className="text-[11px] text-stone-600 leading-snug">
                  {t.task}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack & Submission Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-sandal-300 text-xs text-stone-600">
          <div>
            <h4 className="font-bold text-stone-900 mb-2 uppercase tracking-wide text-[11px]">
              Technology & API Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {HACKATHON_CREDITS.techStack.map((tech, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-sandal-50 text-stone-800 border border-sandal-300 font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-stone-900 mb-1 uppercase tracking-wide text-[11px]">
              Compliance & Submission
            </h4>
            <p>
              Submission Deadline: <strong>{HACKATHON_CREDITS.deadline}</strong>.
            </p>
            <p className="text-stone-500">
              Meets all 5 hackathon tracks criteria with full SerpApi multi-engine coverage (flights, hotels, events, local) & Gemini Dual AI Persona debate.
            </p>
          </div>
        </div>

        {/* Copyright & Sign-off */}
        <div className="text-center pt-4 text-xs text-stone-500 font-medium">
          Crafted with sandalwood warmth and crimson passion for Indian travelers. © 2026 TrueTrip.
        </div>

      </div>
    </footer>
  );
}
