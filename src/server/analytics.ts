import { pool } from './db.js';

type SeriesPoint = {
  label: string;
  value: number;
};

type ActivityLog = {
  action: string;
  actor: string;
  time: string;
  source: string;
};

type AdminAnalytics = {
  summary: {
    totalUsers: number;
    totalVeterinarians: number;
    verifiedVets: number;
    pendingVerifications: number;
    clinics: number;
    appointments: number;
    emergencyRequests: number;
    completedTreatments: number;
    reviews: number;
    averageRating: number;
    notifications: number;
  };
  charts: {
    monthlyUserRegistrations: SeriesPoint[];
    monthlyAppointments: SeriesPoint[];
    appointmentStatusDistribution: SeriesPoint[];
    emergencyRequestsTrend: SeriesPoint[];
    topCities: SeriesPoint[];
    topPetCategories: SeriesPoint[];
    mostCommonDiseases: SeriesPoint[];
    vetVerificationStatus: SeriesPoint[];
    dailyBookings: SeriesPoint[];
    reviewsPerMonth: SeriesPoint[];
    averageRatings: SeriesPoint[];
    vaccinationStatistics: SeriesPoint[];
  };
  activityLogs: ActivityLog[];
};

type VetAnalytics = {
  summary: {
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    emergencyCases: number;
    patientCount: number;
    averageRating: number;
    reviews: number;
    monthlyEarnings: number;
    responseTime: number | null;
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
};

type UserAnalytics = {
  summary: {
    registeredPets: number;
    upcomingAppointment: string | null;
    completedVisits: number;
    vaccinationsDue: number;
    medicalHistoryEntries: number;
    emergencyRequests: number;
    favouriteVeterinarians: number;
    medicalExpenses: number;
  };
  charts: {
    appointmentHistory: SeriesPoint[];
    vaccinationTimeline: SeriesPoint[];
    petHealthTimeline: SeriesPoint[];
    medicalExpenses: SeriesPoint[];
    weightProgress: SeriesPoint[];
  };
  upcomingBookings: Array<{ clinicName: string; service: string; date: string; time: string; status: string }>;
};

async function query<T>(text: string, values: Array<string | number> = []): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}

