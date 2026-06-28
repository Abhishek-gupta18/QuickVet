/**
 * Drizzle ORM Schema for QuickVet PostgreSQL Database
 * 
 * 9 Tables: vet_clinics, users, pets, favorite_clinics, clinic_reviews,
 *           bookings, emergency_requests, verification_documents, activity_logs
 * Referential integrity with proper CASCADE/RESTRICT/SET NULL rules.
 */
import {
  pgTable,
  varchar,
  text,
  doublePrecision,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  primaryKey,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// TABLE: vet_clinics
// ============================================================
export const vetClinics = pgTable('vet_clinics', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  address: text('address').notNull(),
  area: varchar('area', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  reviewsCount: integer('reviews_count').default(0),
  imageUrl: text('image_url').notNull(),
  specialists: jsonb('specialists').notNull().$type<string[]>().default([]),
  hasEmergency: boolean('has_emergency').default(false),
  hasHomeVisit: boolean('has_home_visit').default(false),
  isOpenNow: boolean('is_open_now').default(true),
  workingHours: varchar('working_hours', { length: 100 }).notNull(),
  services: jsonb('services').notNull().$type<string[]>().default([]),
});

// ============================================================
// TABLE: users
// Roles: 'pet_owner' | 'veterinarian' | 'admin' | 'guest'
// ============================================================
export const users = pgTable('users', {
  id: varchar('id', { length: 100 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'pet_owner' | 'veterinarian' | 'admin' | 'guest'
  phone: varchar('phone', { length: 30 }),
  avatarUrl: text('avatar_url'),
  clinicId: varchar('clinic_id', { length: 100 }).references(() => vetClinics.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

  // Account status (for suspension/banning by admin)
  accountStatus: varchar('account_status', { length: 20 }).default('active'), // 'active' | 'suspended' | 'banned'
  suspensionReason: text('suspension_reason'),
  suspendedAt: timestamp('suspended_at', { withTimezone: true }),
  suspendedBy: varchar('suspended_by', { length: 100 }), // admin user id

  // Veterinarian verification fields
  verificationStatus: varchar('verification_status', { length: 30 }).default('not_applicable'),
  // 'not_applicable' (pet_owner/admin) | 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'reverification_required'
  vetRegistrationNumber: varchar('vet_registration_number', { length: 100 }),
  vetLicenseNumber: varchar('vet_license_number', { length: 100 }),
  vetDegree: varchar('vet_degree', { length: 255 }),
  vetSpecializations: jsonb('vet_specializations').$type<string[]>().default([]),
  vetExperienceYears: integer('vet_experience_years'),
  vetGovernmentId: varchar('vet_government_id', { length: 100 }),
  verificationNotes: text('verification_notes'), // Internal admin notes
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: varchar('verified_by', { length: 100 }), // admin user id who approved/rejected
  rejectionReason: text('rejection_reason'),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  verificationIdx: index('idx_users_verification').on(table.verificationStatus),
  accountStatusIdx: index('idx_users_account_status').on(table.accountStatus),
}));

// ============================================================
// TABLE: pets
// ============================================================
export const pets = pgTable('pets', {
  id: varchar('id', { length: 100 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  breed: varchar('breed', { length: 100 }),
  age: integer('age'),
  weight: varchar('weight', { length: 20 }),
  medicalHistory: jsonb('medical_history').notNull().$type<string[]>().default([]),
}, (table) => ({
  ownerIdx: index('idx_pets_owner').on(table.ownerId),
}));

// ============================================================
// TABLE: favorite_clinics (Join Table - Many-to-Many)
// ============================================================
export const favoriteClinics = pgTable('favorite_clinics', {
  userId: varchar('user_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.clinicId] }),
}));

// ============================================================
// TABLE: clinic_reviews
// ============================================================
export const clinicReviews = pgTable('clinic_reviews', {
  id: varchar('id', { length: 100 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  rating: integer('rating').notNull(),
  reviewText: text('review_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  // Admin moderation
  isHidden: boolean('is_hidden').default(false),
  hiddenBy: varchar('hidden_by', { length: 100 }),
  hiddenReason: text('hidden_reason'),
}, (table) => ({
  clinicIdx: index('idx_reviews_clinic').on(table.clinicId),
}));

// ============================================================
// TABLE: bookings
// ============================================================
export const bookings = pgTable('bookings', {
  id: varchar('id', { length: 100 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 100 }).notNull().references(() => vetClinics.id, { onDelete: 'restrict' }),
  clinicName: varchar('clinic_name', { length: 255 }).notNull(),
  petOwnerId: varchar('pet_owner_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  petOwnerName: varchar('pet_owner_name', { length: 100 }).notNull(),
  petOwnerEmail: varchar('pet_owner_email', { length: 255 }).notNull(),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  service: varchar('service', { length: 100 }).notNull(),
  bookingDate: date('booking_date').notNull(),
  bookingTime: varchar('booking_time', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  notes: text('notes'),
  bookingType: varchar('booking_type', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ownerIdx: index('idx_bookings_user').on(table.petOwnerId),
  clinicIdx: index('idx_bookings_clinic').on(table.clinicId),
  dateIdx: index('idx_bookings_date').on(table.bookingDate),
}));

// ============================================================
// TABLE: emergency_requests
// ============================================================
export const emergencyRequests = pgTable('emergency_requests', {
  id: varchar('id', { length: 100 }).primaryKey(),
  petOwnerId: varchar('pet_owner_id', { length: 100 }).references(() => users.id, { onDelete: 'set null' }),
  petOwnerName: varchar('pet_owner_name', { length: 100 }).notNull(),
  petOwnerEmail: varchar('pet_owner_email', { length: 255 }).notNull(),
  petName: varchar('pet_name', { length: 100 }).notNull(),
  petType: varchar('pet_type', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  address: text('address').notNull(),
  description: text('description').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  acceptedByClinicId: varchar('accepted_by_clinic_id', { length: 100 }).references(() => vetClinics.id, { onDelete: 'set null' }),
  acceptedByClinicName: varchar('accepted_by_clinic_name', { length: 255 }),
  requestDate: date('request_date').notNull(),
  requestTime: varchar('request_time', { length: 30 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusIdx: index('idx_emergencies_status').on(table.status),
  createdIdx: index('idx_emergencies_created').on(table.createdAt),
}));

// ============================================================
// TABLE: verification_documents
// Stores uploaded documents for vet verification
// ============================================================
export const verificationDocuments = pgTable('verification_documents', {
  id: varchar('id', { length: 100 }).primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  // 'medical_license' | 'government_id' | 'degree_certificate' | 'registration_proof' | 'clinic_photo' | 'profile_photo' | 'other'
  documentName: varchar('document_name', { length: 255 }).notNull(),
  documentUrl: text('document_url').notNull(), // URL or base64 reference
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 50 }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  // 'pending' | 'verified' | 'rejected' | 'flagged'
  reviewedBy: varchar('reviewed_by', { length: 100 }), // admin user id
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
}, (table) => ({
  userIdx: index('idx_docs_user').on(table.userId),
  typeIdx: index('idx_docs_type').on(table.documentType),
}));

// ============================================================
// TABLE: activity_logs
// Complete audit trail for admin actions
// ============================================================
export const activityLogs = pgTable('activity_logs', {
  id: varchar('id', { length: 100 }).primaryKey(),
  adminId: varchar('admin_id', { length: 100 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  adminName: varchar('admin_name', { length: 100 }).notNull(),
  adminEmail: varchar('admin_email', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  // Actions: 'login' | 'vet_approved' | 'vet_rejected' | 'vet_suspended' | 'vet_reverification'
  //        | 'user_suspended' | 'user_banned' | 'user_reactivated' | 'review_hidden'
  //        | 'emergency_reassigned' | 'booking_cancelled' | 'document_verified' | 'document_flagged'
  targetType: varchar('target_type', { length: 30 }),
  // 'user' | 'veterinarian' | 'clinic' | 'booking' | 'emergency' | 'review' | 'document'
  targetId: varchar('target_id', { length: 100 }),
  targetName: varchar('target_name', { length: 255 }),
  details: text('details'), // JSON string or description of what happened
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  adminIdx: index('idx_logs_admin').on(table.adminId),
  actionIdx: index('idx_logs_action').on(table.action),
  createdIdx: index('idx_logs_created').on(table.createdAt),
}));

// ============================================================
// RELATIONS
// ============================================================
export const usersRelations = relations(users, ({ many, one }) => ({
  pets: many(pets),
  favoriteClinics: many(favoriteClinics),
  bookings: many(bookings),
  emergencyRequests: many(emergencyRequests),
  verificationDocuments: many(verificationDocuments),
  clinic: one(vetClinics, {
    fields: [users.clinicId],
    references: [vetClinics.id],
  }),
}));

export const petsRelations = relations(pets, ({ one }) => ({
  owner: one(users, {
    fields: [pets.ownerId],
    references: [users.id],
  }),
}));

export const vetClinicsRelations = relations(vetClinics, ({ many }) => ({
  reviews: many(clinicReviews),
  bookings: many(bookings),
  veterinarians: many(users),
  favoritedBy: many(favoriteClinics),
}));

export const favoriteClinicsRelations = relations(favoriteClinics, ({ one }) => ({
  user: one(users, {
    fields: [favoriteClinics.userId],
    references: [users.id],
  }),
  clinic: one(vetClinics, {
    fields: [favoriteClinics.clinicId],
    references: [vetClinics.id],
  }),
}));

export const clinicReviewsRelations = relations(clinicReviews, ({ one }) => ({
  clinic: one(vetClinics, {
    fields: [clinicReviews.clinicId],
    references: [vetClinics.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  clinic: one(vetClinics, {
    fields: [bookings.clinicId],
    references: [vetClinics.id],
  }),
  petOwner: one(users, {
    fields: [bookings.petOwnerId],
    references: [users.id],
  }),
}));

export const emergencyRequestsRelations = relations(emergencyRequests, ({ one }) => ({
  petOwner: one(users, {
    fields: [emergencyRequests.petOwnerId],
    references: [users.id],
  }),
  acceptedByClinic: one(vetClinics, {
    fields: [emergencyRequests.acceptedByClinicId],
    references: [vetClinics.id],
  }),
}));

export const verificationDocumentsRelations = relations(verificationDocuments, ({ one }) => ({
  user: one(users, {
    fields: [verificationDocuments.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  admin: one(users, {
    fields: [activityLogs.adminId],
    references: [users.id],
  }),
}));
