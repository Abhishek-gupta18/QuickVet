import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, FileText, Landmark, ShieldCheck, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VetDocument } from '../types';

interface VetRegistrationModalProps {
  onClose: () => void;
  onSubmitRegistration: (clinicData: any) => Promise<void>;
}

const inputClass = 'w-full bg-white p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#4CAF50]';
const labelClass = 'block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5';

const steps = [
  { title: 'Personal', hint: 'Identity and contact details' },
  { title: 'Professional', hint: 'License, education, expertise' },
  { title: 'Clinic', hint: 'Practice and availability' },
  { title: 'Documents', hint: 'Uploads and final review' },
];

export default function VetRegistrationModal({
  onClose,
  onSubmitRegistration,
}: VetRegistrationModalProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [phone, setPhone] = useState('');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 08:30 PM');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [residentialAddress, setResidentialAddress] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [education, setEducation] = useState('');
  const [university, setUniversity] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('English, Kannada, Hindi');
  const [weeklyAvailability, setWeeklyAvailability] = useState('Monday to Saturday');
  const [spDog, setSpDog] = useState(true);
  const [spCat, setSpCat] = useState(true);
  const [spBird, setSpBird] = useState(false);
  const [spRabbit, setSpRabbit] = useState(false);
  const [spExotics, setSpExotics] = useState(false);
  const [hasEmergency, setHasEmergency] = useState(false);
  const [hasHomeVisit, setHasHomeVisit] = useState(false);
  const [servicesInput, setServicesInput] = useState('General Consultation, Vaccination, Small surgeries, Deworming');
  const [documents, setDocuments] = useState<Record<string, VetDocument | null>>({
    veterinaryLicense: null,
    governmentId: null,
    degreeCertificate: null,
    registrationCertificate: null,
    profilePhotograph: null,
    clinicPhotograph: null,
    additionalCertifications: null,
  });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const generateRandomBengaluruCoordinates = () => {
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

  const requiredDocs = ['veterinaryLicense', 'governmentId', 'degreeCertificate', 'registrationCertificate', 'profilePhotograph'];
  const uploadedDocuments = Object.values(documents).filter(Boolean) as VetDocument[];

  const validateStep = (targetStep = step) => {
    if (targetStep === 0) {
      if (!veterinarianName || !dateOfBirth || !gender || !phone || !emailAddress || !residentialAddress || !city || !stateName || !pinCode) {
        alert('Please complete all required personal information.');
        return false;
      }
    }
    if (targetStep === 1) {
      if (!registrationNumber || !licenseNumber || !education || !university || !yearsOfExperience || !consultationFee) {
        alert('Please complete all required professional information.');
        return false;
      }
    }
    if (targetStep === 2) {
      if (!name || !address || !area || !workingHours || !weeklyAvailability || !languagesSpoken || !servicesInput) {
        alert('Please complete all required clinic and availability details.');
        return false;
      }
    }
    if (targetStep === 3 && requiredDocs.some((key) => !documents[key])) {
      alert('Please upload Veterinary License, Government ID, Degree Certificate, Registration Certificate, and Profile Photograph.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (![0, 1, 2, 3].every((index) => validateStep(index))) return;

    setLoading(true);
    const specialists: string[] = [];
    if (spDog) specialists.push('Dog');
    if (spCat) specialists.push('Cat');
    if (spBird) specialists.push('Bird');
    if (spRabbit) specialists.push('Rabbit');
    if (spExotics) specialists.push('Exotics');

    const coordinates = generateRandomBengaluruCoordinates();
    const services = servicesInput.split(',').map((service) => service.trim()).filter(Boolean);

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
      dateOfBirth,
      gender,
      emailAddress,
      residentialAddress,
      stateName,
      pinCode,
      registrationNumber,
      licenseNumber,
      education,
      university,
      yearsOfExperience,
      consultationFee,
      languagesSpoken,
      weeklyAvailability,
      verificationDocuments: uploadedDocuments,
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600',
    };

    try {
      await onSubmitRegistration(payload);
      setRegistered(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#58B368', '#BFE7C4', '#4CAF50'],
      });
    } catch (err) {
      alert('Clinic registration failed. Check container database logs.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-[78vh] bg-[#F4FBF3] px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto bg-white border border-green-100 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ClipboardCheck className="w-10 h-10" />
          </div>
          <h2 className="mt-5 font-display font-black text-3xl text-slate-900">Verification submitted</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Your professional profile is marked Pending Verification. The admin team can now review your license, identity proof, degree, registration certificate, and photographs.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-sm text-slate-600 space-y-2">
            <p><b>Clinic:</b> {name}</p>
            <p><b>Location:</b> {area}, {city}</p>
            <p><b>Contact:</b> {phone}</p>
            <p><b>Documents:</b> {uploadedDocuments.length} uploaded</p>
          </div>
          <button onClick={onClose} className="mt-7 px-8 py-3 bg-[#4CAF50] hover:bg-green-700 text-white font-extrabold rounded-xl text-sm transition-all">
            Go to locked dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[78vh] bg-[#F4FBF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-green-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Mandatory Verification
            </span>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-black text-slate-900">Professional Verification Form</h1>
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">
              Complete this step-by-step form to submit your own clinic, license, identity, education, and availability details for admin approval.
            </p>
          </div>
          <button onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:border-green-300">
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-green-100 shadow-sm p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-green-600 text-white flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-black text-slate-900">Vet Onboarding</p>
                <p className="text-[11px] text-slate-500">Dashboard unlocks after approval</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {steps.map((item, index) => {
                const active = step === index;
                const complete = step > index;
                return (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => {
                      if (index <= step || validateStep(step)) setStep(index);
                    }}
                    className={`w-full flex items-start gap-3 rounded-2xl p-3 text-left transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-green-50'}`}
                  >
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${active ? 'bg-white text-slate-900' : complete ? 'bg-green-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                      {complete ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                    </span>
                    <span>
                      <span className="block text-xs font-black">{item.title}</span>
                      <span className={`block text-[10px] ${active ? 'text-white/70' : 'text-slate-400'}`}>{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="lg:col-span-9 bg-white rounded-3xl border border-green-100 shadow-sm p-5 sm:p-7 space-y-6">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-500">These details confirm the veterinarian’s legal identity and contact route.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Full Name *"><input className={inputClass} value={veterinarianName} onChange={(e) => setVeterinarianName(e.target.value)} placeholder="Dr. Neha Kapoor" /></Field>
                  <Field label="Date of Birth *"><input type="date" className={inputClass} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></Field>
                  <Field label="Gender *">
                    <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Contact Number *"><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></Field>
                  <Field label="Email Address *"><input type="email" className={inputClass} value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="doctor@clinic.com" /></Field>
                  <Field label="PIN Code *"><input className={inputClass} value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="560038" /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Residential Address *"><input className={inputClass} value={residentialAddress} onChange={(e) => setResidentialAddress(e.target.value)} placeholder="House, street, locality" /></Field>
                  <Field label="City *"><input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} /></Field>
                  <Field label="State *"><input className={inputClass} value={stateName} onChange={(e) => setStateName(e.target.value)} /></Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-900">Professional Information</h2>
                  <p className="text-sm text-slate-500">Add registration, license, education, fee, languages, and species focus.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Veterinary Registration No. *"><input className={inputClass} value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="KVC-2024-77112" /></Field>
                  <Field label="Medical License No. *"><input className={inputClass} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="VCI-MED-8821" /></Field>
                  <Field label="Experience *"><input className={inputClass} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="8 years" /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Educational Qualifications *"><input className={inputClass} value={education} onChange={(e) => setEducation(e.target.value)} placeholder="BVSc & AH, MVSc" /></Field>
                  <Field label="University / Institution *"><input className={inputClass} value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University name" /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Consultation Fee *"><input className={inputClass} value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} placeholder="Rs. 600" /></Field>
                  <Field label="Languages Spoken *"><input className={inputClass} value={languagesSpoken} onChange={(e) => setLanguagesSpoken(e.target.value)} /></Field>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className={labelClass}>Areas of Specialization</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold text-slate-600">
                    <Toggle label="Small Animals" checked={spDog} onChange={setSpDog} />
                    <Toggle label="Cats" checked={spCat} onChange={setSpCat} />
                    <Toggle label="Birds" checked={spBird} onChange={setSpBird} />
                    <Toggle label="Rabbits" checked={spRabbit} onChange={setSpRabbit} />
                    <Toggle label="Exotic Pets" checked={spExotics} onChange={setSpExotics} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-900">Clinic and Availability</h2>
                  <p className="text-sm text-slate-500">Use your own clinic or hospital name. This becomes visible only after admin approval.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Current Clinic / Hospital Name *"><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your own clinic name" /></Field>
                  <Field label="Area / Neighborhood *">
                    <select className={inputClass} value={area} onChange={(e) => setArea(e.target.value)}>
                      <option value="Indiranagar">Indiranagar</option>
                      <option value="Domlur">Domlur</option>
                      <option value="Koramangala">Koramangala</option>
                      <option value="Whitefield">Whitefield</option>
                      <option value="HSR Layout">HSR Layout</option>
                      <option value="Hebbal">Hebbal</option>
                      <option value="Jayanagar">Jayanagar</option>
                    </select>
                  </Field>
                </div>
                <Field label="Clinic Address *"><input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full clinic postal address" /></Field>
                <Field label="Biography / Clinic Description"><textarea rows={3} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Diagnostics equipment, ICU capability, clinical mission..." /></Field>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Working Hours *"><input className={inputClass} value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} /></Field>
                  <Field label="Weekly Availability *"><input className={inputClass} value={weeklyAvailability} onChange={(e) => setWeeklyAvailability(e.target.value)} /></Field>
                  <Field label="Services *"><input className={inputClass} value={servicesInput} onChange={(e) => setServicesInput(e.target.value)} /></Field>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className={labelClass}>Service Facilities</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                    <Toggle label="Emergency Trauma Unit" checked={hasEmergency} onChange={setHasEmergency} />
                    <Toggle label="Home Visit Service" checked={hasHomeVisit} onChange={setHasHomeVisit} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-black text-slate-900">Documents and Review</h2>
                  <p className="text-sm text-slate-500">Upload required verification documents before submitting to the admin queue.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'veterinaryLicense', label: 'Veterinary License *' },
                    { key: 'governmentId', label: 'Government ID Proof *' },
                    { key: 'degreeCertificate', label: 'Degree Certificate *' },
                    { key: 'registrationCertificate', label: 'Registration Certificate *' },
                    { key: 'profilePhotograph', label: 'Profile Photograph *' },
                    { key: 'clinicPhotograph', label: 'Clinic Photograph (Optional)' },
                    { key: 'additionalCertifications', label: 'Additional Certifications (Optional)' },
                  ].map((doc) => {
                    const uploaded = documents[doc.key];
                    return (
                      <label key={doc.key} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:border-green-300 transition-colors">
                        <input type="file" accept=".pdf,image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => handleDocumentUpload(doc.key, doc.label.replace(' *', ''), e.target.files?.[0] || null)} />
                        <span className="flex items-center gap-2 text-sm font-black text-slate-800">
                          <FileText className="w-4 h-4 text-green-700" />
                          {doc.label}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-400">{uploaded ? uploaded.fileName : 'Click to upload PDF, PNG, JPG, or WEBP'}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
                  <div className="flex items-start gap-3">
                    <Upload className="w-5 h-5 mt-0.5 text-green-700" />
                    <p>
                      After submission, your profile is marked Pending Verification. The dashboard remains locked, appointments and emergency requests stay disabled, and your profile is hidden from pet owners until admin approval.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button type="button" onClick={goBack} disabled={step === 0} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 disabled:opacity-45 disabled:cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              {step < steps.length - 1 ? (
                <button type="button" onClick={goNext} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4CAF50] px-6 py-3 text-xs font-black text-white hover:bg-green-700">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4CAF50] px-6 py-3 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60">
                  {loading ? 'Submitting...' : 'Submit for Admin Verification'}
                  <ClipboardCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer ${checked ? 'border-green-300 bg-white text-green-800' : 'border-slate-200 bg-white text-slate-600'}`}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
