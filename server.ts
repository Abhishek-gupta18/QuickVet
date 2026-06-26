import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import { eq, desc, and, sql } from 'drizzle-orm';
import { db, testConnection, closePool } from './src/server/db.js';
import {
  vetClinics, users, pets, favoriteClinics,
  clinicReviews, bookings, emergencyRequests,
} from './src/server/schema.js';
import { signToken } from './src/server/jwt.js';
import { authenticateToken, requireRole } from './src/server/middleware.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS: Allow frontend (Vercel) to call backend (Render)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL, // Set this to your Vercel URL in production
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin requests (no Origin header) — allow
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Ensure all API routes return JSON content-type (prevent Vite SPA fallback confusion)
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// --- Utility Helpers ---
function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('FATAL: JWT_SECRET not configured.');
  return secret;
}

function getISTTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
  });
}

function getISTDate(): string {
  return new Date().toISOString().split('T')[0];
}


// ========================
// PUBLIC API ROUTES
// ========================

// AUTH: Sign Up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, name, password, role, phone, clinicId } = req.body;
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'Missing required signup parameters.' });
    }
    if (role === 'veterinarian' && !clinicId) {
      return res.status(400).json({ error: 'Clinic ID is required for veterinarian signups.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const id = `user-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const [newUser] = await db.insert(users).values({
      id, email: normalizedEmail, passwordHash, name, role,
      phone: phone || '', avatarUrl,
      clinicId: role === 'veterinarian' ? clinicId : null,
    }).returning();

    const token = signToken(
      { id: newUser.id, email: normalizedEmail, role: newUser.role, clinicId: newUser.clinicId || undefined },
      getJwtSecret()
    );

    // Build user response (exclude passwordHash)
    const userResponse = await buildUserResponse(newUser.id);
    res.status(201).json({ user: userResponse, token });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});


// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(
      { id: user.id, email: normalizedEmail, role: user.role, clinicId: user.clinicId || undefined },
      getJwtSecret()
    );

    const userResponse = await buildUserResponse(user.id);
    res.json({ user: userResponse, token });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// AUTH: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User does not exist with that email address.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, user.id));
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// CLINICS: Public read
app.get('/api/clinics', async (_req, res) => {
  try {
    const allClinics = await db.select().from(vetClinics);
    // Map to frontend-compatible format
    const mapped = allClinics.map(c => ({
      id: c.id, name: c.name, description: c.description,
      address: c.address, area: c.area, city: c.city,
      latitude: c.latitude, longitude: c.longitude,
      phone: c.phone, rating: parseFloat(c.rating || '0'),
      reviewsCount: c.reviewsCount || 0, imageUrl: c.imageUrl,
      specialists: c.specialists, hasEmergency: c.hasEmergency,
      hasHomeVisit: c.hasHomeVisit, isOpenNow: c.isOpenNow,
      workingHours: c.workingHours, services: c.services,
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get clinics error:', err);
    res.status(500).json({ error: 'Failed to fetch clinics.' });
  }
});

// REVIEWS: Public read
app.get('/api/clinics/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.select().from(clinicReviews)
      .where(eq(clinicReviews.clinicId, req.params.id))
      .orderBy(desc(clinicReviews.createdAt));
    const mapped = reviews.map(r => ({
      id: r.id, clinicId: r.clinicId, userName: r.userName,
      userEmail: r.userEmail, petType: r.petType,
      rating: r.rating, reviewText: r.reviewText,
      date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : getISTDate(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});


// ========================
// PROTECTED API ROUTES (JWT required)
// ========================

// CLINICS: Create (authenticated)
app.post('/api/clinics', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, description, address, area, city, latitude, longitude, phone, specialists, hasEmergency, hasHomeVisit, workingHours, services, imageUrl } = req.body;
    if (!name || !address || !area || !phone) {
      return res.status(400).json({ error: 'Missing key details (Name, Address, Area, Phone).' });
    }

    const id = `clinic-${Date.now()}`;
    const [newClinic] = await db.insert(vetClinics).values({
      id, name,
      description: description || 'Professional veterinary clinic.',
      address, area, city: city || 'Bengaluru',
      latitude: parseFloat(latitude) || 12.9716,
      longitude: parseFloat(longitude) || 77.5946,
      phone, rating: '5.00', reviewsCount: 0,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=600',
      specialists: specialists || ['Dog', 'Cat'],
      hasEmergency: hasEmergency || false,
      hasHomeVisit: hasHomeVisit || false,
      isOpenNow: true,
      workingHours: workingHours || '9:00 AM - 8:00 PM',
      services: services || ['General Consultations', 'Vaccination', 'Pharmacy'],
    }).returning();

    res.status(201).json({
      ...newClinic,
      rating: parseFloat(newClinic.rating || '5'),
      reviewsCount: newClinic.reviewsCount || 0,
    });
  } catch (err: any) {
    console.error('Create clinic error:', err);
    res.status(500).json({ error: 'Failed to create clinic.' });
  }
});


// REVIEWS: Create (authenticated)
app.post('/api/clinics/:id/reviews', authenticateToken, async (req: any, res: any) => {
  try {
    const { rating, reviewText, petType } = req.body;
    const clinicId = req.params.id;
    if (!rating || !reviewText) {
      return res.status(400).json({ error: 'Rating and review comment are required.' });
    }

    const [reviewer] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const id = `rev-${Date.now()}`;

    await db.insert(clinicReviews).values({
      id, clinicId,
      userName: reviewer?.name || 'Anonymous',
      userEmail: req.user.email,
      petType: petType || 'Pet',
      rating: parseInt(rating),
      reviewText,
    });

    // Recalculate average rating
    const allReviews = await db.select().from(clinicReviews).where(eq(clinicReviews.clinicId, clinicId));
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / allReviews.length).toFixed(2);

    await db.update(vetClinics).set({
      rating: avg, reviewsCount: allReviews.length,
    }).where(eq(vetClinics.id, clinicId));

    res.status(201).json({
      id, clinicId, userName: reviewer?.name || 'Anonymous',
      userEmail: req.user.email, petType: petType || 'Pet',
      rating: parseInt(rating), reviewText, date: getISTDate(),
    });
  } catch (err: any) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to publish review.' });
  }
});


// BOOKINGS: Get (tenant-isolated)
app.get('/api/bookings', authenticateToken, async (req: any, res: any) => {
  try {
    let results;
    if (req.user.role === 'veterinarian') {
      results = await db.select().from(bookings)
        .where(eq(bookings.clinicId, req.user.clinicId || ''))
        .orderBy(desc(bookings.createdAt));
    } else {
      results = await db.select().from(bookings)
        .where(eq(bookings.petOwnerEmail, req.user.email))
        .orderBy(desc(bookings.createdAt));
    }

    const mapped = results.map(b => ({
      id: b.id, clinicId: b.clinicId, clinicName: b.clinicName,
      petOwnerName: b.petOwnerName, petOwnerEmail: b.petOwnerEmail,
      petName: b.petName, petType: b.petType, service: b.service,
      date: b.bookingDate, time: b.bookingTime, status: b.status,
      notes: b.notes, type: b.bookingType,
      createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// BOOKINGS: Create (authenticated)
app.post('/api/bookings', authenticateToken, async (req: any, res: any) => {
  try {
    const { clinicId, clinicName, petName, petType, service, date, time, type, notes } = req.body;
    if (!clinicId || !petName || !date || !time) {
      return res.status(400).json({ error: 'Missing essential booking fields.' });
    }

    const [owner] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const id = `booking-${Date.now()}`;

    const [newBooking] = await db.insert(bookings).values({
      id, clinicId, clinicName: clinicName || 'Veterinary Clinic',
      petOwnerId: req.user.id,
      petOwnerName: owner?.name || 'Pet Parent',
      petOwnerEmail: req.user.email,
      petName, petType: petType || 'Dog',
      service: service || 'General Consultation',
      bookingDate: date, bookingTime: time,
      status: 'pending', notes: notes || '',
      bookingType: type || 'clinic_visit',
    }).returning();

    res.status(201).json({
      id: newBooking.id, clinicId: newBooking.clinicId, clinicName: newBooking.clinicName,
      petOwnerName: newBooking.petOwnerName, petOwnerEmail: newBooking.petOwnerEmail,
      petName: newBooking.petName, petType: newBooking.petType, service: newBooking.service,
      date: newBooking.bookingDate, time: newBooking.bookingTime, status: newBooking.status,
      notes: newBooking.notes, type: newBooking.bookingType,
      createdAt: newBooking.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});


// BOOKINGS: Update status (vet only, clinic-scoped)
app.post('/api/bookings/:id/status', authenticateToken, requireRole('veterinarian'), async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.clinicId !== req.user.clinicId) {
      return res.status(403).json({ error: 'You can only manage bookings for your own clinic.' });
    }

    const [updated] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    res.json({
      id: updated.id, clinicId: updated.clinicId, clinicName: updated.clinicName,
      petOwnerName: updated.petOwnerName, petOwnerEmail: updated.petOwnerEmail,
      petName: updated.petName, petType: updated.petType, service: updated.service,
      date: updated.bookingDate, time: updated.bookingTime, status: updated.status,
      notes: updated.notes, type: updated.bookingType,
      createdAt: updated.createdAt?.toISOString() || '',
    });
  } catch (err: any) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});


// EMERGENCY: Get (tenant-isolated)
app.get('/api/emergency', authenticateToken, async (req: any, res: any) => {
  try {
    let results;
    if (req.user.role === 'veterinarian') {
      results = await db.select().from(emergencyRequests).orderBy(desc(emergencyRequests.createdAt));
    } else {
      results = await db.select().from(emergencyRequests)
        .where(eq(emergencyRequests.petOwnerEmail, req.user.email))
        .orderBy(desc(emergencyRequests.createdAt));
    }

    const mapped = results.map(e => ({
      id: e.id, petOwnerName: e.petOwnerName, petOwnerEmail: e.petOwnerEmail,
      petName: e.petName, petType: e.petType, phone: e.phone,
      address: e.address, description: e.description,
      latitude: e.latitude, longitude: e.longitude, status: e.status,
      acceptedByClinicId: e.acceptedByClinicId,
      acceptedByClinicName: e.acceptedByClinicName,
      date: e.requestDate, time: e.requestTime,
      createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Get emergencies error:', err);
    res.status(500).json({ error: 'Failed to fetch emergencies.' });
  }
});

// EMERGENCY: Create (authenticated)
app.post('/api/emergency', authenticateToken, async (req: any, res: any) => {
  try {
    const { petName, petType, phone, address, description, latitude, longitude } = req.body;
    if (!phone || !address || !description) {
      return res.status(400).json({ error: 'Emergency needs phone, address, and description.' });
    }

    const [owner] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    const id = `emergency-${Date.now()}`;

    const [newEmergency] = await db.insert(emergencyRequests).values({
      id, petOwnerId: req.user.id,
      petOwnerName: owner?.name || 'Urgent Caller',
      petOwnerEmail: req.user.email,
      petName: petName || 'Unknown Pet', petType: petType || 'Dog',
      phone, address, description,
      latitude: parseFloat(latitude) || 12.9716,
      longitude: parseFloat(longitude) || 77.5946,
      status: 'pending',
      requestDate: getISTDate(), requestTime: getISTTime(),
    }).returning();

    res.status(201).json({
      id: newEmergency.id, petOwnerName: newEmergency.petOwnerName,
      petOwnerEmail: newEmergency.petOwnerEmail,
      petName: newEmergency.petName, petType: newEmergency.petType,
      phone: newEmergency.phone, address: newEmergency.address,
      description: newEmergency.description,
      latitude: newEmergency.latitude, longitude: newEmergency.longitude,
      status: newEmergency.status,
      acceptedByClinicId: newEmergency.acceptedByClinicId,
      acceptedByClinicName: newEmergency.acceptedByClinicName,
      date: newEmergency.requestDate, time: newEmergency.requestTime,
      createdAt: newEmergency.createdAt?.toISOString() || new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Create emergency error:', err);
    res.status(500).json({ error: 'Failed to create emergency request.' });
  }
});


// EMERGENCY: Update status (vet only)
app.post('/api/emergency/:id/status', authenticateToken, requireRole('veterinarian'), async (req: any, res: any) => {
  try {
    const { status, clinicId, clinicName } = req.body;
    const { id } = req.params;

    const [emergency] = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id)).limit(1);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found.' });

    const updateData: any = { status };
    if (clinicId) updateData.acceptedByClinicId = clinicId;
    if (clinicName) updateData.acceptedByClinicName = clinicName;

    const [updated] = await db.update(emergencyRequests).set(updateData).where(eq(emergencyRequests.id, id)).returning();
    res.json({
      id: updated.id, petOwnerName: updated.petOwnerName,
      petOwnerEmail: updated.petOwnerEmail,
      petName: updated.petName, petType: updated.petType,
      phone: updated.phone, address: updated.address,
      description: updated.description,
      latitude: updated.latitude, longitude: updated.longitude,
      status: updated.status,
      acceptedByClinicId: updated.acceptedByClinicId,
      acceptedByClinicName: updated.acceptedByClinicName,
      date: updated.requestDate, time: updated.requestTime,
      createdAt: updated.createdAt?.toISOString() || '',
    });
  } catch (err: any) {
    console.error('Update emergency error:', err);
    res.status(500).json({ error: 'Failed to update emergency.' });
  }
});


// USER: Toggle favorite clinic
app.post('/api/user/favorites', authenticateToken, async (req: any, res: any) => {
  try {
    const { clinicId } = req.body;
    if (!clinicId) return res.status(400).json({ error: 'clinicId is required.' });

    const existing = await db.select().from(favoriteClinics)
      .where(and(eq(favoriteClinics.userId, req.user.id), eq(favoriteClinics.clinicId, clinicId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favoriteClinics)
        .where(and(eq(favoriteClinics.userId, req.user.id), eq(favoriteClinics.clinicId, clinicId)));
    } else {
      await db.insert(favoriteClinics).values({ userId: req.user.id, clinicId });
    }

    const allFavs = await db.select().from(favoriteClinics).where(eq(favoriteClinics.userId, req.user.id));
    res.json({ favoriteClinics: allFavs.map(f => f.clinicId) });
  } catch (err: any) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Failed to toggle favorite.' });
  }
});

// USER: Add pet
app.post('/api/user/pets', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, type, breed, age, weight, medicalHistory } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required.' });
    }

    const id = `pet-${Date.now()}`;
    await db.insert(pets).values({
      id, ownerId: req.user.id, name, type,
      breed: breed || 'Indie / Mix',
      age: age ? parseInt(age) : null,
      weight: weight || '',
      medicalHistory: medicalHistory ? [medicalHistory] : [],
    });

    // Return full updated user profile
    const userResponse = await buildUserResponse(req.user.id);
    res.status(201).json(userResponse);
  } catch (err: any) {
    console.error('Add pet error:', err);
    res.status(500).json({ error: 'Failed to add pet.' });
  }
});

// USER: Get current profile
app.get('/api/user/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userResponse = await buildUserResponse(req.user.id);
    if (!userResponse) return res.status(404).json({ error: 'User not found.' });
    res.json(userResponse);
  } catch (err: any) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});


// ========================
// HELPER: Build user response with pets & favorites (no passwordHash)
// ========================
async function buildUserResponse(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const userPets = await db.select().from(pets).where(eq(pets.ownerId, userId));
  const userFavs = await db.select().from(favoriteClinics).where(eq(favoriteClinics.userId, userId));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone || '',
    avatarUrl: user.avatarUrl || '',
    createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    clinicId: user.clinicId || undefined,
    pets: userPets.map(p => ({
      id: p.id, name: p.name, type: p.type,
      breed: p.breed || undefined, age: p.age || undefined,
      weight: p.weight || undefined, medicalHistory: p.medicalHistory || [],
    })),
    favoriteClinics: userFavs.map(f => f.clinicId),
  };
}

// ========================
// VITE MIDDLEWARE & SERVER START
// ========================
async function startServer() {
  // Test database connection before starting
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('⚠️  WARNING: Database connection failed. API routes requiring DB will fail.');
  }

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
    console.log(`🐾 QuickVet Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await closePool();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await closePool();
    process.exit(0);
  });
}

startServer();
