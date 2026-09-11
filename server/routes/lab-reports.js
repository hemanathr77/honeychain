const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
  createLabReport,
  getMyLabReports,
  getLabReportById,
  getLabReportByBatchId,
  verifyLabReport,
} = require('../controllers/labReportController');

// GET — seller's own reports (or all if ADMIN)
router.get('/', authenticateUser, authorizeRole('SELLER', 'ADMIN'), getMyLabReports);

// POST — seller submits a lab report
router.post('/', authenticateUser, authorizeRole('SELLER', 'ADMIN'), createLabReport);

// GET by batch string ID — public, no auth (for LabVerification public search)
router.get('/batch/:batchId', getLabReportByBatchId);

// GET by internal numeric id — authenticated seller/admin only
router.get('/:id', authenticateUser, authorizeRole('SELLER', 'ADMIN'), getLabReportById);

// PUT — admin verifies
router.put('/:id/verify', authenticateUser, authorizeRole('ADMIN'), verifyLabReport);

module.exports = router;
