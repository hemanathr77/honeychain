const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const { pool } = require('../config/db');

// GET /api/users — admin only; returns safe user info (no password_hash)
router.get('/', authenticateUser, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [parseInt(limit), offset];
    let where = '';

    if (role) {
      params.unshift(role);
      where = 'WHERE role = $1';
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, role, is_verified, is_active, created_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM users ${where}`,
      role ? [role] : []
    );

    res.json({
      users: result.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GET /api/users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

module.exports = router;
