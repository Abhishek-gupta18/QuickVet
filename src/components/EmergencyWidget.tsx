import React, { useState, useEffect } from 'react';
import { Phone, Check, Activity, AlertTriangle, Play, ShieldAlert, Sparkles, X, ChevronRight, Clock, MapPin } from 'lucide-react';
import { User, EmergencyRequest } from '../types';
import confetti from 'canvas-confetti';

interface EmergencyWidgetProps {
  currentUser: User | null;
  onOpenAuth: (type: 'login' | 'signup') => void;
  onRequestSubmitted?: (req: EmergencyRequest) => void;
}

export default function EmergencyWidget({
  currentUser,
  onOpenAuth,
  onRequestSubmitted,
}: EmergencyWidgetProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [submitting, setSubmitting] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Suggested common veterinary hazards in India
  const commonHazards = [
    'Bleeding / Injury from street accident',
    'Ingested toxic substance (chocolate, soap, raisin)',
    'Continuous vomiting / Severe diarrhea',
    'Seizures / Unconsciousness',
    'Severe breathing difficulties / Heat stroke'
  ];

  // Simulated emergency live progress bar
  useEffect(() => {
    if (!activeEmergency) return;

    // Change step over timer to simulate live vet dispatching in Bengaluru
    const timers: NodeJS.Timeout[] = [];

    // Step 2: Notified (at 3 seconds)
    timers.push(setTimeout(() => {
      setActiveStep(2);
      activeEmergency.status = 'notified';
    }, 4000));

    // Step 3: Accepted by Clinic (at 8 seconds)
    timers.push(setTimeout(() => {
      setActiveStep(3);
      activeEmergency.status = 'accepted';
      activeEmergency.acceptedByClinicId = 'clinic-1';
      activeEmergency.acceptedByClinicName = 'Cessna Lifeline 24x7 Animal Hospital';
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#2F855A', '#58B368', '#BFE7C4']
      });
    }, 9000));

    // Step 4: Treatment begins (at 15 seconds)
    timers.push(setTimeout(() => {
      setActiveStep(4);
      activeEmergency.status = 'completed';
    }, 16000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [activeEmergency]);

  const handleTriggerEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address || !description) {
      alert('Please fill out all mandatory emergency contact details first.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        petOwnerName: currentUser?.name || 'Emergency Guest User',
        petOwnerEmail: currentUser?.email || 'guest-emergency@quickvet.in',
        petName: petName || 'My Pet',
        petType,
        phone,
        address,
        description,
        latitude: 12.9716, // Near Bangalore core
        longitude: 77.5946
      };

      const token = localStorage.getItem('vetfinder_token');
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Endpoint failure');
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data: EmergencyRequest = await res.json();
      setActiveEmergency(data);
      setActiveStep(1); // Start at step 1
      setShowWizard(false);
      
      if (onRequestSubmitted) {
        onRequestSubmitted(data);
      }
    } catch (err) {
      alert('Failed to transmit emergency signal. Please check server logs.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearActiveEmergency = () => {
    setActiveEmergency(null);
    setActiveStep(1);
    setPhone('');
    setAddress('');
    setDescription('');
    setPetName('');
  };

  return (
    <section id="emergency-assistance" className="py-16 bg-gradient-to-b from-white to-[#F4FBF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
        
        {/* Section title header */}
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-wider select-none animate-pulse">
            <ShieldAlert className="w-4.5 h-4.5 fill-emerald-600 text-white" />
            <span>Red Alert Hotline</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-gray-900 tracking-tight">
            Urgent Call Emergency Veterinary Assistance
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Locked in a medical crisis? Trigger an emergency alert to dispatch nearby active animal hospitals, 24/7 ambulance vehicles, or critical trauma trauma doctors instantly.
          </p>
        </div>

        {/* Live Active Emergency Tracking Panel */}
        {activeEmergency ? (
          <div className="max-w-4xl mx-auto bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left space-y-6">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300 animate-pulse" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-50 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md tracking-wider">
                  Signal Broadcasted Live
                </span>
                <h4 className="font-display font-bold text-xl text-gray-900 mt-1">
                  Active Emergency Alert for <b>{activeEmergency.petName}</b>
                </h4>
              </div>
              
              <button
                onClick={clearActiveEmergency}
                className="px-4 py-2 bg-slate-50 border border-slate-200 text-gray-500 hover:text-gray-800 text-xs font-bold rounded-xl active:scale-95 transition-all self-start sm:self-center"
              >
                Clear / New Request
              </button>
            </div>

            {/* Visual timeline elements */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 relative">
              
              {/* Step 1 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' : 'bg-slate-50 border-slate-100 text-gray-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-gray-500'
                  }`}>
                    {activeStep > 1 ? '✓' : '1'}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-display font-bold">Emergency Filed</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-gray-500">
                  Symptoms registered: {activeEmergency.description}
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 2 ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-100 text-gray-400 font-normal'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep >= 2 ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-200 text-gray-500'
                  }`}>
                    {activeStep > 2 ? '✓' : '2'}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-display font-bold">Vets Notified</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-gray-500">
                  Signal distributed to {activeEmergency.petType} specialists within 10km radius.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 3 ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-slate-50 border-slate-100 text-gray-400 font-normal'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep >= 3 ? 'bg-[#4CAF50] text-white' : 'bg-slate-200 text-gray-500'
                  }`}>
                    {activeStep > 3 ? '✓' : '3'}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-display font-bold">Vet Accepted</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-gray-500">
                  {activeStep >= 3 
                    ? `Claimed by ${activeEmergency.acceptedByClinicName || 'Cessna 24/7'}` 
                    : 'Awaiting veterinarian confirmation.'}
                </p>
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-2xl border transition-all ${
                activeStep >= 4 ? 'bg-blue-50 border-blue-200 text-blue-700 font-black' : 'bg-slate-50 border-slate-100 text-gray-400'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    activeStep >= 4 ? 'bg-blue-500 text-white' : 'bg-slate-200 text-gray-500'
                  }`}>
                    {activeStep >= 4 ? '✓' : '4'}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-display font-bold">Treatment Live</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-gray-500">
                  Doctor arrival or clinical stabilization in progress.
                </p>
              </div>

            </div>

            {/* Sim of callbacks */}
            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-spin" />
                <p className="leading-tight">
                  {activeStep === 1 && '🚨 Analyzing critical symptoms. Finding regional veterinaries...'}
                  {activeStep === 2 && '🚨 Sirens active! 4 clinics actively looking at Coco\'s file...'}
                  {activeStep === 3 && `📞 SUCCESS! A doctor from ${activeEmergency.acceptedByClinicName || 'Cessna'} is calling your number ${activeEmergency.phone} right now!`}
                  {activeStep === 4 && '💪 Pet stabilized! Doctor has begun operations successfully.'}
                </p>
              </div>
              
              <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-100/60 shadow-sm font-bold self-start sm:self-center">
                Contact: {activeEmergency.phone}
              </div>
            </div>

          </div>
        ) : (
          /* Visual Steps flow timeline shown by default */
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
              
              {/* Connecting lines for large screens */}
              <div className="hidden sm:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-emerald-200 via-green-200 to-green-100 z-0" />

              {/* Step 1 */}
              <div className="relative z-10 space-y-3 p-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-emerald-50 border-2 border-white">
                  01
                </div>
                <h4 className="font-display font-bold text-gray-800 text-sm">Describe Emergency</h4>
                <p className="text-xs text-gray-500 leading-normal max-w-[200px] mx-auto">
                  Provide pet species and symptom signals on our fast visual form.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 space-y-3 p-4">
                <div className="w-16 h-16 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-green-50 border-2 border-white">
                  02
                </div>
                <h4 className="font-display font-bold text-gray-800 text-sm">Vets Notified</h4>
                <p className="text-xs text-gray-500 leading-normal max-w-[200px] mx-auto">
                  Emergency broadcasts automatically ping all specialists closest to your grid coordinates.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 space-y-3 p-4">
                <div className="w-16 h-16 rounded-2xl bg-[#BFE7C4]/25 text-lime-700 flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-lime-50 border-2 border-white">
                  03
                </div>
                <h4 className="font-display font-bold text-gray-800 text-sm">Vet Accepts</h4>
                <p className="text-xs text-gray-500 leading-normal max-w-[200px] mx-auto">
                  Clinic accepts, fetches your location coordinates, and initiates a phone callback.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative z-10 space-y-3 p-4">
                <div className="w-16 h-16 rounded-2xl bg-green-100 text-[#4CAF50] flex items-center justify-center mx-auto text-xl font-bold shadow-md shadow-green-50 border-2 border-white">
                  04
                </div>
                <h4 className="font-display font-bold text-gray-800 text-sm">Treatment Begins</h4>
                <p className="text-xs text-gray-500 leading-normal max-w-[200px] mx-auto">
                  Doctor initiates primary stabilization, surgery, or emergency care check.
                </p>
              </div>

            </div>

            {/* Huge Red Pulsing Button CTA */}
            <div className="relative inline-block group">
              <div className="absolute -inset-1 rounded-3xl bg-emerald-600 blur opacity-40 group-hover:opacity-75 transition duration-300 animate-pulse" />
              <button
                onClick={() => setShowWizard(true)}
                className="relative px-8 sm:px-12 py-5 sm:py-6 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-base sm:text-xl rounded-2xl sm:rounded-3xl shadow-xl transition-all flex items-center gap-3 cursor-pointer select-none"
              >
                <Phone className="w-6 h-6 fill-white text-white animate-bounce" />
                <span>Request Emergency Assistance</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-400 font-medium">
              Free public service. No login required for guest emergency trauma indexing.
            </p>
          </div>
        )}

        {/* Wizard Panel form popup modal */}
        {showWizard && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-100 flex flex-col text-left">
              
              <div className="bg-emerald-500 text-white p-5 pr-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5.5 h-5.5 fill-white text-emerald-500 animate-bounce" />
                  <div>
                    <h3 className="font-display font-black text-lg">Send Emergency Alert Signal</h3>
                    <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold">24x7 Trauma Dispatch</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="p-1 w-8 h-8 rounded-full bg-black/10 hover:bg-black/25 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTriggerEmergency} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <p className="text-xs text-gray-500 leading-normal bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                  Fill this out as quickly and accurately as possible. Nearby veterinary clinics are notified immediately with your phone contacts and location.
                </p>

                {/* Pet Name & Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pet Name (If known)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bruno / Cat"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Species Type</label>
                    <select
                      value={petType}
                      onChange={(e) => setPetType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 h-[38px]"
                    >
                      <option value="Dog">🐶 Dog</option>
                      <option value="Cat">🐱 Cat</option>
                      <option value="Bird">🦜 Bird / Avian</option>
                      <option value="Rabbit">🐰 Rabbit</option>
                      <option value="Exotics">🦎 Exotic Pet</option>
                    </select>
                  </div>
                </div>

                {/* Phone & Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Your Mobile Phone Number *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210 (Needed for callbacks)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Accident Location Address *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indiranagar Double Road, Opp Cafe Coffee Day"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Hazard selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Common Hazard Presets</label>
                  <div className="flex flex-wrap gap-1.5">
                    {commonHazards.map((haz) => (
                      <button
                        key={haz}
                        type="button"
                        onClick={() => setDescription(haz)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold text-left transition-all ${
                          description === haz
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        {haz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description textarea */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Custom Symptoms / Injury Details *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what happened, any bleeding, difficulty breathing, or symptoms..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-400 leading-normal"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Activity className="w-4 h-4 animate-spin-slow text-white" />
                  <span>{submitting ? 'Broadcasting Alert Signal...' : 'Broadcast Urgent Red Alert'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

