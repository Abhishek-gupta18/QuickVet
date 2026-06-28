import React, { useState } from 'react';
import { X, Landmark, ClipboardCheck, Zap, ShieldCheck, Heart, Upload, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VetDocument } from '../types';

interface VetRegistrationModalProps {
  onClose: () => void;
  onSubmitRegistration: (clinicData: any) => Promise<void>;
}

export default function VetRegistrationModal({
  onClose,
  onSubmitRegistration,
}: VetRegistrationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Indiranagar'); // Common Bengaluru seed neighborhood
  const [city, setCity] = useState('Bengaluru');
  const [phone, setPhone] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 08:30 PM');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  
  // Specialists
  const [spDog, setSpDog] = useState(true);
  const [spCat, setSpCat] = useState(true);
  const [spBird, setSpBird] = useState(false);
  const [spRabbit, setSpRabbit] = useState(false);
  const [spExotics, setSpExotics] = useState(false);

  // Settings
  const [hasEmergency, setHasEmergency] = useState(false);
  const [hasHomeVisit, setHasHomeVisit] = useState(false);
  const [servicesInput, setServicesInput] = useState('General Consultation, Vaccination, Small surgeries, Deworming');
  const [documents, setDocuments] = useState<Record<string, VetDocument | null>>({
    medicalLicense: null,
    governmentId: null,
    degreeCertificate: null,
    clinicProof: null,
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  // Auto-generate coordinates reasonably clustered inside Bengaluru to display instantly on our map!
  const generateRandomBengaluruCoordinates = () => {
    // Bengaluru center is roughly 12.9716, 77.5946
    // We add a subtle offset
    const randomOffsetLat = (Math.random() - 0.5) * 0.08;
    const randomOffsetLng = (Math.random() - 0.5) * 0.08;
    return {
      lat: (12.9716 + randomOffsetLat).toFixed(4),
      lng: (77.5946 + randomOffsetLng).toFixed(4),
    };
  };

  const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleDocumentUpload = async (key: string, label: string, file: File | null) => {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Please upload a document under 2.5 MB for this demo.');
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        id: `${key}-${Date.now()}`,
        label,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !phone || !veterinarianName || !licenseNumber) {
      alert('Mandatory details: Doctor Name, License Number, Clinic Name, Address, and Phone are required.');
      return;
    }

    const uploadedDocuments = Object.values(documents).filter(Boolean) as VetDocument[];
    if (uploadedDocuments.length < 3) {
      alert('Please upload at least Medical License, Government ID, and Degree Certificate for admin verification.');
      return;
    }

    setLoading(true);
    // Assemble specialists array
    const specialists: string[] = [];
    if (spDog) specialists.push('Dog');
    if (spCat) specialists.push('Cat');
    if (spBird) specialists.push('Bird');
    if (spRabbit) specialists.push('Rabbit');
    if (spExotics) specialists.push('Exotics');

    const coordinates = generateRandomBengaluruCoordinates();
    const services = servicesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const payload = {
      name,
      description,
      address,
      area,
      city,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      phone,
      specialists,
      hasEmergency,
      hasHomeVisit,
      workingHours,
      services,
      veterinarianName,
      licenseNumber,
      yearsOfExperience,
      verificationDocuments: uploadedDocuments,
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600' // Generic premium clinic
    };

    try {
      await onSubmitRegistration(payload);
      setRegistered(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#58B368', '#BFE7C4', '#4CAF50']
      });
    } catch (err) {
      alert('Clinic registration failed. Check container database logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-green-50 flex flex-col h-[85vh]">
        
        {/* Banner header top */}
        <div className="bg-gradient-to-r from-green-600 via-[#4CAF50] to-[#BFE7C4] px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Landmark className="w-6 h-6 animate-pulse" />
            <div>
              <h3 className="font-display font-black text-lg md:text-xl">Enlist Your Clinic Station</h3>
              <p className="text-white/80 text-xs mt-0.5">Grow localized clientele and support emergency rescue networks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black/10 hover:bg-black/25 rounded-xl text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {registered ? (
          /* Success confirmation */
          <div className="p-8 text-center space-y-5 my-auto">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ClipboardCheck className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="font-display font-black text-2xl text-gray-900">Congratulations Doctor!</h4>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150/45 text-left max-w-md mx-auto space-y-1 text-xs text-gray-600">
              <p className="font-black text-gray-800 text-sm pb-1.5 border-b border-slate-200">Vet Details Saved Successfully</p>
              <p className="pt-1.5">🔬 <b>Clinic Station:</b> {name}</p>
              <p>📍 <b>Map neighborhood:</b> {area}, {city}</p>
              <p>📞 <b>Helpline:</b> {phone}</p>
              <p>📎 <b>Verification files:</b> {Object.values(documents).filter(Boolean).length} uploaded</p>
              <p className="text-[#4CAF50] font-black mt-1">● Sent to admin verification queue before public activation.</p>
            </div>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Your clinic profile and documents are saved. QuickVet admins can now inspect your license, identity proof, degree, and clinic proof before approval.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#4CAF50] hover:bg-green-700 text-white font-extrabold rounded-xl text-sm transition-all cursor-pointer"
            >
              Back to Home page
            </button>
          </div>
        ) : (
          /* Registration Form split in two panels: Benefits vs Inputs Form */
          <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Column: Benefits (4/12 cols) */}
            <div className="md:col-span-4 bg-green-50/50 p-5 rounded-2xl border border-green-100/30 text-left space-y-4 max-h-[60vh] overflow-y-auto">
              <span className="text-[10px] uppercase font-black text-[#4CAF50] bg-white/80 py-1 px-2 rounded-md shadow-inner">
                Network Perks
              </span>
              <h4 className="font-display font-bold text-gray-800 text-base">Are You a Veterinarian?</h4>
              
              <ul className="space-y-4 text-xs text-gray-600 leading-normal">
                <li className="flex gap-2 items-start">
                  <div className="bg-green-600/10 p-1 rounded-md text-green-700 mt-0.5">
                    <Zap className="w-3.5 h-3.5 fill-green-700" />
                  </div>
                  <div>
                    <b>Supercharged Visibility</b>
                    <span className="block text-[10px] text-gray-400">Put your practice directly in front of thousands of local pet parents.</span>
                  </div>
                </li>

                <li className="flex gap-2 items-start">
                  <div className="bg-emerald-500/10 p-1 rounded-md text-emerald-600 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <b>Red Alert Trauma calls</b>
                    <span className="block text-[10px] text-gray-400">Receive verified critical emergency request files filtered in your local area radius.</span>
                  </div>
                </li>

                <li className="flex gap-2 items-start">
                  <div className="bg-lime-500/10 p-1 rounded-md text-lime-700 mt-0.5">
                    <Heart className="w-3.5 h-3.5 fill-lime-600 text-lime-600" />
                  </div>
                  <div>
                    <b>Grow Local Clientele</b>
                    <span className="block text-[10px] text-gray-400">Manage digital slot bookings and home doctor visitation requests with easy approvals.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right Column: Inputs fields Form (8/12 cols) */}
            <form onSubmit={handleSubmit} className="md:col-span-8 space-y-4 text-left">
              <h4 className="font-display font-black text-gray-800 text-sm border-b pb-1.5 border-green-50">Clinic Details Form</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Veterinarian Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Neha Kapoor"
                    value={veterinarianName}
                    onChange={(e) => setVeterinarianName(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vet Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KVC-2024-77112"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 8 years"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Clinic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cessna Lifeline 2.0"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Clinic Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 80 4369 3333"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Short Description Comments</label>
                <textarea
                  rows={2}
                  placeholder="State your specialized diagnostics equipment, ICU capabilities, and clinical mission statements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50] leading-normal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Area / Neighborhood Landmark *</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50] h-[38px] font-semibold"
                  >
                    <option value="Indiranagar">Indiranagar</option>
                    <option value="Domlur">Domlur</option>
                    <option value="Koramangala">Koramangala</option>
                    <option value="Whitefield">Whitefield</option>
                    <option value="HSR Layout">HSR Layout</option>
                    <option value="Hebbal">Hebbal</option>
                    <option value="Jayanagar">Jayanagar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">City Hub</label>
                  <input
                    type="text"
                    readOnly
                    value={city}
                    className="w-full bg-slate-100 p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none outline-none font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Clinic Postal address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10, Stage 2, Domlur Double Rd, Phase 1, Indiranagar, Bengaluru, 560038"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Working hours schedule</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9:00 AM - 9:00 PM / 24 Hours Open"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Services List (Comma Separated)</label>
                  <input
                    type="text"
                    required
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-[#4CAF50]"
                  />
                </div>
              </div>

              {/* Checkboxes for services capabilities & Specialists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 pb-1">
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Facilities Available</label>
                  <div className="flex flex-col gap-1 text-[11px] font-semibold text-gray-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasEmergency}
                        onChange={(e) => setHasEmergency(e.target.checked)}
                        className="rounded text-[#4CAF50]"
                      />
                      <span>Emergency Trauma Unit (24x7)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasHomeVisit}
                        onChange={(e) => setHasHomeVisit(e.target.checked)}
                        className="rounded text-[#4CAF50]"
                      />
                      <span>Doctor Home Checkup Visits</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Species Specialists</label>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-semibold text-gray-600">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={spDog} onChange={(e) => setSpDog(e.target.checked)} />
                      <span>Dogs</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={spCat} onChange={(e) => setSpCat(e.target.checked)} />
                      <span>Cats</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={spBird} onChange={(e) => setSpBird(e.target.checked)} />
                      <span>Birds / Avian</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={spRabbit} onChange={(e) => setSpRabbit(e.target.checked)} />
                      <span>Rabbits</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-700" />
                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wide">Verification Documents *</label>
                    <p className="text-[10px] text-gray-400">PDF, PNG, or JPG files. Admin can open these from the dashboard.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'medicalLicense', label: 'Medical License' },
                    { key: 'governmentId', label: 'Government ID Proof' },
                    { key: 'degreeCertificate', label: 'Degree / Certificate' },
                    { key: 'clinicProof', label: 'Clinic / Hospital Proof' },
                  ].map((doc) => {
                    const uploaded = documents[doc.key];
                    return (
                      <label key={doc.key} className="block bg-white border border-slate-200 rounded-2xl p-3 cursor-pointer hover:border-green-300 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(e) => handleDocumentUpload(doc.key, doc.label, e.target.files?.[0] || null)}
                        />
                        <span className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <FileText className="w-4 h-4 text-green-600" />
                          {doc.label}
                        </span>
                        <span className="block mt-1 text-[10px] text-slate-400 truncate">
                          {uploaded ? uploaded.fileName : 'Click to upload'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Register button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#4CAF50] hover:bg-green-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-green-100 flex items-center justify-center gap-1 cursor-pointer"
              >
                {loading ? 'Transmitting credentials...' : 'Register Veterinary Hospital Live'}
              </button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}

