import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CLINICS, INITIAL_REVIEWS } from './src/data.js';
import { VetClinic, ClinicReview, Booking, EmergencyRequest, User, Pet } from './src/types.js';
import { signToken } from './src/server/jwt.js';
import { authenticateToken, requireRole } from './src/server/middleware.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Utility Helpers ---

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function parseOptionalNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function sortNewestFirst<T extends { createdAt?: string; date?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.date || 0).getTime();
    const rightTime = new Date(right.createdAt || right.date || 0).getTime();
    return rightTime - leftTime;
  });
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not configured.');
  }
  return secret;
}

// --- Persistent Database ---

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

let db: {
  clinics: VetClinic[];
  reviews: ClinicReview[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  users: User[];
  userPrivateData: Record<string, { passwordHash: string }>;
} = {
  clinics: [...INITIAL_CLINICS],
  reviews: [...INITIAL_REVIEWS],
  bookings: [],
  emergencies: [],
  users: [],
  userPrivateData: {}
};

// Default seed accounts for immediate demo usage
const DEFAULT_ACCOUNTS = [
  {
    user: {
      id: 'user-owner',
      email: 'owner@gmail.com',
      name: 'Prabal Beas',
      role: 'pet_owner' as const,
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date().toISOString(),
      pets: [
        {
          id: 'pet-1',
          name: 'Coco',
          type: 'Dog',
          breed: 'Golden Retriever',
          age: 3,
          weight: '28kg',
          medicalHistory: ['Regular Deworming', 'Rabies vaccine - Booster done in Mar 2026']
        },
        {
          id: 'pet-2',
          name: 'Luna',
          type: 'Cat',
          breed: 'Indie Feral',
          age: 1,
          weight: '4.2kg',
          medicalHistory: ['Vaccination complete']
        }
      ],
      favoriteClinics: ['clinic-1']
    },
    password: 'password'
  },
  {
    user: {
      id: 'user-vet',
      email: 'vet@gmail.com',
      name: 'Dr. Ramesh Roy',
      role: 'veterinarian' as const,
      phone: '+91 99887 76655',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
      createdAt: new Date().toISOString(),
      clinicId: 'clinic-1'
    },
    password: 'password'
  }
];

function initDB() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const saved = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(saved);
      db.clinics = loaded.clinics || [...INITIAL_CLINICS];
      db.reviews = loaded.reviews || [...INITIAL_REVIEWS];
      db.bookings = loaded.bookings || [];
      db.emergencies = loaded.emergencies || [];
      db.users = loaded.users || [];
      db.userPrivateData = loaded.userPrivateData || {};
    } else {
      db.clinics = [...INITIAL_CLINICS];
      db.reviews = [...INITIAL_REVIEWS];
      db.bookings = [
        {
          id: 'booking-seed-1',
          clinicId: 'clinic-1',
          clinicName: 'Cessna Lifeline 24x7 Animal Hospital',
          petOwnerName: 'Prabal Beas',
          petOwnerEmail: 'owner@gmail.com',
          petName: 'Coco',
          petType: 'Dog',
          service: 'General Checkup',
          date: '2026-06-10',
          time: '11:00 AM',
          status: 'approved',
          notes: 'Routine checkup and deworming schedule update.',
          type: 'clinic_visit',
          createdAt: new Date().toISOString()
        }
      ];
      db.emergencies = [
        {
          id: 'emergency-seed-1',
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
          date: '2026-06-05',
          time: '08:42 PM',
          createdAt: new Date().toISOString()
        }
      ];

      for (const item of DEFAULT_ACCOUNTS) {
        db.users.push(item.user);
        db.userPrivateData[item.user.email] = { passwordHash: item.password };
      }
      saveDB();
    }
  } catch (err) {
    console.warn('DB initialization error, falling back to pure in-memory store:', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write DB file:', err);
  }
}

initDB();

// ========================
// PUBLIC API ROUTES (No auth required)
// ========================

