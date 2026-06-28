export type UserRole = 'pet_owner' | 'veterinarian' | 'admin' | 'guest';

export type AccountStatus = 'active' | 'suspended' | 'banned';

export type VerificationStatus = 'not_applicable' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'reverification_required';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  accountStatus?: AccountStatus;
  
  // Pet owner specific
  pets?: Pet[];
  favoriteClinics?: string[]; // Clinic IDs
  
  // Veterinarian specific
  clinicId?: string;
  verificationStatus?: VerificationStatus;
  vetRegistrationNumber?: string;
  vetLicenseNumber?: string;
  vetDegree?: string;
  vetSpecializations?: string[];
  vetExperienceYears?: number;
  vetGovernmentId?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  weight?: string;
  medicalHistory?: string[];
}

export interface VetClinic {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  specialists: ('Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Exotics')[];
  hasEmergency: boolean;
  hasHomeVisit: boolean;
  isOpenNow: boolean;
  workingHours: string;
  services: string[];
}

export interface ClinicReview {
  id: string;
  clinicId: string;
  userName: string;
  userEmail: string;
  petType: string;
  rating: number;
  reviewText: string;
  date: string;
  isHidden?: boolean;
  hiddenReason?: string;
}

export interface Booking {
  id: string;
  clinicId: string;
  clinicName: string;
  petOwnerName: string;
  petOwnerEmail: string;
  petName: string;
  petType: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  type: 'clinic_visit' | 'home_visit';
  createdAt: string;
}

export interface EmergencyRequest {
  id: string;
  petOwnerName: string;
  petOwnerEmail: string;
  petName: string;
  petType: string;
  phone: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'notified' | 'accepted' | 'completed';
  acceptedByClinicId?: string;
  acceptedByClinicName?: string;
  date: string;
  time: string;
  createdAt: string;
}

// ============================================================
// ADMIN-SPECIFIC TYPES
// ============================================================

export interface VerificationDocument {
  id: string;
  userId: string;
  documentType: 'medical_license' | 'government_id' | 'degree_certificate' | 'registration_proof' | 'clinic_photo' | 'profile_photo' | 'other';
  documentName: string;
  documentUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'flagged';
  reviewNotes?: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType?: 'user' | 'veterinarian' | 'clinic' | 'booking' | 'emergency' | 'review' | 'document';
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVets: number;
  totalClinics: number;
  pendingVerifications: number;
  approvedVets: number;
  rejectedVets: number;
  suspendedAccounts: number;
  totalBookings: number;
  todayBookings: number;
  totalEmergencies: number;
  activeEmergencies: number;
  averageRating: number;
  totalReviews: number;
  newRegistrationsThisWeek: number;
}

export interface VetVerificationApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  clinicId?: string;
  clinicName?: string;
  verificationStatus: VerificationStatus;
  vetRegistrationNumber?: string;
  vetLicenseNumber?: string;
  vetDegree?: string;
  vetSpecializations?: string[];
  vetExperienceYears?: number;
  vetGovernmentId?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  verifiedAt?: string;
  documents?: VerificationDocument[];
}
