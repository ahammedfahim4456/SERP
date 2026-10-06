import React from 'react';
import { X, Layers, ArrowDown } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const FLOW_ITEMS = [
    { name: '1. Login / loading screen', type: 'UI Screen', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    { name: '2. Hero section', type: 'UI Screen', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    { 
      name: '3. Journey details', 
      type: 'UI Screen', 
      branches: ['Side Branch: Travel Date', 'Side Branch: User Budget in ₹'],
      color: 'bg-purple-100 text-purple-900 border-purple-300' 
    },
    { name: '4. Enter button', type: 'UI Screen (Trigger)', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    { name: '5. Loading (Round trip, budget + ratings)', type: 'SerpAPI Search Step', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { 
      name: '6. Transit Multi-Modal Options', 
      type: 'SerpAPI Search Step', 
      branches: ['Flight options (google_flights)', 'Bus options (intercity sleeper)', 'Train options (irctc/express)'],
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300' 
    },
    { name: '7. Hotel booking (Within user budget)', type: 'SerpAPI Search Step (google_hotels)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { name: '8. Nearby events & Street Reality Eats', type: 'SerpAPI Search Step (google_events & google_local)', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    { name: '9. Client testimonials', type: 'UI Screen', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    { name: '10. End credits', type: 'UI Screen', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-sandal-50 rounded-2xl border border-sandal-300 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sandal-200 to-sandal-100 border-b border-sandal-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-crimson-700 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                User Architecture Flow Implementation
              </h3>
              <p className="text-[11px] text-stone-600">
                Directly mapped from your sketch in <code className="text-crimson-800">user architechture.jpeg</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-sandal-300/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-white border-b border-sandal-200 flex items-center gap-4 text-xs font-semibold shrink-0">
          <span className="text-stone-500">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500 inline-block"></span>
            <span className="text-stone-800">Purple = UI Screen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
            <span className="text-stone-800">Green = SerpAPI search step</span>
          </div>
        </div>

        {/* Diagram Flow Content */}
        <div className="p-6 overflow-y-auto space-y-3">
          {FLOW_ITEMS.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              
              {/* Node Card */}
              <div className={`w-full p-3.5 rounded-xl border text-center shadow-sm ${item.color}`}>
                <div className="font-bold text-xs sm:text-sm">{item.name}</div>
                <div className="text-[10px] opacity-75 font-mono uppercase mt-0.5">{item.type}</div>

                {/* Sub-branches if present */}
                {item.branches && (
                  <div className="mt-2 pt-2 border-t border-current/20 flex flex-wrap justify-center gap-2">
                    {item.branches.map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/70 shadow-2xs"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Connecting arrow if not last */}
              {idx < FLOW_ITEMS.length - 1 && (
                <div className="my-1 text-stone-400">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-sandal-100 border-t border-sandal-200 text-center shrink-0">
          <p className="text-xs text-stone-600">
            ✅ All 10 workflow stages and side branches are fully interactive in this React application.
          </p>
        </div>

      </div>
    </div>
  );
}
