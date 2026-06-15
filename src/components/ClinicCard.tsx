import { Star, MapPin, Phone, Compass, CalendarPlus, Heart, MessageSquare, AlertCircle } from 'lucide-react';
import { VetClinic } from '../types';
import { calculateHaversineDistance } from '../data';

export default function ClinicCard(props: any) {
  const {
    clinic,
    isSelected,
    isFavorite,
    userLocation,
    onSelect,
    onBook,
    onNavigate,
    onWriteReview,
    onToggleFavorite,
    isNavigating,
  } = props;
  // Compute distance using the Haversine formula
  const distance = userLocation
    ? calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude)
    : null;

  return (
    <div
      onClick={() => onSelect(clinic.id)}
      className={`group relative flex flex-col md:flex-row gap-5 p-5 rounded-3xl bg-white border cursor-pointer hover:shadow-xl transition-all duration-300 md:items-center ${
        isSelected
          ? 'border-[#58B368] ring-2 ring-[#58B368]/20 shadow-[#58B368]/5'
          : 'border-green-50/50 hover:border-[#58B368]/40 shadow-sm'
      }`}
    >
      {/* Clinic Poster Image */}
      <div className="relative w-full md:w-44 h-36 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={clinic.imageUrl}
          alt={clinic.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Badges on overlay image */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {clinic.hasEmergency && (
            <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-0.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Emergency 24x7
            </span>
          )}
          {clinic.hasHomeVisit && (
            <span className="bg-[#4CAF50] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-0.5 shadow-md">
              Home Doc
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(clinic.id);
          }}
          className={`absolute top-2.5 right-2 text-slate-800 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border hover:scale-110 active:scale-95 transition-all shadow-sm ${
            isFavorite 
              ? 'text-emerald-500 border-emerald-100 bg-emerald-50' 
              : 'text-gray-400 border-gray-100 hover:text-emerald-500'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4.5 h-4.5 ${isFavorite ? 'fill-emerald-500 text-emerald-500' : ''}`} />
        </button>
      </div>

      {/* Details Container */}
      <div className="flex-grow space-y-2 text-left">
        <div className="flex flex-wrap items-center justify-between gap-1">
          <h3 className="font-display font-bold text-lg md:text-xl text-gray-900 group-hover:text-[#58B368] transition-colors leading-tight line-clamp-1">
            {clinic.name}
          </h3>
          
          <div className="flex items-center gap-1.5 bg-lime-50 border border-lime-100/50 py-0.5 px-2 rounded-lg">
            <Star className="w-4 h-4 fill-lime-400 text-lime-400" />
            <span className="text-xs font-black text-gray-800">{clinic.rating}</span>
            <span className="text-[10px] text-gray-400">({clinic.reviewsCount})</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 font-normal line-clamp-2 md:line-clamp-1 leading-relaxed">
          {clinic.description}
        </p>

        {/* Location Specs Row */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-green-400" />
            <span className="font-semibold text-gray-700">{clinic.area}, {clinic.city}</span>
          </span>

          {distance !== null && (
            <span className="bg-[#58B368]/10 text-[#58B368] font-bold px-1.5 py-0.5 rounded-md text-[11px] select-none">
              📍 {distance} km away
            </span>
          )}

          <span className="text-slate-300">|</span>
          
          <span className={`font-semibold ${clinic.isOpenNow ? 'text-green-600' : 'text-emerald-500'}`}>
            {clinic.isOpenNow ? '● Open Now' : '● Closed'} ({clinic.workingHours})
          </span>
        </div>

        {/* Specialists & Key Services */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {clinic.specialists.map((spec) => (
            <span
              key={spec}
              className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/45 text-[10px] font-bold text-gray-600 select-none uppercase tracking-wide"
            >
              🐾 {spec} Specialist
            </span>
          ))}

          {clinic.services.slice(0, 3).map((serv) => (
            <span
              key={serv}
              className="px-2 py-0.5 rounded-lg bg-green-50/50 border border-green-100/30 text-[10px] font-semibold text-gray-500"
            >
              {serv}
            </span>
          ))}
          {clinic.services.length > 3 && (
            <span className="text-[10px] text-gray-400 font-bold pl-1">+{clinic.services.length - 3} more</span>
          )}
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onBook(clinic)}
            className="flex items-center gap-1 px-3.5 py-2 bg-[#58B368] hover:bg-green-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-green-100 transition-all cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Book Visit</span>
          </button>

          <button
            onClick={() => onNavigate(isNavigating ? null : clinic.id)}
            className={`flex items-center gap-1 px-3.5 py-2 rounded-xl font-bold text-xs border active:scale-95 transition-all cursor-pointer ${
              isNavigating 
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
            }`}
            title="Calculate routing lines from you on the map"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isNavigating ? 'Cancel Routing' : 'Navigate'}</span>
          </button>

          <a
            href={`tel:${clinic.phone}`}
            className="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>Call Now</span>
          </a>

          <button
            onClick={() => onWriteReview(clinic.id)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer ml-auto"
          >
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span>Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}

