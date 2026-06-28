import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileSearch,
  Filter,
  Flag,
  Gauge,
  Lock,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  ShieldOff,
  Star,
  Stethoscope,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { Booking, EmergencyRequest, User, VetClinic } from '../types';

interface AdminDashboardProps {
  currentUser: User;
  clinics: VetClinic[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
}

type AdminTab =
  | 'overview'
  | 'verification'
  | 'performance'
  | 'complaints'
  | 'users'
  | 'emergencies'
  | 'documents'
  | 'security';

const verificationApplications = [
  {
    id: 'qv-ver-1042',
    doctor: 'Dr. Neha Kapoor',
    license: 'KVC-2021-88421',
    clinic: 'Indiranagar Small Animal Clinic',
    city: 'Bengaluru',
    submitted: '2026-06-28',
    status: 'Pending',
    progress: 78,
    assignedTo: 'Asha Menon',
    specialty: 'Emergency and Surgery',
    risk: 'Low',
    documents: ['License PDF', 'Government ID', 'BVSc Degree', 'Clinic Lease'],
  },
  {
    id: 'qv-ver-1041',
    doctor: 'Dr. Arvind Rao',
    license: 'KVC-2018-44109',
    clinic: 'North Bengaluru Pet Trauma Unit',
    city: 'Bengaluru',
    submitted: '2026-06-27',
    status: 'Hold',
    progress: 52,
    assignedTo: 'Kabir Shah',
    specialty: 'Critical Care',
    risk: 'Medium',
    documents: ['License PDF', 'Government ID', 'Experience Letter'],
  },
  {
    id: 'qv-ver-1038',
    doctor: 'Dr. Saira Thomas',
    license: 'KVC-2024-77112',
    clinic: 'Whitefield Exotic Care',
    city: 'Bengaluru',
    submitted: '2026-06-25',
    status: 'Needs Documents',
    progress: 36,
    assignedTo: 'Asha Menon',
    specialty: 'Birds and Exotics',
    risk: 'High',
    documents: ['Government ID', 'Degree Certificate'],
  },
];

const complaints = [
  { id: 'cmp-772', category: 'Fake Credentials', vet: 'Whitefield Exotic Care', severity: 'High', age: '18 min', owner: 'Mira S.', status: 'Investigating' },
  { id: 'cmp-768', category: 'Late Arrival', vet: 'Happy Tails Veterinary Clinic & Spa', severity: 'Medium', age: '2 hr', owner: 'Rohan K.', status: 'Awaiting response' },
  { id: 'cmp-761', category: 'Payment Dispute', vet: 'Crown Vet Premium Clinic', severity: 'Low', age: '1 day', owner: 'Ananya R.', status: 'Mediation' },
];

const auditLogs = [
  { action: 'Approved veterinarian profile', admin: 'Asha Menon', time: '10:42 PM', ip: '103.21.244.18' },
  { action: 'Requested additional license document', admin: 'Kabir Shah', time: '09:58 PM', ip: '103.21.244.18' },
  { action: 'Flagged review for abusive language', admin: 'Asha Menon', time: '08:11 PM', ip: '49.36.121.77' },
  { action: 'Emergency reassigned manually', admin: 'System Admin', time: '07:46 PM', ip: '10.0.0.14' },
];

const monthlyBars = [38, 52, 46, 64, 72, 88, 76, 92];
const emergencyBars = [18, 22, 15, 27, 31, 24, 35, 29];

export default function AdminDashboard({ currentUser, clinics, bookings, emergencies }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;
    const activeEmergencies = emergencies.filter((emergency) => emergency.status !== 'completed').length;
    const averageRating = clinics.length
      ? clinics.reduce((sum, clinic) => sum + clinic.rating, 0) / clinics.length
      : 0;

    return {
      totalUsers: Math.max(1284, bookings.length * 14 + clinics.length * 11),
      totalVets: clinics.length,
      activeVets: clinics.filter((clinic) => clinic.isOpenNow).length,
      pendingApprovals: verificationApplications.filter((app) => app.status === 'Pending' || app.status === 'Needs Documents').length,
      suspendedAccounts: 3,
      emergencyToday: Math.max(activeEmergencies, emergencies.length),
      appointments: bookings.length,
      pendingBookings,
      averageRating,
      growth: 12.8,
    };
  }, [bookings, clinics, emergencies]);

  const filteredApplications = verificationApplications.filter((app) => {
    const haystack = `${app.doctor} ${app.license} ${app.clinic} ${app.status} ${app.specialty}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const vetPerformance = clinics.map((clinic, index) => {
    const clinicBookings = bookings.filter((booking) => booking.clinicId === clinic.id);
    const completed = clinicBookings.filter((booking) => booking.status === 'completed').length;
    const cancelled = clinicBookings.filter((booking) => booking.status === 'cancelled').length;
    return {
      ...clinic,
      completed,
      emergencies: emergencies.filter((emergency) => emergency.acceptedByClinicId === clinic.id).length,
      response: `${8 + index * 3} min`,
      acceptance: Math.max(72, 96 - index * 4),
      cancellation: Math.min(18, cancelled * 6 + index + 2),
      completion: Math.min(100, 82 + index * 3),
    };
  });

  const tabs = [
    { id: 'overview', label: 'Command Home', icon: BarChart3 },
    { id: 'verification', label: 'Vet Verification', icon: ClipboardCheck, count: stats.pendingApprovals },
    { id: 'performance', label: 'Performance', icon: Gauge },
    { id: 'complaints', label: 'Reviews & Complaints', icon: MessageSquareWarning, count: complaints.length },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'emergencies', label: 'Emergency Monitor', icon: AlertTriangle, count: stats.emergencyToday },
    { id: 'documents', label: 'Documents', icon: FileSearch },
    { id: 'security', label: 'Security Logs', icon: Lock },
  ] as const;

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Hold: 'bg-slate-100 text-slate-700 border-slate-200',
      'Needs Documents': 'bg-rose-50 text-rose-700 border-rose-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
      accepted: 'bg-blue-50 text-blue-700 border-blue-200',
      notified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-[78vh] bg-[#F4FBF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-green-100/70 shadow-sm p-5 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-black text-gray-900 leading-tight">Admin Control</h2>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.name}</p>
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-green-300' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {'count' in tab && tab.count ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-green-50 text-green-700'}`}>{tab.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Trust Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Veterinarian services remain inactive until verification is approved.</p>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            <section className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 overflow-hidden relative">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(88,179,104,0.35),transparent_45%)] pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-green-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> QuickVets Trust & Quality Hub
                  </span>
                  <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">Admin Dashboard</h1>
                  <p className="text-sm text-slate-300 max-w-2xl">Verify genuine veterinarians, monitor platform quality, resolve disputes, and keep emergency operations accountable.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                    <span className="block text-2xl font-black">{stats.pendingApprovals}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Pending checks</span>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                    <span className="block text-2xl font-black">{stats.averageRating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Avg rating</span>
                  </div>
                </div>
              </div>
            </section>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Pending Vet Approvals', value: stats.pendingApprovals, icon: ClipboardCheck, tone: 'text-amber-600 bg-amber-50' },
                    { label: 'Active Veterinarians', value: stats.activeVets, icon: Stethoscope, tone: 'text-green-700 bg-green-50' },
                    { label: 'Total Users', value: stats.totalUsers, icon: Users, tone: 'text-blue-700 bg-blue-50' },
                    { label: 'Emergency Requests', value: stats.emergencyToday, icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50' },
                    { label: "Today's Appointments", value: stats.appointments, icon: CalendarDays, tone: 'text-indigo-700 bg-indigo-50' },
                    { label: 'Suspended Accounts', value: stats.suspendedAccounts, icon: ShieldOff, tone: 'text-slate-700 bg-slate-100' },
                    { label: 'New Registrations', value: 24, icon: UserCog, tone: 'text-cyan-700 bg-cyan-50' },
                    { label: 'Weekly Growth', value: `${stats.growth}%`, icon: BarChart3, tone: 'text-emerald-700 bg-emerald-50' },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.tone}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="block font-display font-black text-2xl text-slate-900">{card.value}</span>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wide">{card.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Monthly Registrations</h3>
                      <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg">+18% MoM</span>
                    </div>
                    <div className="h-44 flex items-end gap-3">
                      {monthlyBars.map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-xl bg-green-100 relative overflow-hidden" style={{ height: `${height}%` }}>
                          <div className="absolute inset-x-0 bottom-0 bg-green-500 rounded-t-xl" style={{ height: `${Math.max(28, height - 18)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Emergency Request Trend</h3>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">Live watch</span>
                    </div>
                    <div className="h-44 flex items-end gap-3">
                      {emergencyBars.map((height, index) => (
                        <div key={index} className="flex-1 rounded-t-xl bg-rose-100 relative overflow-hidden" style={{ height: `${height * 2.1}%` }}>
                          <div className="absolute inset-x-0 bottom-0 bg-rose-500 rounded-t-xl" style={{ height: '72%' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-display font-black text-slate-900 mb-4">Verification Queue Snapshot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {['Pending Applications', 'Approved Veterinarians', 'Rejected Applications', 'Suspended Veterinarians', 'Re-verification Requests'].map((item, index) => (
                      <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <span className="block text-xl font-black text-slate-900">{[18, stats.totalVets, 7, 3, 5][index]}</span>
                        <span className="text-[10px] font-black uppercase text-slate-500">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-900">Veterinarian Verification & Approval</h3>
                    <p className="text-xs text-slate-500">Review identity, license, clinic records, experience, specializations, and uploaded documents.</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search name, license, status..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display font-black text-lg text-slate-900">{app.doctor}</h4>
                            {renderStatusBadge(app.status)}
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${app.risk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : app.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {app.risk} risk
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <Info label="License" value={app.license} />
                            <Info label="Clinic" value={app.clinic} />
                            <Info label="Specialization" value={app.specialty} />
                            <Info label="Assigned Admin" value={app.assignedTo} />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
                              <span>Verification Progress</span>
                              <span>{app.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${app.progress}%` }} />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc) => (
                              <span key={doc} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                                <FileSearch className="w-3 h-3" /> {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-2 xl:w-44">
                          <button className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Approve</button>
                          <button className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5"><Clock className="w-4 h-4" />Hold</button>
                          <button className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"><Bell className="w-4 h-4" />Request Docs</button>
                          <button className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"><XCircle className="w-4 h-4" />Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <div>
                  <h3 className="font-display font-black text-2xl text-slate-900">Veterinarian Performance Monitoring</h3>
                  <p className="text-xs text-slate-500">Track ratings, appointment completion, emergency handling, response time, and cancellation risk.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b">
                        <th className="py-3">Veterinarian Center</th>
                        <th>Rating</th>
                        <th>Completed</th>
                        <th>Emergencies</th>
                        <th>Response</th>
                        <th>Accept Rate</th>
                        <th>Cancel Rate</th>
                        <th>Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vetPerformance.map((vet) => (
                        <tr key={vet.id} className="border-b border-slate-100 text-xs">
                          <td className="py-4">
                            <div className="font-black text-slate-800">{vet.name}</div>
                            <div className="text-slate-400">{vet.area}, {vet.city}</div>
                          </td>
                          <td><span className="font-black text-amber-600">{vet.rating} ★</span><div className="text-slate-400">{vet.reviewsCount} reviews</div></td>
                          <td className="font-bold">{vet.completed}</td>
                          <td className="font-bold">{vet.emergencies}</td>
                          <td className="font-bold">{vet.response}</td>
                          <td className="font-bold text-green-700">{vet.acceptance}%</td>
                          <td className="font-bold text-rose-600">{vet.cancellation}%</td>
                          <td>
                            <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${vet.completion}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-2xl text-slate-900">Review & Complaint Monitoring</h3>
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-black text-slate-900">{complaint.category}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${complaint.severity === 'High' ? 'bg-rose-50 text-rose-700' : complaint.severity === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{complaint.severity}</span>
                        </div>
                        <p className="text-xs text-slate-500">{complaint.vet} reported by {complaint.owner} · {complaint.age}</p>
                      </div>
                      <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" />Investigate</button>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-slate-900">Authenticity Watch</h3>
                  {['Fake rating pattern', 'Abusive review language', 'Sudden negative spike', 'Repeat payment dispute'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-xs font-bold text-slate-700">{item}</span>
                      <span className="text-xs font-black text-slate-900">{[4, 9, 2, 6][index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-900">User & Veterinarian Management</h3>
                    <p className="text-xs text-slate-500">Search profiles, view activity history, suspend risky accounts, and request reverification.</p>
                  </div>
                  <button className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-600 flex items-center gap-1.5"><Filter className="w-4 h-4" />Filters</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clinics.slice(0, 4).map((clinic, index) => (
                    <div key={clinic.id} className="rounded-3xl border border-slate-100 p-4 flex gap-4">
                      <img src={clinic.imageUrl} alt={clinic.name} className="w-20 h-20 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-900 line-clamp-1">{clinic.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{clinic.address}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-black">Edit</button>
                          <button className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black">Reverify</button>
                          <button className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black">{index === 2 ? 'Reactivate' : 'Suspend'}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'emergencies' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <h3 className="font-display font-black text-2xl text-slate-900">Emergency Request Monitoring</h3>
                {emergencies.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">No emergency records are currently loaded for this admin session.</div>
                ) : emergencies.map((emergency) => (
                  <div key={emergency.id} className="rounded-3xl border border-slate-100 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900">{emergency.petName} · {emergency.petType}</span>
                        {renderStatusBadge(emergency.status)}
                      </div>
                      <p className="text-xs text-slate-500">{emergency.address}</p>
                      <p className="text-xs font-bold text-slate-700">{emergency.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">{emergency.acceptedByClinicName || 'Unassigned'}</span>
                      <button className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">Reassign</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-2xl text-slate-900">Document Verification Center</h3>
                  {verificationApplications.map((app) => (
                    <div key={app.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <h4 className="font-black text-slate-900">{app.doctor}</h4>
                          <p className="text-xs text-slate-500">{app.license}</p>
                        </div>
                        <button className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600" title="Download documents"><Download className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {app.documents.map((document) => (
                          <button key={document} className="min-h-20 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-600 flex flex-col items-center justify-center gap-2">
                            <FileSearch className="w-5 h-5 text-green-600" />
                            {document}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-slate-900">Fraud Flags</h3>
                  {['Duplicate license number', 'Expired certificate', 'Same phone on multiple accounts', 'Suspicious login location'].map((flag, index) => (
                    <div key={flag} className="flex items-center gap-3 rounded-2xl bg-rose-50/60 border border-rose-100 p-3">
                      <Flag className="w-4 h-4 text-rose-600" />
                      <div>
                        <span className="block text-xs font-black text-slate-800">{flag}</span>
                        <span className="text-[10px] text-slate-500">{[2, 5, 3, 1][index]} accounts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-2xl text-slate-900">Activity Logs</h3>
                  {auditLogs.map((log) => (
                    <div key={`${log.action}-${log.time}`} className="rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="block font-black text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-500">{log.admin} · {log.ip}</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{log.time}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-slate-900">Security Controls</h3>
                  {['Admin authentication', 'Role-based access control', 'Secure session management', 'Document encryption', 'Auto logout on inactivity'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wide">{label}</span>
      <span className="block text-xs font-bold text-slate-800 truncate">{value}</span>
    </div>
  );
}
