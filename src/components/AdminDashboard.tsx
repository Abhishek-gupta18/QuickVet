import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, ShieldCheck, Users, UserCheck, CalendarDays, AlertTriangle,
  ClipboardList, Star, Search, Filter, CheckCircle, XCircle, Clock, Eye,
  Ban, RefreshCw, FileText, Activity, TrendingUp, Bell, MoreVertical,
  ChevronRight, ChevronDown, Mail, Phone, MapPin, Building2, Award,
  ShieldAlert, Loader2, X, MessageSquare, ArrowRight, Pause, Play
} from 'lucide-react';
import {
  User, AdminStats, VetVerificationApplication, Booking,
  EmergencyRequest, ActivityLog, ClinicReview, VerificationStatus
} from '../types';

interface AdminDashboardProps {
  currentUser: User;
}

// API helper
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';
function getToken(): string | null {
  return localStorage.getItem('vetfinder_token');
}
async function adminFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

type AdminTab = 'home' | 'verification' | 'vets' | 'users' | 'bookings' | 'emergencies' | 'reviews' | 'logs';


export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [loading, setLoading] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<VetVerificationApplication[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allEmergencies, setAllEmergencies] = useState<EmergencyRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allReviews, setAllReviews] = useState<ClinicReview[]>([]);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState<string>('pending');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [emergencyStatusFilter, setEmergencyStatusFilter] = useState('all');

  // Modal states
  const [selectedVet, setSelectedVet] = useState<VetVerificationApplication | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'home':
          const statsData = await adminFetch('/api/admin/stats');
          if (statsData) setStats(statsData);
          break;
        case 'verification':
        case 'vets':
          const vets = await adminFetch(`/api/admin/verification-queue?status=${verificationFilter}`);
          if (vets) setVerificationQueue(vets);
          break;
        case 'users':
          const usersData = await adminFetch(`/api/admin/users?search=${userSearch}&role=${userRoleFilter}`);
          if (usersData) setAllUsers(usersData);
          break;
        case 'bookings':
          const bData = await adminFetch(`/api/admin/bookings?status=${bookingStatusFilter}`);
          if (bData) setAllBookings(bData);
          break;
        case 'emergencies':
          const eData = await adminFetch(`/api/admin/emergencies?status=${emergencyStatusFilter}`);
          if (eData) setAllEmergencies(eData);
          break;
        case 'logs':
          const logs = await adminFetch('/api/admin/activity-logs');
          if (logs) setActivityLogs(logs);
          break;
        case 'reviews':
          const reviews = await adminFetch('/api/admin/reviews');
          if (reviews) setAllReviews(reviews);
          break;
      }
    } catch (err: any) {
      console.error('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, verificationFilter, userSearch, userRoleFilter, bookingStatusFilter, emergencyStatusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);


  // ===== ACTION HANDLERS =====
  const handleVerifyVet = async (vetId: string, action: string) => {
    try {
      await adminFetch(`/api/admin/verify/${vetId}`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: actionReason, notes: actionNotes }),
      });
      setSelectedVet(null);
      setActionNotes('');
      setActionReason('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleUserStatus = async (userId: string, action: string, reason?: string) => {
    try {
      await adminFetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: reason || actionReason }),
      });
      setActionReason('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleModerateReview = async (reviewId: string, action: 'hide' | 'unhide', reason?: string) => {
    try {
      await adminFetch(`/api/admin/reviews/${reviewId}/moderate`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      });
      await fetchData();
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  // Helper: status badge styling
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      under_review: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      suspended: 'bg-stone-50 text-stone-700 border-stone-200',
      reverification_required: 'bg-purple-50 text-purple-700 border-purple-200',
      active: 'bg-green-50 text-green-700 border-green-200',
      banned: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-stone-50 text-stone-600 border-stone-200',
      notified: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      accepted: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return colors[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Sidebar items
  const sidebarItems: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verification', label: 'Verification Queue', icon: ShieldCheck, badge: stats?.pendingVerifications },
    { id: 'vets', label: 'Vet Management', icon: UserCheck },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'bookings', label: 'Appointments', icon: CalendarDays, badge: stats?.todayBookings },
    { id: 'emergencies', label: 'Emergencies', icon: AlertTriangle, badge: stats?.activeEmergencies },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'logs', label: 'Activity Logs', icon: ClipboardList },
  ];


  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[80vh]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ===== LEFT SIDEBAR ===== */}
        <div className="lg:col-span-3 xl:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5 lg:sticky lg:top-24">
          {/* Admin Profile */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              A
            </div>
            <div className="text-left">
              <h4 className="font-display font-bold text-gray-900 text-sm line-clamp-1">{currentUser.name}</h4>
              <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 py-0.5 px-1.5 rounded">
                Administrator
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer w-full text-left ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className="flex-grow">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-red-100 text-red-600'
                    }`}>{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Stats Mini */}
          {stats && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-indigo-100/50 text-left space-y-2">
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Quick Overview</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="font-black text-gray-800">{stats.totalUsers}</span> <span className="text-gray-400">Users</span></div>
                <div><span className="font-black text-gray-800">{stats.totalVets}</span> <span className="text-gray-400">Vets</span></div>
                <div><span className="font-black text-red-500">{stats.pendingVerifications}</span> <span className="text-gray-400">Pending</span></div>
                <div><span className="font-black text-green-600">{stats.approvedVets}</span> <span className="text-gray-400">Approved</span></div>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT CONTENT AREA ===== */}
        <div className="lg:col-span-9 xl:col-span-10 min-h-[600px]">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          )}

          {!loading && activeTab === 'home' && renderHome()}
          {!loading && activeTab === 'verification' && renderVerificationQueue()}
          {!loading && activeTab === 'vets' && renderVetManagement()}
          {!loading && activeTab === 'users' && renderUserManagement()}
          {!loading && activeTab === 'bookings' && renderBookings()}
          {!loading && activeTab === 'emergencies' && renderEmergencies()}
          {!loading && activeTab === 'reviews' && renderReviews()}
          {!loading && activeTab === 'logs' && renderLogs()}
        </div>
      </div>

      {/* Vet Detail Modal */}
      {selectedVet && renderVetDetailModal()}
    </div>
  );


  // ===== TAB: DASHBOARD HOME =====
  function renderHome() {
    if (!stats) return <div className="text-center text-gray-400 py-20">Loading statistics...</div>;
    const cards = [
      { label: 'Total Pet Owners', value: stats.totalUsers, icon: '👤', color: 'from-blue-50 to-cyan-50 border-blue-100' },
      { label: 'Total Veterinarians', value: stats.totalVets, icon: '🩺', color: 'from-green-50 to-emerald-50 border-green-100' },
      { label: 'Pending Approvals', value: stats.pendingVerifications, icon: '⏳', color: 'from-amber-50 to-yellow-50 border-amber-100' },
      { label: 'Active Emergencies', value: stats.activeEmergencies, icon: '🚨', color: 'from-red-50 to-rose-50 border-red-100' },
      { label: 'Today\'s Bookings', value: stats.todayBookings, icon: '📅', color: 'from-purple-50 to-violet-50 border-purple-100' },
      { label: 'Total Clinics', value: stats.totalClinics, icon: '🏥', color: 'from-teal-50 to-cyan-50 border-teal-100' },
      { label: 'Suspended Accounts', value: stats.suspendedAccounts, icon: '🚫', color: 'from-stone-50 to-slate-50 border-stone-200' },
      { label: 'Avg Platform Rating', value: `${stats.averageRating}★`, icon: '⭐', color: 'from-lime-50 to-green-50 border-lime-100' },
      { label: 'Total Reviews', value: stats.totalReviews, icon: '💬', color: 'from-indigo-50 to-blue-50 border-indigo-100' },
      { label: 'New This Week', value: stats.newRegistrationsThisWeek, icon: '📈', color: 'from-pink-50 to-rose-50 border-pink-100' },
      { label: 'Total Emergencies', value: stats.totalEmergencies, icon: '🆘', color: 'from-orange-50 to-amber-50 border-orange-100' },
      { label: 'Total Bookings', value: stats.totalBookings, icon: '🗓️', color: 'from-sky-50 to-blue-50 border-sky-100' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-900">Admin Command Center</h2>
            <p className="text-sm text-gray-500">Platform overview and key metrics at a glance.</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border bg-gradient-to-br ${card.color} space-y-1.5 hover:shadow-md transition-shadow`}>
              <span className="text-xl">{card.icon}</span>
              <div>
                <span className="block text-xl font-black text-gray-800 font-display">{card.value}</span>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button onClick={() => setActiveTab('verification')} className="p-4 bg-white border border-amber-200 rounded-2xl text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 group-hover:text-amber-700">Review Pending Vets</span>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pendingVerifications}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Verify credentials and approve veterinarians.</p>
          </button>
          <button onClick={() => setActiveTab('emergencies')} className="p-4 bg-white border border-red-200 rounded-2xl text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 group-hover:text-red-700">Active Emergencies</span>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{stats.activeEmergencies}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Monitor and reassign emergency requests.</p>
          </button>
          <button onClick={() => setActiveTab('users')} className="p-4 bg-white border border-indigo-200 rounded-2xl text-left hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 group-hover:text-indigo-700">Manage Users</span>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.totalUsers + stats.totalVets}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Search, suspend, or ban problematic accounts.</p>
          </button>
        </div>
      </div>
    );
  }


  // ===== TAB: VERIFICATION QUEUE =====
  function renderVerificationQueue() {
    const statusTabs = ['pending', 'under_review', 'approved', 'rejected', 'suspended', 'reverification_required'];

    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-black text-2xl text-gray-900">Veterinarian Verification Queue</h2>
          <p className="text-sm text-gray-500">Review and approve veterinary professionals before they can offer services.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map(s => (
            <button key={s} onClick={() => setVerificationFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                verificationFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-gray-600 hover:bg-slate-50'
              }`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
          <button onClick={() => setVerificationFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              verificationFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-gray-600 hover:bg-slate-50'
            }`}>
            All
          </button>
        </div>

        {/* Queue List */}
        {verificationQueue.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No veterinarian applications in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {verificationQueue.map((vet) => (
              <div key={vet.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={vet.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=vet'} alt={vet.name}
                      className="w-11 h-11 rounded-full border-2 border-indigo-100" referrerPolicy="no-referrer" />
                    <div className="text-left">
                      <h4 className="font-bold text-sm text-gray-900">{vet.name}</h4>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {vet.email}
                      </p>
                      {vet.phone && <p className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {vet.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${getStatusColor(vet.verificationStatus || 'pending')}`}>
                      {(vet.verificationStatus || 'pending').replace(/_/g, ' ')}
                    </span>
                    <button onClick={() => setSelectedVet(vet)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>
                </div>

                {/* Brief Details Row */}
                <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-500">
                  {vet.vetRegistrationNumber && <span><b>Reg#:</b> {vet.vetRegistrationNumber}</span>}
                  {vet.vetDegree && <span><b>Degree:</b> {vet.vetDegree}</span>}
                  {vet.vetExperienceYears && <span><b>Exp:</b> {vet.vetExperienceYears} yrs</span>}
                  {vet.clinicName && <span><b>Clinic:</b> {vet.clinicName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  // ===== TAB: VET MANAGEMENT =====
  function renderVetManagement() {
    const approvedVets = verificationQueue.filter(v => v.verificationStatus === 'approved');

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-900">Veterinarian Management</h2>
            <p className="text-sm text-gray-500">Monitor performance, manage access, and handle re-verification.</p>
          </div>
          <button onClick={() => { setVerificationFilter('approved'); fetchData(); }}
            className="px-3 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 border border-green-200">
            <RefreshCw className="w-3 h-3 inline mr-1" /> Load Approved Vets
          </button>
        </div>

        {approvedVets.length === 0 && verificationQueue.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No approved veterinarians loaded. Click "Load Approved Vets" above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(approvedVets.length > 0 ? approvedVets : verificationQueue).map((vet) => (
              <div key={vet.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={vet.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=vet'} alt={vet.name}
                      className="w-10 h-10 rounded-full border border-green-200" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{vet.name}</h4>
                      <p className="text-[11px] text-gray-400">{vet.email} {vet.clinicName ? `• ${vet.clinicName}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(vet.verificationStatus || 'pending')}`}>
                      {(vet.verificationStatus || '').replace(/_/g, ' ')}
                    </span>
                    {vet.verificationStatus === 'approved' && (
                      <>
                        <button onClick={() => handleVerifyVet(vet.id, 'suspend')}
                          className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 border border-red-200">
                          <Pause className="w-3 h-3 inline mr-0.5" /> Suspend
                        </button>
                        <button onClick={() => handleVerifyVet(vet.id, 'reverify')}
                          className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold hover:bg-purple-100 border border-purple-200">
                          <RefreshCw className="w-3 h-3 inline mr-0.5" /> Re-verify
                        </button>
                      </>
                    )}
                    {vet.verificationStatus === 'suspended' && (
                      <button onClick={() => handleVerifyVet(vet.id, 'approve')}
                        className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100 border border-green-200">
                        <Play className="w-3 h-3 inline mr-0.5" /> Reactivate
                      </button>
                    )}
                    <button onClick={() => setSelectedVet(vet)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100">
                      <Eye className="w-3 h-3 inline mr-0.5" /> Details
                    </button>
                  </div>
                </div>

                {/* Vet meta row */}
                <div className="mt-2 pt-2 border-t border-slate-50 flex flex-wrap gap-3 text-[10px] text-gray-400">
                  {vet.vetSpecializations && vet.vetSpecializations.length > 0 && (
                    <span>🐾 {vet.vetSpecializations.join(', ')}</span>
                  )}
                  {vet.vetExperienceYears && <span>📅 {vet.vetExperienceYears} yrs exp</span>}
                  {vet.documents && <span>📄 {vet.documents.length} docs</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  // ===== TAB: USER MANAGEMENT =====
  function renderUserManagement() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-black text-2xl text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">Search, monitor, and moderate platform user accounts.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or phone..."
              value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
          </div>
          <select value={userRoleFilter} onChange={(e) => { setUserRoleFilter(e.target.value); }}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400">
            <option value="all">All Roles</option>
            <option value="pet_owner">Pet Owners</option>
            <option value="veterinarian">Veterinarians</option>
            <option value="admin">Admins</option>
          </select>
          <button onClick={fetchData} className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
            <Search className="w-3.5 h-3.5 inline mr-1" /> Search
          </button>
        </div>

        {/* Users Table */}
        {allUsers.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={user.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                          <div>
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-gray-400 text-[10px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                          {(user.role || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusColor(user.accountStatus || 'active')}`}>
                          {user.accountStatus || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {user.accountStatus === 'active' ? (
                              <>
                                <button onClick={() => handleUserStatus(user.id, 'suspend')}
                                  className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[9px] font-bold hover:bg-amber-100 border border-amber-200">
                                  Suspend
                                </button>
                                <button onClick={() => handleUserStatus(user.id, 'ban')}
                                  className="px-2 py-1 bg-red-50 text-red-600 rounded text-[9px] font-bold hover:bg-red-100 border border-red-200">
                                  Ban
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleUserStatus(user.id, 'reactivate')}
                                className="px-2 py-1 bg-green-50 text-green-600 rounded text-[9px] font-bold hover:bg-green-100 border border-green-200">
                                Reactivate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }


  // ===== TAB: BOOKINGS =====
  function renderBookings() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-900">Appointment Management</h2>
            <p className="text-sm text-gray-500">Monitor all scheduled, completed, and cancelled bookings platform-wide.</p>
          </div>
          <select value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {allBookings.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allBookings.map((b) => (
              <div key={b.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">{b.clinicName}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{b.type?.replace('_', ' ')}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    👤 {b.petOwnerName} • 🐾 {b.petName} ({b.petType}) • ⚕️ {b.service}
                  </p>
                  <p className="text-[11px] text-gray-400">📅 {b.date} at {b.time}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase self-start ${getStatusColor(b.status)}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== TAB: EMERGENCIES =====
  function renderEmergencies() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-900">Emergency Monitoring</h2>
            <p className="text-sm text-gray-500">Real-time oversight of all emergency requests. Reassign if needed.</p>
          </div>
          <select value={emergencyStatusFilter} onChange={(e) => setEmergencyStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="notified">Notified</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {allEmergencies.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No emergency requests found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEmergencies.map((em) => (
              <div key={em.id} className="bg-white border border-slate-100 rounded-2xl p-4 border-l-4 border-l-red-400 hover:shadow-md transition-shadow text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-800">{em.petName} ({em.petType})</span>
                    <span className="text-[10px] text-gray-400">{em.date} {em.time}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusColor(em.status)}`}>
                    {em.status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">👤 {em.petOwnerName} • 📞 {em.phone} • 📍 {em.address}</p>
                <div className="bg-red-50/50 p-2 rounded-lg text-[11px] text-red-700 italic border border-red-100/50">
                  "{em.description}"
                </div>
                {em.acceptedByClinicName && (
                  <p className="text-[11px] text-green-700 font-bold">✅ Accepted by: {em.acceptedByClinicName}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  // ===== TAB: REVIEWS =====
  function renderReviews() {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-display font-black text-2xl text-gray-900">Review Moderation</h2>
          <p className="text-sm text-gray-500">Monitor all clinic reviews. Hide inappropriate or fake reviews.</p>
        </div>

        {allReviews.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No reviews found.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allReviews.map((r) => (
              <div key={r.id} className={`bg-white border rounded-2xl p-4 text-left space-y-2 transition-all ${
                r.isHidden ? 'border-red-200 bg-red-50/20 opacity-70' : 'border-slate-100 hover:shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-800">{r.userName}</span>
                    <span className="text-[10px] text-gray-400">({r.userEmail})</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.isHidden && <span className="text-[9px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded">HIDDEN</span>}
                    <span className="text-[10px] text-gray-400">{r.date}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">"{r.reviewText}"</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                  <span className="text-[10px] text-gray-400">🐾 {r.petType} • Clinic: {r.clinicId}</span>
                  {!r.isHidden ? (
                    <button onClick={() => handleModerateReview(r.id, 'hide', 'Inappropriate content')}
                      className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-100 border border-red-200">
                      <X className="w-3 h-3 inline mr-0.5" /> Hide Review
                    </button>
                  ) : (
                    <button onClick={() => handleModerateReview(r.id, 'unhide')}
                      className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-100 border border-green-200">
                      <Eye className="w-3 h-3 inline mr-0.5" /> Unhide
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== TAB: ACTIVITY LOGS =====
  function renderLogs() {
    const actionColors: Record<string, string> = {
      vet_approve: 'text-green-600 bg-green-50',
      vet_approved: 'text-green-600 bg-green-50',
      vet_reject: 'text-red-600 bg-red-50',
      vet_rejected: 'text-red-600 bg-red-50',
      vet_suspend: 'text-amber-600 bg-amber-50',
      vet_suspended: 'text-amber-600 bg-amber-50',
      user_suspend: 'text-amber-600 bg-amber-50',
      user_suspended: 'text-amber-600 bg-amber-50',
      user_ban: 'text-red-600 bg-red-50',
      user_banned: 'text-red-600 bg-red-50',
      user_reactivate: 'text-green-600 bg-green-50',
      user_reactivated: 'text-green-600 bg-green-50',
      review_hide: 'text-orange-600 bg-orange-50',
      review_hidden: 'text-orange-600 bg-orange-50',
      emergency_reassigned: 'text-blue-600 bg-blue-50',
      login: 'text-indigo-600 bg-indigo-50',
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-gray-900">Activity Logs</h2>
            <p className="text-sm text-gray-500">Complete audit trail of all administrative actions.</p>
          </div>
          <button onClick={fetchData} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100">
            <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Refresh
          </button>
        </div>

        {activityLogs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No activity logs recorded yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden">
            {activityLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${actionColors[log.action] || 'text-gray-500 bg-gray-50'}`}>
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-grow text-left min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    <span className="font-bold">{log.adminName}</span> performed <span className="font-mono text-indigo-600">{log.action}</span>
                    {log.targetName && <> on <span className="font-semibold">{log.targetName}</span></>}
                  </p>
                  {log.details && <p className="text-[10px] text-gray-400 truncate mt-0.5">{log.details}</p>}
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }


  // ===== MODAL: VET DETAIL & VERIFICATION ACTIONS =====
  function renderVetDetailModal() {
    if (!selectedVet) return null;
    const v = selectedVet;

    return (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-display font-black text-lg">Veterinarian Verification</h3>
              <p className="text-white/70 text-xs">{v.name} — {v.email}</p>
            </div>
            <button onClick={() => { setSelectedVet(null); setActionNotes(''); setActionReason(''); }}
              className="p-1.5 bg-white/10 hover:bg-white/25 rounded-xl text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-6 space-y-5 flex-grow">
            {/* Profile section */}
            <div className="flex items-start gap-4">
              <img src={v.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=vet'} alt={v.name}
                className="w-16 h-16 rounded-2xl border-2 border-indigo-100" referrerPolicy="no-referrer" />
              <div className="space-y-1 text-left">
                <h4 className="font-display font-black text-lg text-gray-900">{v.name}</h4>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {v.email}</p>
                {v.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {v.phone}</p>}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase inline-block ${getStatusColor(v.verificationStatus || 'pending')}`}>
                  {(v.verificationStatus || 'pending').replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoField label="Registration Number" value={v.vetRegistrationNumber} icon={<FileText className="w-3.5 h-3.5" />} />
              <InfoField label="License Number" value={v.vetLicenseNumber} icon={<Award className="w-3.5 h-3.5" />} />
              <InfoField label="Degree" value={v.vetDegree} icon={<Building2 className="w-3.5 h-3.5" />} />
              <InfoField label="Experience" value={v.vetExperienceYears ? `${v.vetExperienceYears} years` : undefined} icon={<Clock className="w-3.5 h-3.5" />} />
              <InfoField label="Government ID" value={v.vetGovernmentId} icon={<ShieldAlert className="w-3.5 h-3.5" />} />
              <InfoField label="Affiliated Clinic" value={v.clinicName || v.clinicId} icon={<MapPin className="w-3.5 h-3.5" />} />
            </div>

            {/* Specializations */}
            {v.vetSpecializations && v.vetSpecializations.length > 0 && (
              <div className="text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specializations</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {v.vetSpecializations.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {v.documents && v.documents.length > 0 && (
              <div className="text-left">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded Documents ({v.documents.length})</label>
                <div className="mt-2 space-y-2">
                  {v.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{doc.documentName}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(doc.verificationStatus)}`}>
                        {doc.verificationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing notes */}
            {v.verificationNotes && (
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-left">
                <label className="text-[10px] font-bold text-amber-600 uppercase">Previous Notes</label>
                <p className="text-xs text-gray-600 mt-1">{v.verificationNotes}</p>
              </div>
            )}
            {v.rejectionReason && (
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-100 text-left">
                <label className="text-[10px] font-bold text-red-600 uppercase">Rejection Reason</label>
                <p className="text-xs text-gray-600 mt-1">{v.rejectionReason}</p>
              </div>
            )}

            {/* Admin Action Form */}
            <div className="border-t border-slate-100 pt-4 space-y-3 text-left">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admin Notes (optional)</label>
              <textarea rows={2} value={actionNotes} onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add internal verification notes..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />

              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reason (for rejection/suspension)</label>
              <input type="text" value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for rejection or suspension..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-end flex-shrink-0">
            <button onClick={() => handleVerifyVet(v.id, 'approve')}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
            <button onClick={() => handleVerifyVet(v.id, 'reject')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button onClick={() => handleVerifyVet(v.id, 'request_documents')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
              <FileText className="w-3.5 h-3.5" /> Request Docs
            </button>
            <button onClick={() => handleVerifyVet(v.id, 'suspend')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
              <Pause className="w-3.5 h-3.5" /> Suspend
            </button>
            <button onClick={() => { setSelectedVet(null); setActionNotes(''); setActionReason(''); }}
              className="px-4 py-2.5 bg-white border border-slate-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }


}

// ===== HELPER COMPONENT: Info Field =====
function InfoField({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
      <div className="flex items-center gap-1.5 text-gray-400 mb-0.5">
        {icon}
        <label className="text-[9px] font-bold uppercase tracking-widest">{label}</label>
      </div>
      <p className="text-xs font-semibold text-gray-800">{value || <span className="text-gray-300 italic">Not provided</span>}</p>
    </div>
  );
}
