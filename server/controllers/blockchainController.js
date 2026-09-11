'use strict';
const { pool } = require('../config/db');
const blockchain = require('../services/blockchainService');
const { hashBatch } = require('../utils/hashData');

// ─── GET /api/blockchain/batches/:batchId ─────────────────────────────────────
const getProof = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get PostgreSQL record
    const pgResult = await pool.query(
      `SELECT hb.batch_id, hb.blockchain_status, hb.blockchain_data_hash,
              hb.blockchain_tx_hash, hb.blockchain_verified_at,
              hb.created_at
       FROM honey_batches hb
       WHERE hb.batch_id = $1`,
      [batchId]
    );

    if (pgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const pgData = pgResult.rows[0];

    // Get blockchain proof (if available)
    const chainProof = await blockchain.getBatchProof(batchId);

    res.json({
      batchId,
      postgresql: {
        blockchainStatus:    pgData.blockchain_status || 'PENDING',
        blockchainDataHash:  pgData.blockchain_data_hash || null,
        blockchainTxHash:    pgData.blockchain_tx_hash || null,
        blockchainVerifiedAt: pgData.blockchain_verified_at || null,
      },
      blockchain: chainProof || null,
      blockchainAvailable: chainProof !== null,
    });
  } catch (err) {
    console.error('getProof error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve blockchain proof.' });
  }
};

// ─── GET /api/blockchain/batches/:batchId/events ──────────────────────────────
const getEvents = async (req, res) => {
  try {
    const { batchId } = req.params;
    const events = await blockchain.getBatchEvents(batchId);
    res.json({
      batchId,
      events,
      count: events.length,
      blockchainAvailable: true,
    });
  } catch (err) {
    console.error('getEvents error:', err.message);
    res.json({ batchId: req.params.batchId, events: [], count: 0, blockchainAvailable: false });
  }
};

// ─── GET /api/blockchain/batches/:batchId/verify ──────────────────────────────
const verifyBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Get full batch from PostgreSQL to recompute canonical hash
    const pgResult = await pool.query(
      `SELECT hb.*
       FROM honey_batches hb
       WHERE hb.batch_id = $1`,
      [batchId]
    );

    if (pgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const batch = pgResult.rows[0];

    // Recompute current hash from PostgreSQL data
    const { hash: currentHash, bytes32: currentBytes32, canonical } = hashBatch(batch);

    // Compare against blockchain
    const verificationResult = await blockchain.verifyBatchHash(batchId, currentBytes32);

    // Get stored proof details
    const chainProof = await blockchain.getBatchProof(batchId);

    res.json({
      batchId,
      verification: verificationResult,
      // verification is one of:
      //   VERIFIED              — hashes match, data intact
      //   INTEGRITY_MISMATCH    — hashes differ, possible tampering
      //   NO_PROOF              — batch not yet anchored on chain
      //   BLOCKCHAIN_UNAVAILABLE — cannot reach blockchain
      currentHash,
      currentBytes32,
      storedHash: chainProof?.dataHash || null,
      canonical, // for debugging/transparency
      blockchainAvailable: verificationResult !== 'BLOCKCHAIN_UNAVAILABLE',
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('verifyBatch error:', err.message);
    res.status(500).json({ error: 'Verification failed.' });
  }
};

// ─── POST /api/blockchain/batches/:batchId/retry ─────────────────────────────
// SELLER or ADMIN — retry a failed blockchain submission
const retryProof = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Fetch batch from PG
    const pgResult = await pool.query(
      `SELECT hb.* FROM honey_batches hb WHERE hb.batch_id = $1`,
      [batchId]
    );

    if (pgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found.' });
    }

    const batch = pgResult.rows[0];

    // Only sellers can retry their own batches; admins can retry any
    if (req.user.role !== 'ADMIN' && batch.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to retry this batch.' });
    }

    // Don't retry if already confirmed
    if (batch.blockchain_status === 'CONFIRMED') {
      return res.status(400).json({
        error: 'Batch is already blockchain-confirmed. No retry needed.',
        txHash: batch.blockchain_tx_hash,
      });
    }

    // Recompute hash and submit
    const { bytes32 } = hashBatch(batch);

    // Mark as SUBMITTING
    await pool.query(
      `UPDATE honey_batches SET blockchain_status = 'SUBMITTING', updated_at = NOW() WHERE batch_id = $1`,
      [batchId]
    );

    let txResult;
    try {
      txResult = await blockchain.submitBatchProof(batchId, bytes32);
    } catch (bcErr) {
      if (bcErr.message === 'BATCH_PROOF_ALREADY_EXISTS') {
        // Already on chain — just mark confirmed in PG
        await pool.query(
          `UPDATE honey_batches
           SET blockchain_status = 'CONFIRMED', updated_at = NOW()
           WHERE batch_id = $1`,
          [batchId]
        );
        return res.json({ message: 'Proof already exists on blockchain. Marked as confirmed.' });
      }
      await pool.query(
        `UPDATE honey_batches SET blockchain_status = 'FAILED', updated_at = NOW() WHERE batch_id = $1`,
        [batchId]
      );
      return res.status(502).json({ error: 'Blockchain submission failed.', detail: bcErr.message });
    }

    // Success
    const { hash: dataHash } = hashBatch(batch);
    await pool.query(
      `UPDATE honey_batches
       SET blockchain_status = 'CONFIRMED',
           blockchain_data_hash = $1,
           blockchain_tx_hash = $2,
           blockchain_verified_at = NOW(),
           updated_at = NOW()
       WHERE batch_id = $3`,
      [dataHash, txResult.txHash, batchId]
    );

    res.json({
      message: 'Blockchain proof submitted and confirmed.',
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
    });
  } catch (err) {
    console.error('retryProof error:', err.message);
    res.status(500).json({ error: 'Retry failed.' });
  }
};

// ─── GET /api/blockchain/status ──────────────────────────────────────────────
// Admin — blockchain connection + stats
const getStatus = async (req, res) => {
  try {
    const available = await blockchain.isAvailable();
    const walletAddress = await blockchain.getBackendWalletAddress();

    // Stats from PostgreSQL
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE blockchain_status = 'CONFIRMED') AS confirmed,
        COUNT(*) FILTER (WHERE blockchain_status = 'PENDING' OR blockchain_status IS NULL) AS pending,
        COUNT(*) FILTER (WHERE blockchain_status = 'FAILED') AS failed,
        COUNT(*) AS total
      FROM honey_batches
    `);

    res.json({
      blockchainAvailable: available,
      contractAddress: process.env.HONEYCHAIN_CONTRACT_ADDRESS || null,
      backendWallet: walletAddress || null,
      network: {
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL
          ? process.env.BLOCKCHAIN_RPC_URL.replace(/:[^:@]+@/, ':***@') // mask credentials
          : null,
        chainId: process.env.BLOCKCHAIN_CHAIN_ID || null,
      },
      stats: stats.rows[0],
    });
  } catch (err) {
    console.error('getStatus error:', err.message);
    res.status(500).json({ error: 'Failed to get blockchain status.' });
  }
};

module.exports = { getProof, getEvents, verifyBatch, retryProof, getStatus };
