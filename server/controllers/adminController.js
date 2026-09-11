const { pool } = require('../config/db');

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER') AS customers,
        (SELECT COUNT(*) FROM users WHERE role = 'SELLER') AS sellers,
        (SELECT COUNT(*) FROM users WHERE role = 'EXPERT') AS experts,
        (SELECT COUNT(*) FROM users WHERE role = 'COLLECTOR') AS collectors,
        (SELECT COUNT(*) FROM seller_profiles WHERE verification_status = 'PENDING') AS pending_sellers,
        (SELECT COUNT(*) FROM expert_profiles WHERE verification_status = 'PENDING') AS pending_experts,
        (SELECT COUNT(*) FROM honey_products) AS total_products,
        (SELECT COUNT(*) FROM honey_batches) AS total_batches,
        (SELECT COUNT(*) FROM lab_reports) AS total_lab_reports,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(*) FROM bee_rescue_requests) AS total_rescues,
        (SELECT COUNT(*) FROM bee_rescue_requests WHERE status = 'REPORTED') AS open_rescues,
        (SELECT COUNT(*) FROM fraud_flags WHERE status = 'PENDING_REVIEW') AS fraud_flags
    `);

    // Recent registrations
    const recentUsers = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10'
    );

    res.json({ stats: stats.rows[0], recent_users: recentUsers.rows });
  } catch (err) {
    console.error('getDashboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

// ─── Rescue Management ──────────────────────────────────────────────────────

// GET /api/admin/rescue — ALL rescue requests with full data
const getAllRescueRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT brr.*,
        u.name AS reporter_user_name, u.email AS reporter_email,
        ac.name AS assigned_collector_name, ac.role AS assigned_collector_role
      FROM bee_rescue_requests brr
      LEFT JOIN users u ON u.id = brr.reported_by
      LEFT JOIN users ac ON ac.id = brr.assigned_collector
      ORDER BY brr.created_at DESC
    `);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('getAllRescueRequests error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rescue requests.' });
  }
};

// GET /api/admin/rescue/:id/nearby — nearby verified SELLERS + COLLECTORS
const getNearbyAssignees = async (req, res) => {
  try {
    const { id } = req.params;

    // Get rescue request location
    const rescue = await pool.query(
      'SELECT latitude, longitude FROM bee_rescue_requests WHERE id = $1',
      [id]
    );
    if (rescue.rows.length === 0) {
      return res.status(404).json({ error: 'Rescue request not found.' });
    }

    const { latitude: rLat, longitude: rLng } = rescue.rows[0];
    if (!rLat || !rLng) {
      return res.status(400).json({ error: 'Rescue request has no GPS coordinates.' });
    }

    // Get verified SELLERS with GPS
    const sellers = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.phone,
        sp.farm_name, sp.village, sp.district, sp.state,
        sp.latitude, sp.longitude, sp.verification_status,
        sp.number_of_colonies,
        (SELECT COUNT(*) FROM bee_rescue_requests WHERE assigned_collector = u.id AND status NOT IN ('COMPLETED','CANCELLED')) AS active_assignments
      FROM users u
      JOIN seller_profiles sp ON sp.user_id = u.id
      WHERE u.role = 'SELLER'
        AND u.is_active = TRUE
        AND sp.verification_status = 'VERIFIED'
        AND sp.latitude IS NOT NULL
        AND sp.longitude IS NOT NULL
    `);

    // Get verified COLLECTORS with GPS (profile lat/lng or fallback to farm)
    const collectors = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.phone,
        cp.village, cp.district, cp.state,
        cp.verification_status,
        COALESCE(cp.latitude, f.latitude) AS latitude,
        COALESCE(cp.longitude, f.longitude) AS longitude,
        f.farm_name,
        (SELECT COUNT(*) FROM bee_rescue_requests WHERE assigned_collector = u.id AND status NOT IN ('COMPLETED','CANCELLED')) AS active_assignments
      FROM users u
      JOIN collector_profiles cp ON cp.user_id = u.id
      LEFT JOIN farms f ON f.seller_id = u.id
      WHERE u.role = 'COLLECTOR'
        AND u.is_active = TRUE
        AND cp.verification_status = 'VERIFIED'
    `);

    const rescueLat = parseFloat(rLat);
    const rescueLng = parseFloat(rLng);

    // Calculate distances and combine
    const assignees = [];

    for (const s of sellers.rows) {
      const lat = parseFloat(s.latitude);
      const lng = parseFloat(s.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        assignees.push({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: 'SELLER',
          farm_name: s.farm_name,
          village: s.village,
          district: s.district,
          state: s.state,
          verification_status: s.verification_status,
          number_of_colonies: s.number_of_colonies,
          active_assignments: parseInt(s.active_assignments),
          distance_km: Math.round(haversineKm(rescueLat, rescueLng, lat, lng) * 10) / 10,
        });
      }
    }

    for (const c of collectors.rows) {
      const lat = c.latitude ? parseFloat(c.latitude) : null;
      const lng = c.longitude ? parseFloat(c.longitude) : null;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        assignees.push({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: 'COLLECTOR',
          farm_name: c.farm_name || null,
          village: c.village,
          district: c.district,
          state: c.state,
          verification_status: c.verification_status,
          active_assignments: parseInt(c.active_assignments),
          distance_km: Math.round(haversineKm(rescueLat, rescueLng, lat, lng) * 10) / 10,
        });
      }
    }

    // Sort by distance
    assignees.sort((a, b) => a.distance_km - b.distance_km);

    res.json({ assignees, rescue_location: { latitude: rescueLat, longitude: rescueLng } });
  } catch (err) {
    console.error('getNearbyAssignees error:', err.message);
    res.status(500).json({ error: 'Failed to fetch nearby assignees.' });
  }
};

