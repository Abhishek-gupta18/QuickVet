/**
 * Admin API Routes for QuickVet
 * 
 * All routes prefixed with /api/admin and require JWT + admin role.
 * Provides: stats, verification queue, user management, vet management,
 * activity logs, booking/emergency monitoring, review moderation.
 */
import { Router } from 'express';
import { eq, desc, and, sql, count, avg, gte, like, or } from 'drizzle-orm';
import { db } from './db.js';
import {
  users, vetClinics, pets, bookings, emergencyRequests,
  clinicReviews, verificationDocuments, activityLogs, favoriteClinics,
} from './schema.js';
import { authenticateToken, requireRole } from './middleware.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticateToken);
router.use(requireRole('admin'));

// ============================================================
// HELPER: Log admin activity
// ============================================================
async function logActivity(adminId: string, adminName: string, adminEmail: string, action: string, opts: {
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  ipAddress?: string;
} = {}) {
  try {
    await db.insert(activityLogs).values({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      adminId,
      adminName,
      adminEmail,
      action,
      targetType: opts.targetType || null,
      targetId: opts.targetId || null,
      targetName: opts.targetName || null,
      details: opts.details || null,
      ipAddress: opts.ipAddress || null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}


// ============================================================
// 1. PLATFORM ANALYTICS / STATS
// ============================================================
router.get('/stats', async (req: any, res: any) => {
  try {
    const allUsers = await db.select().from(users);
    const allBookings = await db.select().from(bookings);
    const allEmergencies = await db.select().from(emergencyRequests);
    const allClinics = await db.select().from(vetClinics);
    const allReviews = await db.select().from(clinicReviews);

    const totalUsers = allUsers.filter(u => u.role === 'pet_owner').length;
    const totalVets = allUsers.filter(u => u.role === 'veterinarian').length;
    const pendingVerifications = allUsers.filter(u => u.verificationStatus === 'pending' || u.verificationStatus === 'under_review').length;
    const approvedVets = allUsers.filter(u => u.verificationStatus === 'approved').length;
    const rejectedVets = allUsers.filter(u => u.verificationStatus === 'rejected').length;
    const suspendedAccounts = allUsers.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'banned').length;

    const today = new Date().toISOString().split('T')[0];
    const todayBookings = allBookings.filter(b => b.bookingDate === today).length;
    const activeEmergencies = allEmergencies.filter(e => e.status === 'pending' || e.status === 'notified').length;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newRegistrationsThisWeek = allUsers.filter(u => u.createdAt && new Date(u.createdAt) >= oneWeekAgo).length;

    const avgRating = allClinics.reduce((sum, c) => sum + parseFloat(c.rating || '0'), 0) / (allClinics.length || 1);

    res.json({
      totalUsers,
      totalVets,
      totalClinics: allClinics.length,
      pendingVerifications,
      approvedVets,
      rejectedVets,
      suspendedAccounts,
      totalBookings: allBookings.length,
      todayBookings,
      totalEmergencies: allEmergencies.length,
      activeEmergencies,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length,
      newRegistrationsThisWeek,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});


// ============================================================
// 2. VERIFICATION QUEUE
// ============================================================
router.get('/verification-queue', async (req: any, res: any) => {
  try {
    const { status } = req.query; // optional filter: 'pending' | 'approved' | 'rejected' | 'suspended'

    let vets;
    if (status && status !== 'all') {
      vets = await db.select().from(users)
        .where(and(eq(users.role, 'veterinarian'), eq(users.verificationStatus, status as string)))
        .orderBy(desc(users.createdAt));
    } else {
      vets = await db.select().from(users)
        .where(eq(users.role, 'veterinarian'))
        .orderBy(desc(users.createdAt));
    }

    // Enrich with clinic names and document counts
    const enriched = await Promise.all(vets.map(async (vet) => {
      let clinicName = null;
      if (vet.clinicId) {
        const [clinic] = await db.select().from(vetClinics).where(eq(vetClinics.id, vet.clinicId)).limit(1);
        clinicName = clinic?.name || null;
      }
      const docs = await db.select().from(verificationDocuments).where(eq(verificationDocuments.userId, vet.id));

      return {
        id: vet.id,
        name: vet.name,
        email: vet.email,
        phone: vet.phone,
        avatarUrl: vet.avatarUrl,
        clinicId: vet.clinicId,
        clinicName,
        verificationStatus: vet.verificationStatus,
        vetRegistrationNumber: vet.vetRegistrationNumber,
        vetLicenseNumber: vet.vetLicenseNumber,
        vetDegree: vet.vetDegree,
        vetSpecializations: vet.vetSpecializations,
        vetExperienceYears: vet.vetExperienceYears,
        vetGovernmentId: vet.vetGovernmentId,
        verificationNotes: vet.verificationNotes,
        rejectionReason: vet.rejectionReason,
        createdAt: vet.createdAt?.toISOString() || '',
        verifiedAt: vet.verifiedAt?.toISOString() || null,
        accountStatus: vet.accountStatus,
        documents: docs.map(d => ({
          id: d.id,
          documentType: d.documentType,
          documentName: d.documentName,
          documentUrl: d.documentUrl,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          uploadedAt: d.uploadedAt?.toISOString() || '',
          verificationStatus: d.verificationStatus,
          reviewNotes: d.reviewNotes,
        })),
      };
    }));

    res.json(enriched);
  } catch (err: any) {
    console.error('Verification queue error:', err);
    res.status(500).json({ error: 'Failed to fetch verification queue.' });
  }
});


// ============================================================
// 3. VERIFY VET (approve / reject / request docs / suspend)
// ============================================================
router.post('/verify/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { action, reason, notes } = req.body;
    // action: 'approve' | 'reject' | 'request_documents' | 'suspend' | 'reverify'

    const [vet] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!vet || vet.role !== 'veterinarian') {
      return res.status(404).json({ error: 'Veterinarian not found.' });
    }

    let newStatus: string;
    let updateData: any = {};

    switch (action) {
      case 'approve':
        newStatus = 'approved';
        updateData = {
          verificationStatus: 'approved',
          verifiedAt: new Date(),
          verifiedBy: req.user.id,
          verificationNotes: notes || vet.verificationNotes,
          rejectionReason: null,
        };
        break;
      case 'reject':
        newStatus = 'rejected';
        updateData = {
          verificationStatus: 'rejected',
          rejectionReason: reason || 'Application did not meet verification criteria.',
          verificationNotes: notes || vet.verificationNotes,
          verifiedBy: req.user.id,
        };
        break;
      case 'request_documents':
        newStatus = 'under_review';
        updateData = {
          verificationStatus: 'under_review',
          verificationNotes: notes || 'Additional documents requested by admin.',
        };
        break;
      case 'suspend':
        newStatus = 'suspended';
        updateData = {
          verificationStatus: 'suspended',
          accountStatus: 'suspended',
          suspensionReason: reason || 'Suspended by admin.',
          suspendedAt: new Date(),
          suspendedBy: req.user.id,
        };
        break;
      case 'reverify':
        newStatus = 'reverification_required';
        updateData = {
          verificationStatus: 'reverification_required',
          verificationNotes: notes || 'Re-verification required.',
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: approve, reject, request_documents, suspend, reverify.' });
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    // Log activity
    await logActivity(req.user.id, req.user.email, req.user.email, `vet_${action}`, {
      targetType: 'veterinarian',
      targetId: id,
      targetName: vet.name,
      details: `Action: ${action}. ${reason ? 'Reason: ' + reason : ''} ${notes ? 'Notes: ' + notes : ''}`.trim(),
    });

    res.json({ message: `Veterinarian ${action} successful.`, verificationStatus: newStatus });
  } catch (err: any) {
    console.error('Verify vet error:', err);
    res.status(500).json({ error: 'Failed to process verification action.' });
  }
});


// ============================================================
// 4. USER MANAGEMENT
// ============================================================
router.get('/users', async (req: any, res: any) => {
  try {
    const { search, role, status } = req.query;

    let allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    // Apply filters
    if (role && role !== 'all') {
      allUsers = allUsers.filter(u => u.role === role);
    }
    if (status && status !== 'all') {
      allUsers = allUsers.filter(u => u.accountStatus === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      allUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || '').includes(q)
      );
    }

    const mapped = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      accountStatus: u.accountStatus,
      verificationStatus: u.verificationStatus,
      clinicId: u.clinicId,
      createdAt: u.createdAt?.toISOString() || '',
      suspensionReason: u.suspensionReason,
    }));

    res.json(mapped);
  } catch (err: any) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Update user status (suspend / ban / reactivate)
router.post('/users/:id/status', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    // action: 'suspend' | 'ban' | 'reactivate'

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot modify admin accounts.' });

    let updateData: any = {};
    switch (action) {
      case 'suspend':
        updateData = {
          accountStatus: 'suspended',
          suspensionReason: reason || 'Suspended by admin.',
          suspendedAt: new Date(),
          suspendedBy: req.user.id,
        };
        break;
      case 'ban':
        updateData = {
          accountStatus: 'banned',
          suspensionReason: reason || 'Permanently banned.',
          suspendedAt: new Date(),
          suspendedBy: req.user.id,
        };
        break;
      case 'reactivate':
        updateData = {
          accountStatus: 'active',
          suspensionReason: null,
          suspendedAt: null,
          suspendedBy: null,
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: suspend, ban, reactivate.' });
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    // Log activity
    await logActivity(req.user.id, req.user.email, req.user.email, `user_${action}`, {
      targetType: 'user',
      targetId: id,
      targetName: user.name,
      details: reason || `User ${action} by admin.`,
    });

    res.json({ message: `User ${action} successful.`, accountStatus: updateData.accountStatus });
  } catch (err: any) {
    console.error('User status error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});


// ============================================================
// 5. ALL BOOKINGS (admin view - no tenant isolation)
// ============================================================
router.get('/bookings', async (req: any, res: any) => {
  try {
    const { status, clinicId } = req.query;

    let results = await db.select().from(bookings).orderBy(desc(bookings.createdAt));

    if (status && status !== 'all') {
      results = results.filter(b => b.status === status);
    }
    if (clinicId) {
      results = results.filter(b => b.clinicId === clinicId);
    }

    const mapped = results.map(b => ({
      id: b.id, clinicId: b.clinicId, clinicName: b.clinicName,
      petOwnerName: b.petOwnerName, petOwnerEmail: b.petOwnerEmail,
      petName: b.petName, petType: b.petType, service: b.service,
      date: b.bookingDate, time: b.bookingTime, status: b.status,
      notes: b.notes, type: b.bookingType,
      createdAt: b.createdAt?.toISOString() || '',
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Admin bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// ============================================================
// 6. ALL EMERGENCIES (admin view)
// ============================================================
router.get('/emergencies', async (req: any, res: any) => {
  try {
    const { status } = req.query;

    let results = await db.select().from(emergencyRequests).orderBy(desc(emergencyRequests.createdAt));

    if (status && status !== 'all') {
      results = results.filter(e => e.status === status);
    }

    const mapped = results.map(e => ({
      id: e.id, petOwnerName: e.petOwnerName, petOwnerEmail: e.petOwnerEmail,
      petName: e.petName, petType: e.petType, phone: e.phone,
      address: e.address, description: e.description,
      latitude: e.latitude, longitude: e.longitude, status: e.status,
      acceptedByClinicId: e.acceptedByClinicId,
      acceptedByClinicName: e.acceptedByClinicName,
      date: e.requestDate, time: e.requestTime,
      createdAt: e.createdAt?.toISOString() || '',
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Admin emergencies error:', err);
    res.status(500).json({ error: 'Failed to fetch emergencies.' });
  }
});


// ============================================================
// 7. ACTIVITY LOGS
// ============================================================
router.get('/activity-logs', async (req: any, res: any) => {
  try {
    const { action, limit: queryLimit } = req.query;
    const maxResults = parseInt(queryLimit as string) || 100;

    let logs = await db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(maxResults);

    if (action && action !== 'all') {
      logs = logs.filter(l => l.action === action);
    }

    const mapped = logs.map(l => ({
      id: l.id,
      adminId: l.adminId,
      adminName: l.adminName,
      adminEmail: l.adminEmail,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId,
      targetName: l.targetName,
      details: l.details,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt?.toISOString() || '',
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Activity logs error:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs.' });
  }
});

// ============================================================
// 8. REVIEW MODERATION
// ============================================================
router.post('/reviews/:id/moderate', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;
    // action: 'hide' | 'unhide'

    const [review] = await db.select().from(clinicReviews).where(eq(clinicReviews.id, id)).limit(1);
    if (!review) return res.status(404).json({ error: 'Review not found.' });

    if (action === 'hide') {
      await db.update(clinicReviews).set({
        isHidden: true,
        hiddenBy: req.user.id,
        hiddenReason: reason || 'Hidden by admin.',
      }).where(eq(clinicReviews.id, id));
    } else if (action === 'unhide') {
      await db.update(clinicReviews).set({
        isHidden: false,
        hiddenBy: null,
        hiddenReason: null,
      }).where(eq(clinicReviews.id, id));
    } else {
      return res.status(400).json({ error: 'Invalid action. Use: hide, unhide.' });
    }

    await logActivity(req.user.id, req.user.email, req.user.email, `review_${action}`, {
      targetType: 'review',
      targetId: id,
      targetName: `Review by ${review.userName}`,
      details: reason || `Review ${action} by admin.`,
    });

    res.json({ message: `Review ${action} successful.` });
  } catch (err: any) {
    console.error('Review moderation error:', err);
    res.status(500).json({ error: 'Failed to moderate review.' });
  }
});

// ============================================================
// 9. ALL REVIEWS (admin can see hidden ones too)
// ============================================================
router.get('/reviews', async (req: any, res: any) => {
  try {
    const allReviews = await db.select().from(clinicReviews).orderBy(desc(clinicReviews.createdAt));

    const mapped = allReviews.map(r => ({
      id: r.id,
      clinicId: r.clinicId,
      userName: r.userName,
      userEmail: r.userEmail,
      petType: r.petType,
      rating: r.rating,
      reviewText: r.reviewText,
      date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '',
      isHidden: r.isHidden,
      hiddenReason: r.hiddenReason,
    }));
    res.json(mapped);
  } catch (err: any) {
    console.error('Admin reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// ============================================================
// 10. EMERGENCY REASSIGNMENT (manual)
// ============================================================
router.post('/emergencies/:id/reassign', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { clinicId, clinicName } = req.body;

    const [emergency] = await db.select().from(emergencyRequests).where(eq(emergencyRequests.id, id)).limit(1);
    if (!emergency) return res.status(404).json({ error: 'Emergency not found.' });

    await db.update(emergencyRequests).set({
      acceptedByClinicId: clinicId,
      acceptedByClinicName: clinicName,
      status: 'accepted',
    }).where(eq(emergencyRequests.id, id));

    await logActivity(req.user.id, req.user.email, req.user.email, 'emergency_reassigned', {
      targetType: 'emergency',
      targetId: id,
      targetName: `Emergency for ${emergency.petName}`,
      details: `Reassigned to ${clinicName} (${clinicId}).`,
    });

    res.json({ message: 'Emergency reassigned successfully.' });
  } catch (err: any) {
    console.error('Emergency reassign error:', err);
    res.status(500).json({ error: 'Failed to reassign emergency.' });
  }
});

export default router;
