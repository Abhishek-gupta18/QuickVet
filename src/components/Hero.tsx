import { ShieldCheck, HeartPulse, Home, Users, Star, Clock } from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { VetClinic } from '../types';

interface HeroProps {
  clinics: VetClinic[];
  userLocation: { lat: number; lng: number } | null;
  onSelectClinic: (id: string) => void;
  onNavigateToFind: () => void;
  onNavigateToEmergency: () => void;
}

export default function Hero({
  clinics,
  userLocation,
  onSelectClinic,
  onNavigateToFind,
  onNavigateToEmergency,
}: HeroProps) {
  return (
    <div className="relative bg-[#F4FBF3] min-h-[calc(100vh-80px)] flex items-center pt-6 pb-16 overflow-hidden">
      {/* Decorative Warm Pet Illustrations/Bubbles Background */}
      <div className="absolute top-1/2 left-[-150px] w-[500px] h-[500px] rounded-full bg-green-100/30 blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-[-100px] w-[400px] h-[400px] rounded-full bg-green-100/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Descriptive Left Side (5 or 6 Cols) */}
          <div className="lg:col-span-6 space-y-6 text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 text-xs font-bold leading-none select-none">
              <span>🚑</span> Urgent Help Available 24/7
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[52px] text-gray-900 tracking-tight leading-[1.1] text-balance">
              Find Trusted <span className="text-[#58B368]">Veterinary Care</span> Near You
            </h1>

            <p className="text-gray-600 text-lg font-normal max-w-xl leading-relaxed text-balance">
              Locate nearby veterinarians, request emergency assistance, and book home visits for your pets across India.
            </p>

            {/* Actions CTA buttons with brand-matched shadows */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
              <button
                onClick={onNavigateToFind}
                className="px-8 py-4 bg-[#58B368] hover:bg-green-600 active:scale-95 text-white font-extrabold rounded-2xl shadow-[0_10px_15px_-3px_rgba(88,179,104,0.3)] hover:shadow-[0_10px_20px_-3px_rgba(88,179,104,0.4)] transition-all text-center cursor-pointer text-base"
              >
                Find Nearby Vets
              </button>

              <button
                onClick={onNavigateToEmergency}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold rounded-2xl shadow-[0_10px_15px_-3px_rgba(47,133,90,0.3)] hover:shadow-[0_10px_20px_-3px_rgba(47,133,90,0.4)] transition-all text-center cursor-pointer text-base flex items-center justify-center gap-2"
              >
                <HeartPulse className="w-5 h-5 text-white animate-pulse" />
                Emergency Help
              </button>
            </div>

            {/* Aligned Geometric Balance stats counter links */}
            <div className="flex gap-6 pt-4 max-w-xl">
              <div className="flex flex-col">
                <span className="text-2.5xl font-black text-[#58B368] font-display">500+</span>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Verified Clinics</span>
              </div>
              <div className="w-[1.5px] bg-green-100/30 self-stretch my-1" />
              <div className="flex flex-col">
                <span className="text-2.5xl font-black text-[#4CAF50] font-display">10k+</span>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Pets Assisted</span>
              </div>
              <div className="w-[1.5px] bg-green-100/30 self-stretch my-1" />
              <div className="flex flex-col">
                <span className="text-2.5xl font-black text-[#BFE7C4] font-display">4.8★</span>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">User Rating</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 font-medium pl-1">
              Supports location auto-detection in Bangalore and regional cities.
            </p>
          </div>

          {/* Interactive OpenStreetMap preview right side (6 Cols) */}
          <div className="lg:col-span-6 relative h-[450px] lg:h-[520px] w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <InteractiveMap
              clinics={clinics}
              selectedClinicId={null}
              onSelectClinic={onSelectClinic}
              userLocation={userLocation}
              searchRadius={5}
              navigatingToClinicId={null}
            />

            {/* Overlay floating statistics cards */}
            <div className="absolute top-4 left-4 z-[999] pointer-events-none bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-green-100 shadow-lg flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-xl text-[#58B368]">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-gray-800 font-display">10,000+</span>
                <span className="text-[10px] text-gray-500 font-medium leading-none">Indian Pets Assisted</span>
              </div>
            </div>

            <div className="absolute top-20 right-4 z-[999] pointer-events-none bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-green-100 shadow-lg flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-xl text-[#4CAF50]">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-[#4CAF50] font-display">&lt;15 mins</span>
                <span className="text-[10px] text-gray-500 font-medium leading-none">Average Response</span>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-[999] pointer-events-none bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-lime-100 shadow-lg flex items-center gap-3">
              <div className="bg-lime-100 p-2 rounded-xl text-lime-500">
                <Star className="w-5 h-5 fill-lime-500" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-gray-800 font-display">4.8 ★ Rating</span>
                <span className="text-[10px] text-gray-500 font-medium leading-none font-sans">Highly Certified Clinic Care</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