// POST /api/admin/rescue/:id/assign — assign a SELLER or COLLECTOR
const assignRescue = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignee_id, assignment_notes } = req.body;

    if (!assignee_id) {
      return res.status(400).json({ error: 'assignee_id is required.' });
    }

    // Verify the rescue request exists and is assignable
    const rescue = await pool.query('SELECT * FROM bee_rescue_requests WHERE id = $1', [id]);
    if (rescue.rows.length === 0) {
      return res.status(404).json({ error: 'Rescue request not found.' });
    }
    const r = rescue.rows[0];
    if (!['REPORTED', 'UNDER_REVIEW'].includes(r.status)) {
      return res.status(400).json({ error: `Cannot assign from status: ${r.status}. Must be REPORTED or UNDER_REVIEW.` });
    }

    // Verify the assignee is a valid verified SELLER or COLLECTOR
    const assignee = await pool.query(
      'SELECT id, name, role, is_active FROM users WHERE id = $1',
      [assignee_id]
    );
    if (assignee.rows.length === 0) {
      return res.status(404).json({ error: 'Assignee not found.' });
    }
    const a = assignee.rows[0];
    if (!['SELLER', 'COLLECTOR'].includes(a.role)) {
      return res.status(400).json({ error: 'Assignee must be a SELLER or COLLECTOR.' });
    }
    if (!a.is_active) {
      return res.status(400).json({ error: 'Assignee account is suspended.' });
    }

    // Check verification status
    const profileTable = a.role === 'SELLER' ? 'seller_profiles' : 'collector_profiles';
    const profileCheck = await pool.query(
      `SELECT verification_status FROM ${profileTable} WHERE user_id = $1`,
      [assignee_id]
    );
    if (profileCheck.rows.length === 0 || profileCheck.rows[0].verification_status !== 'VERIFIED') {
      return res.status(400).json({ error: `${a.role} is not verified. Only verified users can be assigned.` });
    }

    // Assign
    await pool.query(`
      UPDATE bee_rescue_requests
      SET status = 'COLLECTOR_ASSIGNED',
          assigned_collector = $1,
          assigned_by = $2,
          assignment_notes = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [assignee_id, req.user.id, assignment_notes || null, id]);

    res.json({
      message: `Rescue assigned to ${a.role.toLowerCase()} "${a.name}" successfully.`,
      assignee: { id: a.id, name: a.name, role: a.role },
    });
  } catch (err) {
    console.error('assignRescue error:', err.message);
    res.status(500).json({ error: 'Failed to assign rescue request.' });
  }
};

// ─── Batches (admin) ─────────────────────────────────────────────────────────

// GET /api/admin/batches — all batches
const getAllBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT hb.*, hp.name AS product_name, u.name AS seller_name,
        f.farm_name, lr.overall_status AS lab_status, lr.report_id
      FROM honey_batches hb
      LEFT JOIN honey_products hp ON hp.id = hb.product_id
      JOIN users u ON u.id = hb.seller_id
      LEFT JOIN farms f ON f.id = hb.farm_id
      LEFT JOIN lab_reports lr ON lr.batch_id = hb.id
      ORDER BY hb.created_at DESC
    `);
    res.json({ batches: result.rows });
  } catch (err) {
    console.error('getAllBatches error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
};

// ─── Seller/Expert Verification ─────────────────────────────────────────────

// GET /api/admin/verifications/sellers
const getPendingSellers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at,
        sp.farm_name, sp.village, sp.district, sp.state,
        sp.experience_years, sp.number_of_colonies, sp.verification_status, sp.id AS profile_id
      FROM seller_profiles sp JOIN users u ON u.id = sp.user_id
      WHERE sp.verification_status IN ('PENDING', 'UNDER_REVIEW', 'FIELD_VERIFICATION')
      ORDER BY u.created_at DESC
    `);
    res.json({ sellers: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending sellers.' });
  }
};

// PUT /api/admin/verifications/sellers/:id — verify or reject
const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const statusMap = { verify: 'VERIFIED', reject: 'REJECTED', field: 'FIELD_VERIFICATION' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: 'Invalid action.' });

    await pool.query(
      'UPDATE seller_profiles SET verification_status = $1, updated_at = NOW() WHERE user_id = $2',
      [newStatus, id]
    );
    if (newStatus === 'VERIFIED') {
      await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [id]);
    }

    res.json({ message: `Seller ${action}d successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update seller verification.' });
  }
};

