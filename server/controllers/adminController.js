const { pool } = require('../config/db');

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

module.exports = { getDashboard, getPendingSellers, verifySeller, suspendUser, getAllUsers, getFraudFlags, getPendingExperts, verifyExpert };
