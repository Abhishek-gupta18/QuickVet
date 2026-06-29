export type UserRole = 'pet_owner' | 'veterinarian' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  
  // Pet owner specific
  pets?: Pet[];
  favoriteClinics?: string[]; // Clinic IDs
  
  // Veterinarian specific
  clinicId?: string; // Links to their clinic
}

export interface Pet {
  id: string;
  name: string;
  type: string; // 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | etc.
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
  verificationDocuments?: VetDocument[];
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'needs_documents' | 'hold' | 'suspended';
  licenseNumber?: string;
  veterinarianName?: string;
  yearsOfExperience?: string;
}

export interface VetDocument {
  id: string;
  label: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  dataUrl?: string;
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
