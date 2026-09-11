const { pool } = require('../config/db');
const blockchain = require('../services/blockchainService');
const { hashBatch } = require('../utils/hashData');

// Generate unique batch ID: HC-TN-2026-000001
async function generateBatchId() {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM honey_batches WHERE batch_id LIKE $1`,
    [`HC-TN-${year}-%`]
  );
  const seq = parseInt(result.rows[0].count) + 1;
  return `HC-TN-${year}-${String(seq).padStart(6, '0')}`;
}

// GET /api/batches/seller/mine
const getMyBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT hb.*, hp.name AS product_name, f.farm_name,
        lr.overall_status AS lab_status, lr.report_id
      FROM honey_batches hb
      LEFT JOIN honey_products hp ON hp.id = hb.product_id
      LEFT JOIN farms f ON f.id = hb.farm_id
      LEFT JOIN lab_reports lr ON lr.batch_id = hb.id
      WHERE hb.seller_id = $1
      ORDER BY hb.created_at DESC
    `, [req.user.id]);
    res.json({ batches: result.rows });
  } catch (err) {
    console.error('getMyBatches error:', err.message);
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
};

// POST /api/batches — SELLER only
const createBatch = async (req, res) => {
  try {
    const { product_id, farm_id, harvest_date, quantity, unit } = req.body;

    if (!quantity || !harvest_date) {
      return res.status(400).json({ error: 'Harvest date and quantity are required.' });
    }

    // Verify product belongs to seller
    if (product_id) {
      const check = await pool.query(
        'SELECT id FROM honey_products WHERE id = $1 AND seller_id = $2',
        [product_id, req.user.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Product not found or not yours.' });
      }
    }

    const batch_id = await generateBatchId();
    const qr_token = `HC-QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const result = await pool.query(`
      INSERT INTO honey_batches (batch_id, product_id, seller_id, farm_id, harvest_date, quantity, unit, qr_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [batch_id, product_id || null, req.user.id, farm_id || null,
        harvest_date, parseFloat(quantity), unit || 'kg', qr_token]);

    const newBatch = result.rows[0];

    // Log traceability event
    await pool.query(`
      INSERT INTO traceability_events (batch_id, event_type, event_description, performed_by, performed_by_name)
      VALUES ($1, 'HARVESTED', $2, $3, $4)
    `, [newBatch.id, `Batch created. ${quantity} ${unit || 'kg'} harvested.`, req.user.id, req.user.name]);

    // ── Blockchain proof (async, non-blocking for response) ──────────────────
    // Do NOT await here — respond to seller immediately, blockchain runs in background
    setImmediate(async () => {
      try {
        const { hash: dataHash, bytes32 } = hashBatch(newBatch);

        // Mark as submitting
        await pool.query(
          `UPDATE honey_batches SET blockchain_status = 'SUBMITTING', updated_at = NOW() WHERE id = $1`,
          [newBatch.id]
        );

        const txResult = await blockchain.submitBatchProof(batch_id, bytes32);

        // Success — store confirmed status and tx hash
        await pool.query(
          `UPDATE honey_batches
           SET blockchain_status = 'CONFIRMED',
               blockchain_data_hash = $1,
               blockchain_tx_hash = $2,
               blockchain_verified_at = NOW(),
               updated_at = NOW()
           WHERE id = $3`,
          [dataHash, txResult.txHash, newBatch.id]
        );
        console.log(`✅ Blockchain proof confirmed for batch ${batch_id}: ${txResult.txHash}`);
      } catch (bcErr) {
        // Blockchain failure does NOT affect the batch — mark FAILED for retry
        const status = bcErr.message === 'BLOCKCHAIN_UNAVAILABLE' ? 'PENDING' : 'FAILED';
        await pool.query(
          `UPDATE honey_batches SET blockchain_status = $1, updated_at = NOW() WHERE id = $2`,
          [status, newBatch.id]
        ).catch(() => {});
        console.warn(`⚠️  Blockchain proof failed for batch ${batch_id}:`, bcErr.message);
      }
    });
    // ─────────────────────────────────────────────────────────────────────────

    res.status(201).json({
      message: 'Batch created successfully.',
      batch: { ...newBatch, blockchain_status: 'PENDING' },
    });
  } catch (err) {
    console.error('createBatch error:', err.message);
    res.status(500).json({ error: 'Failed to create batch.' });
  }
};

// GET /api/batches/:id/traceability — public
const getBatchTraceability = async (req, res) => {
  try {
    const { id } = req.params;

    // Find by batch_id string OR numeric id
    const batchResult = await pool.query(`
      SELECT hb.*, hp.name AS product_name, hp.honey_type,
        u.name AS seller_name, sp.verification_status AS seller_verification,
        sp.district, sp.state, sp.village,
        f.farm_name, f.latitude AS farm_lat, f.longitude AS farm_lng,
        lr.overall_status AS lab_status, lr.laboratory_name, lr.report_id,
        lr.moisture_content, lr.reducing_sugars, lr.hmf, lr.diastase_activity,
        lr.blockchain_tx_hash AS lab_blockchain_tx_hash,
        lr.blockchain_status AS lab_blockchain_status
      FROM honey_batches hb
      LEFT JOIN honey_products hp ON hp.id = hb.product_id
      JOIN users u ON u.id = hb.seller_id
      LEFT JOIN seller_profiles sp ON sp.user_id = hb.seller_id
      LEFT JOIN farms f ON f.id = hb.farm_id
      LEFT JOIN lab_reports lr ON lr.batch_id = hb.id
      WHERE hb.batch_id = $1 OR hb.id = $2
    `, [id, isNaN(id) ? -1 : parseInt(id)]);

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found. Check the batch ID and try again.' });
    }

    const batch = batchResult.rows[0];

    // Get traceability timeline
    const events = await pool.query(`
      SELECT te.*, u.name AS actor_name, u.role AS actor_role
      FROM traceability_events te
      LEFT JOIN users u ON u.id = te.performed_by
      WHERE te.batch_id = $1
      ORDER BY te.event_timestamp ASC
    `, [batch.id]);

    res.json({ batch, events: events.rows });
  } catch (err) {
    console.error('getBatchTraceability error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traceability data.' });
  }
};

// PUT /api/batches/:id/status — SELLER or ADMIN
const updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_status, event_type, event_description } = req.body;

    const batch = await pool.query('SELECT * FROM honey_batches WHERE id = $1', [id]);
    if (batch.rows.length === 0) return res.status(404).json({ error: 'Batch not found.' });
    if (batch.rows[0].seller_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    await pool.query('UPDATE honey_batches SET batch_status = $1, updated_at = NOW() WHERE id = $2', [batch_status, id]);

    if (event_type) {
      await pool.query(`
        INSERT INTO traceability_events (batch_id, event_type, event_description, performed_by, performed_by_name)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, event_type, event_description || '', req.user.id, req.user.name]);
    }

    res.json({ message: 'Batch status updated.' });
  } catch (err) {
    console.error('updateBatchStatus error:', err.message);
    res.status(500).json({ error: 'Failed to update batch.' });
  }
};

module.exports = { getMyBatches, createBatch, getBatchTraceability, updateBatchStatus };
