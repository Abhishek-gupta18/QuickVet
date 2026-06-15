import { PawPrint, Facebook, Twitter, Instagram, ChevronRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          
          {/* Logo & Description */}
          <div className="space-y-4 text-left">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-white font-display font-black text-xl cursor-pointer"
            >
              <div className="bg-[#58B368] p-1.5 rounded-xl text-white">
                <PawPrint className="w-5 h-5 fill-white text-white" />
              </div>
              <span>QuickVet</span>
            </button>
            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              India's first completely interactive veterinary assistance router mapping 24/7 animal hospitals, emergency responses, and certified home diagnostics.
            </p>
            
            {/* Social handles */}
            <div className="flex items-center space-x-3.5 pt-2">
              <a href="#" className="p-2 bg-slate-800 hover:bg-[#58B368] text-slate-300 hover:text-white rounded-xl transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-[#58B368] text-slate-300 hover:text-white rounded-xl transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-[#58B368] text-slate-300 hover:text-white rounded-xl transition-all">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Core App routes links */}
          <div className="text-left space-y-3.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest text-[#58B368]">App Features</h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <button onClick={() => onNavigate('find_vets')} className="hover:text-[#58B368] text-left transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span>Search Veterinary Clinics</span>
              </button>
              <button onClick={() => onNavigate('emergency')} className="hover:text-[#58B368] text-left transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-emerald-500 animate-pulse" />
                <span>Request Red Emergency Alert</span>
              </button>
              <button onClick={() => onNavigate('reviews')} className="hover:text-[#58B368] text-left transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span>Patient Reviews</span>
              </button>
            </div>
          </div>

          {/* Legal / Policies links */}
          <div className="text-left space-y-3.5">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest text-[#4CAF50]">Information & Trust</h4>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span>About Us</span>
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span>Contact Hotline Support</span>
              </a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span>Privacy & Offline Data Terms</span>
              </a>
            </div>
          </div>

          {/* Veterinarians registration column */}
          <div className="text-left space-y-3.5 bg-slate-800/40 p-4.5 rounded-2xl border border-slate-800">
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-widest text-[#BFE7C4]">For Veterinary Experts</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Are you operating a registered, licensed veterinary clinical station in India? Plunge into our live network today.
            </p>
            <button
              onClick={() => onNavigate('vet_register')}
              className="w-full text-center py-2.5 bg-green-600 hover:bg-[#4CAF50] text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Register Your Clinic Station
            </button>
          </div>

        </div>

        {/* Lower rights credits section */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© 2026 QuickVet Healthcare Services India Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Legal Terms</a>
            <span>•</span>
            <a href="#" className="hover:underline">Acceptable Use Guideline</a>
            <span>•</span>
            <span className="text-[#58B368] font-bold">🎯 Swadeshi Code</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

