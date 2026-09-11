/**
 * Generates unique batch IDs in the format: HC-TN-YYYY-NNNNNN
 * e.g. HC-TN-2026-000001
 *
 * The numeric suffix is derived from the current count of batches for that year,
 * making it incrementally unique as long as inserts are serialized.
 */

const { pool } = require('../config/db');

async function generateBatchId() {
  const year = new Date().getFullYear();
  const prefix = `HC-TN-${year}-`;

  // Count existing batches for this year pattern to determine next sequence
  const result = await pool.query(
    `SELECT COUNT(*) FROM honey_batches WHERE batch_id LIKE $1`,
    [`${prefix}%`]
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `${prefix}${String(seq).padStart(6, '0')}`;
}

module.exports = { generateBatchId };
