import React from 'react';
import { Plane, Bus, Train, Clock, Check, AlertCircle } from 'lucide-react';

export default function TransitOptionsSection({
  cityKey,
  cityName,
  transitData,
  selectedMode,
  selectedOptionId,
  onSelectTransitMode,
  onSelectOption
}) {
  const flightsList = transitData?.flights || [];
  const busesList = transitData?.buses || [];
  const trainsList = transitData?.trains || [];

  const modes = [
    { key: 'flight', label: 'Flight Options', icon: Plane, count: flightsList.length },
    { key: 'bus', label: 'Intercity Bus', icon: Bus, count: busesList.length },
    { key: 'train', label: 'Express Train', icon: Train, count: trainsList.length }
  ];

  const currentList =
    selectedMode === 'flight'
      ? flightsList
      : selectedMode === 'bus'
      ? busesList
      : trainsList;

  return (
    <div className="space-y-4">
      
      {/* Subheader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
            Multi-Modal Transit
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sandal-200 text-stone-700">
            google_flights & transit
          </span>
        </div>
        <span className="text-xs text-stone-500 font-medium">Roundtrip Per Person</span>
      </div>

      {/* 3 Tab Mode Switcher: Flight / Bus / Train */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-sandal-100 border border-sandal-200">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = selectedMode === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onSelectTransitMode(m.key)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-crimson-700 text-white shadow-sm shadow-crimson-900/20'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{m.label} ({m.count})</span>
            </button>
          );
        })}
      </div>

      {/* Transit Options List */}
      <div className="space-y-2.5">
        {currentList && currentList.length > 0 ? (
          currentList.map((item) => {
            const isSelected = selectedOptionId === item.id;
            const price = Number(item.roundTripPrice || 0);

            return (
              <div
                key={item.id}
                onClick={() => onSelectOption(item.id, price)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-crimson-600 ring-2 ring-crimson-500/20 shadow-md'
                    : 'bg-white/70 border-sandal-200 hover:border-sandal-400 hover:bg-white'
                }`}
              >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-stone-900">
                      {item.airline || item.name || item.operator}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-crimson-100 text-crimson-800">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                    <span>{item.route || item.class || item.type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {item.duration}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-400 mt-1">
                    Dep: <span className="text-stone-700 font-semibold">{item.departure}</span> ➔ Arr:{' '}
                    <span className="text-stone-700 font-semibold">{item.arrival}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-extrabold text-stone-900">
                    ₹{price.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-stone-500">roundtrip</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-crimson-700 text-white'
                          : 'bg-sandal-100 text-stone-600 hover:bg-sandal-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : null}
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })
        ) : (
          <div className="p-4 rounded-xl bg-sandal-50 border border-sandal-200 text-center space-y-2">
            <p className="text-xs text-stone-600 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>No direct {selectedMode}s found for this route.</span>
            </p>
            <div className="flex justify-center gap-2 pt-1">
              {busesList.length > 0 && selectedMode !== 'bus' && (
                <button
                  type="button"
                  onClick={() => onSelectTransitMode('bus')}
                  className="px-3 py-1 bg-white hover:bg-sandal-100 text-crimson-800 border border-sandal-300 rounded-lg text-xs font-bold shadow-2xs transition-all"
                >
                  Switch to Buses ({busesList.length})
                </button>
              )}
              {trainsList.length > 0 && selectedMode !== 'train' && (
                <button
                  type="button"
                  onClick={() => onSelectTransitMode('train')}
                  className="px-3 py-1 bg-white hover:bg-sandal-100 text-crimson-800 border border-sandal-300 rounded-lg text-xs font-bold shadow-2xs transition-all"
                >
                  Switch to Trains ({trainsList.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
