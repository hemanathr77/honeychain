const express = require('express');
const router = express.Router();
const { getMyBatches, createBatch, getBatchTraceability, updateBatchStatus } = require('../controllers/batchController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.get('/seller/mine', authenticateUser, authorizeRole('SELLER'), getMyBatches);
router.post('/', authenticateUser, authorizeRole('SELLER'), createBatch);
router.get('/:id/traceability', getBatchTraceability);                 // public
router.put('/:id/status', authenticateUser, authorizeRole('SELLER', 'ADMIN'), updateBatchStatus);

module.exports = router;
