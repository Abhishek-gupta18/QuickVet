import React, { useState } from 'react';
import { 
  LayoutDashboard, PawPrint, CalendarDays, ShieldAlert, Heart, 
  Plus, ClipboardList, CheckCircle, Clock, Search, ArrowRight,
  AlertTriangle, MapPin, Phone
} from 'lucide-react';
import { User, Pet, Booking, EmergencyRequest, VetClinic } from '../types';

interface UserDashboardProps {
  currentUser: User;
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  clinics: VetClinic[];
  onAddPet: (petForm: any) => Promise<void>;
  onSelectTab: (tab: string) => void;
}

export default function UserDashboard({
  currentUser,
  bookings,
  emergencies,
  clinics,
  onAddPet,
  onSelectTab,
}: UserDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'pets' | 'bookings' | 'emergencies' | 'favorites'
  >('overview');

  // Add Pet form states
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [medHistory, setMedHistory] = useState('');
  const [submittingPet, setSubmittingPet] = useState(false);


  // Filtered data scoped to this user (tenant isolation already on server, but also filter client-side)
  const userBookings = bookings.filter(
    b => b.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );
  const userEmergencies = emergencies.filter(
    e => e.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase()
  );
  const favoriteClinics = clinics.filter(
    c => currentUser.favoriteClinics?.includes(c.id)
  );

  // Sidebar navigation definition
  const sidebarOpts = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pets', label: 'My Pets', icon: PawPrint, count: currentUser.pets?.length || 0 },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, count: userBookings.length },
    { id: 'emergencies', label: 'Emergency Requests', icon: ShieldAlert, count: userEmergencies.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favoriteClinics.length },
  ];

  // Handle pet form submission
  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName || !petType) {
      alert('Please fill out Name and Species Type');
      return;
    }
    setSubmittingPet(true);
    try {
      await onAddPet({
        name: petName,
        type: petType,
        breed,
        age,
        weight,
        medicalHistory: medHistory,
      });
      // Clear form
      setPetName('');
      setBreed('');
      setAge('');
      setWeight('');
      setMedHistory('');
      setShowAddPetForm(false);
    } catch (err) {
      alert('Failed to register pet record.');
    } finally {
      setSubmittingPet(false);
    }
  };


  // Status badge helper
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-50 border-green-200 text-green-700',
      approved: 'bg-blue-50 border-blue-200 text-blue-700',
      cancelled: 'bg-stone-50 border-stone-200 text-stone-500',
      pending: 'bg-amber-50 border-amber-200 text-amber-700',
      notified: 'bg-cyan-50 border-cyan-200 text-cyan-700',
      accepted: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    };
    return styles[status] || 'bg-slate-50 border-slate-200 text-slate-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ===== LEFT SIDEBAR ===== */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-green-50 shadow-sm space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 border-b border-green-50 pb-5">
            <img
              src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full border-2 border-green-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h4 className="font-display font-bold text-gray-900 line-clamp-1">{currentUser.name}</h4>
              <span className="text-[10px] uppercase font-bold text-[#58B368] bg-green-100/40 py-0.5 px-2 rounded-md">
                Pet Parent
              </span>
            </div>
          </div>


          {/* Navigation Buttons */}
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
                      ? 'bg-green-50 text-[#58B368] shadow-inner'
                      : 'text-gray-600 hover:text-[#58B368] hover:bg-green-50/20'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-[#58B368]' : 'text-gray-400'}`} />
                  <span className="flex-grow text-left">{opt.label}</span>
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-[#58B368] text-white' : 'bg-slate-100 text-gray-500'
                    }`}>{opt.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick action */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50/30 p-4 rounded-2xl border border-green-100/50 text-left">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1.5">Quick Action</p>
            <button
              onClick={() => onSelectTab('find_vets')}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[#58B368] hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <span>Find Nearby Vets</span>
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>


        {/* ===== RIGHT CONTENT PANE ===== */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-green-50 shadow-sm text-left min-h-[500px]">

          {/* ========== TAB 1: OVERVIEW (Pet Care Hub) ========== */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Pet Care Hub</h3>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Quickly glance at your active bookings, companion profiles, and rescue histories.
                </p>
              </div>

              {/* Bento Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div
                  onClick={() => setActiveSubTab('pets')}
                  className="bg-[#F4FBF3] border border-green-100/60 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-[#58B368] transition-colors shadow-sm group"
                >
                  <span className="text-2xl">🐶</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display group-hover:text-[#58B368] transition-colors">
                      {currentUser.pets?.length || 0}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Registered Pets</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSubTab('bookings')}
                  className="bg-green-50/50 border border-green-100/40 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-green-600 transition-colors shadow-sm group"
                >
                  <span className="text-2xl">🗓️</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display group-hover:text-green-600 transition-colors">
                      {userBookings.length}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Total Appointments</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSubTab('emergencies')}
                  className="bg-emerald-50/50 border border-emerald-100/40 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-emerald-500 transition-colors shadow-sm group"
                >
                  <span className="text-2xl">🚨</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display group-hover:text-emerald-600 transition-colors">
                      {userEmergencies.length}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Distress Requests</span>
                  </div>
                </div>
              </div>


              {/* Active Care Schedules - 2 most recent bookings */}
              <div className="space-y-3.5 pt-4">
                <h4 className="font-display font-bold text-gray-800 text-sm border-b pb-2">Active Care Schedules</h4>
                {userBookings.length === 0 ? (
                  <div className="bg-slate-50 border p-6 rounded-2xl text-center space-y-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">You do not have any pending or historical bookings scheduled yet.</p>
                    <button
                      onClick={() => onSelectTab('find_vets')}
                      className="px-4 py-2 bg-[#58B368] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      Search Regional Vets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBookings.slice(0, 2).map((book) => (
                      <div key={book.id} className="p-4 bg-white border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border-green-50 hover:shadow-md transition-shadow">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-800">{book.clinicName}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/40">
                              {book.service}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Pet: <b>{book.petName}</b> ({book.petType}) &bull; Scheduled: <b>{book.date}</b> ({book.time})
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 capitalize border ${getStatusBadge(book.status)}`}>
                            {book.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{book.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                    {userBookings.length > 2 && (
                      <button onClick={() => setActiveSubTab('bookings')} className="text-xs text-[#58B368] font-bold hover:underline flex items-center gap-1">
                        View all {userBookings.length} bookings <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {/* ========== TAB 2: MY PETS ========== */}
          {activeSubTab === 'pets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-2xl text-gray-900">Your Animal Companions</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Manage pet profiles, allergies, booster records, and diagnostics histories.</p>
                </div>
                <button
                  onClick={() => setShowAddPetForm(!showAddPetForm)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#58B368] hover:bg-green-600 text-white rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pet</span>
                </button>
              </div>

              {/* Add pet inline form */}
              {showAddPetForm && (
                <form onSubmit={handleAddPetSubmit} className="bg-green-50/40 p-5 rounded-2xl border border-green-100 space-y-4 text-left">
                  <h4 className="font-display font-bold text-sm text-[#58B368]">Register Companion Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Companion Name *</label>
                      <input type="text" required placeholder="e.g. Coco" value={petName} onChange={(e) => setPetName(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Species Type *</label>
                      <select value={petType} onChange={(e) => setPetType(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 h-[38px]">
                        <option value="Dog">🐶 Dog</option>
                        <option value="Cat">🐱 Cat</option>
                        <option value="Bird">🦜 Bird</option>
                        <option value="Rabbit">🐰 Rabbit</option>
                        <option value="Exotics">🦎 Exotic Companion</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Breed / Mix</label>
                      <input type="text" placeholder="e.g. Golden Retriever" value={breed} onChange={(e) => setBreed(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                    </div>
                  </div>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pet Age (Years)</label>
                      <input type="number" placeholder="e.g. 3" value={age} onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Weight (kg / grams)</label>
                      <input type="text" placeholder="e.g. 25kg" value={weight} onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Medical History & Allergies (Optional)</label>
                    <textarea rows={2} placeholder="e.g. Fully vaccinated, allergic to gluten, regular booster scheduled."
                      value={medHistory} onChange={(e) => setMedHistory(e.target.value)}
                      className="w-full bg-white p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-green-400 leading-relaxed" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddPetForm(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={submittingPet}
                      className="px-5 py-2 bg-[#58B368] text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50">
                      {submittingPet ? 'Saving...' : 'Register Pet Profile'}
                    </button>
                  </div>
                </form>
              )}


              {/* Pet Cards Grid */}
              {!currentUser.pets || currentUser.pets.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <PawPrint className="w-10 h-10 text-green-200 mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">You haven't listed any companions on QuickVet yet.</p>
                  <button onClick={() => setShowAddPetForm(true)}
                    className="px-4 py-2 bg-green-100/60 border border-green-200 text-[#58B368] text-xs font-bold rounded-xl">
                    Add Your First Companion Pet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.pets.map((pet) => (
                    <div key={pet.id} className="p-5 bg-white border border-gray-100 rounded-3xl text-left space-y-3.5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {pet.type === 'Dog' ? '🐶' : pet.type === 'Cat' ? '🐱' : pet.type === 'Bird' ? '🦜' : pet.type === 'Rabbit' ? '🐰' : '🐾'}
                          </span>
                          <div>
                            <h4 className="font-display font-black text-lg text-gray-800 leading-none">{pet.name}</h4>
                            <span className="text-[10px] text-gray-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded uppercase mt-1 inline-block border border-slate-100">
                              {pet.breed || pet.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div><b>Age:</b> {pet.age !== undefined ? `${pet.age} Years` : 'Not specified'}</div>
                        <div><b>Weight:</b> {pet.weight || 'Not logged'}</div>
                      </div>

                      {pet.medicalHistory && pet.medicalHistory.length > 0 && (
                        <div className="bg-green-50/30 p-3 rounded-2xl border border-green-50/50 leading-relaxed text-xs">
                          <h5 className="font-black text-[10px] uppercase text-[#58B368] tracking-wider mb-1 flex items-center gap-1">
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Clinical Notes</span>
                          </h5>
                          <ul className="list-disc pl-3.5 space-y-0.5 text-gray-600">
                            {pet.medicalHistory.map((hist, ind) => (
                              <li key={ind}>{hist}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ========== TAB 3: BOOKINGS (Appointment History) ========== */}
          {activeSubTab === 'bookings' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Your Appointment History</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Track pending validations, home-visit approvals, and completed clinical visits.</p>
              </div>

              {userBookings.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <CalendarDays className="w-10 h-10 text-green-200 mx-auto" />
                  <p className="text-sm text-gray-400">You do not have any vet checkups or home visit bookings registered yet.</p>
                  <button onClick={() => onSelectTab('find_vets')}
                    className="px-5 py-2.5 bg-[#58B368] text-white font-bold rounded-xl text-xs shadow-md">
                    Schedule Care Checkup
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {userBookings.map((book) => (
                    <div key={book.id} className="p-5 bg-white border border-gray-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="space-y-1.5 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display font-extrabold text-gray-800 text-base">{book.clinicName}</span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            book.type === 'home_visit' ? 'bg-green-100 text-[#58B368] border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {book.type === 'home_visit' ? '🏠 Home Doc' : '🏫 Clinic Visit'}
                          </span>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-0.5 leading-relaxed">
                          <li>⚕️ <b>Service:</b> {book.service}</li>
                          <li>🐾 <b>Pet:</b> {book.petName} ({book.petType})</li>
                          <li>📅 <b>Date & Time:</b> {book.date} at {book.time}</li>
                          {book.notes && <li>📝 <b>Notes:</b> <span className="italic text-gray-400">"{book.notes}"</span></li>}
                        </ul>
                      </div>
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className={`text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1 ${getStatusBadge(book.status)}`}>
                          {book.status === 'completed' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{book.status}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ========== TAB 4: EMERGENCY CALL RECORDS ========== */}
          {activeSubTab === 'emergencies' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Emergency Call Records</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Track real-time rescue states and phone coordinates submitted under urgent pet healthcare scenarios.</p>
              </div>

              {userEmergencies.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <AlertTriangle className="w-10 h-10 text-emerald-200 mx-auto" />
                  <p className="text-sm text-gray-400">Your profile doesn't have any logged emergency alerts history.</p>
                  <button onClick={() => onSelectTab('emergency')}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                    View Emergency Pipeline
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {userEmergencies.map((em) => (
                    <div key={em.id} className="p-5 bg-white border border-emerald-50 rounded-3xl relative overflow-hidden text-left space-y-3 shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">
                            Critical Incident Card
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{em.date} at {em.time}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${getStatusBadge(em.status)}`}>
                          ● {em.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p className="flex items-center gap-1"><PawPrint className="w-3 h-3 text-green-400" /> <b>Pet:</b> {em.petName} ({em.petType})</p>
                        <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-400" /> <b>Phone:</b> {em.phone}</p>
                        <p className="sm:col-span-2 flex items-start gap-1"><MapPin className="w-3 h-3 text-red-400 mt-0.5" /> <b>Location:</b> {em.address}</p>
                      </div>

                      {/* Symptom description in high-contrast box */}
                      <div className="bg-red-50/60 p-3 rounded-xl border border-red-100/60 text-xs text-red-800 italic">
                        <b className="not-italic text-red-600">Symptoms:</b> "{em.description}"
                      </div>

                      {em.acceptedByClinicId && (
                        <div className="pt-2 border-t text-xs text-green-700 font-bold flex items-center gap-1.5 bg-green-50/50 p-2.5 rounded-xl border border-green-100">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          <span>Accepted by: <b>{em.acceptedByClinicName}</b></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* ========== TAB 5: FAVORITES ========== */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Your Favorite Clinics</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Quick access to highly rated veterinarians you saved for routine medical schedules.</p>
              </div>

              {favoriteClinics.length === 0 ? (
                <div className="p-12 border rounded-3xl text-center space-y-2 border-dashed border-gray-100 bg-slate-50">
                  <Heart className="w-10 h-10 text-green-200 mx-auto" />
                  <p className="text-xs text-gray-400">You haven't flagged any veterinary stations in your favorites yet.</p>
                  <button onClick={() => onSelectTab('find_vets')}
                    className="px-4 py-2 bg-[#58B368] text-white text-xs font-bold rounded-xl shadow-md">
                    Flag Local Clinics
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteClinics.map((fc) => (
                    <div key={fc.id} className="p-4 bg-white border border-gray-100 rounded-3xl flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:border-[#58B368]/30 transition-all">
                      <img
                        src={fc.imageUrl}
                        alt={fc.name}
                        className="w-16 h-16 object-cover rounded-2xl flex-shrink-0 border border-green-50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="leading-tight space-y-1.5 flex-grow">
                        <h4 className="font-display font-bold text-gray-800 text-sm line-clamp-1">{fc.name}</h4>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-green-400" /> {fc.area}, {fc.city}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-lime-600 font-bold">★ {fc.rating} ({fc.reviewsCount} reviews)</span>
                          <button
                            onClick={() => onSelectTab('find_vets')}
                            className="text-[10px] font-bold text-[#58B368] hover:underline flex items-center gap-0.5"
                          >
                            Book Checkup <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
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
