const { pool } = require('../config/db');

// Generate unique report ID
function generateReportId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `HC-LAB-${year}-${rand}`;
}

// POST /api/lab-reports — SELLER submits a lab report for their batch
const createLabReport = async (req, res) => {
  try {
    const {
      batch_id,
      sample_id,
      laboratory_name,
      accreditation_no,
      test_date,
      report_date,
      moisture_content,
      reducing_sugars,
      sucrose_content,
      hmf,
      diastase_activity,
      c4_sugar_result,
      other_parameters,
      overall_status,
      report_file,
    } = req.body;

    if (!batch_id || !laboratory_name) {
      return res.status(400).json({ error: 'Batch ID and laboratory name are required.' });
    }

    // Verify the batch belongs to the seller (or admin can do anything)
    const batchCheck = await pool.query(
      'SELECT id, seller_id FROM honey_batches WHERE id = $1',
      [batch_id]
    );
    if (batchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found.' });
    }
    if (
      req.user.role !== 'ADMIN' &&
      batchCheck.rows[0].seller_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'You can only submit lab reports for your own batches.' });
    }

    const report_id = generateReportId();

    const result = await pool.query(
      `INSERT INTO lab_reports (
        report_id, batch_id, sample_id, laboratory_name, accreditation_no,
        test_date, report_date, moisture_content, reducing_sugars, sucrose_content,
        hmf, diastase_activity, c4_sugar_result, other_parameters,
        overall_status, report_file, verification_status, is_demo_data
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'PENDING',FALSE)
      RETURNING *`,
      [
        report_id,
        parseInt(batch_id),
        sample_id || null,
        laboratory_name,
        accreditation_no || null,
        test_date || null,
        report_date || null,
        moisture_content ? parseFloat(moisture_content) : null,
        reducing_sugars ? parseFloat(reducing_sugars) : null,
        sucrose_content ? parseFloat(sucrose_content) : null,
        hmf ? parseFloat(hmf) : null,
        diastase_activity ? parseFloat(diastase_activity) : null,
        c4_sugar_result || null,
        other_parameters ? JSON.stringify(other_parameters) : null,
        overall_status || 'PENDING',
        report_file || null,
      ]
    );

    // Update batch laboratory_status
    await pool.query(
      `UPDATE honey_batches SET laboratory_status = $1, updated_at = NOW() WHERE id = $2`,
      ['SUBMITTED', parseInt(batch_id)]
    );

    // Log traceability event
    await pool.query(
      `INSERT INTO traceability_events (batch_id, event_type, event_description, performed_by, performed_by_name)
       VALUES ($1, 'LAB_SUBMITTED', $2, $3, $4)`,
      [
        parseInt(batch_id),
        `Laboratory report submitted. Lab: ${laboratory_name}. Report: ${report_id}`,
        req.user.id,
        req.user.name,
      ]
    );

    res.status(201).json({
      message: 'Lab report submitted successfully.',
      report: result.rows[0],
    });
  } catch (err) {
    console.error('createLabReport error:', err.message);
    res.status(500).json({ error: 'Failed to submit lab report.' });
  }
};

// GET /api/lab-reports — seller gets their own lab reports
const getMyLabReports = async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'ADMIN') {
      query = `
        SELECT lr.*, hb.batch_id AS batch_code, u.name AS seller_name
        FROM lab_reports lr
        JOIN honey_batches hb ON hb.id = lr.batch_id
        JOIN users u ON u.id = hb.seller_id
        ORDER BY lr.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT lr.*, hb.batch_id AS batch_code
        FROM lab_reports lr
        JOIN honey_batches hb ON hb.id = lr.batch_id
        WHERE hb.seller_id = $1
        ORDER BY lr.created_at DESC
      `;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json({ reports: result.rows });
  } catch (err) {
    console.error('getMyLabReports error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lab reports.' });
  }
};

// GET /api/lab-reports/:id
const getLabReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT lr.*, hb.batch_id AS batch_code, hb.seller_id,
         u.name AS seller_name
       FROM lab_reports lr
       JOIN honey_batches hb ON hb.id = lr.batch_id
       JOIN users u ON u.id = hb.seller_id
       WHERE lr.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab report not found.' });
    }
    // Non-admin sellers can only see their own
    if (
      req.user.role !== 'ADMIN' &&
      result.rows[0].seller_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error('getLabReportById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lab report.' });
  }
};

// PUT /api/lab-reports/:id/verify — ADMIN only
const verifyLabReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status, overall_status, admin_notes } = req.body;

    const allowed = ['PENDING', 'VERIFIED', 'REJECTED'];
    if (!allowed.includes(verification_status)) {
      return res.status(400).json({ error: 'Invalid verification_status.' });
    }

    const existing = await pool.query('SELECT * FROM lab_reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    await pool.query(
      `UPDATE lab_reports SET
         verification_status = $1,
         overall_status = COALESCE($2, overall_status)
       WHERE id = $3`,
      [verification_status, overall_status || null, id]
    );

    // Update batch lab status if verified/rejected
    if (verification_status === 'VERIFIED') {
      const reportStatus = overall_status || existing.rows[0].overall_status;
      const batchLabStatus = reportStatus === 'COMPLIANT' ? 'COMPLIANT' : 'NON_COMPLIANT';
      await pool.query(
        'UPDATE honey_batches SET laboratory_status = $1, updated_at = NOW() WHERE id = $2',
        [batchLabStatus, existing.rows[0].batch_id]
      );
      // Log traceability event
      await pool.query(
        `INSERT INTO traceability_events (batch_id, event_type, event_description, performed_by, performed_by_name)
         VALUES ($1, 'LAB_TESTED', $2, $3, $4)`,
        [
          existing.rows[0].batch_id,
          `Lab report verified by admin. Status: ${batchLabStatus}`,
          req.user.id,
          req.user.name,
        ]
      );
    }

    res.json({ message: 'Lab report verification updated.' });
  } catch (err) {
    console.error('verifyLabReport error:', err.message);
    res.status(500).json({ error: 'Failed to verify lab report.' });
  }
};

// GET /api/lab-reports/batch/:batchId — PUBLIC, no auth required
// Looks up a lab report by the batch string ID (e.g. HC-TN-2026-000001)
const getLabReportByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await pool.query(
      `SELECT lr.id, lr.report_id, lr.sample_id, lr.laboratory_name, lr.accreditation_no,
         lr.test_date, lr.report_date, lr.moisture_content, lr.reducing_sugars,
         lr.sucrose_content, lr.hmf, lr.diastase_activity, lr.c4_sugar_result,
         lr.other_parameters, lr.overall_status, lr.verification_status,
         lr.created_at, hb.batch_id AS batch_code, u.name AS seller_name
       FROM lab_reports lr
       JOIN honey_batches hb ON hb.id = lr.batch_id
       JOIN users u ON u.id = hb.seller_id
       WHERE LOWER(hb.batch_id) = LOWER($1)
         AND lr.verification_status = 'VERIFIED'
       ORDER BY lr.created_at DESC
       LIMIT 1`,
      [batchId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No verified lab report found for this batch ID.',
      });
    }
    res.json({ report: result.rows[0] });
  } catch (err) {
    console.error('getLabReportByBatchId error:', err.message);
    res.status(500).json({ error: 'Failed to fetch lab report.' });
  }
};

module.exports = { createLabReport, getMyLabReports, getLabReportById, getLabReportByBatchId, verifyLabReport };
