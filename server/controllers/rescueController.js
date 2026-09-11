const { pool } = require('../config/db');

function generateRequestNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  return `HC-RES-${ts}`;
}

// POST /api/rescue — authenticated users only
const submitRescue = async (req, res) => {
  try {
    const {
      description,
      approximate_size,
      location_description,
      reporter_name,
      reporter_phone,
      latitude,
      longitude,
      location_accuracy,
      photo_captured_at,
    } = req.body;

    if (!description || !location_description) {
      return res.status(400).json({ error: 'Description and location description are required.' });
    }

    // photo_url from multer upload (if provided)
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    const request_number = generateRequestNumber();
    const result = await pool.query(`
      INSERT INTO bee_rescue_requests
        (request_number, reported_by, reporter_name, reporter_phone,
         description, approximate_size, location_description, photo_url,
         latitude, longitude, location_accuracy, photo_captured_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      request_number,
      req.user ? req.user.id : null,
      reporter_name || (req.user ? req.user.name : null),
      reporter_phone || null,
      description,
      approximate_size || null,
      location_description,
      photo_url,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      location_accuracy ? parseFloat(location_accuracy) : null,
      photo_captured_at || null,
    ]);

    res.status(201).json({
      message: 'Rescue request submitted! We will contact you soon.',
      request: result.rows[0],
    });
  } catch (err) {
    console.error('submitRescue error:', err.message);
    res.status(500).json({ error: 'Failed to submit rescue request.' });
  }
};

// GET /api/rescue — collectors see all open requests, users see their own
const getRescueRequests = async (req, res) => {
  try {
    let query, params;

    if (req.user && (req.user.role === 'COLLECTOR' || req.user.role === 'ADMIN')) {
      // Collectors/admin see all active requests
      // Exact coordinates only revealed once a collector is assigned
      query = `
        SELECT id, request_number, reporter_name, reporter_phone,
          description, approximate_size, location_description,
          status, assigned_collector, created_at, updated_at,
          photo_url,
          CASE WHEN status IN ('COLLECTOR_ASSIGNED','SCHEDULED','COLLECTED','COMPLETED')
            THEN latitude ELSE NULL END AS latitude,
          CASE WHEN status IN ('COLLECTOR_ASSIGNED','SCHEDULED','COLLECTED','COMPLETED')
            THEN longitude ELSE NULL END AS longitude,
          location_accuracy
        FROM bee_rescue_requests
        WHERE status NOT IN ('COMPLETED', 'CANCELLED')
        ORDER BY created_at DESC
      `;
      params = [];
    } else if (req.user) {
      // Regular users see only their own requests
      query = `
        SELECT id, request_number, reporter_name, description,
          approximate_size, location_description, photo_url,
          status, created_at, updated_at,
          latitude, longitude, location_accuracy
        FROM bee_rescue_requests
        WHERE reported_by = $1
        ORDER BY created_at DESC
      `;
      params = [req.user.id];
    } else {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('getRescueRequests error:', err.message);
    res.status(500).json({ error: 'Failed to fetch rescue requests.' });
  }
};

// POST /api/rescue/:id/accept — COLLECTOR only
const acceptRescue = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query('SELECT * FROM bee_rescue_requests WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Request not found.' });
    if (existing.rows[0].status !== 'REPORTED') {
      return res.status(409).json({ error: 'This request is no longer available.' });
    }

    const result = await pool.query(`
      UPDATE bee_rescue_requests
      SET status = 'COLLECTOR_ASSIGNED', assigned_collector = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `, [req.user.id, id]);

    res.json({ message: 'Rescue request accepted!', request: result.rows[0] });
  } catch (err) {
    console.error('acceptRescue error:', err.message);
    res.status(500).json({ error: 'Failed to accept request.' });
  }
};

// PUT /api/rescue/:id/status — COLLECTOR or ADMIN
const updateRescueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, collector_notes, honey_quantity_kg } = req.body;

    const allowedStatuses = ['SCHEDULED', 'COLLECTED', 'COMPLETED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const existing = await pool.query('SELECT * FROM bee_rescue_requests WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
    if (existing.rows[0].assigned_collector !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this request.' });
    }

    await pool.query(`
      UPDATE bee_rescue_requests
      SET status = $1,
          collector_notes = COALESCE($2, collector_notes),
          honey_quantity_kg = COALESCE($3, honey_quantity_kg),
          updated_at = NOW()
      WHERE id = $4
    `, [status, collector_notes || null, honey_quantity_kg ? parseFloat(honey_quantity_kg) : null, id]);

    res.json({ message: 'Status updated.' });
  } catch (err) {
    console.error('updateRescueStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

module.exports = { submitRescue, getRescueRequests, acceptRescue, updateRescueStatus };
