import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarClock,
  Check,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Star,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { User, VetClinic, Booking, EmergencyRequest, ClinicReview, VetDocument } from '../types';

interface VetDashboardProps {
  currentUser: User;
  clinics: VetClinic[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onUpdateEmergencyStatus: (id: string, status: string, clinicId: string, clinicName: string) => Promise<void>;
}

interface SeriesPoint {
  label: string;
  value: number;
}

interface VetAnalyticsData {
  summary: {
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    emergencyCases: number;
    patientCount: number;
    averageRating: number;
    reviews: number;
    monthlyEarnings: number;
    responseTime: number;
    successRate: number;
    notifications: number;
  };
  charts: {
    appointmentsPerWeek: SeriesPoint[];
    monthlyPatients: SeriesPoint[];
    ratingsTrend: SeriesPoint[];
    appointmentStatus: SeriesPoint[];
    patientCategories: SeriesPoint[];
  };
  recentReviews: Array<{ userName: string; rating: number; reviewText: string; date: string; petType: string }>;
}

type VetTab =
  | 'overview'
  | 'appointments'
  | 'emergencies'
  | 'records'
  | 'reviews'
  | 'schedule'
  | 'profile'
  | 'messages'
  | 'prescriptions'
  | 'analytics'
  | 'credentials'
  | 'security';

type VerificationState = NonNullable<VetClinic['verificationStatus']> | 'suspended';

const trendBars = [34, 48, 42, 57, 64, 76, 69];
const patientBars = [28, 35, 44, 39, 52, 61];
const ratingBars = [4.2, 4.5, 4.4, 4.7, 4.8, 4.8];

const statusCopy: Record<VerificationState, { label: string; tone: string; message: string }> = {
  pending: {
    label: 'Pending Verification',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    message: 'Your professional profile is under admin review. The dashboard unlocks after approval.',
  },
  approved: {
    label: 'Approved',
    tone: 'bg-green-50 text-green-700 border-green-200',
    message: 'Your verified veterinarian workspace is active.',
  },
  rejected: {
    label: 'Rejected',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    message: 'Your verification was rejected. Review the admin note and resubmit corrected credentials.',
  },
  needs_documents: {
    label: 'Additional Documents Required',
    tone: 'bg-orange-50 text-orange-700 border-orange-200',
    message: 'QuickVet needs one or more additional documents before your profile can be approved.',
  },
  hold: {
    label: 'On Hold',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    message: 'Your verification is paused while the admin team reviews your application details.',
  },
  suspended: {
    label: 'Suspended',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    message: 'Dashboard access is suspended. Contact QuickVet support for credential review.',
  },
};

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    rescheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emergency: 'bg-rose-50 text-rose-700 border-rose-200',
    accepted: 'bg-blue-50 text-blue-700 border-blue-200',
    notified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 font-display text-2xl font-black text-slate-900">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function DocumentList({ documents }: { documents: VetDocument[] }) {
  if (!documents.length) {
    return <p className="text-xs text-slate-400">No credential documents are attached yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={doc.dataUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-green-300 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-black text-slate-800">
            <FileText className="h-4 w-4 text-green-700" />
            {doc.label}
          </span>
          <span className="mt-1 block truncate text-[10px] text-slate-400">{doc.fileName}</span>
        </a>
      ))}
    </div>
  );
}

