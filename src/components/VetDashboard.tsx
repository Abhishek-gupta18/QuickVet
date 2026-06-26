import { useState, useEffect } from 'react';
import { ToggleLeft, CalendarCheck, Home, Star, BarChart3, Settings, ClipboardList, Loader2, Check, X, ShieldAlert, Heart, Phone } from 'lucide-react';
import { User, VetClinic, Booking, EmergencyRequest, ClinicReview } from '../types';

interface VetDashboardProps {
  currentUser: User;
  clinics: VetClinic[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onUpdateEmergencyStatus: (id: string, status: string, clinicId: string, clinicName: string) => Promise<void>;
}

export default function VetDashboard({
  currentUser,
  clinics,
  bookings,
  emergencies,
  onUpdateBookingStatus,
  onUpdateEmergencyStatus,
}: VetDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bookings' | 'home_visits' | 'emergencies' | 'reviews' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [clinicReviews, setClinicReviews] = useState<ClinicReview[]>([]);

  // Find affiliated clinic
  const clinic = clinics.find(c => c.id === currentUser.clinicId) || clinics[0];

  // Filters
  const clinicBookings = bookings.filter(b => b.clinicId === clinic?.id);
  const regularBookings = clinicBookings.filter(b => b.type === 'clinic_visit');
  const homeVisits = clinicBookings.filter(b => b.type === 'home_visit');
  
  // Nearby Active emergencies pending (within the region, for doctors to accept!)
  const activeEmergencies = emergencies.filter(e => e.status !== 'completed');

  // Fetch reviews of this clinic
  useEffect(() => {
    if (!clinic) return;
    const fetchClinicReviews = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/clinics/${clinic.id}/reviews`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          setClinicReviews([]);
          return;
        }
        const data = await res.json();
        setClinicReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to pull reviews:', err);
      }
    };
    fetchClinicReviews();
  }, [clinic?.id, bookings]);

  const handleActionBooking = async (id: string, status: 'approved' | 'completed' | 'cancelled') => {
    setLoading(true);
    try {
      await onUpdateBookingStatus(id, status);
    } catch (err) {
      alert('Could not update booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimEmergency = async (id: string) => {
    if (!clinic) return;
    setLoading(true);
    try {
      await onUpdateEmergencyStatus(id, 'accepted', clinic.id, clinic.name);
    } catch (err) {
      alert('Could not accept emergency reservation');
    } finally {
      setLoading(false);
    }
  };

  const sidebarOpts = [
    { id: 'overview', label: 'Doctor Hub', icon: ToggleLeft },
    { id: 'bookings', label: 'In-Clinic Bookings', icon: CalendarCheck, count: regularBookings.filter(b => b.status === 'pending').length },
    { id: 'home_visits', label: 'Home Visit Jobs', icon: Home, count: homeVisits.filter(b => b.status === 'pending').length },
    { id: 'emergencies', label: 'Emergency Alerts', icon: ShieldAlert, count: activeEmergencies.filter(e => e.status === 'pending' || e.status === 'notified').length },
    { id: 'reviews', label: 'Patient Reviews', icon: Star, count: clinicReviews.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Panel */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-green-50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-green-50 pb-5">
            <img
              src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full border border-green-200"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h4 className="font-display font-bold text-gray-900 line-clamp-1">{currentUser.name}</h4>
              <span className="text-[10px] uppercase font-bold text-[#4CAF50] bg-green-150 bg-green-50 py-0.5 px-2 rounded-md">Medical Doctor</span>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0">
            {sidebarOpts.map((opt) => {
              const IconComp = opt.icon;
              const isActive = activeSubTab === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveSubTab(opt.id as any)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-green-50 text-green-700 shadow-inner-sm'
                      : 'text-gray-600 hover:text-green-700 hover:bg-green-50/20'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="flex-grow text-left">{opt.label}</span>
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                      isActive ? 'bg-green-600 text-white' : 'bg-slate-100 text-gray-500'
                    }`}>{opt.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {clinic && (
            <div className="bg-slate-50 p-4 rounded-2xl border text-left text-xs text-gray-500 space-y-1">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Primary Station</span>
              <p className="font-black text-gray-700 font-display line-clamp-1">{clinic.name}</p>
              <p className="text-[10px]">📍 {clinic.area}, {clinic.city}</p>
            </div>
          )}
        </div>

        {/* Right Dashboard Space */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-green-50 shadow-sm text-left min-h-[500px]">
          
          {/* OVERVIEW PANEL */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Veterinary Doctor Terminal</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Welcome back, {currentUser.name}. Review trauma triggers and clinic visitor checkups scheduled today.</p>
              </div>

              {/* Analytics metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border text-left space-y-2 bg-gradient-to-tr from-green-50 to-white border-green-100 shadow-sm">
                  <span className="text-xl">🏪</span>
                  <div>
                    <span className="block text-xl font-black text-gray-800 font-display">{clinicBookings.filter(b => b.status === 'approved').length}</span>
                    <span className="text-[9px] uppercase font-bold text-gray-400">Approved Bookings</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border text-left space-y-2 bg-gradient-to-tr from-lime-50 to-white border-lime-100 shadow-sm">
                  <span className="text-xl">⏳</span>
                  <div>
                    <span className="block text-xl font-black text-gray-800 font-display">{clinicBookings.filter(b => b.status === 'pending').length}</span>
                    <span className="text-[9px] uppercase font-bold text-gray-400">Pending Approvals</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border text-left space-y-2 bg-gradient-to-tr from-emerald-50/60 to-white border-emerald-100 shadow-sm">
                  <span className="text-xl">🚨</span>
                  <div>
                    <span className="block text-xl font-black text-emerald-600 font-display">{activeEmergencies.length}</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-500 font-sans">Active Emergencies</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border text-left space-y-2 bg-gradient-to-tr from-lime-50 to-white border-lime-100 shadow-sm animate-fade-in">
                  <span className="text-xl">⭐️</span>
                  <div>
                    <span className="block text-xl font-black text-gray-800 font-display">{clinic?.rating || 5.0} ★</span>
                    <span className="text-[9px] uppercase font-bold text-gray-500 font-sans">Satisfaction Score</span>
                  </div>
                </div>
              </div>

              {/* Alert list on center */}
              <div className="space-y-4 pt-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-display font-extrabold text-gray-800 text-sm">Critical Active Regional Emergencies</h4>
                  <span className="text-[10px] text-emerald-500 bg-emerald-100/60 px-2 py-0.5 rounded font-bold animate-pulse">Broadcast Channel Active</span>
                </div>

                {activeEmergencies.length === 0 ? (
                  <div className="bg-slate-50 border p-6 rounded-2xl text-center border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">All local animal emergencies are currently stabilized or completed. Good job!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeEmergencies.map((em) => (
                      <div key={em.id} className="p-4 bg-white border border-emerald-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border-l-4 border-l-emerald-500">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-gray-800">{em.petName} ({em.petType})</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded uppercase">{em.status}</span>
                          </div>
                          <p className="text-xs text-gray-500">📍 <b>Address:</b> {em.address} • Contact: {em.phone}</p>
                          <p className="text-xs text-emerald-700 italic font-semibold">"Symptom: {em.description}"</p>
                        </div>

                        {em.status === 'pending' || em.status === 'notified' ? (
                          <button
                            onClick={() => handleClaimEmergency(em.id)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer self-start sm:self-center flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Claim & Call Parent</span>
                          </button>
                        ) : em.acceptedByClinicId === clinic?.id ? (
                          <button
                            onClick={() => onUpdateEmergencyStatus(em.id, 'completed', clinic.id, clinic.name)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer self-start sm:self-center"
                          >
                            Mark Stabilized
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Claimed by another unit</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: IN-CLINIC BOOKINGS */}
          {activeSubTab === 'bookings' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">In-clinic Doctor Visits</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Manage, approve, or cancel physical medical checkups requested at your clinic desk.</p>
              </div>

              {regularBookings.length === 0 ? (
                <div className="p-12 border rounded-3xl text-center border-dashed border-gray-150 bg-slate-50 text-gray-400 text-xs">
                  No clinic checkup appointments logged on your schedule sheet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {regularBookings.map((book) => (
                    <div key={book.id} className="p-5 bg-white border border-gray-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1.5 text-left text-xs text-gray-500 leading-normal">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-base text-gray-800">{book.petOwnerName}</span>
                          <span className="text-[9px] font-bold bg-slate-50 border border-slate-205 py-0.5 px-2 rounded-md uppercase text-gray-500 tracking-wide">{book.service}</span>
                        </div>
                        <p>🐾 <b>Pet Companion:</b> {book.petName} ({book.petType})</p>
                        <p>📅 <b>Requested Slot:</b> {book.date} at {book.time}</p>
                        <p>📧 <b>Parent E-mail:</b> {book.petOwnerEmail}</p>
                        {book.notes && <p className="italic text-gray-400 font-medium">🐾 "Parent notes: {book.notes}"</p>}
                      </div>

                      {/* Scheduling controls */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {book.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleActionBooking(book.id, 'approved')}
                              className="p-2 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded-xl transition-all cursor-pointer"
                              title="Approve Slot"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleActionBooking(book.id, 'cancelled')}
                              className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                              title="Decline Slot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : book.status === 'approved' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-green-50 text-green-700 border rounded">Approved</span>
                            <button
                              onClick={() => handleActionBooking(book.id, 'completed')}
                              className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold capitalize text-gray-400 bg-slate-50 py-1 px-2.5 rounded border border-slate-200/50">{book.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCTOR HOME VISITS */}
          {activeSubTab === 'home_visits' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Registered Home Visit Jobs</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Doctors can trace local parent coordinates, details, and dispatch schedules for home visits.</p>
              </div>

              {homeVisits.length === 0 ? (
                <div className="p-12 border rounded-3xl text-center border-dashed border-gray-150 bg-slate-50 text-gray-400 text-xs">
                  Your veterinary center does not have any pending Home Doctor requests currently.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {homeVisits.map((book) => (
                    <div key={book.id} className="p-5 bg-white border border-green-50 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border-l-4 border-l-green-600">
                      <div className="space-y-1.5 text-left text-xs text-gray-500 leading-normal">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-base text-gray-800">{book.petOwnerName}</span>
                          <span className="text-[9px] font-bold bg-green-50 border border-green-200 py-0.5 px-2 rounded uppercase text-green-700">🏠 Home Care</span>
                        </div>
                        <p>⚕️ <b>Duty service:</b> {book.service}</p>
                        <p>🐶 <b>Diagnose companion:</b> {book.petName} ({book.petType})</p>
                        <p>🕒 <b>Schedule slot:</b> {book.date} at {book.time}</p>
                        {book.notes && <p className="italic text-gray-400 bg-slate-50 p-2 rounded-lg">💬 "{book.notes}"</p>}
                      </div>

                      {/* Status changer buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {book.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleActionBooking(book.id, 'approved')}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                            >
                              Dispatch Doctor
                            </button>
                            <button
                              onClick={() => handleActionBooking(book.id, 'cancelled')}
                              className="px-3.5 py-2 border hover:bg-slate-50 text-gray-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : book.status === 'approved' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-semibold px-2 py-1 bg-blue-50 text-blue-700 border rounded">Dispatched</span>
                            <button
                              onClick={() => handleActionBooking(book.id, 'completed')}
                              className="px-3.5 py-1.5 bg-[#4CAF50] text-white font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
                            >
                              Mark Completed
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold capitalize text-gray-400 bg-slate-100 py-1 px-2.5 rounded">{book.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLINIC REVIEWS */}
          {activeSubTab === 'reviews' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Your Clinic Feedback Log</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Read and analyze treatment logs, feedback comments, and rating reviews published by pet owners.</p>
              </div>

              {clinicReviews.length === 0 ? (
                <div className="p-12 border rounded-3xl text-center border-dashed border-gray-150 bg-slate-50 text-gray-400 text-xs">
                  Your veterinary clinic hasn't received any satisfying index reviews. Promote checkout slips!
                </div>
              ) : (
                <div className="space-y-3.5">
                  {clinicReviews.map((rev) => (
                    <div key={rev.id} className="p-4 bg-white border rounded-2xl text-left space-y-2.5 shadow-sm border-green-50">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-800">{rev.userName} ({rev.userEmail})</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{rev.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex text-lime-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-lime-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-500 flex items-center gap-1">🐾 {rev.petType} companion</span>
                      </div>

                      <p className="text-xs text-gray-600 font-normal leading-relaxed">
                        "{rev.reviewText}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

