const { pool } = require('../config/db');

// POST /api/mentorship — request mentorship from an expert
const requestMentorship = async (req, res) => {
  try {
    const { mentor_id, message } = req.body;

    if (!mentor_id) {
      return res.status(400).json({ error: 'Mentor ID is required.' });
    }

    // Verify mentor exists and is a verified expert
    const mentorCheck = await pool.query(`
      SELECT u.id FROM users u
      JOIN expert_profiles ep ON ep.user_id = u.id
      WHERE u.id = $1 AND ep.verification_status = 'VERIFIED'
    `, [mentor_id]);

    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found or not yet verified.' });
    }

    // Prevent duplicate active requests
    const existing = await pool.query(`
      SELECT id FROM mentorship_requests
      WHERE farmer_id = $1 AND mentor_id = $2 AND status IN ('REQUESTED', 'ACCEPTED', 'ACTIVE')
    `, [req.user.id, mentor_id]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active mentorship request with this expert.' });
    }

    const result = await pool.query(`
      INSERT INTO mentorship_requests (farmer_id, mentor_id, message)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.user.id, mentor_id, message || null]);

    res.status(201).json({ message: 'Mentorship request sent.', request: result.rows[0] });
  } catch (err) {
    console.error('requestMentorship error:', err.message);
    res.status(500).json({ error: 'Failed to send mentorship request.' });
  }
};

// GET /api/mentorship — get mentorship requests (for farmer or expert)
const getMentorshipRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query;
    if (role === 'EXPERT') {
      query = pool.query(`
        SELECT mr.*, u.name AS farmer_name, u.email AS farmer_email
        FROM mentorship_requests mr
        JOIN users u ON u.id = mr.farmer_id
        WHERE mr.mentor_id = $1
        ORDER BY mr.created_at DESC
      `, [userId]);
    } else {
      query = pool.query(`
        SELECT mr.*, u.name AS mentor_name, u.email AS mentor_email,
          ep.specialization, ep.qualification
        FROM mentorship_requests mr
        JOIN users u ON u.id = mr.mentor_id
        LEFT JOIN expert_profiles ep ON ep.user_id = mr.mentor_id
        WHERE mr.farmer_id = $1
        ORDER BY mr.created_at DESC
      `, [userId]);
    }

    const result = await query;
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('getMentorshipRequests error:', err.message);
    res.status(500).json({ error: 'Failed to fetch mentorship requests.' });
  }
};

// PUT /api/mentorship/:id — update status (expert accepts/rejects, or marks complete)
const updateMentorshipStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['ACCEPTED', 'REJECTED', 'ACTIVE', 'COMPLETED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const existing = await pool.query('SELECT * FROM mentorship_requests WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Mentorship request not found.' });
    }

    const req_data = existing.rows[0];
    // Only the mentor or farmer involved can update
    if (req_data.mentor_id !== req.user.id && req_data.farmer_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this request.' });
    }

    await pool.query(
      'UPDATE mentorship_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    res.json({ message: `Mentorship request ${status.toLowerCase()}.` });
  } catch (err) {
    console.error('updateMentorshipStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update mentorship request.' });
  }
};

module.exports = { requestMentorship, getMentorshipRequests, updateMentorshipStatus };
