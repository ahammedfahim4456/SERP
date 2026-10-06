import React, { useState } from 'react';
import { Star, ShieldCheck, Check, Building2, Home, Compass } from 'lucide-react';

export default function HotelBookingSection({
  hotels = [],
  selectedHotelId,
  onSelectHotel,
  nightsCount,
  userBudget,
  cityName,
  tripadvisorRecommendations = []
}) {
  const [stayFilter, setStayFilter] = useState('all'); // 'all', 'hotel', 'rental'

  const filteredHotels = hotels.filter((hotel) => {
    if (stayFilter === 'hotel') {
      return hotel.kind === 'hotel' || (!hotel.kind && !hotel.type?.toLowerCase().includes('rental') && !hotel.type?.toLowerCase().includes('cottage') && !hotel.type?.toLowerCase().includes('villa'));
    }
    if (stayFilter === 'rental') {
      return hotel.kind === 'rental' || hotel.type?.toLowerCase().includes('rental') || hotel.type?.toLowerCase().includes('cottage') || hotel.type?.toLowerCase().includes('villa') || hotel.type?.toLowerCase().includes('airbnb');
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
            Stays & Vacation Homes
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sandal-200 text-stone-700">
            google_hotels & rentals
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Within User Budget</span>
        </div>
      </div>

      {/* Segregation Filter: All vs Hotels vs Airbnb/Homes */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-sandal-100 border border-sandal-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setStayFilter('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
            stayFilter === 'all'
              ? 'bg-crimson-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          All Stays ({hotels.length})
        </button>
        <button
          type="button"
          onClick={() => setStayFilter('hotel')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            stayFilter === 'hotel'
              ? 'bg-crimson-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Hotels</span>
        </button>
        <button
          type="button"
          onClick={() => setStayFilter('rental')}
          className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
            stayFilter === 'rental'
              ? 'bg-crimson-700 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Homes & Airbnbs</span>
        </button>
      </div>

      {/* TripAdvisor Budget Recommendation Banner */}
      {tripadvisorRecommendations.length > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>TripAdvisor Recommendation ({cityName})</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 font-bold">
              engine: tripadvisor
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {tripadvisorRecommendations.slice(0, 2).map((rec, i) => (
              <div key={i} className="p-2 rounded-lg bg-white border border-emerald-100 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 truncate">{rec.title}</span>
                  <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span>{rec.rating}</span>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{rec.badge}</div>
                <div className="text-[11px] text-stone-600 mt-1 line-clamp-1">{rec.note || rec.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel / Vacation Rental Cards */}
      <div className="space-y-3">
        {filteredHotels.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500 bg-white rounded-2xl border border-sandal-200">
            No properties found matching this stay filter.
          </div>
        ) : (
          filteredHotels.map((hotel) => {
            const isSelected = selectedHotelId === hotel.id;
            const totalStayCost = hotel.pricePerNight * nightsCount;
            const budgetPercentage = Math.round((totalStayCost / userBudget) * 100);
            const isRental =
              hotel.kind === 'rental' ||
              hotel.type?.toLowerCase().includes('rental') ||
              hotel.type?.toLowerCase().includes('cottage') ||
              hotel.type?.toLowerCase().includes('villa') ||
              hotel.type?.toLowerCase().includes('airbnb');

            return (
              <div
                key={hotel.id}
                onClick={() => onSelectHotel(hotel.id, hotel.pricePerNight)}
                className={`rounded-2xl border overflow-hidden transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-crimson-600 ring-2 ring-crimson-500/20 shadow-md'
                    : 'border-sandal-200 hover:border-sandal-400 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Thumbnail Image */}
                  <div className="sm:w-36 h-32 sm:h-auto relative shrink-0 overflow-hidden bg-stone-100">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-bold">
                      {hotel.serpRank}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                              {hotel.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isRental
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'bg-sandal-100 text-stone-700'
                              }`}
                            >
                              {isRental ? '🏡 Airbnb / Homestay' : '🏨 Hotel'}
                            </span>
                            <span className="text-[11px] text-stone-500 truncate">{hotel.type}</span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-bold text-stone-800">{hotel.rating}</span>
                          <span className="text-[10px] text-stone-400">({hotel.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {hotel.amenities?.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-sandal-100 text-stone-600 border border-sandal-200"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing footer */}
                    <div className="mt-3 pt-2 border-t border-sandal-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-stone-500">
                          ₹{hotel.pricePerNight.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px]">/ night</span>
                        </div>
                        <div className="text-xs font-bold text-stone-800">
                          Total {nightsCount} nights: ₹{totalStayCost.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] text-stone-400 font-normal">
                            ({budgetPercentage}% of budget)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-crimson-700 text-white'
                            : 'bg-sandal-100 text-stone-700 hover:bg-sandal-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        {isSelected ? 'Selected' : 'Select Stay'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