export default function VetDashboard({
  currentUser,
  clinics,
  bookings,
  emergencies,
  onUpdateBookingStatus,
  onUpdateEmergencyStatus,
}: VetDashboardProps) {
  const [activeTab, setActiveTab] = useState<VetTab>('overview');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | Booking['status']>('all');
  const [clinicReviews, setClinicReviews] = useState<ClinicReview[]>([]);
  const [analytics, setAnalytics] = useState<VetAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const clinic = useMemo(
    () => clinics.find((candidate) => candidate.id === currentUser.clinicId),
    [clinics, currentUser.clinicId],
  );

  const verificationStatus = (clinic?.verificationStatus || 'pending') as VerificationState;
  const verification = statusCopy[verificationStatus] || statusCopy.pending;
  const isApproved = verificationStatus === 'approved';

  const clinicBookings = useMemo(
    () => bookings.filter((booking) => booking.clinicId === clinic?.id),
    [bookings, clinic?.id],
  );
  const visibleAppointments = appointmentFilter === 'all'
    ? clinicBookings
    : clinicBookings.filter((booking) => booking.status === appointmentFilter);
  const todaysAppointments = clinicBookings.filter((booking) => booking.date === new Date().toISOString().split('T')[0]);
  const pendingBookings = clinicBookings.filter((booking) => booking.status === 'pending');
  const completedBookings = clinicBookings.filter((booking) => booking.status === 'completed');
  const activeEmergencies = emergencies.filter((emergency) => emergency.status !== 'completed');
  const ownedEmergencies = emergencies.filter((emergency) => emergency.acceptedByClinicId === clinic?.id);
  const newReviews = clinicReviews.filter((review) => review.date >= new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);

  const patientRecords = useMemo(() => {
    const seen = new Map<string, Booking>();
    completedBookings.forEach((booking) => {
      seen.set(`${booking.petOwnerEmail}-${booking.petName}`, booking);
    });
    return Array.from(seen.values()).map((booking, index) => ({
      id: `${booking.id}-record`,
      pet: booking.petName,
      type: booking.petType,
      owner: booking.petOwnerName,
      email: booking.petOwnerEmail,
      diagnosis: booking.notes || booking.service,
      vaccination: index % 2 === 0 ? 'Rabies booster current' : 'Vaccination review due',
      allergies: index % 3 === 0 ? 'No known allergies' : 'Ask owner before medication',
      lastVisit: booking.date,
    }));
  }, [completedBookings]);

  useEffect(() => {
    if (!clinic) {
      setClinicReviews([]);
      return;
    }

    const fetchClinicReviews = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/clinics/${clinic.id}/reviews`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          setClinicReviews([]);
          return;
        }
        const data = await res.json();
        setClinicReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load clinic reviews:', err);
        setClinicReviews([]);
      }
    };

    fetchClinicReviews();
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinic) return;

    let mounted = true;

    const loadAnalytics = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const token = localStorage.getItem('vetfinder_token');
        const res = await fetch(`${apiBase}/api/analytics/vet`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          if (mounted) setAnalytics(null);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (mounted) setAnalytics(null);
          return;
        }

        const data = await res.json();
        if (mounted) setAnalytics(data);
      } catch (err) {
        console.error('Failed to load veterinarian analytics:', err);
        if (mounted) setAnalytics(null);
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [clinic?.id]);

  const analyticsSummary = analytics?.summary;
  const appointmentsPerWeek = analytics?.charts.appointmentsPerWeek ?? trendBars.map((value, index) => ({ label: `W${index + 1}`, value }));
  const monthlyPatients = analytics?.charts.monthlyPatients ?? patientBars.map((value, index) => ({ label: `M${index + 1}`, value }));
  const ratingsTrend = analytics?.charts.ratingsTrend ?? ratingBars.map((value, index) => ({ label: `M${index + 1}`, value }));
  const appointmentStatus = analytics?.charts.appointmentStatus ?? [];
  const patientCategories = analytics?.charts.patientCategories ?? [];

  const updateBooking = async (id: string, status: 'approved' | 'completed' | 'cancelled') => {
    setLoadingId(id);
    try {
      await onUpdateBookingStatus(id, status);
    } finally {
      setLoadingId(null);
    }
  };

  const updateEmergency = async (id: string, status: 'accepted' | 'completed') => {
    if (!clinic) return;
    setLoadingId(id);
    try {
      await onUpdateEmergencyStatus(id, status, clinic.id, clinic.name);
    } finally {
      setLoadingId(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Home', icon: BarChart3 },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, count: analyticsSummary?.upcomingAppointments ?? pendingBookings.length },
    { id: 'emergencies', label: 'Emergencies', icon: ShieldAlert, count: analyticsSummary?.emergencyCases ?? activeEmergencies.filter((emergency) => emergency.status === 'pending' || emergency.status === 'notified').length },
    { id: 'records', label: 'Patient Records', icon: ClipboardList },
    { id: 'reviews', label: 'Reviews', icon: Star, count: analyticsSummary?.reviews ?? clinicReviews.length },
    { id: 'schedule', label: 'Schedule', icon: CalendarClock },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: analyticsSummary?.notifications ?? Math.min(4, pendingBookings.length + ownedEmergencies.length) },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'credentials', label: 'Credentials', icon: ShieldCheck },
    { id: 'security', label: 'Security', icon: Lock },
  ] as const;

  if (!clinic) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[75vh]">
        <div className="bg-white border border-amber-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-black text-slate-900">Verification profile required</h2>
          <p className="mx-auto max-w-xl text-sm text-slate-500">
            Your veterinarian account is not linked to a professional verification profile yet. Submit clinic, license, and document details from the veterinarian registration flow to enter the admin review queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[78vh] bg-[#F4FBF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-green-100/70 shadow-sm p-5 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg'}
                alt={currentUser.name}
                className="h-12 w-12 rounded-2xl border border-green-100 bg-green-50"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h2 className="font-display font-black text-slate-900 truncate">{currentUser.name}</h2>
                <p className="text-[11px] text-slate-500 truncate">{clinic.name}</p>
              </div>
            </div>

            <div className={`rounded-2xl border p-3 ${verification.tone}`}>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide">
                {isApproved ? <BadgeCheck className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {verification.label}
              </span>
              <p className="mt-2 text-xs leading-relaxed opacity-90">{verification.message}</p>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={!isApproved && tab.id !== 'credentials'}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-green-300' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {'count' in tab && tab.count ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-green-50 text-green-700'}`}>{tab.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            {!isApproved && (
              <section className="bg-white rounded-3xl border border-amber-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-black text-slate-900">Dashboard locked until admin approval</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Appointments, emergency broadcasts, public profile visibility, and patient communications remain disabled while verification is incomplete.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'overview' && isApproved && (
              <section className="space-y-6">
                <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-green-700">Veterinarian Dashboard</p>
                      <h3 className="font-display text-2xl sm:text-3xl font-black text-slate-900">Professional workspace</h3>
                      <p className="mt-1 text-sm text-slate-500">Manage appointments, emergencies, records, prescriptions, messages, and performance from one verified hub.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                      <BadgeCheck className="h-4 w-4" />
                      Verified badge active
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <MetricTile icon={CalendarCheck} label="Today" value={analyticsSummary?.todaysAppointments ?? todaysAppointments.length} hint="Appointments booked for the current date" />
                  <MetricTile icon={Clock} label="Upcoming" value={analyticsSummary?.upcomingAppointments ?? clinicBookings.filter((booking) => booking.status === 'approved' || booking.status === 'upcoming' || booking.status === 'rescheduled').length} hint="Upcoming consultations waiting to be completed" />
                  <MetricTile icon={ShieldAlert} label="Emergencies" value={analyticsSummary?.emergencyCases ?? activeEmergencies.length} hint="Open regional emergency requests" />
                  <MetricTile icon={Star} label="Rating" value={`${(analyticsSummary?.averageRating ?? clinic.rating).toFixed(1)}`} hint={`${analyticsSummary?.reviews ?? clinic.reviewsCount ?? clinicReviews.length} public reviews tracked`} />
                  <MetricTile icon={UsersRound} label="Patients" value={analyticsSummary?.patientCount ?? patientRecords.length} hint="Unique completed patient records" />
                  <MetricTile icon={MessageSquare} label="Messages" value={analyticsSummary?.notifications ?? Math.min(4, pendingBookings.length + ownedEmergencies.length)} hint="Appointment and follow-up conversations" />
                  <MetricTile icon={Pill} label="Earnings" value={`₹${Math.round(analyticsSummary?.monthlyEarnings ?? completedBookings.length * 850).toLocaleString('en-IN')}`} hint="Estimated monthly earnings from treatments" />
                  <MetricTile icon={Bell} label="Success" value={`${Math.round(analyticsSummary?.successRate ?? (clinicBookings.length ? ((clinicBookings.length - clinicBookings.filter((booking) => booking.status === 'cancelled').length) / clinicBookings.length) * 100 : 100))}%`} hint="Requests not declined" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Weekly appointment trends</h4>
                    <div className="mt-5 flex h-40 items-end gap-3">
                      {appointmentsPerWeek.map((point, index) => (
                        <div key={`${point.label}-${index}`} className="flex-1 rounded-t-xl bg-green-500/80" style={{ height: `${Math.max(12, Math.min(100, point.value * 8))}%` }} title={point.label} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Priority queue</h4>
                    <div className="mt-4 space-y-3">
                      {[...pendingBookings.slice(0, 2), ...activeEmergencies.slice(0, 2)].map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                          {'petOwnerName' in item ? (
                            <>
                              <p className="text-sm font-black text-slate-800">{item.petOwnerName}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.petName} needs {item.service} on {item.date} at {item.time}</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black text-slate-800">{item.petName} emergency</p>
                              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                            </>
                          )}
                        </div>
                      ))}
                      {!pendingBookings.length && !activeEmergencies.length && (
                        <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">No pending clinical actions right now.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'appointments' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-2xl font-black text-slate-900">Appointment management</h3>
                    <p className="text-sm text-slate-500">Accept, decline, complete, and review clinic or home visit requests.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'pending', 'approved', 'completed', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setAppointmentFilter(filter)}
                        className={`rounded-xl px-3 py-2 text-xs font-black capitalize ${appointmentFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {visibleAppointments.map((booking) => (
                    <div key={booking.id} className="rounded-3xl border border-slate-200 p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-lg font-black text-slate-900">{booking.petOwnerName}</h4>
                          {statusBadge(booking.status)}
                          <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500">{booking.type === 'home_visit' ? 'Home visit' : 'Clinic visit'}</span>
                        </div>
                        <p className="text-xs text-slate-500">{booking.petName} ({booking.petType}) requested {booking.service}</p>
                        <p className="text-xs text-slate-500">{booking.date} at {booking.time} | {booking.petOwnerEmail}</p>
                        {booking.notes && <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{booking.notes}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button disabled={loadingId === booking.id} onClick={() => updateBooking(booking.id, 'approved')} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60">
                              <Check className="h-4 w-4" />
                              Accept
                            </button>
                            <button disabled={loadingId === booking.id} onClick={() => updateBooking(booking.id, 'cancelled')} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:opacity-60">
                              <X className="h-4 w-4" />
                              Decline
                            </button>
                          </>
                        )}
                        {booking.status === 'approved' && (
                          <button disabled={loadingId === booking.id} onClick={() => updateBooking(booking.id, 'completed')} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60">
                            <ClipboardList className="h-4 w-4" />
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!visibleAppointments.length && (
                    <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">No appointments match this filter.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'emergencies' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Emergency requests</h3>
                  <p className="text-sm text-slate-500">Accept high-priority cases, contact pet owners, and mark treatment as completed.</p>
                </div>
                <div className="space-y-3">
                  {activeEmergencies.map((emergency) => (
                    <div key={emergency.id} className="rounded-3xl border border-rose-100 border-l-4 border-l-rose-500 p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-lg font-black text-slate-900">{emergency.petName} ({emergency.petType})</h4>
                          {statusBadge(emergency.status)}
                        </div>
                        <p className="text-xs text-slate-500">{emergency.address}</p>
                        <p className="text-xs font-semibold text-rose-700">{emergency.description}</p>
                        <a href={`tel:${emergency.phone}`} className="inline-flex items-center gap-2 text-xs font-black text-green-700">
                          <Phone className="h-4 w-4" />
                          {emergency.phone}
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(emergency.status === 'pending' || emergency.status === 'notified') && (
                          <button disabled={loadingId === emergency.id} onClick={() => updateEmergency(emergency.id, 'accepted')} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-60">
                            Accept case
                          </button>
                        )}
                        {emergency.acceptedByClinicId === clinic.id && emergency.status === 'accepted' && (
                          <button disabled={loadingId === emergency.id} onClick={() => updateEmergency(emergency.id, 'completed')} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60">
                            Mark treatment complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!activeEmergencies.length && (
                    <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">No active emergency requests are currently open.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'records' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Patient records</h3>
                  <p className="text-sm text-slate-500">Completed appointments are organized into digital pet treatment histories.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {patientRecords.map((record) => (
                    <div key={record.id} className="rounded-3xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-display font-black text-slate-900">{record.pet}</h4>
                          <p className="text-xs text-slate-500">{record.type} owned by {record.owner}</p>
                        </div>
                        <Stethoscope className="h-5 w-5 text-green-700" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <p><b>Diagnosis:</b> {record.diagnosis}</p>
                        <p><b>Vaccination:</b> {record.vaccination}</p>
                        <p><b>Allergies:</b> {record.allergies}</p>
                        <p><b>Last visit:</b> {record.lastVisit}</p>
                      </div>
                    </div>
                  ))}
                  {!patientRecords.length && (
                    <p className="xl:col-span-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">Patient records appear after consultations are marked completed.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'reviews' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Reviews and ratings</h3>
                  <p className="text-sm text-slate-500">Feedback is read-only to preserve transparency.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MetricTile icon={Star} label="Overall" value={clinic.rating.toFixed(1)} hint="Average public rating" />
                  <MetricTile icon={MessageSquare} label="New Reviews" value={newReviews.length} hint="Received in the last seven days" />
                  <MetricTile icon={Activity} label="Satisfaction" value={`${Math.round(clinic.rating * 20)}%`} hint="Derived from star score" />
                </div>
                <div className="space-y-3">
                  {clinicReviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-slate-200 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-black text-slate-900">{review.userName}</p>
                        <span className="text-xs text-slate-400">{review.date}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                        <span className="text-xs font-bold text-slate-500">{review.petType}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{review.reviewText}</p>
                    </div>
                  ))}
                  {!clinicReviews.length && (
                    <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">No clinic reviews yet.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'schedule' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Schedule and availability</h3>
                  <p className="text-sm text-slate-500">Current availability controls for appointments and emergency coverage.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Working hours</p>
                    <p className="mt-2 font-display text-xl font-black text-slate-900">{clinic.workingHours}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Emergency mode</p>
                    <p className="mt-2 font-display text-xl font-black text-slate-900">{clinic.hasEmergency ? 'Available' : 'Offline'}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-5">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Home visits</p>
                    <p className="mt-2 font-display text-xl font-black text-slate-900">{clinic.hasHomeVisit ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                    <div key={day} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <span className="text-sm font-black text-slate-800">{day}</span>
                      <span className="text-xs text-slate-500">{clinic.workingHours}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'profile' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Profile management</h3>
                  <p className="text-sm text-slate-500">Public clinic details can be maintained here. Sensitive credentials require re-verification.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {[
                    ['Clinic', clinic.name],
                    ['Veterinarian', clinic.veterinarianName || currentUser.name],
                    ['Phone', clinic.phone],
                    ['Address', clinic.address],
                    ['Consultation focus', clinic.services.join(', ')],
                    ['Specializations', clinic.specialists.join(', ')],
                    ['Experience', clinic.yearsOfExperience || 'Not listed'],
                    ['Biography', clinic.description],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'messages' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Messages and notifications</h3>
                  <p className="text-sm text-slate-500">Appointment chats, verification notices, cancellations, reviews, and platform updates.</p>
                </div>
                <div className="space-y-3">
                  {pendingBookings.slice(0, 4).map((booking) => (
                    <div key={booking.id} className="rounded-3xl border border-slate-200 p-5 flex items-start gap-3">
                      <Mail className="h-5 w-5 text-green-700 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-slate-900">New appointment request from {booking.petOwnerName}</p>
                        <p className="mt-1 text-xs text-slate-500">{booking.petName} needs {booking.service}. Reply after accepting the booking.</p>
                      </div>
                    </div>
                  ))}
                  {newReviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-slate-200 p-5 flex items-start gap-3">
                      <Star className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-slate-900">New review from {review.userName}</p>
                        <p className="mt-1 text-xs text-slate-500">{review.rating} star feedback for {review.petType} care.</p>
                      </div>
                    </div>
                  ))}
                  {!pendingBookings.length && !newReviews.length && (
                    <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">No unread messages or notifications.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'prescriptions' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Prescriptions and medical notes</h3>
                  <p className="text-sm text-slate-500">Completed consultations can be converted into treatment notes and follow-up recommendations.</p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {completedBookings.map((booking) => (
                    <div key={booking.id} className="rounded-3xl border border-slate-200 p-5 space-y-3">
                      <h4 className="font-display font-black text-slate-900">{booking.petName} prescription draft</h4>
                      <p className="text-xs text-slate-500">Diagnosis: {booking.notes || booking.service}</p>
                      <p className="text-xs text-slate-500">Medicine: To be entered after consultation review</p>
                      <p className="text-xs text-slate-500">Follow-up: Schedule review in 7-14 days if symptoms persist</p>
                    </div>
                  ))}
                  {!completedBookings.length && (
                    <p className="xl:col-span-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">Prescription drafts appear after appointments are completed.</p>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'analytics' && isApproved && (
              <section className="space-y-6">
                <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                  <h3 className="font-display text-2xl font-black text-slate-900">Analytics and performance</h3>
                  <p className="text-sm text-slate-500">Track consultations, emergency cases, acceptance rate, cancellations, response quality, and satisfaction.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <MetricTile icon={Stethoscope} label="Consultations" value={clinicBookings.length} hint="Total booked clinic and home visits" />
                  <MetricTile icon={HeartPulse} label="Emergencies" value={analyticsSummary?.emergencyCases ?? ownedEmergencies.length} hint="Emergency cases accepted by this clinic" />
                  <MetricTile icon={Check} label="Acceptance" value={`${analyticsSummary?.successRate ?? (clinicBookings.length ? Math.round(((clinicBookings.length - clinicBookings.filter((booking) => booking.status === 'cancelled').length) / clinicBookings.length) * 100) : 100)}%`} hint="Requests not declined" />
                  <MetricTile icon={X} label="Response" value={`${Math.round(analyticsSummary?.responseTime ?? 0)}h`} hint="Average booking lead time" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Monthly patient statistics</h4>
                    <div className="mt-5 flex h-40 items-end gap-3">
                      {monthlyPatients.map((point, index) => (
                        <div key={`${point.label}-${index}`} className="flex-1 rounded-t-xl bg-slate-900" style={{ height: `${Math.max(12, Math.min(100, point.value * 8))}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Rating trend</h4>
                    <div className="mt-5 space-y-3">
                      {ratingsTrend.map((rating, index) => (
                        <div key={`${rating.label}-${index}`} className="flex items-center gap-3">
                          <span className="w-10 text-xs font-black text-slate-500">{rating.label}</span>
                          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, rating.value * 20)}%` }} />
                          </div>
                          <span className="w-8 text-xs font-black text-slate-700">{rating.value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Appointment Status</h4>
                    <div className="mt-5 space-y-3">
                      {(appointmentStatus.length ? appointmentStatus : clinicBookings.map((booking) => ({ label: booking.status, value: 1 }))).slice(0, 6).map((item, index) => (
                        <div key={`${item.label}-${index}`} className="flex items-center gap-3">
                          <span className="w-24 text-xs font-black text-slate-500 capitalize truncate">{item.label}</span>
                          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, item.value * 14)}%` }} />
                          </div>
                          <span className="w-8 text-xs font-black text-slate-700">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6">
                    <h4 className="font-display font-black text-slate-900">Patient Categories</h4>
                    <div className="mt-5 space-y-3">
                      {(patientCategories.length ? patientCategories : clinicBookings.map((booking) => ({ label: booking.petType, value: 1 }))).slice(0, 6).map((item, index) => (
                        <div key={`${item.label}-${index}`} className="flex items-center gap-3">
                          <span className="w-24 text-xs font-black text-slate-500 capitalize truncate">{item.label}</span>
                          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, item.value * 14)}%` }} />
                          </div>
                          <span className="w-8 text-xs font-black text-slate-700">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'credentials' && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Verification and credential management</h3>
                  <p className="text-sm text-slate-500">Review current approval status, uploaded documents, and credential details.</p>
                </div>
                <div className={`rounded-3xl border p-5 ${verification.tone}`}>
                  <p className="text-xs font-black uppercase tracking-wide">{verification.label}</p>
                  <p className="mt-2 text-sm">{verification.message}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">License number</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{clinic.licenseNumber || 'Pending entry'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Expiry reminder</p>
                    <p className="mt-1 text-sm font-black text-slate-800">90 days before expiry</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Documents</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{clinic.verificationDocuments?.length || 0} uploaded</p>
                  </div>
                </div>
                <DocumentList documents={clinic.verificationDocuments || []} />
              </section>
            )}

            {activeTab === 'security' && isApproved && (
              <section className="bg-white rounded-3xl border border-green-100/70 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="font-display text-2xl font-black text-slate-900">Account and security</h3>
                  <p className="text-sm text-slate-500">Password management, two-factor authentication, active sessions, and privacy controls.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['Password', 'Last changed recently'],
                    ['Two-factor authentication', 'Optional setup available'],
                    ['Active sessions', '1 trusted browser session'],
                    ['Privacy settings', 'Public verified clinic profile visible'],
                    ['Device login history', 'Current Windows browser session'],
                    ['Account deactivation', 'Requires support confirmation'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-sm font-black text-slate-900">{label}</p>
                      <p className="mt-1 text-xs text-slate-500">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
