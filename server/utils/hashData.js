'use strict';
/**
 * hashData.js — Canonical SHA-256 hashing for HoneyChain blockchain proofs.
 *
 * IMPORTANT: The canonical representation must be:
 *   1. Deterministic — same data always produces the same hash
 *   2. Field-ordered — NOT JSON.stringify (which can be ordered arbitrarily)
 *   3. Stable — only stable, protected fields are included
 *   4. Documented — so verification can be reproduced independently
 *
 * Fields that are intentionally EXCLUDED from hashes:
 *   - created_at / updated_at (change on every save)
 *   - blockchain_status / blockchain_tx_hash (would create circular dependency)
 *   - qr_token (random, not business-critical)
 *   - UI/display fields
 */

const crypto = require('crypto');

// ─── Core hash function ────────────────────────────────────────────────────

/**
 * Compute SHA-256 of a string.
 * Returns the hex digest (64 chars).
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Convert a hex SHA-256 string to a bytes32 hex string (prefixed with 0x)
 * for use in the smart contract (bytes32 type).
 */
function hexToBytes32(hexString) {
  // Remove 0x prefix if present, pad to 64 hex chars, re-add 0x
  const clean = hexString.replace(/^0x/, '');
  if (clean.length !== 64) {
    throw new Error(`Invalid SHA-256 hex length: ${clean.length} (expected 64)`);
  }
  return '0x' + clean;
}

/**
 * Normalize a value for canonical representation.
 * null/undefined → "NULL"
 * numbers → string representation (no trailing zeros)
 * dates → ISO date string (YYYY-MM-DD)
 * strings → trimmed
 */
function normalize(val) {
  if (val === null || val === undefined) return 'NULL';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  // Normalize numeric strings to remove trailing zeros (e.g. "10.00" → "10")
  if (/^\d+\.\d+$/.test(str)) {
    return parseFloat(str).toString();
  }
  return str;
}

// ─── Batch hash ────────────────────────────────────────────────────────────

/**
 * Generate a canonical SHA-256 hash for a honey batch.
 *
 * Canonical format (pipe-delimited, field-ordered):
 *   HONEYCHAIN_BATCH|{batch_id}|{product_id}|{seller_id}|{farm_id}|
 *   {harvest_date}|{quantity}|{unit}
 *
 * Protected fields:
 *   - batch_id     : unique identifier
 *   - product_id   : which product this batch belongs to
 *   - seller_id    : who created it
 *   - farm_id      : origin farm
 *   - harvest_date : when honey was harvested
 *   - quantity     : amount in kg
 *   - unit         : unit of measurement
 *
 * @param {Object} batch — row from honey_batches table
 * @returns {{ canonical: string, hash: string, bytes32: string }}
 */
function hashBatch(batch) {
  const canonical = [
    'HONEYCHAIN_BATCH',
    normalize(batch.batch_id),
    normalize(batch.product_id),
    normalize(batch.seller_id),
    normalize(batch.farm_id),
    normalize(batch.harvest_date),
    normalize(batch.quantity),
    normalize(batch.unit || 'kg'),
  ].join('|');

  const hash = sha256(canonical);
  return {
    canonical,
    hash,
    bytes32: hexToBytes32(hash),
  };
}

// ─── Lab report hash ────────────────────────────────────────────────────────

/**
 * Generate a canonical SHA-256 hash for a lab report.
 *
 * Canonical format:
 *   HONEYCHAIN_LAB|{report_id}|{batch_id}|{laboratory_name}|
 *   {accreditation_no}|{test_date}|{moisture_content}|{reducing_sugars}|
 *   {sucrose_content}|{hmf}|{diastase_activity}|{overall_status}
 *
 * @param {Object} report — row from lab_reports table
 * @returns {{ canonical: string, hash: string, bytes32: string }}
 */
function hashLabReport(report) {
  const canonical = [
    'HONEYCHAIN_LAB',
    normalize(report.report_id),
    normalize(report.batch_id),
    normalize(report.laboratory_name),
    normalize(report.accreditation_no),
    normalize(report.test_date),
    normalize(report.moisture_content),
    normalize(report.reducing_sugars),
    normalize(report.sucrose_content),
    normalize(report.hmf),
    normalize(report.diastase_activity),
    normalize(report.overall_status),
  ].join('|');

  const hash = sha256(canonical);
  return {
    canonical,
    hash,
    bytes32: hexToBytes32(hash),
  };
}

// ─── Traceability event hash ───────────────────────────────────────────────

/**
 * Generate a canonical SHA-256 hash for a traceability event.
 *
 * Canonical format:
 *   HONEYCHAIN_EVENT|{batch_id}|{event_type}|{event_description}|
 *   {performed_by}|{event_timestamp}
 *
 * NOTE: event_timestamp must be the ISO string from the DB, not Date.now().
 *
 * @param {Object} event — row from traceability_events table
 * @returns {{ canonical: string, hash: string, bytes32: string }}
 */
function hashTraceabilityEvent(event) {
  // Normalize timestamp to ISO string without milliseconds
  let ts = normalize(event.event_timestamp);
  if (event.event_timestamp instanceof Date) {
    ts = event.event_timestamp.toISOString();
  }

  const canonical = [
    'HONEYCHAIN_EVENT',
    normalize(event.batch_id),
    normalize(event.event_type),
    normalize(event.event_description),
    normalize(event.performed_by),
    ts,
  ].join('|');

  const hash = sha256(canonical);
  return {
    canonical,
    hash,
    bytes32: hexToBytes32(hash),
  };
}

module.exports = {
  sha256,
  hexToBytes32,
  normalize,
  hashBatch,
  hashLabReport,
  hashTraceabilityEvent,
};