// PUT /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot suspend your own account.' });
    }
    await pool.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ message: 'User suspended.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to suspend user.' });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [parseInt(limit), offset];
    let where = '';
    if (role) { params.unshift(role); where = `WHERE role = $1`; }

    const result = await pool.query(`
      SELECT id, name, email, phone, role, is_verified, is_active, created_at
      FROM users ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// GET /api/admin/fraud-flags
const getFraudFlags = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ff.*, u.name AS flagged_user_name, u.email AS flagged_user_email, u.role AS flagged_user_role
      FROM fraud_flags ff
      LEFT JOIN users u ON u.id = ff.flagged_user
      ORDER BY ff.created_at DESC
    `);
    res.json({ flags: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fraud flags.' });
  }
};

// GET /api/admin/verifications/experts
const getPendingExperts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at,
        ep.qualification, ep.specialization, ep.experience_years, ep.verification_status, ep.id AS profile_id
      FROM expert_profiles ep JOIN users u ON u.id = ep.user_id
      WHERE ep.verification_status IN ('PENDING', 'UNDER_REVIEW')
      ORDER BY u.created_at DESC
    `);
    res.json({ experts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending experts.' });
  }
};

// PUT /api/admin/verifications/experts/:id
const verifyExpert = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const statusMap = { verify: 'VERIFIED', reject: 'REJECTED' };
    const newStatus = statusMap[action];
    if (!newStatus) return res.status(400).json({ error: 'Invalid action.' });

    await pool.query(
      'UPDATE expert_profiles SET verification_status = $1, updated_at = NOW() WHERE user_id = $2',
      [newStatus, id]
    );
    if (newStatus === 'VERIFIED') {
      await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [id]);
    }
    res.json({ message: `Expert ${action}d.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expert verification.' });
  }
};

module.exports = {
  getDashboard, getPendingSellers, verifySeller, suspendUser, getAllUsers,
  getFraudFlags, getPendingExperts, verifyExpert,
  getAllRescueRequests, getNearbyAssignees, assignRescue, getAllBatches,
};
