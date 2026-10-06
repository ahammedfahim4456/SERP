import React from 'react';
import { Hotel, Star, Check, ShieldCheck, MapPin, Wifi, Coffee } from 'lucide-react';

export default function HotelBookingSection({
  hotels,
  selectedHotelId,
  onSelectHotel,
  nightsCount,
  userBudget
}) {
  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-wider text-crimson-800">
            Hotel Booking
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sandal-200 text-stone-700">
            google_hotels
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Within User Budget</span>
        </div>
      </div>

      {/* Hotel Cards */}
      <div className="space-y-3">
        {hotels.map((hotel) => {
          const isSelected = selectedHotelId === hotel.id;
          const totalStayCost = hotel.pricePerNight * nightsCount;
          const budgetPercentage = Math.round((totalStayCost / userBudget) * 100);

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
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                          {hotel.name}
                        </h4>
                        <div className="text-[11px] text-stone-500 mt-0.5">{hotel.type}</div>
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
                      {hotel.amenities.map((amenity, idx) => (
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
                      {isSelected ? 'Booked' : 'Select Stay'}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