// AUTHENTICATION ENDPOINTS (Public)
app.post('/api/auth/signup', (req, res) => {
  const { email, name, password, role, phone, clinicId } = req.body;
  if (!email || !name || !password || !role) {
    res.status(400).json({ error: 'Missing required signup parameters.' });
    return;
  }

  if (role === 'veterinarian' && !clinicId) {
    res.status(400).json({ error: 'Clinic ID is required for veterinarian signups.' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = db.users.find(u => normalizeEmail(u.email) === normalizedEmail);
  if (existing) {
    res.status(400).json({ error: 'Email already registered. Please login.' });
    return;
  }

  const id = `user-${Date.now()}`;
  const newUser: User = {
    id,
    email: normalizedEmail,
    name,
    role,
    phone: phone || '',
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString(),
    pets: role === 'pet_owner' ? [] : undefined,
    favoriteClinics: role === 'pet_owner' ? [] : undefined,
    clinicId: role === 'veterinarian' ? clinicId : undefined
  };

  db.users.push(newUser);
  db.userPrivateData[normalizedEmail] = { passwordHash: password };
  saveDB();

  // Sign a real JWT token
  const token = signToken(
    { id: newUser.id, email: normalizedEmail, role: newUser.role, clinicId: newUser.clinicId },
    getJwtSecret()
  );

  res.status(201).json({ user: newUser, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const user = db.users.find(u => normalizeEmail(u.email) === normalizedEmail);
  const privateData = db.userPrivateData[normalizedEmail];

  if (!user || !privateData || privateData.passwordHash !== password) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Sign a real JWT token
  const token = signToken(
    { id: user.id, email: normalizedEmail, role: user.role, clinicId: user.clinicId },
    getJwtSecret()
  );

  res.json({ user, token });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required.' });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const privateData = db.userPrivateData[normalizedEmail];
  if (!privateData) {
    res.status(404).json({ error: 'User does not exist with that email address.' });
    return;
  }

  db.userPrivateData[normalizedEmail].passwordHash = newPassword;
  saveDB();
  res.json({ message: 'Password updated successfully.' });
});

// CLINICS - Public read, authenticated write
app.get('/api/clinics', (req, res) => {
  res.json(db.clinics);
});

// REVIEWS - Public read
app.get('/api/clinics/:id/reviews', (req, res) => {
  const clinicReviews = db.reviews.filter(r => r.clinicId === req.params.id);
  res.json(clinicReviews);
});

// ========================
// PROTECTED API ROUTES (JWT auth required)
// ========================

// CLINICS - Create new clinic (authenticated)
app.post('/api/clinics', authenticateToken, (req: any, res: any) => {
  const { name, description, address, area, city, latitude, longitude, phone, specialists, hasEmergency, hasHomeVisit, workingHours, services, imageUrl } = req.body;

  if (!name || !address || !area || !phone) {
    res.status(400).json({ error: 'Missing key details (Name, Address, Area, and Phone number).' });
    return;
  }

  const id = `clinic-${Date.now()}`;
  const newClinic: VetClinic = {
    id,
    name,
    description: description || 'Professional veterinary clinic centered around high-quality animal diagnostics and premium pet healthcare.',
    address,
    area,
    city: city || 'Bengaluru',
    latitude: parseOptionalNumber(latitude, 12.9716),
    longitude: parseOptionalNumber(longitude, 77.5946),
    phone,
    rating: 5.0,
    reviewsCount: 1,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600',
    specialists: specialists || ['Dog', 'Cat'],
    hasEmergency: hasEmergency || false,
    hasHomeVisit: hasHomeVisit || false,
    isOpenNow: true,
    workingHours: workingHours || '9:00 AM - 8:00 PM',
    services: services || ['General Consultations', 'Vaccination', 'Pharmacy']
  };

  db.clinics.push(newClinic);
  saveDB();
  res.status(201).json(newClinic);
});

// REVIEWS - Create new review (authenticated)
app.post('/api/clinics/:id/reviews', authenticateToken, (req: any, res: any) => {
  const { rating, reviewText, petType } = req.body;
  const clinicId = req.params.id;

  if (!rating || !reviewText) {
    res.status(400).json({ error: 'Rating and review comment are required.' });
    return;
  }

  const newReview: ClinicReview = {
    id: `rev-${Date.now()}`,
    clinicId,
    userName: req.user!.email ? db.users.find(u => normalizeEmail(u.email) === req.user!.email)?.name || 'Anonymous' : 'Anonymous',
    userEmail: req.user!.email,
    petType: petType || 'Pet',
    rating: parseInt(rating),
    reviewText,
    date: new Date().toISOString().split('T')[0]
  };

  db.reviews.unshift(newReview);

  // Re-calculate average clinic rating
  const clinic = db.clinics.find(c => c.id === clinicId);
  if (clinic) {
    const allClinicReviews = db.reviews.filter(r => r.clinicId === clinicId);
    const sum = allClinicReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = Math.round((sum / allClinicReviews.length) * 10) / 10;
    clinic.rating = avg;
    clinic.reviewsCount = allClinicReviews.length;
  }

  saveDB();
  res.status(201).json(newReview);
});

// BOOKINGS - Secured with tenant isolation
app.get('/api/bookings', authenticateToken, (req: any, res: any) => {
  const user = req.user!;

  if (user.role === 'veterinarian') {
    // Vet sees only bookings for their clinic
    const clinicBookings = db.bookings.filter(b => b.clinicId === user.clinicId);
    return res.json(sortNewestFirst(clinicBookings));
  } else {
    // Pet owner sees only their own bookings
    const userBookings = db.bookings.filter(b => normalizeEmail(b.petOwnerEmail) === user.email);
    return res.json(sortNewestFirst(userBookings));
  }
});

app.post('/api/bookings', authenticateToken, (req: any, res: any) => {
  const { clinicId, clinicName, petName, petType, service, date, time, type, notes } = req.body;
  const user = req.user!;
  const fullUser = db.users.find(u => normalizeEmail(u.email) === user.email);

  if (!clinicId || !petName || !date || !time) {
    res.status(400).json({ error: 'Missing essential booking credentials (clinicId, pet name, date, time).' });
    return;
  }

  const newBooking: Booking = {
    id: `booking-${Date.now()}`,
    clinicId,
    clinicName: clinicName || 'Veterinary Clinic',
    petOwnerName: fullUser?.name || 'Pet Parent',
    petOwnerEmail: user.email,
    petName,
    petType: petType || 'Dog',
    service: service || 'General Consultation',
    date,
    time,
    status: 'pending',
    notes: notes || '',
    type: type || 'clinic_visit',
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);
  saveDB();
  res.status(201).json(newBooking);
});

app.post('/api/bookings/:id/status', authenticateToken, requireRole('veterinarian'), (req: any, res: any) => {
  const { status } = req.body;
  const { id } = req.params;

  const bIndex = db.bookings.findIndex(b => b.id === id);
  if (bIndex === -1) {
    res.status(404).json({ error: 'Booking order not found.' });
    return;
  }

  // Vets can only update bookings for their own clinic
  if (db.bookings[bIndex].clinicId !== req.user!.clinicId) {
    res.status(403).json({ error: 'You can only manage bookings for your own clinic.' });
    return;
  }

  db.bookings[bIndex].status = status;
  saveDB();
  res.json(db.bookings[bIndex]);
});

// EMERGENCY ASSISTANCE - Authenticated
app.get('/api/emergency', authenticateToken, (req: any, res: any) => {
  const user = req.user!;

  if (user.role === 'veterinarian') {
    // Vets see all active emergencies (for dispatching)
    return res.json(sortNewestFirst(db.emergencies));
  } else {
    // Pet owners see only their own emergency requests
    const userEmergencies = db.emergencies.filter(e => normalizeEmail(e.petOwnerEmail) === user.email);
    return res.json(sortNewestFirst(userEmergencies));
  }
});

app.post('/api/emergency', authenticateToken, (req: any, res: any) => {
  const { petName, petType, phone, address, description, latitude, longitude } = req.body;
  const user = req.user!;
  const fullUser = db.users.find(u => normalizeEmail(u.email) === user.email);

  if (!phone || !address || !description) {
    res.status(400).json({ error: 'Emergency request needs phone number, location address, and symptom description.' });
    return;
  }

  const newEmergency: EmergencyRequest = {
    id: `emergency-${Date.now()}`,
    petOwnerName: fullUser?.name || 'Urgent Caller',
    petOwnerEmail: user.email,
    petName: petName || 'Unknown Pet',
    petType: petType || 'Dog',
    phone,
    address,
    description,
    latitude: parseOptionalNumber(latitude, 12.9716),
    longitude: parseOptionalNumber(longitude, 77.5946),
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
    createdAt: new Date().toISOString()
  };

  db.emergencies.unshift(newEmergency);
  saveDB();
  res.status(201).json(newEmergency);
});

app.post('/api/emergency/:id/status', authenticateToken, requireRole('veterinarian'), (req: any, res: any) => {
  const { status, clinicId, clinicName } = req.body;
  const { id } = req.params;

  const eIndex = db.emergencies.findIndex(e => e.id === id);
  if (eIndex === -1) {
    res.status(404).json({ error: 'Emergency rescue instance not found.' });
    return;
  }

  db.emergencies[eIndex].status = status;
  if (clinicId) db.emergencies[eIndex].acceptedByClinicId = clinicId;
  if (clinicName) db.emergencies[eIndex].acceptedByClinicName = clinicName;

  saveDB();
  res.json(db.emergencies[eIndex]);
});

// USER FAVORITES AND PET MANAGEMENT - Authenticated
app.post('/api/user/favorites', authenticateToken, (req: any, res: any) => {
  const { clinicId } = req.body;
  const user = req.user!;

  if (!clinicId) {
    res.status(400).json({ error: 'clinicId is required.' });
    return;
  }

  const uIndex = db.users.findIndex(u => normalizeEmail(u.email) === user.email);
  if (uIndex === -1) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }

  const favorites = db.users[uIndex].favoriteClinics || [];
  const exists = favorites.includes(clinicId);

  if (exists) {
    db.users[uIndex].favoriteClinics = favorites.filter(id => id !== clinicId);
  } else {
    db.users[uIndex].favoriteClinics = [...favorites, clinicId];
  }

  saveDB();
  res.json({ favoriteClinics: db.users[uIndex].favoriteClinics });
});

app.post('/api/user/pets', authenticateToken, (req: any, res: any) => {
  const { name, type, breed, age, weight, medicalHistory } = req.body;
  const user = req.user!;

  if (!name || !type) {
    res.status(400).json({ error: 'Name and species Type are required to add a pet.' });
    return;
  }

  const uIndex = db.users.findIndex(u => normalizeEmail(u.email) === user.email);
  if (uIndex === -1) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  const newPet: Pet = {
    id: `pet-${Date.now()}`,
    name,
    type,
    breed: breed || 'Indie / Mix',
    age: age ? parseInt(age) : undefined,
    weight: weight || '',
    medicalHistory: medicalHistory ? [medicalHistory] : []
  };

  const pets = db.users[uIndex].pets || [];
  db.users[uIndex].pets = [...pets, newPet];

  saveDB();
  res.status(201).json(db.users[uIndex]);
});

// GET current user profile (authenticated) - used to refresh user state
app.get('/api/user/me', authenticateToken, (req: any, res: any) => {
  const user = req.user!;
  const fullUser = db.users.find(u => normalizeEmail(u.email) === user.email);

  if (!fullUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json(fullUser);
});

// ========================
// VITE MIDDLEWARE SETUP
// ========================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuickVet Server is happily running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
