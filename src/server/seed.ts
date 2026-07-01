/**
 * Database Seed Script for QuickVet
 *
 * Adds production-like demo data without resetting the database.
 * Existing accounts and records remain intact.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
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

type Dateish = string | Date;

interface ClinicSeed {
  id: string;
  name: string;
  description: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  rating: string;
  reviewsCount: number;
  imageUrl: string;
  specialists: string[];
  hasEmergency: boolean;
  hasHomeVisit: boolean;
  isOpenNow: boolean;
  workingHours: string;
  services: string[];
  verificationDocuments: Array<{
    id: string;
    label: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    dataUrl?: string;
  }>;
  verificationStatus: string;
  licenseNumber: string;
  veterinarianName: string;
  yearsOfExperience: string;
}

interface GeneratedUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'pet_owner' | 'veterinarian';
  phone: string;
  avatarUrl: string;
  clinicId: string | null;
  createdAt: Date;
}

interface GeneratedPet {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  breed: string | null;
  age: number | null;
  weight: string | null;
  medicalHistory: string[];
}

interface GeneratedBooking {
  id: string;
  clinicId: string;
  clinicName: string;
  petOwnerId: string;
  petOwnerName: string;
  petOwnerEmail: string;
  petName: string;
  petType: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  notes: string;
  bookingType: 'clinic_visit' | 'home_visit';
  createdAt: Date;
}

interface GeneratedReview {
  id: string;
  clinicId: string;
  userName: string;
  userEmail: string;
  petType: string;
  rating: number;
  reviewText: string;
  createdAt: Date;
}

interface GeneratedEmergency {
  id: string;
  petOwnerId: string | null;
  petOwnerName: string;
  petOwnerEmail: string;
  petName: string;
  petType: string;
  phone: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  acceptedByClinicId: string | null;
  acceptedByClinicName: string | null;
  requestDate: string;
  requestTime: string;
  createdAt: Date;
}

interface PersonSeed {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  createdAt: Date;
}

const random = mulberry32(0x71b3cafe);
const now = new Date();

const firstNames = ['Aarav', 'Anika', 'Arjun', 'Diya', 'Ishaan', 'Mira', 'Neha', 'Rohan', 'Saanvi', 'Kabir', 'Priya', 'Rahul', 'Tara', 'Vikram', 'Nina', 'Karan'];
const lastNames = ['Sharma', 'Patel', 'Rao', 'Kapoor', 'Nair', 'Menon', 'Iyer', 'Gupta', 'Bose', 'Mehta', 'Shah', 'Fernandes', 'Chatterjee', 'Mishra', 'Joshi'];
const petNames = ['Coco', 'Luna', 'Milo', 'Simba', 'Bella', 'Rocky', 'Max', 'Leo', 'Poppy', 'Nala', 'Oreo', 'Ruby', 'Bruno', 'Loki', 'Toby', 'Zara', 'Kiki', 'Bubbles'];
const petTypes = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Hamster', 'Other'];
const dogBreeds = ['Labrador Retriever', 'Golden Retriever', 'Indian Pariah', 'Pug', 'Beagle', 'German Shepherd', 'Cocker Spaniel', 'Shih Tzu'];
const catBreeds = ['Indian Short Hair', 'Persian', 'Siamese', 'Maine Coon', 'Bengal', 'Ragdoll', 'British Shorthair'];
const smallPetBreeds = ['Dutch Rabbit', 'Lionhead Rabbit', 'Cockatiel', 'Budgerigar', 'Syrian Hamster', 'Roborovski Hamster'];
const servicePool = ['General Consultation', 'Vaccination', 'Routine Checkup', 'Dental Care', 'Digital X-Ray', 'Home Visit Diagnostics', 'Grooming', 'Emergency Trauma Care', 'Ultrasonography', 'Microchipping', 'Blood Transfusion', 'Critical Care Unit', 'Avian Care Specialist', 'Nutritional Advice'];
const conditions = ['Dermatitis', 'Gastroenteritis', 'Fever', 'Limping', 'Ear Infection', 'Dental Plaque', 'Skin Allergy', 'Respiratory Infection', 'Routine Wellness', 'Post-surgery Follow-up'];
const reviewOpeners = ['Excellent', 'Very good', 'Reliable', 'Impressive', 'Patient', 'Thorough', 'Helpful', 'Friendly'];
const reviewDetails = [
  'The staff explained the treatment clearly and handled the pet gently.',
  'Waiting time was reasonable and the doctor was attentive throughout the visit.',
  'The clinic is clean, organized, and the follow-up advice was practical.',
  'Emergency support was fast and the communication stayed calm and reassuring.',
  'Good diagnostics, transparent pricing, and a comfortable environment for pets.',
  'The vaccination visit was smooth and the post-care instructions were clear.',
];
const emergencyDescriptions = [
  'Sudden vomiting and lethargy after eating something from the floor.',
  'Dog is breathing fast and refusing water after a long walk.',
  'Cat has a swollen paw and is unable to bear weight.',
  'Bird is fluffed up, quiet, and not eating since this morning.',
  'Rabbit is weak and has not eaten for several hours.',
  'Pet may have swallowed a foreign object and is now restless.',
];
const vetTitles = ['Dr.', 'Dr.'];
const cityCatalog = [
  { city: 'Bengaluru', areas: ['Domlur', 'Indiranagar', 'Koramangala', 'Whitefield', 'JP Nagar', 'Hebbal', 'HSR Layout', 'Jayanagar'], lat: 12.9716, lng: 77.5946 },
  { city: 'Mysuru', areas: ['Vijayanagar', 'Hebbal', 'Nazarbad', 'Gokulam', 'Saraswathipuram', 'Bogadi'], lat: 12.2958, lng: 76.6394 },
  { city: 'Chennai', areas: ['Anna Nagar', 'Adyar', 'Velachery', 'T Nagar', 'Mylapore', 'Nungambakkam'], lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', areas: ['Banjara Hills', 'Gachibowli', 'Kondapur', 'Madhapur', 'Jubilee Hills', 'Kukatpally'], lat: 17.3850, lng: 78.4867 },
  { city: 'Pune', areas: ['Koregaon Park', 'Baner', 'Hinjewadi', 'Wakad', 'Kothrud', 'Viman Nagar'], lat: 18.5204, lng: 73.8567 },
  { city: 'Kochi', areas: ['Kadavanthra', 'Edappally', 'Panampilly Nagar', 'Kakkanad', 'Aluva', 'Fort Kochi'], lat: 9.9312, lng: 76.2673 },
  { city: 'Mumbai', areas: ['Andheri', 'Bandra', 'Powai', 'Worli', 'Goregaon', 'Juhu'], lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', areas: ['Saket', 'Dwarka', 'Rohini', 'Vasant Kunj', 'Lajpat Nagar', 'Connaught Place'], lat: 28.6139, lng: 77.2090 },
];
const clinicNamePrefixes = ['PawCare', 'MediPaws', 'Crown Vet', 'Urban Vet', 'Happy Tails', 'QuickPaws', 'CarePoint Vet', 'Prime Pet', 'Nexa Vet', 'PetFirst', 'Companion Care', 'Healing Paws'];
const clinicSuffixes = ['Veterinary Clinic', 'Animal Hospital', 'Pet Wellness Centre', 'Critical Care Clinic', 'Veterinary Centre', 'Pet Health Clinic'];
const specialityPools = [
  ['Dog', 'Cat'],
  ['Dog', 'Cat', 'Rabbit'],
  ['Dog', 'Cat', 'Bird'],
  ['Dog', 'Cat', 'Bird', 'Rabbit'],
  ['Bird', 'Rabbit', 'Exotics'],
  ['Dog', 'Cat', 'Exotics'],
];
const clinicServices = [
  ['General Consultation', 'Vaccination', 'Routine Checkup', 'Dental Care'],
  ['Home Visit Diagnostics', 'Nutritional Advice', 'Vaccination', 'Grooming'],
  ['Emergency Trauma Care', 'Critical Care Unit', 'Blood Transfusion', 'Emergency Oxygen'],
  ['Ultrasonography', 'Digital X-Ray', 'Microchipping', 'Surgery Follow-up'],
  ['Avian Care Specialist', 'Rabbit Dentistry', 'Exotics Evaluation', 'Wellness Exams'],
];
const statusWeights = [
  { status: 'completed', weight: 0.44 },
  { status: 'approved', weight: 0.18 },
  { status: 'upcoming', weight: 0.12 },
  { status: 'pending', weight: 0.08 },
  { status: 'cancelled', weight: 0.10 },
  { status: 'rescheduled', weight: 0.06 },
  { status: 'emergency', weight: 0.02 },
];
const unsplashIds = [
  '1584132967334-10e028bd69f7',
  '1629909613654-28e377c37b09',
  '1576091160399-112ba8d25d1d',
  '1606206591513-ad3c5abd089e',
  '1599443015574-be5fe8a05783',
  '1532938911079-1b06ac7ceec7',
  '1548199973-03cce0bbc87b',
  '1517841905240-472988babdf9',
  '1516728778615-2d590ea1856f',
  '1516734212186-a967f81ad0d7',
  '1517423440428-a5a00ad493e8',
  '1552053831-71594a27632d',
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const clinics = buildClinicSeeds();
  console.log('  → Inserting vet clinics...');
  await batchInsert(vetClinics, clinics);

  const passwordHash = await bcrypt.hash('password', 10);
  const veterinarianUsers = buildVeterinarianUsers(clinics, passwordHash);
  const ownerUsers = buildOwnerUsers(passwordHash);

  console.log('  → Inserting users...');
  await batchInsert(users, [...veterinarianUsers, ...ownerUsers]);

  const ownerMap = buildOwnerMap(ownerUsers);
  const generatedPetRows = [
    ...buildPetsForUser('user-owner', 14),
    ...buildPets(ownerUsers, 1484),
  ];
  console.log('  → Inserting pets...');
  await batchInsert(pets, generatedPetRows);
  const ownerPetsById = buildOwnerPetMap(generatedPetRows);

  console.log('  → Inserting favorite clinics...');
  await batchInsert(favoriteClinics, buildFavorites(ownerUsers));

  const reviewStats = new Map<string, { count: number; sum: number }>();
  const reviews = buildReviews(clinics, reviewStats);
  console.log('  → Inserting clinic reviews...');
  await batchInsert(clinicReviews, reviews);

  console.log('  → Inserting bookings...');
  await batchInsert(bookings, buildBookings(clinics, ownerUsers, ownerPetsById, ownerMap));

  console.log('  → Inserting emergency requests...');
  await batchInsert(emergencyRequests, buildEmergencies(clinics, ownerUsers, ownerPetsById, ownerMap));

  console.log('  → Refreshing clinic ratings...');
  await refreshClinicRatings(clinics, reviewStats);

  console.log('\n✅ Database seeded successfully!');
  console.log('   Demo accounts:');
  console.log('   • Pet Owner:    owner@gmail.com / password');
  console.log('   • Veterinarian: vet@gmail.com / password');
  console.log('   • Admin:        admin@gmail.com / password\n');
}

function buildClinicSeeds(): ClinicSeed[] {
  const clinics: ClinicSeed[] = [
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-HOSP-1001',
      veterinarianName: 'Dr. Ramesh Roy',
      yearsOfExperience: '14 years',
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-CLN-1002',
      veterinarianName: 'Dr. Arjun Mehta',
      yearsOfExperience: '11 years',
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-CLN-1003',
      veterinarianName: 'Dr. Mira Nair',
      yearsOfExperience: '9 years',
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-CLN-1004',
      veterinarianName: 'Dr. Myra Thomas',
      yearsOfExperience: '13 years',
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-CLN-1005',
      veterinarianName: 'Dr. Saira Fernandes',
      yearsOfExperience: '8 years',
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
      verificationDocuments: [],
      verificationStatus: 'approved',
      licenseNumber: 'KAR-CLN-1006',
      veterinarianName: 'Dr. Kabir Shah',
      yearsOfExperience: '16 years',
    },
  ];

  for (let index = 6; index < 80; index += 1) {
    const city = cityCatalog[index % cityCatalog.length];
    const area = city.areas[index % city.areas.length];
    const speciality = specialityPools[index % specialityPools.length];
    const services = clinicServices[index % clinicServices.length];
    const verificationStatus = chooseClinicStatus(index);
    const docs = verificationStatus === 'approved'
      ? []
      : [
        makeDocument('Medical License', `license-${index}.pdf`, 'application/pdf', monthsAgo(1 + (index % 6))),
        makeDocument('Government ID', `id-${index}.pdf`, 'application/pdf', monthsAgo(1 + (index % 5))),
        ...(verificationStatus === 'needs_documents' || verificationStatus === 'pending'
          ? [makeDocument('Clinic Photo', `clinic-${index}.jpg`, 'image/jpeg', monthsAgo(index % 4))]
          : []),
      ];

    clinics.push({
      id: `clinic-${index + 1}`,
      name: `${clinicNamePrefixes[index % clinicNamePrefixes.length]} ${area} ${clinicSuffixes[index % clinicSuffixes.length]}`,
      description: `${services[0]} and ${services[1]} for companion animals with a focus on ${speciality.join(', ').toLowerCase()}.`,
      address: `${100 + index}, ${area} Main Road, ${area}, ${city.city}`,
      area,
      city: city.city,
      latitude: city.lat + randomBetween(-0.03, 0.03),
      longitude: city.lng + randomBetween(-0.03, 0.03),
      phone: `+91 ${randDigits(10, index)}`,
      rating: randomBetween(3.8, 5.0).toFixed(2),
      reviewsCount: randomInt(35, 1200),
      imageUrl: `https://images.unsplash.com/photo-${unsplashIds[index % unsplashIds.length]}?auto=format&fit=crop&q=80&w=600`,
      specialists: speciality,
      hasEmergency: index % 3 !== 1,
      hasHomeVisit: index % 4 !== 0,
      isOpenNow: index % 5 !== 0,
      workingHours: index % 6 === 0 ? 'Open 24 Hours / 7 Days' : `${8 + (index % 3)}:00 AM - ${7 + (index % 4)}:30 PM`,
      services,
      verificationDocuments: docs,
      verificationStatus,
      licenseNumber: `KVC-${2020 + (index % 5)}-${randDigits(5, index + 17)}`,
      veterinarianName: `${pick(vetTitles)} ${pick(firstNames)} ${pick(lastNames)}`,
      yearsOfExperience: `${4 + (index % 18)} years`,
    });
  }

  return clinics;
}

function buildVeterinarianUsers(clinics: ClinicSeed[], passwordHash: string): GeneratedUser[] {
  const usersGenerated: GeneratedUser[] = [];
  for (let index = 0; index < 119; index += 1) {
    const clinic = clinics[index % clinics.length];
    const name = `${pick(vetTitles)} ${pick(firstNames)} ${pick(lastNames)}`;
    usersGenerated.push({
      id: `user-vet-${String(index + 1).padStart(4, '0')}`,
      email: `vet${String(index + 1).padStart(4, '0')}@quickvet.in`,
      passwordHash,
      name,
      role: 'veterinarian',
      phone: `+91 98${randDigits(8, index + 1000)}`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      clinicId: clinic.id,
      createdAt: randomDateBetween(monthsAgo(12), now),
    });
  }
  return usersGenerated;
}

function buildOwnerUsers(passwordHash: string): GeneratedUser[] {
  const usersGenerated: GeneratedUser[] = [];
  for (let index = 0; index < 4878; index += 1) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    usersGenerated.push({
      id: `user-owner-${String(index + 1).padStart(4, '0')}`,
      email: `owner${String(index + 1).padStart(4, '0')}@quickvet.in`,
      passwordHash,
      name,
      role: 'pet_owner',
      phone: `+91 97${randDigits(8, index + 2000)}`,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      clinicId: null,
      createdAt: randomDateBetween(monthsAgo(12), now),
    });
  }
  return usersGenerated;
}

function buildPetsForUser(ownerId: string, count: number): GeneratedPet[] {
  const rows: GeneratedPet[] = [];
  if (ownerId === 'user-owner') {
    rows.push({
      id: 'user-owner-pet-001',
      ownerId: 'user-owner',
      name: 'Coco',
      type: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: '28kg',
      medicalHistory: ['Rabies vaccination complete', 'Deworming due in Sep 2026', 'Regular wellness checks'],
    });
    rows.push({
      id: 'user-owner-pet-002',
      ownerId: 'user-owner',
      name: 'Luna',
      type: 'Cat',
      breed: 'Indian Short Hair',
      age: 1,
      weight: '4.2kg',
      medicalHistory: ['Vaccination complete', 'Annual booster due next month'],
    });
  }

  for (let index = rows.length; index < count; index += 1) {
    const type = petTypes[index % petTypes.length];
    rows.push({
      id: `${ownerId}-pet-${String(index + 1).padStart(3, '0')}`,
      ownerId,
      name: petNames[(index + 3) % petNames.length],
      type,
      breed: pickBreed(type),
      age: randomInt(1, 12),
      weight: `${randomBetween(type === 'Dog' ? 4 : 1, type === 'Dog' ? 35 : 9).toFixed(1)}kg`,
      medicalHistory: buildMedicalHistory(type, index % 3 === 0),
    });
  }

  return rows;
}

function buildPets(ownerUsers: GeneratedUser[], totalCount: number): GeneratedPet[] {
  const rows: GeneratedPet[] = [];
  const targetOwners = ownerUsers.slice(0, Math.max(20, Math.min(ownerUsers.length, 1200)));
  for (let index = 0; index < totalCount; index += 1) {
    const owner = targetOwners[index % targetOwners.length];
    const type = petTypes[index % petTypes.length];
    rows.push({
      id: `pet-${String(index + 3).padStart(5, '0')}`,
      ownerId: owner.id,
      name: `${petNames[index % petNames.length]}${index % 11 === 0 ? '' : ` ${String.fromCharCode(65 + (index % 6))}`}`,
      type,
      breed: pickBreed(type),
      age: randomInt(1, 14),
      weight: `${randomBetween(type === 'Dog' ? 3 : 0.8, type === 'Dog' ? 40 : 8).toFixed(1)}kg`,
      medicalHistory: buildMedicalHistory(type, index % 4 !== 0),
    });
  }
  return rows;
}

function buildFavorites(ownerUsers: GeneratedUser[]): Array<{ userId: string; clinicId: string }> {
  const favorites: Array<{ userId: string; clinicId: string }> = [];
  const clinics = Array.from({ length: 12 }, (_, index) => `clinic-${index + 1}`);
  for (const clinicId of clinics.slice(0, 6)) {
    favorites.push({ userId: 'user-owner', clinicId });
  }
  ownerUsers.slice(0, 194).forEach((owner, index) => {
    favorites.push({ userId: owner.id, clinicId: clinics[index % clinics.length] });
  });
  return favorites;
}

function buildReviews(clinics: ClinicSeed[], reviewStats: Map<string, { count: number; sum: number }>): GeneratedReview[] {
  const rows: GeneratedReview[] = [];
  const reviewOwners = ['owner@gmail.com', ...Array.from({ length: 400 }, (_, index) => `owner${String(index + 1).padStart(4, '0')}@quickvet.in`)];
  const reviewNames = ['Rohan Sharma', 'Priya Patel', 'Ananya Rao', 'Kabir Fernandes', 'Maya Iyer', 'Sanjay Kumar', 'Asha Nair', 'Vikram Bose'];

  const baseReviews = [
    { clinicId: 'clinic-1', userName: 'Rohan Sharma', userEmail: 'rohan@gmail.com', petType: 'Dog', rating: 5, reviewText: 'Excellent emergency service. They saved my Golden Retriever in the middle of the night.', createdAt: monthsAgo(11) },
    { clinicId: 'clinic-1', userName: 'Priya Patel', userEmail: 'priya.patel@yahoo.com', petType: 'Cat', rating: 4, reviewText: 'Great place, very clean and state-of-the-art facilities.', createdAt: monthsAgo(10) },
    { clinicId: 'clinic-3', userName: 'Ananya Rao', userEmail: 'ananya@gmail.com', petType: 'Cat', rating: 5, reviewText: 'Home visit for my senior cat was gentle and thorough.', createdAt: monthsAgo(9) },
    { clinicId: 'clinic-4', userName: 'Kabir Fernandes', userEmail: 'kabir@gmail.com', petType: 'Bird', rating: 5, reviewText: 'Best avian vet in town. Very transparent and kind.', createdAt: monthsAgo(8) },
  ] as const;

  for (const review of baseReviews) {
    rows.push({
      id: `rev-base-${review.clinicId}-${rows.length + 1}`,
      clinicId: review.clinicId,
      userName: review.userName,
      userEmail: review.userEmail,
      petType: review.petType,
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
    });
    bumpReviewStats(reviewStats, review.clinicId, review.rating);
  }

  for (let index = 0; index < 2496; index += 1) {
    const clinic = clinics[index % clinics.length];
    const createdAt = randomDateBetween(monthsAgo(12), now);
    const rating = index % 8 === 0 ? 4 : 5;
    const actualRating = Math.min(5, rating - (index % 21 === 0 ? 1 : 0) + (createdAt > daysAgo(7) ? 0 : 0));
    rows.push({
      id: `rev-${String(index + 5).padStart(5, '0')}`,
      clinicId: clinic.id,
      userName: reviewNames[index % reviewNames.length],
      userEmail: reviewOwners[index % reviewOwners.length],
      petType: petTypes[index % petTypes.length],
      rating: actualRating,
      reviewText: `${pick(reviewOpeners)} service. ${pick(reviewDetails)} ${index % 5 === 0 ? 'They also gave a detailed vaccination plan.' : 'The follow-up instructions were easy to understand.'}`,
      createdAt,
    });
    bumpReviewStats(reviewStats, clinic.id, actualRating);
  }

  return rows;
}

function buildBookings(clinics: ClinicSeed[], ownerUsers: GeneratedUser[], ownerPetsById: Map<string, GeneratedPet[]>, ownerMap: Map<string, PersonSeed>): GeneratedBooking[] {
  const rows: GeneratedBooking[] = [];
  const bookingOwners = [
    { id: 'user-owner', name: 'Prabal Beas', email: 'owner@gmail.com' },
    ...ownerUsers.slice(0, 1200).map((owner) => ({ id: owner.id, name: owner.name, email: owner.email })),
  ];
  const userOwnerPets = ownerPetsById.get('user-owner') || [];

  for (let index = 0; index < 60; index += 1) {
    const clinic = clinics[index % clinics.length];
    const pet = userOwnerPets[index % userOwnerPets.length];
    const date = randomDateWithFutureBias(index, 12, 45);
    const status = pickStatus(date, index);
    rows.push(makeBooking(index, clinic, { id: 'user-owner', name: 'Prabal Beas', email: 'owner@gmail.com' }, pet, status, date));
  }

  for (let index = 0; index < 9939; index += 1) {
    const owner = bookingOwners[index % bookingOwners.length];
    const petsForOwner = ownerPetsById.get(owner.id) || [];
    const pet = petsForOwner.length ? petsForOwner[index % petsForOwner.length] : userOwnerPets[index % userOwnerPets.length];
    const clinic = clinics[(index * 7) % clinics.length];
    const date = randomDateWithFutureBias(index + 100, 12, 45);
    const status = pickStatus(date, index + 3);
    const mappedOwner = ownerMap.get(owner.id);
    rows.push(makeBooking(index + 60, clinic, { id: owner.id, name: mappedOwner?.name || owner.name, email: mappedOwner?.email || owner.email }, pet, status, date));
  }

  return rows;
}

function buildEmergencies(clinics: ClinicSeed[], ownerUsers: GeneratedUser[], ownerPetsById: Map<string, GeneratedPet[]>, ownerMap: Map<string, PersonSeed>): GeneratedEmergency[] {
  const rows: GeneratedEmergency[] = [];
  const guestNames = ['Megha Nair', 'Arvind Kumar', 'Nisha Thomas', 'Siddharth Jain', 'Pooja Rao'];
  const ownerPool = [
    { id: 'user-owner', name: 'Prabal Beas', email: 'owner@gmail.com' },
    ...ownerUsers.slice(0, 400).map((owner) => ({ id: owner.id, name: owner.name, email: owner.email })),
  ];
  const userOwnerPets = ownerPetsById.get('user-owner') || [];

  rows.push({
    id: 'emergency-seed-1',
    petOwnerId: null,
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
    requestDate: monthsAgo(1).toISOString().split('T')[0],
    requestTime: '08:42 PM',
    createdAt: monthsAgo(1),
  });

  for (let index = 0; index < 18; index += 1) {
    const clinic = clinics[index % clinics.length];
    const pet = userOwnerPets[index % userOwnerPets.length];
    const date = randomDateWithFutureBias(index, 10, 20);
    rows.push({
      id: `emergency-user-owner-${String(index + 1).padStart(3, '0')}`,
      petOwnerId: 'user-owner',
      petOwnerName: 'Prabal Beas',
      petOwnerEmail: 'owner@gmail.com',
      petName: pet?.name || 'Coco',
      petType: pet?.type || 'Dog',
      phone: '+91 98765 43210',
      address: `QuickVet saved location ${index + 1}, Bengaluru`,
      description: emergencyDescriptions[index % emergencyDescriptions.length],
      latitude: 12.95 + randomBetween(-0.04, 0.04),
      longitude: 77.60 + randomBetween(-0.04, 0.04),
      status: index % 4 === 0 ? 'completed' : index % 4 === 1 ? 'accepted' : index % 4 === 2 ? 'notified' : 'pending',
      acceptedByClinicId: clinic.id,
      acceptedByClinicName: clinic.name,
      requestDate: date.toISOString().split('T')[0],
      requestTime: formatTime(date),
      createdAt: date,
    });
  }

  for (let index = rows.length - 1; index < 299; index += 1) {
    const date = randomDateWithFutureBias(index + 20, 12, 30);
    const clinic = clinics[(index * 5) % clinics.length];
    const owner = index % 5 === 0
      ? { id: null, name: pick(guestNames), email: `${slugify(pick(guestNames))}@gmail.com` }
      : ownerPool[index % ownerPool.length];
    const ownerPetsForOwner = owner.id ? (ownerPetsById.get(owner.id) || userOwnerPets) : userOwnerPets;
    const pet = ownerPetsForOwner[index % ownerPetsForOwner.length] || userOwnerPets[0];
    const status = index % 6 === 0 ? 'completed' : index % 6 === 1 ? 'accepted' : index % 6 === 2 ? 'notified' : 'pending';
    const mappedOwner = owner.id ? ownerMap.get(owner.id) : undefined;

    rows.push({
      id: `emergency-${String(index + 2).padStart(5, '0')}`,
      petOwnerId: owner.id,
      petOwnerName: mappedOwner?.name || owner.name,
      petOwnerEmail: mappedOwner?.email || owner.email,
      petName: pet?.name || `Pet ${index + 1}`,
      petType: pet?.type || petTypes[index % petTypes.length],
      phone: owner.id ? (owner.id === 'user-owner' ? '+91 9876543210' : `+91 98${randDigits(8, index + 3000)}`) : `+91 ${randDigits(10, index + 4000)}`,
      address: `${pick(cityCatalog).areas[index % 4]}, ${pick(cityCatalog).city}`,
      description: emergencyDescriptions[index % emergencyDescriptions.length],
      latitude: 12.9 + randomBetween(-0.4, 0.4),
      longitude: 77.5 + randomBetween(-0.4, 0.4),
      status,
      acceptedByClinicId: status === 'pending' ? null : clinic.id,
      acceptedByClinicName: status === 'pending' ? null : clinic.name,
      requestDate: date.toISOString().split('T')[0],
      requestTime: formatTime(date),
      createdAt: date,
    });
  }

  return rows;
}

function makeBooking(index: number, clinic: ClinicSeed, owner: { id: string; name: string; email: string }, pet: GeneratedPet | undefined, status: string, date: Date): GeneratedBooking {
  const service = pet?.type === 'Bird' ? 'Avian Care Specialist' : pet?.type === 'Rabbit' ? 'Routine Checkup' : pick(servicePool);
  const bookingType = clinic.hasHomeVisit && index % 4 === 0 ? 'home_visit' : 'clinic_visit';
  return {
    id: `booking-${String(index + 2).padStart(5, '0')}`,
    clinicId: clinic.id,
    clinicName: clinic.name,
    petOwnerId: owner.id,
    petOwnerName: owner.name,
    petOwnerEmail: owner.email,
    petName: pet?.name || 'Coco',
    petType: pet?.type || 'Dog',
    service,
    bookingDate: date.toISOString().split('T')[0],
    bookingTime: formatTime(date),
    status,
    notes: buildBookingNotes(service, pet?.type || 'Pet', status, index),
    bookingType,
    createdAt: new Date(date.getTime() - randomInt(3, 96) * 3600 * 1000),
  };
}

function buildBookingNotes(service: string, petType: string, status: string, index: number): string {
  const noteParts = [
    `${petType} follow-up for ${service.toLowerCase()}.`,
    `${pick(conditions)} noted during intake.`,
    status === 'completed' ? 'Treatment completed with a same-day discharge plan.' : 'Reminder issued for next review.',
  ];
  if (index % 5 === 0) noteParts.push('Rabies booster due next month.');
  if (index % 7 === 0) noteParts.push('Deworming schedule updated.');
  return noteParts.join(' ');
}

function buildMedicalHistory(type: string, withDueEntry: boolean): string[] {
  const history = [
    `${pick(conditions)} treated recently.`,
    `${withDueEntry ? 'Rabies booster due soon' : 'Rabies vaccine up to date'}.`,
    `${withDueEntry ? 'Deworming due in 4 weeks' : 'Annual wellness check complete'}.`,
  ];
  if (type === 'Bird' || type === 'Rabbit' || type === 'Hamster') {
    history.push('Weight monitoring and diet adjustment in progress.');
  }
  return history;
}

function pickBreed(type: string): string | null {
  if (type === 'Dog') return pick(dogBreeds);
  if (type === 'Cat') return pick(catBreeds);
  if (type === 'Rabbit' || type === 'Bird' || type === 'Hamster' || type === 'Other') return pick(smallPetBreeds);
  return null;
}

function chooseClinicStatus(index: number): string {
  if (index % 17 === 0) return 'suspended';
  if (index % 13 === 0) return 'hold';
  if (index % 11 === 0) return 'needs_documents';
  if (index % 7 === 0) return 'pending';
  return 'approved';
}

function makeDocument(label: string, fileName: string, fileType: string, uploadedAt: Date): { id: string; label: string; fileName: string; fileType: string; fileSize: number; uploadedAt: string; dataUrl?: string } {
  return {
    id: `doc-${fileName}`,
    label,
    fileName,
    fileType,
    fileSize: 260000 + randomInt(0, 500000),
    uploadedAt: uploadedAt.toISOString(),
  };
}

function buildOwnerPetMap(rows: GeneratedPet[]): Map<string, GeneratedPet[]> {
  const map = new Map<string, GeneratedPet[]>();
  for (const pet of rows) {
    const list = map.get(pet.ownerId) || [];
    list.push(pet);
    map.set(pet.ownerId, list);
  }
  return map;
}

function buildOwnerMap(ownerUsers: GeneratedUser[]): Map<string, PersonSeed> {
  const map = new Map<string, PersonSeed>();
  map.set('user-owner', {
    id: 'user-owner',
    name: 'Prabal Beas',
    email: 'owner@gmail.com',
    phone: '+91 98765 43210',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    createdAt: now,
  });
  for (const owner of ownerUsers) {
    map.set(owner.id, {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      avatarUrl: owner.avatarUrl,
      createdAt: owner.createdAt,
    });
  }
  return map;
}

function pickStatus(date: Date, seedIndex: number): string {
  if (date > now) {
    const statuses = ['upcoming', 'approved', 'pending', 'rescheduled', 'emergency'];
    return statuses[seedIndex % statuses.length];
  }
  const weighted = statusWeights.flatMap((entry) => Array.from({ length: Math.round(entry.weight * 100) }, () => entry.status));
  return weighted[(seedIndex * 13) % weighted.length];
}

function randomDateWithFutureBias(seedIndex: number, monthsBack: number, futureDays: number): Date {
  const shouldBeFuture = seedIndex % 3 === 0;
  if (shouldBeFuture) {
    const future = new Date(now);
    future.setDate(future.getDate() + randomInt(1, futureDays));
    return future;
  }
  return randomDateBetween(monthsAgo(monthsBack), now);
}

function monthsAgo(months: number): Date {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date;
}

function daysAgo(days: number): Date {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

function randomDateBetween(start: Date, end: Date): Date {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return new Date(startMs + random() * (endMs - startMs));
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomBetween(min: number, max: number): number {
  return min + random() * (max - min);
}

function pick<T>(values: T[]): T {
  return values[Math.floor(random() * values.length)];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
}

function randDigits(length: number, salt = 0): string {
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += String(Math.abs(Math.floor(Math.sin((salt + 1) * (index + 1) * 9999) * 10)) % 10);
  }
  return out;
}

function mulberry32(seed: number): () => number {
  return function rng() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bumpReviewStats(stats: Map<string, { count: number; sum: number }>, clinicId: string, rating: number): void {
  const current = stats.get(clinicId) || { count: 0, sum: 0 };
  current.count += 1;
  current.sum += rating;
  stats.set(clinicId, current);
}

async function refreshClinicRatings(clinics: ClinicSeed[], reviewStats: Map<string, { count: number; sum: number }>): Promise<void> {
  for (const clinic of clinics) {
    const stats = reviewStats.get(clinic.id);
    if (!stats) continue;
    const average = stats.sum / stats.count;
    await db.update(vetClinics).set({
      rating: average.toFixed(2),
      reviewsCount: stats.count,
    }).where(eq(vetClinics.id, clinic.id));
  }
}

async function batchInsert<T>(table: any, rows: T[], batchSize = 250): Promise<void> {
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    if (batch.length) {
      await db.insert(table).values(batch as any).onConflictDoNothing();
    }
  }
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
