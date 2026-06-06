import React, { useState } from 'react';
import { LayoutDashboard, PawPrint, CalendarDays, ShieldAlert, Heart, Settings, Plus, ClipboardList, CheckCircle, Clock } from 'lucide-react';
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
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pets' | 'bookings' | 'emergencies' | 'favorites'>('overview');
  
  // States for Adding a Pet form
  const [showAddPetForm, setShowAddPetForm] = useState(false);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [medHistory, setMedHistory] = useState('');
  const [submittingPet, setSubmittingPet] = useState(false);

  // Filter lists based on currentUser
  const userBookings = bookings.filter(b => b.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase());
  const userEmergencies = emergencies.filter(e => e.petOwnerEmail.toLowerCase() === currentUser.email.toLowerCase());
  const favoriteClinics = clinics.filter(c => currentUser.favoriteClinics?.includes(c.id));

  // Sidebar navigation options
  const sidebarOpts = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pets', label: 'My Pets', icon: PawPrint, count: currentUser.pets?.length || 0 },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays, count: userBookings.length },
    { id: 'emergencies', label: 'Emergency Requests', icon: ShieldAlert, count: userEmergencies.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favoriteClinics.length },
  ];

  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName || !petType) {
      alert('Please fill out Name and Species Type');
      return;
    }
    setSubmittingPet(true);
    try {
      await onAddPet({
        email: currentUser.email,
        name: petName,
        type: petType,
        breed,
        age,
        weight,
        medicalHistory: medHistory,
      });

      // Clear Form on success
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[75vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Sidebar navigation Panel (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-orange-50 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-orange-50 pb-5">
            <img
              src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full border border-orange-200"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h4 className="font-display font-bold text-gray-900 line-clamp-1">{currentUser.name}</h4>
              <span className="text-[10px] uppercase font-bold text-[#FF914D] bg-orange-100/40 py-0.5 px-2 rounded-md">Pet Parent</span>
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
                      ? 'bg-orange-50 text-[#FF914D] shadow-inner-sm'
                      : 'text-gray-600 hover:text-[#FF914D] hover:bg-orange-50/20'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-[#FF914D]' : 'text-gray-400'}`} />
                  <span className="flex-grow text-left">{opt.label}</span>
                  {opt.count !== undefined && opt.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                      isActive ? 'bg-[#FF914D] text-white' : 'bg-slate-100 text-gray-500'
                    }`}>{opt.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Tabular Content Pane (9 Cols) */}
        <div className="lg:col-span-9 bg-white p-6 sm:p-8 rounded-3xl border border-orange-50 shadow-sm text-left minimum-h-[500px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Pet Care Hub</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Quickly glance at your active bookings, companions profiles, and rescue histories.</p>
              </div>

              {/* General metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div onClick={() => setActiveSubTab('pets')} className="bg-[#FFF8F0] border border-orange-100/60 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-[#FF914D] transition-colors shadow-sm">
                  <span className="text-2xl">🐶</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display">{currentUser.pets?.length || 0}</span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Registered Pets</span>
                  </div>
                </div>

                <div onClick={() => setActiveSubTab('bookings')} className="bg-green-50/50 border border-green-100/40 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-green-600 transition-colors shadow-sm">
                  <span className="text-2xl">🗓️</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display">{userBookings.length}</span>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Total Appointments</span>
                  </div>
                </div>

                <div onClick={() => setActiveSubTab('emergencies')} className="bg-rose-50/50 border border-rose-100/40 p-5 rounded-2xl space-y-2 cursor-pointer hover:border-rose-500 transition-colors shadow-sm">
                  <span className="text-2xl">🚨</span>
                  <div className="leading-tight">
                    <span className="block text-2xl font-black text-gray-800 font-display">{userEmergencies.length}</span>
                    <span className="text-xs text-gray-400 font-semibold uppercase font-sans">Distress Requests</span>
                  </div>
                </div>
              </div>

              {/* Recent Booking tracker block */}
              <div className="space-y-3.5 pt-4">
                <h4 className="font-display font-bold text-gray-800 text-sm border-b pb-2">Active Care Schedules</h4>
                {userBookings.length === 0 ? (
                  <div className="bg-slate-50 border p-6 rounded-2xl text-center space-y-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">You do not have any pending or historical bookings scheduled yet.</p>
                    <button
                      onClick={() => onSelectTab('find_vets')}
                      className="px-4 py-2 bg-[#FF914D] text-white text-xs font-bold rounded-xl"
                    >
                      Search Regional Vets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBookings.slice(0, 2).map((book) => (
                      <div key={book.id} className="p-4 bg-white border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border-orange-50">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-800">{book.clinicName}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200/40">{book.service}</span>
                          </div>
                          <p className="text-xs text-gray-400">Pet Target: <b>{book.petName}</b> ({book.petType}) • Scheduled: <b>{book.date}</b> ({book.time})</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 capitalize ${
                            book.status === 'completed' ? 'bg-green-100 text-green-700' :
                            book.status === 'approved' ? 'bg-blue-100 text-blue-700 font-semibold' :
                            book.status === 'cancelled' ? 'bg-stone-100 text-stone-500' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {book.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>{book.status}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY PETS */}
          {activeSubTab === 'pets' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-2xl text-gray-900">Your Animal Companions</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Manage pets profile, allergies lists, booster records, and diagnostics histories.</p>
                </div>
                
                <button
                  onClick={() => setShowAddPetForm(!showAddPetForm)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#FF914D] hover:bg-orange-600 text-white rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pet</span>
                </button>
              </div>

              {/* Add pet form */}
              {showAddPetForm && (
                <form onSubmit={handleAddPetSubmit} className="bg-orange-50/40 p-5 rounded-2xl border border-orange-100 space-y-4 animate-fade-in text-left">
                  <h4 className="font-display font-bold text-sm text-[#FF914D]">Register Companion Info</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Companion Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Coco"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Species Type</label>
                      <select
                        value={petType}
                        onChange={(e) => setPetType(e.target.value)}
                        className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400 h-[38px]"
                      >
                        <option value="Dog">🐶 Dog</option>
                        <option value="Cat">🐱 Cat</option>
                        <option value="Bird">🦜 Bird</option>
                        <option value="Rabbit">🐰 Rabbit</option>
                        <option value="Exotics">🦎 Exotic Companion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Breed / Mix Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Golden Retriever / Indie"
                        value={breed}
                        onChange={(e) => setBreed(e.target.value)}
                        className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pet Age (Years)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Weight (kg / grams)</label>
                      <input
                        type="text"
                        placeholder="e.g. 25kg"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Medical History & Allergies (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Fully vaccinated against rabies, allergic to gluten products, regular booster scheduled."
                      value={medHistory}
                      onChange={(e) => setMedHistory(e.target.value)}
                      className="w-full bg-white p-2.5 border rounded-xl text-xs focus:outline-none focus:border-orange-400 leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddPetForm(false)}
                      className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPet}
                      className="px-5 py-2 bg-[#FF914D] text-white font-bold rounded-xl text-xs shadow-md"
                    >
                      {submittingPet ? 'Saving...' : 'Register Pet Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* Pets Grid */}
              {!currentUser.pets || currentUser.pets.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-medium">You haven't listed any of your furry or feathered family members on QuickVet yet.</p>
                  <button
                    onClick={() => setShowAddPetForm(true)}
                    className="px-4 py-2 bg-orange-100/60 border border-orange-200 text-[#FF914D] text-xs font-bold rounded-xl"
                  >
                    Add Your First Companion Pet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentUser.pets.map((pet) => (
                    <div key={pet.id} className="p-5 bg-white border border-gray-100 rounded-3xl text-left space-y-3.5 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">
                            {pet.type === 'Dog' ? '🐶' : pet.type === 'Cat' ? '🐱' : pet.type === 'Bird' ? '🦜' : '🐾'}
                          </span>
                          <div>
                            <h4 className="font-display font-black text-lg text-gray-800 leading-none">{pet.name}</h4>
                            <span className="text-[10px] text-gray-400 font-bold bg-slate-150 bg-slate-50 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                              {pet.breed || pet.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <b>Age:</b> {pet.age !== undefined ? `${pet.age} Years` : 'Not specified'}
                        </div>
                        <div>
                          <b>Weight:</b> {pet.weight || 'Not logged'}
                        </div>
                      </div>

                      {pet.medicalHistory && pet.medicalHistory.length > 0 && (
                        <div className="bg-orange-50/30 p-3 rounded-2xl border border-orange-50/50 leading-relaxed text-xs">
                          <h5 className="font-black text-[10px] uppercase text-[#FF914D] tracking-wider mb-1 flex items-center gap-1">
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>Clinical Notes File</span>
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

          {/* TAB 3: BOOKINGS */}
          {activeSubTab === 'bookings' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Your Appointment History</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Keep tab of pending vet validations, doctor home-visits approvals, and complete clinical visits.</p>
              </div>

              {userBookings.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">You do not have any pending vet checkups or home visit bookings registered yet.</p>
                  <button
                    onClick={() => onSelectTab('find_vets')}
                    className="px-5 py-2.5 bg-[#FF914D] text-white font-bold rounded-xl text-xs"
                  >
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
                            book.type === 'home_visit' ? 'bg-orange-100 text-[#FF914D]' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {book.type === 'home_visit' ? '🏠 Home Doc' : '🏫 Clinic Visit'}
                          </span>
                        </div>

                        <ul className="text-xs text-gray-500 space-y-0.5 leading-relaxed">
                          <li>⚕️ <b>Service:</b> {book.service}</li>
                          <li>🐱 <b>Pet:</b> {book.petName} ({book.petType})</li>
                          <li>📅 <b>Date & Time:</b> {book.date} at {book.time}</li>
                          {book.notes && <li>📝 <b>Parent Notes:</b> <span className="italic">"{book.notes}"</span></li>}
                        </ul>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className={`text-xs px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] border flex items-center gap-1 ${
                          book.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                          book.status === 'approved' ? 'bg-blue-50 border-blue-200 text-blue-700 font-black' :
                          book.status === 'cancelled' ? 'bg-stone-50 border-stone-200 text-stone-500' :
                          'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                          <span>{book.status}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EMERGENCIES */}
          {activeSubTab === 'emergencies' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Emergency Call Records</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Track real-time rescue states and phone coordinates submitted under urgent pet healthcare scenarios.</p>
              </div>

              {userEmergencies.length === 0 ? (
                <div className="bg-slate-50 border p-12 rounded-3xl text-center space-y-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Your profile doesn't have any logged emergency alerts history.</p>
                  <button
                    onClick={() => onSelectTab('emergency')}
                    className="px-4 py-2 bg-red-100 text-red-700 text-xs font-bold rounded-xl"
                  >
                    View Emergency Pipeline
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {userEmergencies.map((em) => (
                    <div key={em.id} className="p-5 bg-white border border-red-50 rounded-3xl relative overflow-hidden text-left space-y-3 shadow-sm border-l-4 border-l-red-500">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Critical Incident Card</span>
                          <span className="text-xs text-gray-400 font-medium pl-2">{em.date} at {em.time}</span>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          em.status === 'completed' ? 'bg-green-100 text-green-700' :
                          em.status === 'accepted' ? 'bg-blue-100 text-blue-700 font-bold' :
                          em.status === 'notified' ? 'bg-orange-100 text-[#FF914D]' :
                          'bg-amber-100 text-amber-700 animate-pulse'
                        }`}>
                          ● {em.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p>🐾 <b>Pet Companion:</b> {em.petName} ({em.petType})</p>
                        <p>📞 <b>Rescue Phone:</b> {em.phone}</p>
                        <p className="sm:col-span-2">📍 <b>Incident Location:</b> {em.address}</p>
                        <p className="sm:col-span-2 bg-rose-50/40 p-2.5 rounded-xl text-red-800 border border-rose-50 italic">
                          <b>Symptom Description:</b> "{em.description}"
                        </p>
                      </div>

                      {em.acceptedByClinicId && (
                        <div className="pt-2 border-t text-xs text-green-700 font-bold flex items-center gap-1.5 bg-green-50/50 p-2 rounded-xl">
                          <span>✅ Successfully accepted by: <b>{em.acceptedByClinicName}</b></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FAVORITES */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-6">
              <div className="border-b pb-3 space-y-1">
                <h3 className="font-display font-black text-2xl text-gray-900">Your Favorite Clinics</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Quick access to highly rated veterinarians you saved for routine medical schedules.</p>
              </div>

              {favoriteClinics.length === 0 ? (
                <div className="p-12 border rounded-3xl text-center space-y-2 border-dashed border-gray-100 bg-slate-50">
                  <p className="text-xs text-gray-400">You haven't flagged any veterinary stations in your favorites dashboard yet.</p>
                  <button
                    onClick={() => onSelectTab('find_vets')}
                    className="px-4 py-2 bg-[#FF914D] text-white text-xs font-bold rounded-xl"
                  >
                    Flag Local Clinics
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteClinics.map((fc) => (
                    <div key={fc.id} className="p-4 bg-white border border-gray-150 rounded-3xl flex items-center gap-4 text-left shadow-sm">
                      <img
                        src={fc.imageUrl}
                        alt={fc.name}
                        className="w-16 h-16 object-cover rounded-2xl flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="leading-tight space-y-1.5 flex-grow">
                        <h4 className="font-display font-bold text-gray-800 text-sm line-clamp-1">{fc.name}</h4>
                        <p className="text-[10px] text-gray-400">📍 {fc.area}, {fc.city}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-500 font-bold">★ {fc.rating} ({fc.reviewsCount})</span>
                          <button
                            onClick={() => onSelectTab('find_vets')}
                            className="text-[10px] font-bold text-[#FF914D] hover:underline"
                          >
                            Book Checkup →
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
