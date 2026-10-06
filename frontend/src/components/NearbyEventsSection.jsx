import React from 'react';
import { Calendar, MapPin, Star } from 'lucide-react';

export default function NearbyEventsSection({ events, localFood, cityName }) {
  return (
    <div className="space-y-6">
      
      {/* 1. Live Events Section (google_events) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
              Live Weekend Events
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sandal-200 text-stone-700">
              google_events
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Happening on your travel dates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl bg-white border border-sandal-200 shadow-sm hover:border-sandal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-crimson-700 mb-1">
                  <span className="bg-crimson-50 px-2 py-0.5 rounded-md border border-crimson-100">
                    {evt.category}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {evt.entry}
                  </span>
                </div>

                <h5 className="font-bold text-xs text-stone-900 line-clamp-2 mt-1">
                  {evt.title}
                </h5>

                <div className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                  <span className="truncate">{evt.date}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-sandal-100 text-[10px] text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                <span className="truncate">{evt.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Street Reality Local Eats (google_local) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
              Street Reality Local Eats
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sandal-200 text-stone-700">
              google_local
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Budget joints locals actually love</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {localFood.map((spot) => (
            <div
              key={spot.id}
              className="p-3.5 rounded-xl bg-white border border-sandal-200 shadow-sm hover:border-sandal-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <h5 className="font-bold text-xs text-stone-900 line-clamp-1">{spot.name}</h5>
                  <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span>{spot.rating}</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                  {spot.cuisine}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-sandal-100 flex items-center justify-between text-[11px]">
                <span className="text-stone-400 truncate max-w-[120px]">{spot.location}</span>
                <span className="font-bold text-stone-900 bg-sandal-100 px-2 py-0.5 rounded-md">
                  ~₹{spot.avgMealPrice}/meal
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
