'use strict';
const express = require('express');
const router  = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
  getProof,
  getEvents,
  verifyBatch,
  retryProof,
  getStatus,
} = require('../controllers/blockchainController');

// ─── Public routes (no auth required — customers can verify without a wallet) ─
router.get('/batches/:batchId',         getProof);
router.get('/batches/:batchId/events',  getEvents);
router.get('/batches/:batchId/verify',  verifyBatch);

// ─── Protected routes ─────────────────────────────────────────────────────────
// SELLER or ADMIN can retry a failed blockchain submission
router.post(
  '/batches/:batchId/retry',
  authenticateUser,
  authorizeRole('SELLER', 'ADMIN'),
  retryProof
);

// ADMIN only — blockchain health + stats
router.get(
  '/status',
  authenticateUser,
  authorizeRole('ADMIN'),
  getStatus
);

module.exports = router;
