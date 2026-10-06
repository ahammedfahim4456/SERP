import React from 'react';
import { Quote, Star, CheckCircle, Heart, Users } from 'lucide-react';
import { TESTIMONIALS } from '../data/mockData';

export default function ClientTestimonialsSection() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-sandal-200">
      
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-100 text-crimson-800 text-xs font-bold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5" />
          <span>Client Testimonials</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900">
          Loved by Weekend Escapers & Backpacker Gangs
        </h2>
        <p className="text-xs sm:text-sm text-stone-600">
          Real feedback from travelers who eliminated tab paralysis and saved actual rupees.
        </p>
      </div>

      {/* Testimonials Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="sandal-card p-6 bg-white border border-sandal-200 shadow-sm flex flex-col justify-between hover:border-crimson-300 transition-all"
          >
            <div>
              {/* Top Row: Stars + Savings Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                </div>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {t.savings}
                </span>
              </div>

              {/* Quote */}
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-6">
                "{t.comment}"
              </p>
            </div>

            {/* Author Footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-sandal-100">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-crimson-200"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                  {t.name}
                </div>
                <div className="text-[11px] text-stone-500 truncate">{t.location}</div>
                <div className="text-[10px] text-crimson-700 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t.verified}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
}