function toSeriesPoint(row: { label: string; value: number }): SeriesPoint {
  return { label: row.label, value: Number(row.value) || 0 };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildSeriesQuery(labelSql: string, fromSql: string, whereSql = ''): string {
  return `
    SELECT ${labelSql} AS label, COUNT(*)::int AS value
    FROM ${fromSql}
    ${whereSql}
    GROUP BY 1
    ORDER BY 1
  `;
}

async function getActivityLogs(limit = 12): Promise<ActivityLog[]> {
  const rows = await query<{
    action: string;
    actor: string;
    time: string;
    source: string;
  }>(`
    SELECT action, actor, TO_CHAR(time, 'YYYY-MM-DD HH24:MI') AS time, source
    FROM (
      SELECT 'Booking created'::text AS action, pet_owner_name AS actor, created_at AS time, 'bookings'::text AS source
      FROM bookings
      UNION ALL
      SELECT CASE WHEN rating >= 5 THEN 'Five-star review submitted' ELSE 'Review submitted' END AS action,
             user_name AS actor, created_at AS time, 'reviews'::text AS source
      FROM clinic_reviews
      UNION ALL
      SELECT CASE
               WHEN status = 'completed' THEN 'Emergency resolved'
               WHEN status = 'accepted' THEN 'Emergency accepted'
               WHEN status = 'notified' THEN 'Emergency notified'
               ELSE 'Emergency requested'
             END AS action,
             pet_owner_name AS actor, created_at AS time, 'emergencies'::text AS source
      FROM emergency_requests
      UNION ALL
      SELECT 'Vet profile created'::text AS action, COALESCE(veterinarian_name, name) AS actor, created_at AS time, 'clinics'::text AS source
      FROM vet_clinics
    ) events
    ORDER BY time DESC
    LIMIT $1
  `, [limit]);

  return rows.map((row) => ({
    action: cleanText(row.action),
    actor: cleanText(row.actor),
    time: cleanText(row.time),
    source: cleanText(row.source),
  }));
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [totalUsersRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'pet_owner'`);
  const [totalVeterinariansRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM users WHERE role = 'veterinarian'`);
  const [verifiedVetsRow] = await query<{ value: number }>(`
    SELECT COUNT(DISTINCT u.id)::int AS value
    FROM users u
    JOIN vet_clinics c ON c.id = u.clinic_id
    WHERE u.role = 'veterinarian' AND COALESCE(c.verification_status, 'pending') = 'approved'
  `);
  const [pendingVerificationsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM vet_clinics
    WHERE COALESCE(verification_status, 'pending') IN ('pending', 'needs_documents', 'hold')
  `);
  const [clinicsRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM vet_clinics`);
  const [appointmentsRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM bookings`);
  const [emergencyRequestsRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM emergency_requests`);
  const [completedTreatmentsRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM bookings WHERE status = 'completed'`);
  const [reviewsRow] = await query<{ value: number }>(`SELECT COUNT(*)::int AS value FROM clinic_reviews`);
  const [averageRatingRow] = await query<{ value: string }>(`SELECT COALESCE(AVG(rating), 0)::numeric(4,2) AS value FROM clinic_reviews`);
  const [notificationsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM (
      SELECT created_at FROM bookings WHERE created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT created_at FROM clinic_reviews WHERE created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT created_at FROM emergency_requests WHERE created_at >= NOW() - INTERVAL '7 days'
    ) recent_activity
  `);

  const [monthlyUserRegistrations, monthlyAppointments, appointmentStatusDistribution, emergencyRequestsTrend, topCities, topPetCategories, mostCommonDiseases, vetVerificationStatus, dailyBookings, reviewsPerMonth, averageRatings, vaccinationStatistics] = await Promise.all([
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS label, COUNT(*)::int AS value
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE booking_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `),
    query<SeriesPoint>(`
      SELECT COALESCE(status, 'pending') AS label, COUNT(*)::int AS value
      FROM bookings
      GROUP BY COALESCE(status, 'pending')
      ORDER BY COUNT(*) DESC, label ASC
    `),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', request_date::timestamp), 'Mon') AS label, COUNT(*)::int AS value
      FROM emergency_requests
      WHERE request_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', request_date::timestamp)
      ORDER BY DATE_TRUNC('month', request_date::timestamp)
    `),
    query<SeriesPoint>(`
      SELECT city AS label, COUNT(*)::int AS value
      FROM vet_clinics
      GROUP BY city
      ORDER BY COUNT(*) DESC, city ASC
      LIMIT 6
    `),
    query<SeriesPoint>(`
      SELECT type AS label, COUNT(*)::int AS value
      FROM pets
      GROUP BY type
      ORDER BY COUNT(*) DESC, type ASC
      LIMIT 6
    `),
    query<SeriesPoint>(`
      SELECT disease AS label, COUNT(*)::int AS value
      FROM (
        SELECT CASE
          WHEN LOWER(COALESCE(notes, '')) LIKE '%parvo%' OR LOWER(COALESCE(description, '')) LIKE '%parvo%' THEN 'Parvovirus'
          WHEN LOWER(COALESCE(notes, '')) LIKE '%fever%' OR LOWER(COALESCE(description, '')) LIKE '%fever%' THEN 'Fever'
          WHEN LOWER(COALESCE(notes, '')) LIKE '%skin%' OR LOWER(COALESCE(description, '')) LIKE '%skin%' THEN 'Skin Infection'
          WHEN LOWER(COALESCE(notes, '')) LIKE '%vomit%' OR LOWER(COALESCE(description, '')) LIKE '%vomit%' THEN 'Gastroenteritis'
          WHEN LOWER(COALESCE(notes, '')) LIKE '%ear%' OR LOWER(COALESCE(description, '')) LIKE '%ear%' THEN 'Ear Infection'
          WHEN LOWER(COALESCE(notes, '')) LIKE '%fracture%' OR LOWER(COALESCE(description, '')) LIKE '%limp%' THEN 'Orthopedic Injury'
          ELSE 'General Checkup'
        END AS disease
        FROM bookings
        UNION ALL
        SELECT CASE
          WHEN LOWER(COALESCE(description, '')) LIKE '%parvo%' THEN 'Parvovirus'
          WHEN LOWER(COALESCE(description, '')) LIKE '%fever%' THEN 'Fever'
          WHEN LOWER(COALESCE(description, '')) LIKE '%bite%' THEN 'Bite Wound'
          WHEN LOWER(COALESCE(description, '')) LIKE '%vomit%' THEN 'Gastroenteritis'
          WHEN LOWER(COALESCE(description, '')) LIKE '%limp%' THEN 'Orthopedic Injury'
          ELSE 'Emergency Evaluation'
        END AS disease
        FROM emergency_requests
        UNION ALL
        SELECT CASE
          WHEN LOWER(medical_history::text) LIKE '%booster%' OR LOWER(medical_history::text) LIKE '%vaccination%' THEN 'Vaccination Follow-up'
          WHEN LOWER(medical_history::text) LIKE '%allerg%' THEN 'Allergy Management'
          WHEN LOWER(medical_history::text) LIKE '%weight%' THEN 'Weight Monitoring'
          ELSE 'Routine Wellness'
        END AS disease
        FROM pets
      ) disease_sources
      GROUP BY disease
      ORDER BY COUNT(*) DESC, disease ASC
      LIMIT 6
    `),
    query<SeriesPoint>(`
      SELECT COALESCE(verification_status, 'pending') AS label, COUNT(*)::int AS value
      FROM vet_clinics
      GROUP BY COALESCE(verification_status, 'pending')
      ORDER BY COUNT(*) DESC, label ASC
    `),
    query<SeriesPoint>(`
      SELECT TO_CHAR(booking_date::timestamp, 'YYYY-MM-DD') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY booking_date
      ORDER BY booking_date
    `),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS label, COUNT(*)::int AS value
      FROM clinic_reviews
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS label, COALESCE(AVG(rating), 0)::numeric(4,2)::float AS value
      FROM clinic_reviews
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `),
    query<SeriesPoint>(`
      SELECT bucket AS label, COUNT(*)::int AS value
      FROM (
        SELECT CASE
          WHEN LOWER(medical_history::text) LIKE '%vaccination complete%' OR LOWER(medical_history::text) LIKE '%booster done%' THEN 'Up to date'
          WHEN LOWER(medical_history::text) LIKE '%due%' OR LOWER(medical_history::text) LIKE '%booster due%' THEN 'Due soon'
          ELSE 'Tracked'
        END AS bucket
        FROM pets
      ) vaccination_buckets
      GROUP BY bucket
      ORDER BY COUNT(*) DESC, bucket ASC
    `),
  ]);

  return {
    summary: {
      totalUsers: Number(totalUsersRow?.value || 0),
      totalVeterinarians: Number(totalVeterinariansRow?.value || 0),
      verifiedVets: Number(verifiedVetsRow?.value || 0),
      pendingVerifications: Number(pendingVerificationsRow?.value || 0),
      clinics: Number(clinicsRow?.value || 0),
      appointments: Number(appointmentsRow?.value || 0),
      emergencyRequests: Number(emergencyRequestsRow?.value || 0),
      completedTreatments: Number(completedTreatmentsRow?.value || 0),
      reviews: Number(reviewsRow?.value || 0),
      averageRating: Number.parseFloat(averageRatingRow?.value || '0') || 0,
      notifications: Number(notificationsRow?.value || 0),
    },
    charts: {
      monthlyUserRegistrations: monthlyUserRegistrations.map(toSeriesPoint),
      monthlyAppointments: monthlyAppointments.map(toSeriesPoint),
      appointmentStatusDistribution: appointmentStatusDistribution.map(toSeriesPoint),
      emergencyRequestsTrend: emergencyRequestsTrend.map(toSeriesPoint),
      topCities: topCities.map(toSeriesPoint),
      topPetCategories: topPetCategories.map(toSeriesPoint),
      mostCommonDiseases: mostCommonDiseases.map(toSeriesPoint),
      vetVerificationStatus: vetVerificationStatus.map(toSeriesPoint),
      dailyBookings: dailyBookings.map(toSeriesPoint),
      reviewsPerMonth: reviewsPerMonth.map(toSeriesPoint),
      averageRatings: averageRatings.map(toSeriesPoint),
      vaccinationStatistics: vaccinationStatistics.map(toSeriesPoint),
    },
    activityLogs: await getActivityLogs(),
  };
}

export async function getVetAnalytics(clinicId: string): Promise<VetAnalytics> {
  const [todaysAppointmentsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM bookings
    WHERE clinic_id = $1 AND booking_date = CURRENT_DATE
  `, [clinicId]);
  const [upcomingAppointmentsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM bookings
    WHERE clinic_id = $1 AND booking_date >= CURRENT_DATE AND status IN ('pending', 'approved', 'rescheduled', 'upcoming')
  `, [clinicId]);
  const [completedAppointmentsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM bookings
    WHERE clinic_id = $1 AND status = 'completed'
  `, [clinicId]);
  const [emergencyCasesRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM emergency_requests
    WHERE accepted_by_clinic_id = $1 OR status IN ('pending', 'notified', 'accepted')
  `, [clinicId]);
  const [patientCountRow] = await query<{ value: number }>(`
    SELECT COUNT(DISTINCT CONCAT(pet_owner_email, ':', pet_name))::int AS value
    FROM bookings
    WHERE clinic_id = $1 AND status = 'completed'
  `, [clinicId]);
  const [averageRatingRow] = await query<{ value: string }>(`
    SELECT COALESCE(AVG(rating), 0)::numeric(4,2) AS value
    FROM clinic_reviews
    WHERE clinic_id = $1
  `, [clinicId]);
  const [reviewsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM clinic_reviews
    WHERE clinic_id = $1
  `, [clinicId]);
  const [monthlyEarningsRow] = await query<{ value: string }>(`
    SELECT COALESCE(SUM(CASE service
      WHEN 'Emergency Trauma Care' THEN 1800
      WHEN 'Surgeries' THEN 4200
      WHEN 'Pathology & ICU' THEN 2300
      WHEN 'Vaccinations' THEN 650
      WHEN 'Grooming' THEN 900
      WHEN 'In-house Pharmacy' THEN 520
      WHEN 'Dental Care' THEN 1500
      WHEN 'Digital X-Ray' THEN 1400
      WHEN 'Routine Checkup' THEN 800
      WHEN 'General Consultation' THEN 700
      WHEN 'Home Visit Diagnostics' THEN 1200
      WHEN 'General Consultations' THEN 750
      WHEN 'Deworming & Spay' THEN 1100
      WHEN 'Nutritional Advice' THEN 500
      WHEN 'Pet Spa' THEN 950
      WHEN 'Advanced Surgery' THEN 4800
      WHEN 'Ultrasonography' THEN 1700
      WHEN 'Microchipping' THEN 600
      WHEN 'Avian Care Specialist' THEN 1300
      WHEN 'Home Medical Support' THEN 1400
      WHEN 'Critical Care Unit' THEN 3000
      WHEN 'Emergency Oxygen' THEN 1600
      WHEN 'Cardiac Monitoring' THEN 1800
      WHEN 'Orthopedic Trauma' THEN 2600
      WHEN 'Blood Transfusion' THEN 3500
      ELSE 850
    END), 0)::numeric(12,2) AS value
    FROM bookings
    WHERE clinic_id = $1 AND status IN ('approved', 'completed', 'rescheduled')
  `, [clinicId]);
  const [responseTimeRow] = await query<{ value: string }>(`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (booking_date::timestamp - created_at)) / 3600), 0)::numeric(10,2) AS value
    FROM bookings
    WHERE clinic_id = $1 AND status IN ('approved', 'completed')
  `, [clinicId]);
  const [successRateRow] = await query<{ value: string }>(`
    SELECT COALESCE(
      (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled', 'approved', 'pending', 'rescheduled')), 0)) * 100,
      0
    )::numeric(10,2) AS value
    FROM bookings
    WHERE clinic_id = $1
  `, [clinicId]);
  const [notificationsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM (
      SELECT created_at FROM bookings WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT created_at FROM clinic_reviews WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT created_at FROM emergency_requests WHERE accepted_by_clinic_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
    ) recent_activity
  `, [clinicId]);

  const [appointmentsPerWeek, monthlyPatients, ratingsTrend, appointmentStatus, patientCategories, recentReviews] = await Promise.all([
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('week', booking_date::timestamp), 'Mon DD') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE clinic_id = $1
      GROUP BY DATE_TRUNC('week', booking_date::timestamp)
      ORDER BY DATE_TRUNC('week', booking_date::timestamp)
      LIMIT 12
    `, [clinicId]),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COUNT(DISTINCT pet_owner_email)::int AS value
      FROM bookings
      WHERE clinic_id = $1 AND booking_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `, [clinicId]),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS label, COALESCE(AVG(rating), 0)::numeric(4,2)::float AS value
      FROM clinic_reviews
      WHERE clinic_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `, [clinicId]),
    query<SeriesPoint>(`
      SELECT COALESCE(status, 'pending') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE clinic_id = $1
      GROUP BY COALESCE(status, 'pending')
      ORDER BY COUNT(*) DESC, label ASC
    `, [clinicId]),
    query<SeriesPoint>(`
      SELECT pet_type AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE clinic_id = $1
      GROUP BY pet_type
      ORDER BY COUNT(*) DESC, pet_type ASC
    `, [clinicId]),
    query<{ userName: string; rating: number; reviewText: string; date: string; petType: string }>(`
      SELECT user_name AS "userName", rating, review_text AS "reviewText", TO_CHAR(created_at, 'YYYY-MM-DD') AS date, pet_type AS "petType"
      FROM clinic_reviews
      WHERE clinic_id = $1
      ORDER BY created_at DESC
      LIMIT 6
    `, [clinicId]),
  ]);

  return {
    summary: {
      todaysAppointments: Number(todaysAppointmentsRow?.value || 0),
      upcomingAppointments: Number(upcomingAppointmentsRow?.value || 0),
      completedAppointments: Number(completedAppointmentsRow?.value || 0),
      emergencyCases: Number(emergencyCasesRow?.value || 0),
      patientCount: Number(patientCountRow?.value || 0),
      averageRating: Number.parseFloat(averageRatingRow?.value || '0') || 0,
      reviews: Number(reviewsRow?.value || 0),
      monthlyEarnings: Number.parseFloat(monthlyEarningsRow?.value || '0') || 0,
      responseTime: Number.parseFloat(responseTimeRow?.value || '0') || 0,
      successRate: Number.parseFloat(successRateRow?.value || '0') || 0,
      notifications: Number(notificationsRow?.value || 0),
    },
    charts: {
      appointmentsPerWeek: appointmentsPerWeek.map(toSeriesPoint),
      monthlyPatients: monthlyPatients.map(toSeriesPoint),
      ratingsTrend: ratingsTrend.map(toSeriesPoint),
      appointmentStatus: appointmentStatus.map(toSeriesPoint),
      patientCategories: patientCategories.map(toSeriesPoint),
    },
    recentReviews: recentReviews.map((review) => ({
      userName: cleanText(review.userName),
      rating: Number(review.rating) || 0,
      reviewText: cleanText(review.reviewText),
      date: cleanText(review.date),
      petType: cleanText(review.petType),
    })),
  };
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const [registeredPetsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM pets
    WHERE owner_id = $1
  `, [userId]);
  const [upcomingAppointmentRow] = await query<{ clinicName: string; service: string; date: string; time: string; status: string }>(`
    SELECT clinic_name AS "clinicName", service, booking_date::text AS date, booking_time AS time, status
    FROM bookings
    WHERE pet_owner_id = $1 AND booking_date >= CURRENT_DATE
    ORDER BY booking_date ASC, booking_time ASC
    LIMIT 1
  `, [userId]);
  const [completedVisitsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM bookings
    WHERE pet_owner_id = $1 AND status = 'completed'
  `, [userId]);
  const [vaccinationsDueRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM pets
    WHERE owner_id = $1 AND LOWER(medical_history::text) LIKE '%due%'
  `, [userId]);
  const [medicalHistoryEntriesRow] = await query<{ value: number }>(`
    SELECT COALESCE(SUM(jsonb_array_length(medical_history)), 0)::int AS value
    FROM pets
    WHERE owner_id = $1
  `, [userId]);
  const [emergencyRequestsRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM emergency_requests
    WHERE pet_owner_id = $1
  `, [userId]);
  const [favouriteVeterinariansRow] = await query<{ value: number }>(`
    SELECT COUNT(*)::int AS value
    FROM favorite_clinics
    WHERE user_id = $1
  `, [userId]);
  const [medicalExpensesRow] = await query<{ value: string }>(`
    SELECT COALESCE(SUM(CASE service
      WHEN 'Emergency Trauma Care' THEN 1800
      WHEN 'Surgeries' THEN 4200
      WHEN 'Pathology & ICU' THEN 2300
      WHEN 'Vaccinations' THEN 650
      WHEN 'Grooming' THEN 900
      WHEN 'In-house Pharmacy' THEN 520
      WHEN 'Dental Care' THEN 1500
      WHEN 'Digital X-Ray' THEN 1400
      WHEN 'Routine Checkup' THEN 800
      WHEN 'General Consultation' THEN 700
      WHEN 'Home Visit Diagnostics' THEN 1200
      WHEN 'General Consultations' THEN 750
      WHEN 'Deworming & Spay' THEN 1100
      WHEN 'Nutritional Advice' THEN 500
      WHEN 'Pet Spa' THEN 950
      WHEN 'Advanced Surgery' THEN 4800
      WHEN 'Ultrasonography' THEN 1700
      WHEN 'Microchipping' THEN 600
      WHEN 'Avian Care Specialist' THEN 1300
      WHEN 'Home Medical Support' THEN 1400
      WHEN 'Critical Care Unit' THEN 3000
      WHEN 'Emergency Oxygen' THEN 1600
      WHEN 'Cardiac Monitoring' THEN 1800
      WHEN 'Orthopedic Trauma' THEN 2600
      WHEN 'Blood Transfusion' THEN 3500
      ELSE 850
    END), 0)::numeric(12,2) AS value
    FROM bookings
    WHERE pet_owner_id = $1 AND status IN ('completed', 'approved', 'rescheduled')
  `, [userId]);

  const [appointmentHistory, vaccinationTimeline, petHealthTimeline, medicalExpenses, weightProgress] = await Promise.all([
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE pet_owner_id = $1 AND booking_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `, [userId]),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE pet_owner_id = $1 AND LOWER(service) LIKE '%vaccin%'
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `, [userId]),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COUNT(*)::int AS value
      FROM bookings
      WHERE pet_owner_id = $1 AND status IN ('completed', 'approved', 'rescheduled', 'pending')
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `, [userId]),
    query<SeriesPoint>(`
      SELECT TO_CHAR(DATE_TRUNC('month', booking_date::timestamp), 'Mon') AS label, COALESCE(SUM(CASE service
        WHEN 'Emergency Trauma Care' THEN 1800
        WHEN 'Surgeries' THEN 4200
        WHEN 'Pathology & ICU' THEN 2300
        WHEN 'Vaccinations' THEN 650
        WHEN 'Grooming' THEN 900
        WHEN 'In-house Pharmacy' THEN 520
        WHEN 'Dental Care' THEN 1500
        WHEN 'Digital X-Ray' THEN 1400
        WHEN 'Routine Checkup' THEN 800
        WHEN 'General Consultation' THEN 700
        WHEN 'Home Visit Diagnostics' THEN 1200
        WHEN 'General Consultations' THEN 750
        WHEN 'Deworming & Spay' THEN 1100
        WHEN 'Nutritional Advice' THEN 500
        WHEN 'Pet Spa' THEN 950
        WHEN 'Advanced Surgery' THEN 4800
        WHEN 'Ultrasonography' THEN 1700
        WHEN 'Microchipping' THEN 600
        WHEN 'Avian Care Specialist' THEN 1300
        WHEN 'Home Medical Support' THEN 1400
        WHEN 'Critical Care Unit' THEN 3000
        WHEN 'Emergency Oxygen' THEN 1600
        WHEN 'Cardiac Monitoring' THEN 1800
        WHEN 'Orthopedic Trauma' THEN 2600
        WHEN 'Blood Transfusion' THEN 3500
        ELSE 850
      END), 0)::numeric(12,2)::float AS value
      FROM bookings
      WHERE pet_owner_id = $1 AND booking_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', booking_date::timestamp)
      ORDER BY DATE_TRUNC('month', booking_date::timestamp)
    `, [userId]),
    query<SeriesPoint>(`
      SELECT name AS label, COALESCE(NULLIF(REGEXP_REPLACE(weight, '[^0-9.]', '', 'g'), ''), '0')::float AS value
      FROM pets
      WHERE owner_id = $1
      ORDER BY COALESCE(NULLIF(REGEXP_REPLACE(weight, '[^0-9.]', '', 'g'), ''), '0')::float DESC, name ASC
      LIMIT 6
    `, [userId]),
  ]);

  const latestPetHistory = await query<{ label: string; value: number }>(`
    SELECT COALESCE(p.breed, p.type) AS label, COUNT(*)::int AS value
    FROM pets p
    WHERE p.owner_id = $1
    GROUP BY COALESCE(p.breed, p.type)
    ORDER BY COUNT(*) DESC, label ASC
    LIMIT 6
  `, [userId]);

  return {
    summary: {
      registeredPets: Number(registeredPetsRow?.value || 0),
      upcomingAppointment: upcomingAppointmentRow
        ? `${upcomingAppointmentRow.clinicName} · ${upcomingAppointmentRow.date} ${upcomingAppointmentRow.time}`
        : null,
      completedVisits: Number(completedVisitsRow?.value || 0),
      vaccinationsDue: Number(vaccinationsDueRow?.value || 0),
      medicalHistoryEntries: Number(medicalHistoryEntriesRow?.value || 0),
      emergencyRequests: Number(emergencyRequestsRow?.value || 0),
      favouriteVeterinarians: Number(favouriteVeterinariansRow?.value || 0),
      medicalExpenses: Number.parseFloat(medicalExpensesRow?.value || '0') || 0,
    },
    charts: {
      appointmentHistory: appointmentHistory.map(toSeriesPoint),
      vaccinationTimeline: vaccinationTimeline.map(toSeriesPoint),
      petHealthTimeline: petHealthTimeline.map(toSeriesPoint),
      medicalExpenses: medicalExpenses.map(toSeriesPoint),
      weightProgress: latestPetHistory.map(toSeriesPoint),
    },
    upcomingBookings: upcomingAppointmentRow ? [upcomingAppointmentRow] : [],
  };
}
