import { useState } from 'react';
import { Phone, Menu, X, LogIn, ClipboardList, AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';
import { AnimatePresence, motion } from 'motion/react';

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
                <span className="text-[#58B368]">🐾</span> Quick<span className="text-[#58B368]">Vet</span>
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
                    ? 'bg-green-50 text-[#58B368] shadow-inner-sm'
                    : 'text-gray-600 hover:text-[#58B368] hover:bg-green-50/40'
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
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-[#58B368] border border-green-100 rounded-xl text-sm font-semibold hover:bg-green-100 transition-all cursor-pointer"
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

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin_dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white border border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-green-300" />
                <span>Admin Control</span>
              </button>
            )}

            {/* Quick Emergency Button */}
            <button
              onClick={() => handleNavClick('emergency')}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-white animate-bounce" />
              <span>Emergency Assistance</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <div className="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-100">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-green-500">
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
                  className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 border-l border-gray-100 pl-3">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-[#58B368] font-semibold text-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-5 py-2.5 bg-[#58B368] hover:bg-green-600 text-white font-bold text-sm rounded-xl shadow-custom hover:shadow-green-100 transition-all cursor-pointer"
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
              className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer"
              title="Urgent Call"
            >
              <Phone className="w-4 h-4 text-white animate-pulse" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-green-100 hover:bg-green-50 text-gray-600 cursor-pointer overflow-hidden"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileMenuOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -45, scale: 0.75 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.75 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="block"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'calc(100vh - 72px)', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white/95 border-b border-green-100 shadow-xl overflow-hidden"
          >
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: { staggerChildren: 0.045, delayChildren: 0.05 },
              },
              closed: {
                transition: { staggerChildren: 0.025, staggerDirection: -1 },
              },
            }}
            className="h-full overflow-y-auto px-4 pt-4 pb-24 space-y-3"
          >
            {currentUser && (
              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-2"
              >
                <img
                  src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border border-green-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-gray-800">{currentUser.name}</h4>
                  <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                </div>
              </motion.div>
            )}

            {navLinks.map((link) => (
              <motion.button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === link.id
                    ? 'bg-green-50 text-[#58B368]'
                    : 'text-gray-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </motion.button>
            ))}

            {currentUser && currentUser.role === 'pet_owner' && (
              <motion.button
                onClick={() => handleNavClick('user_dashboard')}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#58B368] bg-green-50/70 border border-green-100 font-bold transition-all text-left"
              >
                <ClipboardList className="w-5 h-5" />
                <span>My Pet Dashboard</span>
              </motion.button>
            )}

            {currentUser && currentUser.role === 'veterinarian' && (
              <motion.button
                onClick={() => handleNavClick('vet_dashboard')}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-700 bg-green-50 border border-green-100 font-bold transition-all text-left"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Doctor Portal Dashboard</span>
              </motion.button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <motion.button
                onClick={() => handleNavClick('admin_dashboard')}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white bg-slate-900 border border-slate-800 font-bold transition-all text-left"
              >
                <ShieldCheck className="w-5 h-5 text-green-300" />
                <span>Admin Control Center</span>
              </motion.button>
            )}

            <motion.button
              onClick={() => handleNavClick('emergency')}
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: -8 },
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-500 text-white rounded-xl font-extrabold text-center shadow-lg shadow-emerald-100"
            >
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
              <span>Urgent Emergency Rescue</span>
            </motion.button>

            {currentUser ? (
              <motion.button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-600 bg-emerald-50 hover:bg-emerald-100 font-bold transition-all text-left"
              >
                <X className="w-5 h-5" />
                <span>Logout Session</span>
              </motion.button>
            ) : (
              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: -8 },
                }}
                className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100"
              >
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="w-full py-3 border border-green-200 text-[#58B368] font-bold text-sm rounded-xl text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  className="w-full py-3 bg-[#58B368] text-white font-bold text-sm rounded-xl text-center shadow-md shadow-green-100"
                >
                  Sign Up
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

