/**
 * Database Seed Script for QuickVet
 * 
 * Populates the PostgreSQL database with initial demo data:
 * - 6 veterinary clinics in Bengaluru
 * - 2 default user accounts (pet owner + veterinarian)
 * - 2 pets for the pet owner
 * - 4 clinic reviews
 * - 1 seed booking
 * - 1 seed emergency request
 * - 1 favorite clinic entry
 * 
 * Run with: npm run db:seed (or: npx tsx src/server/seed.ts)
 */
import 'dotenv/config';
import { db, closePool } from './db.js';
import {
  vetClinics,
  users,
  pets,
  favoriteClinics,
  clinicReviews,
  bookings,
  emergencyRequests,
} from './schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================
  // 1. SEED VET CLINICS
  // ============================================================
  console.log('  → Inserting vet clinics...');
  await db.insert(vetClinics).values([
    {
      id: 'clinic-1',
      name: 'Cessna Lifeline 24x7 Animal Hospital',
      description: 'Premier 24/7 veterinary multi-specialty hospital with advanced diagnostics, critical care, and emergency services.',
      address: '10, Stage 2, Domlur Double Rd, Phase 1, Domlur, Bengaluru, Karnataka 560071',
      area: 'Domlur',
      city: 'Bengaluru',
      latitude: 12.9628,
      longitude: 77.6387,
      phone: '+91 80 4369 3333',
      rating: '4.80',
      reviewsCount: 1420,
      imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600',
      specialists: ['Dog', 'Cat', 'Bird', 'Exotics'],
      hasEmergency: true,
      hasHomeVisit: true,
      isOpenNow: true,
      workingHours: 'Open 24 Hours / 7 Days',
      services: ['Emergency Trauma Care', 'Surgeries', 'Pathology & ICU', 'Vaccinations', 'Grooming', 'In-house Pharmacy'],
    },
    {
      id: 'clinic-2',
      name: 'Crown Vet Premium Clinic',
      description: 'State-of-the-art diagnostics and premium care for pet companions. Led by experienced surgical and critical care experts.',
      address: '694, 15th Main Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      area: 'Indiranagar',
      city: 'Bengaluru',
      latitude: 12.9756,
      longitude: 77.6412,
      phone: '+91 80 4915 2200',
      rating: '4.70',
      reviewsCount: 890,
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
      specialists: ['Dog', 'Cat', 'Rabbit'],
      hasEmergency: true,
      hasHomeVisit: false,
      isOpenNow: true,
      workingHours: '8:00 AM - 10:00 PM',
      services: ['Consultation', 'Dental Care', 'Digital X-Ray', 'Routine Checkup', 'Sterilization'],
    },
    {
      id: 'clinic-3',
      name: 'Happy Tails Veterinary Clinic & Spa',
      description: 'A warm, friendly neighborhood clinic offering customized companion care and pet grooming services with customized therapies.',
      address: '122, 1st B Cross Rd, 5th Block, Koramangala, Bengaluru, Karnataka 560095',
      area: 'Koramangala',
      city: 'Bengaluru',
      latitude: 12.9352,
      longitude: 77.6244,
      phone: '+91 98860 12345',
      rating: '4.50',
      reviewsCount: 540,
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
      specialists: ['Dog', 'Cat'],
      hasEmergency: false,
      hasHomeVisit: true,
      isOpenNow: true,
      workingHours: '9:00 AM - 8:30 PM',
      services: ['Home Visit Diagnostics', 'General Consultations', 'Deworming & Spay', 'Nutritional Advice', 'Pet Spa'],
    },
    {
      id: 'clinic-4',
      name: 'Myra Pet Clinic & Vet Surgery Center',
      description: 'Expert orthopedic, soft tissue animal surgeries, pet therapy options, and specialized exotic pets consultation.',
      address: '15, ECC Rd, OPP. Deen Academy, Pattandur Agrahara, Whitefield, Bengaluru, Karnataka 560066',
      area: 'Whitefield',
      city: 'Bengaluru',
      latitude: 12.9734,
      longitude: 77.7410,
      phone: '+91 99000 66321',
      rating: '4.60',
      reviewsCount: 680,
      imageUrl: 'https://images.unsplash.com/photo-1606206591513-ad3c5abd089e?auto=format&fit=crop&q=80&w=600',
      specialists: ['Dog', 'Cat', 'Bird', 'Exotics'],
      hasEmergency: true,
      hasHomeVisit: true,
      isOpenNow: true,
      workingHours: '9:00 AM - 9:00 PM',
      services: ['Advanced Surgery', 'Ultrasonography', 'Microchipping', 'Avian Care Specialist', 'Home Medical Support'],
    },
    {
      id: 'clinic-5',
      name: 'We Care Pets & Exotic Birds Clinic',
      description: 'Dedicated treatments for high-risk small pets, exotic birds, rabbits, and general canine/feline services.',
      address: '542, 24th Main Rd, 1st Phase, JP Nagar, Bengaluru, Karnataka 560078',
      area: 'JP Nagar',
      city: 'Bengaluru',
      latitude: 12.9099,
      longitude: 77.5896,
      phone: '+91 94480 54321',
      rating: '4.40',
      reviewsCount: 310,
      imageUrl: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&q=80&w=600',
      specialists: ['Bird', 'Rabbit', 'Exotics', 'Dog', 'Cat'],
      hasEmergency: false,
      hasHomeVisit: true,
      isOpenNow: false,
      workingHours: '10:00 AM - 7:30 PM',
      services: ['Avian Medicine', 'Rabbit Dentistry', 'Immunization', 'Flea & Tick Treatments', 'Home Visits'],
    },
    {
      id: 'clinic-6',
      name: 'Hebbal Animal Emergency & Critical Care Hospital',
      description: '24/7 dedicated pet trauma center working closest with regional emergency services to rescue animals and provide ICU support.',
      address: 'Opp. Veterinary College, Bellary Rd, Hebbal, Bengaluru, Karnataka 560024',
      area: 'Hebbal',
      city: 'Bengaluru',
      latitude: 13.0232,
      longitude: 77.5920,
      phone: '+91 80 2341 1234',
      rating: '4.90',
      reviewsCount: 1650,
      imageUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=600',
      specialists: ['Dog', 'Cat', 'Rabbit'],
      hasEmergency: true,
      hasHomeVisit: false,
      isOpenNow: true,
      workingHours: 'Open 24 Hours / 7 Days',
      services: ['Critical Care Unit', 'Emergency Oxygen', 'Cardiac Monitoring', 'Orthopedic Trauma', 'Blood Transfusion'],
    },
  ]).onConflictDoNothing();

  // ============================================================
  // 2. SEED USERS (with bcrypt-hashed passwords)
  // ============================================================
  console.log('  → Inserting users...');
  const passwordHash = await bcrypt.hash('password', 10);

  await db.insert(users).values([
    {
      id: 'user-owner',
      email: 'owner@gmail.com',
      passwordHash,
      name: 'Prabal Beas',
      role: 'pet_owner',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      clinicId: null,
    },
    {
      id: 'user-vet',
      email: 'vet@gmail.com',
      passwordHash,
      name: 'Dr. Ramesh Roy',
      role: 'veterinarian',
      phone: '+91 99887 76655',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
      clinicId: 'clinic-1',
    },
  ]).onConflictDoNothing();

  // ============================================================
  // 3. SEED PETS (belonging to the pet owner)
  // ============================================================
  console.log('  → Inserting pets...');
  await db.insert(pets).values([
    {
      id: 'pet-1',
      ownerId: 'user-owner',
      name: 'Coco',
      type: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: '28kg',
      medicalHistory: ['Regular Deworming', 'Rabies vaccine - Booster done in Mar 2026'],
    },
    {
      id: 'pet-2',
      ownerId: 'user-owner',
      name: 'Luna',
      type: 'Cat',
      breed: 'Indie Feral',
      age: 1,
      weight: '4.2kg',
      medicalHistory: ['Vaccination complete'],
    },
  ]).onConflictDoNothing();

  // ============================================================
  // 4. SEED FAVORITE CLINICS
  // ============================================================
  console.log('  → Inserting favorite clinics...');
  await db.insert(favoriteClinics).values([
    { userId: 'user-owner', clinicId: 'clinic-1' },
  ]).onConflictDoNothing();

  // ============================================================
  // 5. SEED CLINIC REVIEWS
  // ============================================================
  console.log('  → Inserting clinic reviews...');
  await db.insert(clinicReviews).values([
    {
      id: 'rev-1',
      clinicId: 'clinic-1',
      userName: 'Rohan Sharma',
      userEmail: 'rohan@gmail.com',
      petType: 'Dog',
      rating: 5,
      reviewText: 'Excellent emergency service. They saved my Golden Retriever, Rocky, in the middle of the night when he had a high fever and breathing troubles. The vets are absolute professionals!',
    },
    {
      id: 'rev-2',
      clinicId: 'clinic-1',
      userName: 'Priya Patel',
      userEmail: 'priya.patel@yahoo.com',
      petType: 'Cat',
      rating: 4,
      reviewText: 'Great place, very clean and state-of-the-art facilities. A bit expensive compared to some local clinics, but absolutely worth it for the care and safety they provide.',
    },
    {
      id: 'rev-3',
      clinicId: 'clinic-3',
      userName: 'Ananya Rao',
      userEmail: 'ananya@gmail.com',
      petType: 'Cat',
      rating: 5,
      reviewText: 'I booked a home visit for my senior Persian cat. The doctor was super patient and handled her with so much tenderness. Highly recommended for home checkups!',
    },
    {
      id: 'rev-4',
      clinicId: 'clinic-4',
      userName: 'Kabir Fernandes',
      userEmail: 'kabir@gmail.com',
      petType: 'Bird',
      rating: 5,
      reviewText: 'Best avian vet in town. Dr. Myra treated my injured parakeet flawlessly. Very transparent and extremely kind environment.',
    },
  ]).onConflictDoNothing();

  // ============================================================
  // 6. SEED BOOKINGS
  // ============================================================
  console.log('  → Inserting bookings...');
  await db.insert(bookings).values([
    {
      id: 'booking-seed-1',
      clinicId: 'clinic-1',
      clinicName: 'Cessna Lifeline 24x7 Animal Hospital',
      petOwnerId: 'user-owner',
      petOwnerName: 'Prabal Beas',
      petOwnerEmail: 'owner@gmail.com',
      petName: 'Coco',
      petType: 'Dog',
      service: 'General Checkup',
      bookingDate: '2026-06-10',
      bookingTime: '11:00 AM',
      status: 'approved',
      notes: 'Routine checkup and deworming schedule update.',
      bookingType: 'clinic_visit',
    },
  ]).onConflictDoNothing();

  // ============================================================
  // 7. SEED EMERGENCY REQUESTS
  // ============================================================
  console.log('  → Inserting emergency requests...');
  await db.insert(emergencyRequests).values([
    {
      id: 'emergency-seed-1',
      petOwnerId: null, // Guest emergency (Megha is not a registered user in seed)
      petOwnerName: 'Megha Nair',
      petOwnerEmail: 'megha@gmail.com',
      petName: 'Rocky',
      petType: 'Dog',
      phone: '+91 90088 12345',
      address: 'Prestige Shantiniketan, Whitefield, Bengaluru',
      description: 'Dog ate some chocolate wrapper and is throwing up continuously.',
      latitude: 12.9840,
      longitude: 77.7289,
      status: 'completed',
      acceptedByClinicId: 'clinic-4',
      acceptedByClinicName: 'Myra Pet Clinic & Vet Surgery Center',
      requestDate: '2026-06-05',
      requestTime: '08:42 PM',
    },
  ]).onConflictDoNothing();

  console.log('\n✅ Database seeded successfully!');
  console.log('   Demo accounts:');
  console.log('   • Pet Owner:    owner@gmail.com / password');
  console.log('   • Veterinarian: vet@gmail.com / password\n');
}

// Execute seed and handle cleanup
seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
