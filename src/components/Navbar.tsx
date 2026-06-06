import { useState } from 'react';
import { PawPrint, Phone, Menu, X, LogIn, User, ClipboardList, AlertTriangle, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (type: 'login' | 'signup') => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  activeTab,
  setActiveTab,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'find_vets', label: 'Find Vets' },
    { id: 'emergency', label: 'Emergency Help' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-black/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between h-[72px]">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 text-2xl font-extrabold text-[#2D3748] tracking-tight group hover:opacity-90 transition-all cursor-pointer"
            >
              <span className="font-display font-black text-2xl text-[#2D3748] flex items-center gap-1.5">
                <span className="text-[#FF914D]">🐾</span> Quick<span className="text-[#FF914D]">Vet</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5 lg:space-x-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === link.id
                    ? 'bg-orange-50 text-[#FF914D] shadow-inner-sm'
                    : 'text-gray-600 hover:text-[#FF914D] hover:bg-orange-50/40'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Direct Actions & Auth States */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser && currentUser.role === 'pet_owner' && (
              <button
                onClick={() => handleNavClick('user_dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-[#FF914D] border border-orange-100 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-all cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>My Dashboard</span>
              </button>
            )}

            {currentUser && currentUser.role === 'veterinarian' && (
              <button
                onClick={() => handleNavClick('vet_dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-100 rounded-xl text-sm font-semibold hover:bg-green-100 transition-all cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Doctor Portal</span>
              </button>
            )}

            {/* Quick Emergency Button */}
            <button
              onClick={() => handleNavClick('emergency')}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-white animate-bounce" />
              <span>Emergency Assistance</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-orange-500">
                    <img
                      src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-left leading-none">
                    <span className="block text-xs font-bold text-gray-800 line-clamp-1 max-w-[100px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-gray-100 pl-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-[#FF914D] font-semibold text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 bg-[#FF914D] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-custom hover:shadow-orange-100 transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Actions Button */}
          <div className="flex items-center md:hidden gap-1.5">
            <button
              onClick={() => handleNavClick('emergency')}
              className="p-2.5 bg-red-500 text-white rounded-xl shadow-md cursor-pointer"
              title="Urgent Call"
            >
              <Phone className="w-4 h-4 text-white animate-pulse" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-orange-100 hover:bg-orange-50 text-gray-600 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 border-b border-orange-100 shadow-xl transition-all h-screen overflow-y-auto pb-24">
          <div className="px-4 pt-4 pb-6 space-y-3">
            {currentUser && (
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-2">
                <img
                  src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-orange-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-gray-800">{currentUser.name}</h4>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === link.id
                    ? 'bg-orange-50 text-[#FF914D]'
                    : 'text-gray-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}

            {currentUser && currentUser.role === 'pet_owner' && (
              <button
                onClick={() => handleNavClick('user_dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#FF914D] bg-orange-50/70 border border-orange-100 font-bold transition-all text-left"
              >
                <ClipboardList className="w-5 h-5" />
                <span>My Pet Dashboard</span>
              </button>
            )}

            {currentUser && currentUser.role === 'veterinarian' && (
              <button
                onClick={() => handleNavClick('vet_dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-700 bg-green-50 border border-green-100 font-bold transition-all text-left"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Doctor Portal Dashboard</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('emergency')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500 text-white rounded-xl font-extrabold text-center shadow-lg shadow-red-100"
            >
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              <span>Urgent Emergency Rescue</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-all text-left"
              >
                <X className="w-5 h-5" />
                <span>Logout Session</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-3 border border-orange-200 text-[#FF914D] font-bold text-sm rounded-xl text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="w-full py-3 bg-[#FF914D] text-white font-bold text-sm rounded-xl text-center shadow-md shadow-orange-100"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
