import { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, SlidersHorizontal, Star, 
  Sparkles, ShieldAlert, Heart, CalendarDays, ClipboardList
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
import AdminDashboard from './components/AdminDashboard';
import VetRegistrationModal from './components/VetRegistrationModal';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { VetClinic, Booking, EmergencyRequest, User, ClinicReview } from './types';
import { calculateHaversineDistance } from './data';
import { motion, AnimatePresence } from 'motion/react';

// ===== Auth Storage Keys =====
const STORAGE_KEY_USER = 'vetfinder_user';
const STORAGE_KEY_TOKEN = 'vetfinder_token';

// ===== API Base URL =====
// In development: empty string (same origin, Express serves both)
// In production: set VITE_API_URL to your Render backend URL (e.g. https://quickvet-api.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL || '';


// ===== Authenticated Fetch Helper =====
function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  return res;
}

/**
 * Safely parse JSON from a Response object.
 * Returns null if the response body is not valid JSON (e.g., HTML error page).
 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.warn(`Expected JSON but got "${contentType}" from ${res.url}`);
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}


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
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [filterEmergency, setFilterEmergency] = useState<boolean>(false);
  const [filterHomeVisit, setFilterHomeVisit] = useState<boolean>(false);
  const [filterHighestRated, setFilterHighestRated] = useState<boolean>(false);
  const [filterSpecialist, setFilterSpecialist] = useState<string>('All');

  // Map control
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [navigatingToClinicId, setNavigatingToClinicId] = useState<string | null>(null);


  // ===== Session Handling: Handle 401/403 by forcing logout =====
  const handleForceLogout = useCallback(() => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setActiveTab('home');
  }, []);

  // On mount: Auto-detect user geolocation & restore session
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 12.9716, lng: 77.5946 });
    }

    // Restore user session from persistent storage
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setSessionToken(savedToken);
      } catch (err) {
        console.error('Session parse error:', err);
        handleForceLogout();
      }
    }
  }, [handleForceLogout]);


  // ===== Data Fetching with Auth Headers =====
  const pullConfiguration = useCallback(async () => {
    try {
      // Clinics are public
      const cRes = await fetch(`${API_BASE}/api/clinics`);
      if (!cRes.ok) return;
      const cData = await safeJson(cRes);
      if (cData && Array.isArray(cData)) setClinics(cData);

      // Bookings & Emergencies require auth
      const token = getStoredToken();
      if (token) {
        const bRes = await authFetch('/api/bookings');
        if (bRes.status === 401 || bRes.status === 403) {
          handleForceLogout();
          return;
        }
        if (bRes.ok) {
          const bData = await safeJson(bRes);
          if (bData && Array.isArray(bData)) setBookings(bData);
        }

        const eRes = await authFetch('/api/emergency');
        if (eRes.status === 401 || eRes.status === 403) {
          handleForceLogout();
          return;
        }
        if (eRes.ok) {
          const eData = await safeJson(eRes);
          if (eData && Array.isArray(eData)) setEmergencies(eData);
        }
      }
    } catch (err) {
      console.warn('Backend REST fetch failure:', err);
    }
  }, [handleForceLogout]);

  useEffect(() => {
    pullConfiguration();
    const interval = setInterval(pullConfiguration, 6000);
    return () => clearInterval(interval);
  }, [pullConfiguration]);


  // ===== Authentication Handlers =====
  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    // Route to correct dashboard by role
    if (user.role === 'admin') {
      setActiveTab('admin_dashboard');
    } else if (user.role === 'veterinarian') {
      setActiveTab('vet_dashboard');
    } else {
      setActiveTab('user_dashboard');
    }

    // Immediately refresh data with new credentials
    setTimeout(() => pullConfiguration(), 100);
  };

  const handleLogout = () => {
    handleForceLogout();
  };

  // ===== Pet Management =====
  const handleAddPet = async (petData: any) => {
    const res = await authFetch('/api/user/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) throw new Error('Failed to save pet');
    const updatedUser = await safeJson(res);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };


  // ===== Favorites Toggle =====
  const handleToggleFavorite = async (clinicId: string) => {
    if (!currentUser) {
      setAuthModalType('login');
      return;
    }
    const res = await authFetch('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ clinicId }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) return;
    const data = await safeJson(res);
    if (!data) return;

    const updatedUser = { ...currentUser, favoriteClinics: data.favoriteClinics };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  // ===== Booking Submission =====
  const handleSubmitBooking = async (bookingPayload: any) => {
    const res = await authFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error('Booking failed');
    await pullConfiguration();
  };

  // ===== Vet Registration =====
  const handleSubmitVetRegistration = async (registrationPayload: any) => {
    const res = await authFetch('/api/clinics', {
      method: 'POST',
      body: JSON.stringify(registrationPayload),
    });
    if (!res.ok) throw new Error('Registration failed');
    const createdClinic = await safeJson(res);
    await pullConfiguration();

    if (currentUser && currentUser.role === 'veterinarian' && createdClinic) {
      const updatedUser = { ...currentUser, clinicId: createdClinic.id };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };


  // ===== Booking Status Updates (Vet only) =====
  const handleUpdateBookingStatus = async (id: string, status: string) => {
    const res = await authFetch(`/api/bookings/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) console.error('Failed to change booking status');
    await pullConfiguration();
  };

  // ===== Emergency Status Updates (Vet only) =====
  const handleUpdateEmergencyStatus = async (id: string, status: string, clinicId: string, clinicName: string) => {
    const res = await authFetch(`/api/emergency/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, clinicId, clinicName }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) console.error('Failed to update emergency status');
    await pullConfiguration();
  };


  // ===== Clinic Filtering Logic =====
  const filteredClinics = clinics.filter((clinic) => {
    if (searchName && !clinic.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchArea && !clinic.area.toLowerCase().includes(searchArea.toLowerCase())) return false;
    if (filterOpenNow && !clinic.isOpenNow) return false;
    if (filterEmergency && !clinic.hasEmergency) return false;
    if (filterHomeVisit && !clinic.hasHomeVisit) return false;
    if (filterHighestRated && clinic.rating < 4.6) return false;
    if (filterSpecialist !== 'All' && !clinic.specialists.includes(filterSpecialist as any)) return false;
    if (userLocation) {
      const dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude);
      if (dist > searchRadius) return false;
    }
    return true;
  });


  // ===== RENDER =====
  return (
    <div className="relative min-h-screen bg-[#F4FBF3] font-sans text-[#2D3748] flex flex-col">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(type) => setAuthModalType(type)}
      />

      <AnimatePresence mode="wait">
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
            <Hero
              clinics={clinics.slice(0, 5)}
              userLocation={userLocation}
              onSelectClinic={(id) => { setSelectedClinicId(id); setActiveTab('find_vets'); }}
              onNavigateToFind={() => setActiveTab('find_vets')}
              onNavigateToEmergency={() => setActiveTab('emergency')}
            />


            {/* QUICK SEARCH SECTION */}
            <section className="py-12 bg-[#F4FBF3]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white border border-black/5 rounded-3xl p-6 sm:p-8 shadow-md max-w-5xl mx-auto space-y-6">
                  <div className="text-left space-y-1">
                    <h3 className="font-display font-black text-xl text-[#2D3748]">Quick Clinic Station Search</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Configure specific area metrics or species specialties</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                      <input type="text" placeholder="Search Clinic Name..." value={searchName} onChange={(e) => setSearchName(e.target.value)}
                        className="w-full bg-slate-50 p-3.5 pl-11 border border-slate-100 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#58B368] shadow-sm leading-none font-medium text-gray-800" />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-[#58B368]" />
                      <select value={searchArea} onChange={(e) => setSearchArea(e.target.value)}
                        className="w-full bg-slate-50 p-3.5 pl-11 border border-slate-100 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#58B368] shadow-sm h-[48px] font-semibold text-gray-800">
                        <option value="">All Areas (Bengaluru)</option>
                        <option value="Indiranagar">Indiranagar</option>
                        <option value="Domlur">Domlur</option>
                        <option value="Koramangala">Koramangala</option>
                        <option value="Whitefield">Whitefield</option>
                        <option value="JP Nagar">JP Nagar</option>
                        <option value="Hebbal">Hebbal</option>
                      </select>
                    </div>
                    <div className="bg-slate-50 p-2.5 px-4.5 border border-slate-100 rounded-2xl shadow-sm text-left flex flex-col justify-center">
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 leading-none">
                        <span>Search Radius</span>
                        <span className="text-[#58B368]">{searchRadius} km</span>
                      </div>
                      <input type="range" min="2" max="50" step="2" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                        className="w-full mt-1.5 accent-[#58B368] cursor-pointer" />
                    </div>
                  </div>


                  {/* Species pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Species Focus:</span>
                    {['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Exotics'].map((spec) => (
                      <button key={spec} onClick={() => setFilterSpecialist(spec)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          filterSpecialist === spec ? 'bg-[#58B368] text-white shadow-md' : 'bg-white border border-slate-200/60 text-gray-600 hover:bg-slate-50'
                        }`}>
                        {spec === 'All' ? '🐾 All Types' : `${spec} Specialist`}
                      </button>
                    ))}
                  </div>

                  {/* Filter checkboxes */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 font-bold uppercase tracking-[0.08em] text-[10px]">Filter Badges:</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={filterOpenNow} onChange={(e) => setFilterOpenNow(e.target.checked)} className="rounded border-gray-300 text-[#58B368] focus:ring-[#58B368]" />
                      <span>🟢 Open Now</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={filterEmergency} onChange={(e) => setFilterEmergency(e.target.checked)} className="rounded border-gray-300 text-[#58B368] focus:ring-[#58B368]" />
                      <span>🩹 Emergency Services (24x7)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={filterHomeVisit} onChange={(e) => setFilterHomeVisit(e.target.checked)} className="rounded border-gray-300 text-[#58B368] focus:ring-[#58B368]" />
                      <span>🏠 Home Visit Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={filterHighestRated} onChange={(e) => setFilterHighestRated(e.target.checked)} className="rounded border-gray-300 text-[#58B368] focus:ring-[#58B368]" />
                      <span>⭐ Highest Rated</span>
                    </label>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 pt-1.5 border-t border-green-50">
                    <span>Showing <b>{filteredClinics.length}</b> verified veterinary centers matching filters.</span>
                    <button onClick={() => setActiveTab('find_vets')} className="text-[#58B368] font-bold hover:underline">Maximize Map View →</button>
                  </div>
                </div>
              </div>
            </section>


            {/* NEARBY VETS SECTION */}
            <section className="py-16 bg-[#F4FBF3]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-3 mb-10">
                  <h2 className="font-display font-black text-3xl text-gray-900 tracking-tight">Verified Veterinary Care Stations Near You</h2>
                  <p className="text-gray-500 text-sm max-w-2xl mx-auto">Click any clinic card below to schedule a checkup visit, review feedback stars, or plot real-time navigating paths on the map layer.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-12 space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                    {filteredClinics.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-3xl border border-green-50 space-y-2">
                        <span className="text-4xl block">🔍</span>
                        <h4 className="font-display font-bold text-gray-800 text-lg">No Clinics Found Mapping Selected filters</h4>
                        <p className="text-xs text-gray-400">Try widening your search radius range or turning off specific specialists checkboxes.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredClinics.map((clinic) => (
                          <ClinicCard key={clinic.id} clinic={clinic}
                            isSelected={selectedClinicId === clinic.id}
                            isFavorite={currentUser?.favoriteClinics?.includes(clinic.id) || false}
                            userLocation={userLocation}
                            onSelect={setSelectedClinicId}
                            onBook={(cl: VetClinic) => setBookingClinic(cl)}
                            onNavigate={(id: string) => setNavigatingToClinicId(id)}
                            onWriteReview={() => setReviewsClinic(clinic)}
                            onToggleFavorite={handleToggleFavorite}
                            isNavigating={navigatingToClinicId === clinic.id} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>


            {/* EMERGENCY SECTION */}
            <EmergencyWidget currentUser={currentUser} onOpenAuth={(type) => setAuthModalType(type)} />

            {/* WHY CHOOSE QUICKVET */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2">
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Why Pet Parents Trust QuickVet</h3>
                  <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">Engineered to bypass localized chaos under medical emergencies, supporting fast health checks and direct doctor consults.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <div className="p-6 bg-[#F4FBF3] border border-green-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 text-[#58B368] flex items-center justify-center text-xl shadow-inner">🐾</div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Nearby Certified Clinics</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">We catalog verified licensed clinical centers, veterinary ambulances, and specialty surgical theaters.</p>
                  </div>
                  <div className="p-6 bg-green-50/30 border border-green-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-xl shadow-inner animate-pulse">🚑</div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Live Trauma Alerts</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">One critical alert button triggers dynamic localized broadcasts, alerting regional ambulances with continuous updates.</p>
                  </div>
                  <div className="p-6 bg-green-50/30 border border-green-100/40 rounded-3xl text-left space-y-3.5 hover:shadow-xl transition-all hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center text-xl shadow-inner">🏠</div>
                    <h4 className="font-display font-black text-gray-800 text-base leading-tight">Home Visitation Booking</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">Avoid long hospital queue lines for routine deworming or immunization. Book a certified home checkup in clicks.</p>
                  </div>
                </div>
              </div>
            </section>


            {/* HOW IT WORKS */}
            <section className="py-16 bg-[#F4FBF3] border-t border-b border-green-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Easy Workflow</span>
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Clinical Care in Four Simple Milestones</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                  <div className="hidden sm:block absolute top-10 left-[12%] right-[12%] h-[1.5px] bg-[#58B368]/20" />
                  {[
                    { n: '1', title: 'Share Location', desc: 'Auto-detect geolocation to map active animal care clinics nearest to your grid.' },
                    { n: '2', title: 'Select Veterinarian', desc: 'Verify clinical specials, distance, ratings, check hours, and pick your doctor.' },
                    { n: '3', title: 'Schedule Care', desc: 'Transmit details, secure your preferred checking slot, or trigger distress lines.' },
                    { n: '4', title: 'Receive Treatment', desc: 'Stabilize injury or receive professional vaccinations checkup file reports.' },
                  ].map((step) => (
                    <div key={step.n} className="space-y-3 relative z-10">
                      <span className="w-10 h-10 rounded-full bg-green-100 text-[#58B368] border-2 border-white shadow-md flex items-center justify-center font-bold text-xs mx-auto">{step.n}</span>
                      <h4 className="font-display font-bold text-gray-800 text-sm">{step.title}</h4>
                      <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>


            {/* TESTIMONIALS */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
                <div className="space-y-2 text-center max-w-2xl mx-auto">
                  <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Warm Stories From Happy Pet Parents</h3>
                  <p className="text-gray-500 text-sm sm:text-base">Real feedback from the local Bengaluru community.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {[
                    { text: '"When Rocky suffered a heat stroke, one alert button brought instant directions from Cessna, stabilizing him in 20 minutes!"', name: 'Sarah Banerjee', role: 'Golden Retriever Mom', img: 'photo-1544005313-94ddf0286df2' },
                    { text: '"I booked a home deworming visit for Luna. The practitioner was incredibly gentle and patient."', name: 'Rohan Sridhar', role: 'Persian Cat Dad', img: 'photo-1506794778202-cad84cf45f1d' },
                    { text: '"Finding verified avian specialists is tough in Bengaluru. QuickVet made filtering species focus trivial."', name: 'Ananya Krishnan', role: 'Parakeet Parent', img: 'photo-1534528741775-53994a69daeb' },
                  ].map((t, idx) => (
                    <div key={idx} className="p-6 bg-[#F4FBF3] border border-green-100/50 rounded-3xl text-left space-y-4">
                      <div className="flex text-green-400">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4.5 h-4.5 fill-green-300 text-green-300" />)}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-normal">{t.text}</p>
                      <div className="flex items-center gap-2.5 border-t border-green-100/40 pt-3">
                        <div className="w-8 h-8 rounded-full bg-green-200 overflow-hidden">
                          <img src={`https://images.unsplash.com/${t.img}?auto=format&fit=crop&q=80&w=150`} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-xs text-gray-800">{t.name}</h5>
                          <p className="text-[10px] text-gray-400">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>


            {/* VET REGISTRATION CTA */}
            <section className="py-16 bg-[#F4FBF3] border-t border-green-100/50">
              <div className="max-w-5xl mx-auto px-4 text-center bg-gradient-to-r from-green-600 to-emerald-700 rounded-[36px] p-8 sm:p-12 text-white shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="font-display font-black text-2xl sm:text-3xl tracking-normal">Are You a Practicing Veterinarian?</h3>
                <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">Join our verified directory network. Put your animal hospital or private consultancy on the interactive maps.</p>
                <div className="pt-2">
                  <button onClick={() => setShowVetRegisterModal(true)}
                    className="px-8 py-3.5 bg-white text-green-700 font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all text-sm cursor-pointer select-none">
                    Register Your Clinic Station
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        )}


        {/* VIEW 2: MAP FIND CLINICS VIEW */}
        {activeTab === 'find_vets' && (
          <motion.div key="find_vets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] self-start min-h-0">
                <div className="bg-white p-5 rounded-3xl border border-green-100 shadow-sm space-y-4 flex-shrink-0 text-left">
                  <h3 className="font-display font-black text-lg text-gray-800">Advanced Locator Filters</h3>
                  <input type="text" placeholder="Search Clinic Name..." value={searchName} onChange={(e) => setSearchName(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#58B368] font-semibold" />
                  <div className="flex flex-col justify-center">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                      <span>Search Range</span><span className="text-[#2F855A]">{searchRadius} km</span>
                    </div>
                    <input type="range" min="2" max="50" step="2" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="w-full mt-1.5 accent-[#58B368]" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 pt-1.5 border-t border-green-100">
                    {[
                      { label: '🟢 Open Now', active: filterOpenNow, toggle: () => setFilterOpenNow(!filterOpenNow) },
                      { label: '🩹 Emergency Unit', active: filterEmergency, toggle: () => setFilterEmergency(!filterEmergency) },
                      { label: '🏠 Home Doc', active: filterHomeVisit, toggle: () => setFilterHomeVisit(!filterHomeVisit) },
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.toggle}
                        className={`px-2 py-1.5 rounded-lg border font-bold transition-colors cursor-pointer ${btn.active ? 'bg-green-50 border-[#58B368] text-[#2F855A]' : 'bg-white text-gray-500'}`}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>


                <div className="flex-1 space-y-3.5 pr-1 lg:overflow-y-auto lg:overscroll-contain lg:pb-2 lg:min-h-0">
                  {filteredClinics.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 border border-green-100 text-center text-slate-400 text-xs">No results match filters.</div>
                  ) : (
                    filteredClinics.map((clinic) => (
                      <div key={clinic.id} onClick={() => setSelectedClinicId(clinic.id)}
                        className={`p-4 bg-white border rounded-2xl cursor-pointer hover:border-green-200 text-left space-y-1.5 shadow-sm transition-all ${
                          selectedClinicId === clinic.id ? 'border-[#58B368] ring-2 ring-[#58B368]/15 bg-green-50/50' : 'border-green-100'
                        }`}>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-display font-bold text-sm text-gray-800 line-clamp-1">{clinic.name}</h4>
                          <span className="text-xs font-bold text-gray-700 flex-shrink-0">★ {clinic.rating}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-1">{clinic.address}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-bold text-slate-700">📍 {clinic.area}</span><span>•</span><span>{clinic.workingHours}</span>
                        </div>
                        <div className="pt-2 border-t flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setBookingClinic(clinic); }}
                            className="bg-[#58B368] text-white text-[10px] font-bold px-3 py-1 rounded-lg">Book Visit</button>
                          <button onClick={(e) => { e.stopPropagation(); setNavigatingToClinicId(navigatingToClinicId === clinic.id ? null : clinic.id); }}
                            className="bg-slate-50 border text-slate-600 text-[10px] font-bold px-3 py-1 rounded-lg">
                            {navigatingToClinicId === clinic.id ? 'Stop Route' : 'Navigate Path'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="w-full h-[360px] sm:h-[430px] lg:h-[calc(100vh-8rem)] lg:max-h-[680px] min-h-[340px] rounded-3xl overflow-hidden border border-green-100 shadow-sm">
                  <InteractiveMap clinics={filteredClinics} selectedClinicId={selectedClinicId} onSelectClinic={setSelectedClinicId}
                    userLocation={userLocation} searchRadius={searchRadius} navigatingToClinicId={navigatingToClinicId} />
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* VIEW 3: EMERGENCY */}
        {activeTab === 'emergency' && (
          <motion.div key="emergency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EmergencyWidget currentUser={currentUser} onOpenAuth={(type) => setAuthModalType(type)} />
          </motion.div>
        )}

        {/* VIEW 4: REVIEWS FEED */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
            <div className="border-b pb-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#58B368] bg-green-100/40 py-1 px-2.5 rounded-md">Feedback Vault</span>
              <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Recent Verified Clinical Reviews</h3>
              <p className="text-gray-500 text-xs sm:text-sm">Real stories from local companion pet parents in India.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clinics.map(clinic => (
                <div key={clinic.id} className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm hover:border-[#58B368]/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-gray-800 text-sm leading-none">{clinic.name}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 inline-block">📍 {clinic.area}, {clinic.city}</span>
                    </div>
                    <button onClick={() => setReviewsClinic(clinic)} className="text-xs text-[#58B368] font-bold hover:underline">View All Feedback →</button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-gray-500">
                    <span>★ <b>{clinic.rating} Rating Score</b></span>
                    <span>💬 <b>{clinic.reviewsCount} Patient Audits</b></span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* VIEW 5: USER DASHBOARD - ROLE GUARDED (pet_owner only) */}
        {activeTab === 'user_dashboard' && (
          currentUser && currentUser.role === 'pet_owner' ? (
            <motion.div key="user_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <UserDashboard
                currentUser={currentUser}
                bookings={bookings}
                emergencies={emergencies}
                clinics={clinics}
                onAddPet={handleAddPet}
                onSelectTab={setActiveTab}
              />
            </motion.div>
          ) : (
            <motion.div key="user_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This dashboard is restricted to registered pet owners. Please log in with a pet owner account.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Pet Owner'}
                </button>
              </div>
            </motion.div>
          )
        )}

        {/* VIEW 6: VET DASHBOARD - ROLE GUARDED (veterinarian only) */}
        {activeTab === 'vet_dashboard' && (
          currentUser && currentUser.role === 'veterinarian' ? (
            <motion.div key="vet_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <VetDashboard
                currentUser={currentUser}
                clinics={clinics}
                bookings={bookings}
                emergencies={emergencies}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onUpdateEmergencyStatus={handleUpdateEmergencyStatus}
              />
            </motion.div>
          ) : (
            <motion.div key="vet_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This portal is restricted to verified veterinarians. Please log in with a veterinarian account.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Veterinarian'}
                </button>
              </div>
            </motion.div>
          )
        )}


        {/* VIEW 7: ADMIN DASHBOARD - ROLE GUARDED (admin only) */}
        {activeTab === 'admin_dashboard' && (
          currentUser && currentUser.role === 'admin' ? (
            <motion.div key="admin_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <AdminDashboard
                currentUser={currentUser}
                clinics={clinics}
                bookings={bookings}
                emergencies={emergencies}
              />
            </motion.div>
          ) : (
            <motion.div key="admin_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This command center is restricted to QuickVet administrators.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Admin'}
                </button>
              </div>
            </motion.div>
          )
        )}


        {/* VIEW 8: VET REGISTRATION */}
        {activeTab === 'vet_register' && (
          <motion.div key="vet_register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
            <VetRegistrationModal onClose={() => setActiveTab('home')} onSubmitRegistration={handleSubmitVetRegistration} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <Footer onNavigate={setActiveTab} />

      {/* GLOBAL MODALS */}
      {authModalType && (
        <AuthModal type={authModalType} onClose={() => setAuthModalType(null)} onSuccess={handleAuthSuccess} onToggleType={setAuthModalType} />
      )}
      {bookingClinic && (
        <BookingModal clinic={bookingClinic} currentUser={currentUser} onClose={() => setBookingClinic(null)}
          onSubmitBooking={handleSubmitBooking} onOpenAuth={(type) => setAuthModalType(type)} />
      )}
      {reviewsClinic && (
        <ReviewsModal clinic={reviewsClinic} currentUser={currentUser} onClose={() => setReviewsClinic(null)}
          onOpenAuth={(type) => setAuthModalType(type)} />
      )}
      {showVetRegisterModal && (
        <VetRegistrationModal onClose={() => setShowVetRegisterModal(false)} onSubmitRegistration={handleSubmitVetRegistration} />
      )}
    </div>
  );
}
