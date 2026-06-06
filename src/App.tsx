import { useState, useEffect } from 'react';
import { 
  Search, MapPin, SlidersHorizontal, Eye, Star, Check, Award, ArrowUpRight, 
  Sparkles, ShieldAlert, Heart, CalendarDays, ClipboardList, Info, HelpCircle
} from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InteractiveMap from './components/InteractiveMap';
import ClinicCard from './components/ClinicCard';
import BookingModal from './components/BookingModal';
import ReviewsModal from './components/ReviewsModal';
import EmergencyWidget from './components/EmergencyWidget';
import UserDashboard from './components/UserDashboard';
import VetDashboard from './components/VetDashboard';
import VetRegistrationModal from './components/VetRegistrationModal';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { VetClinic, Booking, EmergencyRequest, User, ClinicReview } from './types';
import { calculateHaversineDistance } from './data';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Global State Engine
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Database lists fetched from Express
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);

  // Modals Visibility triggers
  const [authModalType, setAuthModalType] = useState<'login' | 'signup' | null>(null);
  const [bookingClinic, setBookingClinic] = useState<VetClinic | null>(null);
  const [reviewsClinic, setReviewsClinic] = useState<VetClinic | null>(null);
  const [showVetRegisterModal, setShowVetRegisterModal] = useState<boolean>(false);

  // Search & Filtration States
  const [searchName, setSearchName] = useState<string>('');
  const [searchArea, setSearchArea] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(25); // in km (Range selection slider!)
  
  // Feature filters checklist
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [filterEmergency, setFilterEmergency] = useState<boolean>(false);
  const [filterHomeVisit, setFilterHomeVisit] = useState<boolean>(false);
  const [filterHighestRated, setFilterHighestRated] = useState<boolean>(false);
  const [filterSpecialist, setFilterSpecialist] = useState<string>('All'); // 'All' | 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Exotics'

  // Map control
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [navigatingToClinicId, setNavigatingToClinicId] = useState<string | null>(null);

  // On mount: Auto-detect user region location of Bengaluru
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation blocked. Defaulting coordinates hub to Bengaluru CBD (12.9716, 77.5946)...');
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    }

    // Try loads user session files from persistent storage
    const savedUser = localStorage.getItem('quickvet_user');
    const savedToken = localStorage.getItem('quickvet_token');
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setSessionToken(savedToken);
      } catch (err) {
        console.error('Session file parse fault:', err);
      }
    }
  }, []);

  // Fetch metrics data from Node/Express backend
  const pullConfiguration = async () => {
    try {
      const cRes = await fetch('/api/clinics');
      const cData = await cRes.json();
      setClinics(cData);

      const bRes = await fetch('/api/bookings');
      const bData = await bRes.json();
      setBookings(bData);

      const eRes = await fetch('/api/emergency');
      const eData = await eRes.json();
      setEmergencies(eData);
    } catch (err) {
      console.warn('Backend REST configuration failure. Make sure development server started.');
    }
  };

  useEffect(() => {
    pullConfiguration();
    // Poll updates every 6 seconds to track booking statuses and live emergency broad-networks immediately!
    const interval = setInterval(pullConfiguration, 6000);
    return () => clearInterval(interval);
  }, []);

  // Authentication controllers
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
    localStorage.setItem('quickvet_user', JSON.stringify(user));
    localStorage.setItem('quickvet_token', token);
    
    // Auto transfer to dashboard page based on role attributes
    if (user.role === 'veterinarian') {
      setActiveTab('vet_dashboard');
    } else {
      setActiveTab('user_dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem('quickvet_user');
    localStorage.removeItem('quickvet_token');
    setActiveTab('home');
  };

  // Add pet record handler for dashboards
  const handleAddPet = async (petData: any) => {
    try {
      const res = await fetch('/api/user/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
      });
      const updatedUser = await res.json();
      if (!res.ok) throw new Error();
      setCurrentUser(updatedUser);
      localStorage.setItem('quickvet_user', JSON.stringify(updatedUser));
    } catch (err) {
      alert('Fail saving pet checkup profile database.');
    }
  };

  // Save/Unsave Favorite clinic
  const handleToggleFavorite = async (clinicId: string) => {
    if (!currentUser) {
      setAuthModalType('login');
      return;
    }
    try {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, clinicId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      
      const updatedUser = { ...currentUser, favoriteClinics: data.favoriteClinics };
      setCurrentUser(updatedUser);
      localStorage.setItem('quickvet_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Error toggling favorite clinic:', err);
    }
  };

  // Create booking request integration
  const handleSubmitBooking = async (bookingPayload: any) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      if (!res.ok) throw new Error();
      await pullConfiguration();
    } catch (err) {
      throw err;
    }
  };

  // Save new veterinary clinic live mapping
  const handleSubmitVetRegistration = async (registrationPayload: any) => {
    try {
      const res = await fetch('/api/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload),
      });
      if (!res.ok) throw new Error();
      await pullConfiguration();
      
      // Auto upgrade logged-in user to link with this registered clinic if veterinarian
      if (currentUser && currentUser.role === 'veterinarian') {
        const createdClinic = await res.json();
        const updatedUser = { ...currentUser, clinicId: createdClinic.id };
        setCurrentUser(updatedUser);
        localStorage.setItem('quickvet_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      throw err;
    }
  };

  // Adjust Booking parameters status for Vets
  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await pullConfiguration();
    } catch (err) {
      console.error('Failed to change booking status:', err);
    }
  };

  // Adjust Emergency incident checks for Vets
  const handleUpdateEmergencyStatus = async (id: string, status: string, clinicId: string, clinicName: string) => {
    try {
      const res = await fetch(`/api/emergency/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, clinicId, clinicName }),
      });
      if (!res.ok) throw new Error();
      await pullConfiguration();
    } catch (err) {
      console.error('Failed to update emergency rescue status:', err);
    }
  };

  // Filter algorithmic query matching
  const filteredClinics = clinics.filter((clinic) => {
    // 1. Name query filter
    if (searchName && !clinic.name.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }

    // 2. Area neighborhood filters
    if (searchArea && !clinic.area.toLowerCase().includes(searchArea.toLowerCase())) {
      return false;
    }

    // 3. Open Now filters
    if (filterOpenNow && !clinic.isOpenNow) {
      return false;
    }

    // 4. Emergency capabilities filters
    if (filterEmergency && !clinic.hasEmergency) {
      return false;
    }

    // 5. Home Doc capabilities filters
    if (filterHomeVisit && !clinic.hasHomeVisit) {
      return false;
    }

    // 6. Rating status filter (>4.6 stars check)
    if (filterHighestRated && clinic.rating < 4.6) {
      return false;
    }

    // 7. Core specialized animals species selection tags
    if (filterSpecialist !== 'All' && !clinic.specialists.includes(filterSpecialist as any)) {
      return false;
    }

    // 8. Distance radius calculation verification!
    if (userLocation) {
      const dist = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        clinic.latitude,
        clinic.longitude
      );
      if (dist > searchRadius) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#FFF8F0] font-sans text-[#2D3748] flex flex-col">
      {/* 1. Navbar Sticky Widget */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(type) => setAuthModalType(type)}
      />

      <AnimatePresence mode="wait">
        {/* VIEW 1: HOME PAGE GRID VIEW */}
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow"
          >
            {/* HERO SECTION BLOCK */}
            <Hero
              clinics={clinics.slice(0, 5)}
              userLocation={userLocation}
              onSelectClinic={(id) => {
                setSelectedClinicId(id);
                setActiveTab('find_vets');
              }}
              onNavigateToFind={() => setActiveTab('find_vets')}
              onNavigateToEmergency={() => setActiveTab('emergency')}
            />

            {/* QUICK SEARCH SECTION CONTROLLER */}
            <section className="py-12 bg-[#FFF8F0]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white border border-black/5 rounded-3xl p-6 sm:p-8 shadow-md max-w-5xl mx-auto space-y-6">
                  
                  <div className="text-left space-y-1">
                    <h3 className="font-display font-black text-xl text-[#2D3748]">Quick Clinic Station Search</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure specific area metrics or species specialties</p>
                  </div>

                  {/* Search bar inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search Clinic Name..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full bg-slate-55 bg-slate-50 p-3.5 pl-11 border border-slate-100 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#FF914D] shadow-sm leading-none font-medium text-gray-800"
                      />
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#FF914D]" />
                      <select
                        value={searchArea}
                        onChange={(e) => setSearchArea(e.target.value)}
                        className="w-full bg-slate-55 bg-slate-50 p-3.5 pl-11 border border-slate-100 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#FF914D] shadow-sm h-[48px] font-semibold text-gray-800"
                      >
                        <option value="">All Areas (Bengaluru)</option>
                        <option value="Indiranagar">Indiranagar</option>
                        <option value="Domlur">Domlur</option>
                        <option value="Koramangala">Koramangala</option>
                        <option value="Whitefield">Whitefield</option>
                        <option value="JP Nagar">JP Nagar</option>
                        <option value="Hebbal">Hebbal</option>
                      </select>
                    </div>

                    {/* Radius Slider selection filter */}
                    <div className="bg-slate-50 p-2.5 px-4.5 border border-slate-100 rounded-2xl shadow-sm text-left flex flex-col justify-center">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 leading-none">
                        <span>Search Radius</span>
                        <span className="text-[#FF914D]">{searchRadius} km</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        step="2"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                        className="w-full mt-1.5 accent-[#FF914D] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Species specialized pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Species Focus:</span>
                    {['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Exotics'].map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setFilterSpecialist(spec)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          filterSpecialist === spec
                            ? 'bg-[#FF914D] text-white shadow-md'
                            : 'bg-white border border-slate-200/60 text-gray-600 hover:bg-slate-50'
                        }`}
                      >
                        {spec === 'All' ? '🐾 All Types' : `${spec} Specialist`}
                      </button>
                    ))}
                  </div>

                  {/* Filters Checklist buttons */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 font-bold uppercase tracking-[0.08em] text-[10px]">Filter Badges:</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filterOpenNow}
                        onChange={(e) => setFilterOpenNow(e.target.checked)}
                        className="rounded border-gray-300 text-[#FF914D] focus:ring-[#FF914D]"
                      />
                      <span>🟢 Open Now</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filterEmergency}
                        onChange={(e) => setFilterEmergency(e.target.checked)}
                        className="rounded border-gray-300 text-[#FF914D] focus:ring-[#FF914D]"
                      />
                      <span>🩹 Emergency Services (24x7)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filterHomeVisit}
                        onChange={(e) => setFilterHomeVisit(e.target.checked)}
                        className="rounded border-gray-300 text-[#FF914D] focus:ring-[#FF914D]"
                      />
                      <span>🏠 Home Visit Available</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={filterHighestRated}
                        onChange={(e) => setFilterHighestRated(e.target.checked)}
                        className="rounded border-gray-300 text-[#FF914D] focus:ring-[#FF914D]"
                      />
                      <span>⭐ Highest Rated</span>
                    </label>
                  </div>

                  {/* Search results notice */}
                  <div className="flex justify-between items-center text-xs text-gray-400 pt-1.5 border-t border-orange-50">
                    <span>Showing <b>{filteredClinics.length}</b> verified veterinary centers matching filters.</span>
                    <button
                      onClick={() => setActiveTab('find_vets')}
                      className="text-[#FF914D] font-bold hover:underline"
                    >
                      Maximize Map View →
                    </button>
                  </div>

                </div>
              </div>
            </section>

            {/* LIVE NEARBY VETS SECTION split layout */}
            <section className="py-16 bg-[#FFF8F0]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">Verified Veterinary Care Stations Near You</h2>
                  <p className="text-gray-500 text-sm max-w-2xl mx-auto">Click any clinic card below to schedule a checkup visit, review feedback stars, or plot real-time navigating paths on the map layer.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  {/* Left Column: Clinics list (7/12 cols) */}
                  <div className="lg:col-span-12 space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                    {filteredClinics.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-3xl border border-orange-50 space-y-2">
                        <span className="text-4xl block">🔍</span>
                        <h4 className="font-display font-bold text-gray-800 text-lg">No Clinics Found Mapping Selected filters</h4>
                        <p className="text-xs text-gray-400">Try widening your search radius range or turning off specific specialists checkboxes to explore regional options.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredClinics.map((clinic) => (
                          <ClinicCard
                            key={clinic.id}
                            clinic={clinic}
                            isSelected={selectedClinicId === clinic.id}
                            isFavorite={currentUser?.favoriteClinics?.includes(clinic.id) || false}
                            userLocation={userLocation}
                            onSelect={setSelectedClinicId}
                            onBook={(cl) => setBookingClinic(cl)}
                            onNavigate={(id) => setNavigatingToClinicId(id)}
                            onWriteReview={(id) => setReviewsClinic(clinic)}
                            onToggleFavorite={handleToggleFavorite}
                            isNavigating={navigatingToClinicId === clinic.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* EMERGENCY ASSISTANCE SECTION HOT BUTTON */}
            <EmergencyWidget
              currentUser={currentUser}
              onOpenAuth={(type) => setAuthModalType(type)}
            />

            {/* WHY CHOOSE QUICKVET cards grids with subtle animations */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2">
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Why Pet Parents Trust QuickVet</h3>
                  <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">Engineered to bypass localized chaos under medical emergencies, supporting fast health checks and direct doctor consults.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  
                  <div className="p-6 bg-[#FFF8F0] border border-orange-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF914D] flex items-center justify-center text-xl shadow-inner">
                      🐾
                    </div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Nearby Certified Clinics</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                      We catalog verified licensed clinical centers, veterinary ambulances, and specialty surgical theaters, plotting coordinates details accurately.
                    </p>
                  </div>

                  <div className="p-6 bg-red-50/30 border border-rose-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-500 flex items-center justify-center text-xl shadow-inner animate-pulse">
                      🚑
                    </div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Live Trauma Alerts</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                      One critical red-button triggers dynamic localized broadcasts, alerting regional ambulances or available practices with continuous client updates.
                    </p>
                  </div>

                  <div className="p-6 bg-green-50/30 border border-green-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-xl shadow-inner">
                      🏠
                    </div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Home visitation Booking</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                      Avoid long hospital queue lines for routine deworming or immunization booster schedules. Book a certified home checkup in clicks.
                    </p>
                  </div>

                </div>
              </div>
            </section>

            {/* HOW IT WORKS ILLUSTRATIONS & STEP MATRIX */}
            <section className="py-16 bg-[#FFF8F0] border-t border-b border-orange-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Easy Workflow</span>
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Clinical Care in Four Simple Milestones</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                  {/* Connection vector line */}
                  <div className="hidden sm:block absolute top-10 left-[12%] right-[12%] h-[1.5px] bg-[#FF914D]/20" />

                  <div className="space-y-3 relative z-10">
                    <span className="w-10 h-10 rounded-full bg-orange-100 text-[#FF914D] border-2 border-white shadow-md flex items-center justify-center font-bold text-xs mx-auto">1</span>
                    <h4 className="font-display font-bold text-gray-800 text-sm">Share Location</h4>
                    <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">Auto-detect geolocation coordinates to map active animal care clinics nearest to your grid.</p>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <span className="w-10 h-10 rounded-full bg-orange-100 text-[#FF914D] border-2 border-white shadow-md flex items-center justify-center font-bold text-xs mx-auto">2</span>
                    <h4 className="font-display font-bold text-gray-800 text-sm">Select Veterinarian</h4>
                    <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">Verify clinical specials, distance, ratings, check hours, and pick your doctor visit format.</p>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <span className="w-10 h-10 rounded-full bg-orange-100 text-[#FF914D] border-2 border-white shadow-md flex items-center justify-center font-bold text-xs mx-auto">3</span>
                    <h4 className="font-display font-bold text-gray-800 text-sm">Schedule Care</h4>
                    <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">Transmit details, secure your preferred checking slot, or trigger immediate distress phone lines.</p>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <span className="w-10 h-10 rounded-full bg-green-100 text-[#4CAF50] border-2 border-white shadow-md flex items-center justify-center font-bold text-xs mx-auto">4</span>
                    <h4 className="font-display font-bold text-gray-800 text-sm">Receive Treatment</h4>
                    <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">Stabilize injury or receive professional vaccinations checkup file reports.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* TESTIMONIALS (Carousel/list representation) */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2 text-center max-w-2xl mx-auto">
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Warm Stories From Happy Pet Parents</h3>
                  <p className="text-gray-500 text-sm sm:text-base">We bridge gaps under crisis when your animal companion is feeling down. Here is feedback from the local Bengaluru community.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  
                  <div className="p-6 bg-[#FFF8F0] border border-orange-100/50 rounded-3xl text-left space-y-4">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-amber-300 text-amber-300" />)}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      "When Rocky suffered a heat stroke under summer walks, we panicked. One red button alert brought instant directions from Cessna, stabilizing him in 20 minutes! Absolutely invaluable system."
                    </p>
                    <div className="flex items-center gap-2.5 border-t border-orange-100/40 pt-3">
                      <div className="w-8 h-8 rounded-full bg-orange-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" alt="Sarah" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-xs text-gray-800">Sarah Banerjee</h5>
                        <p className="text-[10px] text-gray-400">Golden Retriever Mom</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[#FFF8F0] border border-orange-100/50 rounded-3xl text-left space-y-4">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-amber-300 text-amber-300" />)}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      "I booked a domestic deworming home checker visit for my feline Luna. The practitioner was incredibly gentle and patient. Luna felt totally secure right inside our living room layout."
                    </p>
                    <div className="flex items-center gap-2.5 border-t border-orange-100/40 pt-3">
                      <div className="w-8 h-8 rounded-full bg-orange-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" alt="Rohan" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-xs text-gray-800">Rohan Sridhar</h5>
                        <p className="text-[10px] text-gray-400">Persian Cat Dad</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[#FFF8F0] border border-orange-100/50 rounded-3xl text-left space-y-4">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-amber-300 text-amber-300" />)}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-normal">
                      "Finding verified avian specialists is famously tough in Bengaluru. QuickVet made filtering species focus trivial. Cessna treated my injured parakeet with pristine medical tools."
                    </p>
                    <div className="flex items-center gap-2.5 border-t border-orange-100/40 pt-3">
                      <div className="w-8 h-8 rounded-full bg-orange-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Ananya" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left">
                        <h5 className="font-bold text-xs text-gray-800">Ananya Krishnan</h5>
                        <p className="text-[10px] text-gray-400">Parakeet Parent</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* VET REGISTRATION SECTION CTA BANNER */}
            <section className="py-16 bg-[#FFF8F0] border-t border-orange-100/50">
              <div className="max-w-5xl mx-auto px-4 text-center bg-gradient-to-r from-green-600 to-emerald-700 rounded-[36px] p-8 sm:p-12 text-white shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="font-display font-black text-2xl sm:text-3.5xl tracking-normal">Are You a Practicing Veterinarian?</h3>
                <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                  Join our verified directory network list. Put your animal hospital, emergency ambulance services, or private home consultancy on the interactive maps, supporting the pet parent community.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowVetRegisterModal(true)}
                    className="px-8 py-3.5 bg-white text-green-700 font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-sm cursor-pointer select-none"
                  >
                    Register Your Clinic Station
                  </button>
                </div>
              </div>
            </section>

          </motion.div>
        )}

        {/* VIEW 2: MAP FIND CLINICS VIEW */}
        {activeTab === 'find_vets' && (
          <motion.div
            key="find_vets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-[calc(100vh-140px)] min-h-[550px]">
              {/* Left filter and lists column (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col space-y-4 h-full">
                <div className="bg-white p-5 rounded-3xl border border-orange-50 shadow-sm space-y-4 flex-shrink-0 text-left">
                  <h3 className="font-display font-black text-lg text-gray-800">Advanced Locator Filters</h3>
                  
                  {/* Name field */}
                  <input
                    type="text"
                    placeholder="Search Clinic Name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-400 font-semibold"
                  />

                  {/* Range selection coordinates haversine slider */}
                  <div className="flex flex-col justify-center">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Search Range</span>
                      <span className="text-[#FF914D]">{searchRadius} km</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="50"
                      step="2"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                      className="w-full mt-1.5 accent-[#FF914D]"
                    />
                  </div>

                  {/* Badges row checklists */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 pt-1.5 border-t border-orange-50">
                    <button
                      onClick={() => setFilterOpenNow(!filterOpenNow)}
                      className={`px-2 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${
                        filterOpenNow ? 'bg-orange-50 border-[#FF914D] text-[#FF914D]' : 'bg-white text-gray-500'
                      }`}
                    >
                      🟢 Open Now
                    </button>
                    <button
                      onClick={() => setFilterEmergency(!filterEmergency)}
                      className={`px-2 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${
                        filterEmergency ? 'bg-orange-50 border-[#FF914D] text-[#FF914D]' : 'bg-white text-gray-500'
                      }`}
                    >
                      🩹 Emergency Unit
                    </button>
                    <button
                      onClick={() => setFilterHomeVisit(!filterHomeVisit)}
                      className={`px-2 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${
                        filterHomeVisit ? 'bg-orange-50 border-[#FF914D] text-[#FF914D]' : 'bg-white text-gray-500'
                      }`}
                    >
                      🏠 Home Doc
                    </button>
                  </div>
                </div>

                {/* Clinics dynamic checklist scroll list */}
                <div className="flex-grow overflow-y-auto space-y-3.5 pr-1">
                  {filteredClinics.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 border border-orange-50 text-center text-slate-400 text-xs">
                      No results match advanced locate options. Widening filter specs can discover more.
                    </div>
                  ) : (
                    filteredClinics.map((clinic) => (
                      <div
                        key={clinic.id}
                        onClick={() => setSelectedClinicId(clinic.id)}
                        className={`p-4 bg-white border rounded-2.5xl rounded-2xl cursor-pointer hover:border-orange-200 text-left space-y-1.5 shadow-sm transition-all ${
                          selectedClinicId === clinic.id ? 'border-[#FF914D] ring-2 ring-[#FF914D]/10 bg-orange-50/10' : 'border-orange-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-display font-bold text-sm text-gray-800 line-clamp-1">{clinic.name}</h4>
                          <span className="text-xs font-bold text-gray-700 flex-shrink-0">★ {clinic.rating}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{clinic.address}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700">📍 {clinic.area}</span>
                          <span>•</span>
                          <span>{clinic.workingHours}</span>
                        </div>
                        
                        <div className="pt-2 border-t flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingClinic(clinic);
                            }}
                            className="bg-[#FF914D] text-white text-[10px] font-bold px-3 py-1 rounded-lg"
                          >
                            Book Visit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNavigatingToClinicId(navigatingToClinicId === clinic.id ? null : clinic.id);
                            }}
                            className="bg-slate-50 border text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg"
                          >
                            {navigatingToClinicId === clinic.id ? 'Stop Route' : 'Navigate Path'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Maps column (7 Cols) */}
              <div className="lg:col-span-7 h-full">
                <div className="w-full h-full rounded-3xl overflow-hidden border">
                  {/* FULL EXPAND MAP COMPONENT LAYER */}
                  <InteractiveMap
                    clinics={filteredClinics}
                    selectedClinicId={selectedClinicId}
                    onSelectClinic={setSelectedClinicId}
                    userLocation={userLocation}
                    searchRadius={searchRadius}
                    navigatingToClinicId={navigatingToClinicId}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: RED ALERT EMERGENCY HELP VIEW */}
        {activeTab === 'emergency' && (
          <motion.div
            key="emergency"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          >
            <EmergencyWidget
              currentUser={currentUser}
              onOpenAuth={(type) => setAuthModalType(type)}
            />
          </motion.div>
        )}

        {/* VIEW 4: REVIEWS FEED REVIEWS */}
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6"
          >
            <div className="border-b pb-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#FF914D] bg-orange-100/40 py-1 px-2.5 rounded-md">Feedback Vault</span>
              <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Recent Verified Clinical Reviews</h3>
              <p className="text-gray-500 text-xs sm:text-sm">Real stories from local companion pet parents in India.</p>
            </div>

            {/* List all clinics feedback reviews sorted nicely */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map(clinic => (
                <div key={clinic.id} className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm hover:border-[#FF914D]/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-gray-800 text-sm leading-none">{clinic.name}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 inline-block">📍 {clinic.area}, {clinic.city}</span>
                    </div>
                    <button
                      onClick={() => setReviewsClinic(clinic)}
                      className="text-xs text-[#FF914D] font-bold hover:underline"
                    >
                      View All Feedback →
                    </button>
                  </div>
                  
                  {/* Mini statistics row of review logs */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-gray-500">
                    <span>★ <b>{clinic.rating} Rating Score</b></span>
                    <span>💬 <b>{clinic.reviewsCount} Patient Audits</b></span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* VIEW 5: USER DASHBOARD PORTAL */}
        {activeTab === 'user_dashboard' && currentUser && (
          <motion.div
            key="user_dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow"
          >
            <UserDashboard
              currentUser={currentUser}
              bookings={bookings}
              emergencies={emergencies}
              clinics={clinics}
              onAddPet={handleAddPet}
              onSelectTab={setActiveTab}
            />
          </motion.div>
        )}

        {/* VIEW 6: VETERINARIAN PORTAL PANEL */}
        {activeTab === 'vet_dashboard' && currentUser && (
          <motion.div
            key="vet_dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow"
          >
            <VetDashboard
              currentUser={currentUser}
              clinics={clinics}
              bookings={bookings}
              emergencies={emergencies}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onUpdateEmergencyStatus={handleUpdateEmergencyStatus}
            />
          </motion.div>
        )}

        {/* VIEW 7: MANUAL VETERINARIAN REGISTRATION */}
        {activeTab === 'vet_register' && (
          <motion.div
            key="vet_register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow"
          >
            <VetRegistrationModal
              onClose={() => setActiveTab('home')}
              onSubmitRegistration={handleSubmitVetRegistration}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER BAR */}
      <Footer onNavigate={setActiveTab} />

      {/* GLOBAL MODALS INJECTION LAYER */}
      
      {/* 1. Auth Login Signup Modal */}
      {authModalType && (
        <AuthModal
          type={authModalType}
          onClose={() => setAuthModalType(null)}
          onSuccess={handleAuthSuccess}
          onToggleType={setAuthModalType}
        />
      )}

      {/* 2. Clinical Scheduling booking Modal */}
      {bookingClinic && (
        <BookingModal
          clinic={bookingClinic}
          currentUser={currentUser}
          onClose={() => setBookingClinic(null)}
          onSubmitBooking={handleSubmitBooking}
          onOpenAuth={(type) => setAuthModalType(type)}
        />
      )}

      {/* 3. Feedback Reviews modal */}
      {reviewsClinic && (
        <ReviewsModal
          clinic={reviewsClinic}
          currentUser={currentUser}
          onClose={() => setReviewsClinic(null)}
          onOpenAuth={(type) => setAuthModalType(type)}
        />
      )}

      {/* 4. Vet Manual Registry Modal */}
      {showVetRegisterModal && (
        <VetRegistrationModal
          onClose={() => setShowVetRegisterModal(false)}
          onSubmitRegistration={handleSubmitVetRegistration}
        />
      )}

    </div>
  );
}
