import React, { useState } from 'react';
import { X, Calendar, Clock, Smile, ChevronRight } from 'lucide-react';
import { VetClinic, User } from '../types';

interface BookingModalProps {
  clinic: VetClinic;
  currentUser: User | null;
  onClose: () => void;
  onSubmitBooking: (bookingData: any) => Promise<void>;
  onOpenAuth: (type: 'login' | 'signup') => void;
}

export default function BookingModal({
  clinic,
  currentUser,
  onClose,
  onSubmitBooking,
  onOpenAuth,
}: BookingModalProps) {
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [service, setService] = useState('General Consultation');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [type, setType] = useState<'clinic_visit' | 'home_visit'>('clinic_visit');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Suggested Indian city timings
  const timeslots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!petName || !date || !time) {
      alert('Please fill out all mandatory fields: Pet Name, Date, and Time Slot.');
      return;
    }

    setLoading(true);
    try {
      await onSubmitBooking({
        clinicId: clinic.id,
        clinicName: clinic.name,
        petOwnerName: currentUser.name,
        petOwnerEmail: currentUser.email,
        petName,
        petType,
        service,
        date,
        time,
        type,
        notes,
      });
      setSuccess(true);
    } catch (err) {
      alert('Booking request failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-[#F4FBF3] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-green-100 flex flex-col">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#58B368] to-[#BFE7C4] px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h3 className="font-display font-black text-lg sm:text-xl">Book Veterinary Slot</h3>
            <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{clinic.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/10 hover:bg-black/25 rounded-xl text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest fallback block */}
        {!currentUser ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-[#58B368]">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-lg text-gray-800">Authorization Required First</h4>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Please sign up, or log in with your account to schedule clinic appointments, track veterinary visits, and access personal medical histories.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="px-5 py-2.5 border border-green-200 text-[#58B368] font-bold rounded-xl text-sm"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('signup');
                }}
                className="px-5 py-2.5 bg-[#58B368] text-white font-bold rounded-xl text-sm shadow-md shadow-green-100"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : success ? (
          /* Successful visual confirmation */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-[#4CAF50]">
              <Smile className="w-8 h-8" />
            </div>
            <h4 className="font-display font-bold text-xl text-gray-800">Booking Requested!</h4>
            <div className="bg-white p-4.5 rounded-2xl border border-green-100/50 text-left space-y-2 text-sm text-gray-600">
              <div className="flex justify-between font-bold text-gray-800 border-b pb-1.5 border-green-50 mb-1.5">
                <span>{service}</span>
                <span className="capitalize text-xs px-2 py-0.5 rounded-md bg-green-50 text-[#58B368]">{type.replace('_', ' ')}</span>
              </div>
              <p><b>Clinic:</b> {clinic.name}</p>
              <p><b>Pet:</b> {petName} ({petType})</p>
              <p><b>Schedule:</b> {date} at {time}</p>
            </div>
            <p className="text-xs text-gray-400">
              Your appointment status is currently <b>Pending</b>. You will be notified immediately when the clinic veterinarian reviews and approves the slot.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm mt-3"
            >
              Done, Close Modal
            </button>
          </div>
        ) : (
          /* Main booking form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* Choose Visit Type */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Appointment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('clinic_visit')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    type === 'clinic_visit'
                      ? 'border-[#58B368] bg-green-50/70 text-[#58B368]'
                      : 'border-slate-200 bg-white text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  🏫 In-Clinic Visit
                </button>
                <button
                  type="button"
                  disabled={!clinic.hasHomeVisit}
                  onClick={() => setType('home_visit')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center relative cursor-pointer ${
                    !clinic.hasHomeVisit ? 'opacity-40 cursor-not-allowed' : ''
                  } ${
                    type === 'home_visit'
                      ? 'border-[#58B368] bg-green-50/70 text-[#58B368]'
                      : 'border-slate-200 bg-white text-gray-500 hover:bg-slate-50'
                  }`}
                >
                  🏠 Doctor Home Visit
                  {!clinic.hasHomeVisit && (
                    <span className="absolute -top-1.5 right-1 bg-emerald-100 text-emerald-600 font-bold text-[8px] px-1 rounded">Unavailable</span>
                  )}
                </button>
              </div>
            </div>

            {/* Pet details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Pet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coco / Leo"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Pet Species</label>
                <select
                  value={petType}
                  onChange={(e) => setPetType(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368] h-[46px]"
                >
                  <option value="Dog">🐶 Dog</option>
                  <option value="Cat">🐱 Cat</option>
                  <option value="Bird">🦜 Bird / Avian</option>
                  <option value="Rabbit">🐰 Rabbit</option>
                  <option value="Exotics">🦎 Exotic Companion</option>
                </select>
              </div>
            </div>

            {/* Choose Service */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Choose Service Required</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368]"
              >
                {clinic.services.map((serv) => (
                  <option key={serv} value={serv}>{serv}</option>
                ))}
              </select>
            </div>

            {/* Date and Hour timeslots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Appointment Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368] h-[46px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Time Slot *</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368] h-[46px]"
                >
                  {timeslots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Symptoms or Special Requests (Optional)</label>
              <textarea
                rows={2}
                placeholder="Describe pet behavior, medical history notes, or instructions for the veterinarian..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368]"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#58B368] hover:bg-green-600 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Submitting Details...' : 'Confirm Appointment Reservation'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

