const express = require('express');
const router = express.Router();
const { submitRescue, getRescueRequests, acceptRescue, updateRescueStatus, completeCollection } = require('../controllers/rescueController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { processUpload } = require('../middleware/upload');

// POST /api/rescue — authenticated user, supports multipart/form-data photo upload
router.post('/', authenticateUser, upload.single('photo'), processUpload('honeychain/rescue'), submitRescue);

// GET /api/rescue
router.get('/', authenticateUser, getRescueRequests);

// POST /api/rescue/:id/accept — COLLECTOR or SELLER or ADMIN
router.post('/:id/accept', authenticateUser, authorizeRole('COLLECTOR', 'SELLER', 'ADMIN'), acceptRescue);

// PUT /api/rescue/:id/status — COLLECTOR, SELLER, or ADMIN
router.put('/:id/status', authenticateUser, authorizeRole('COLLECTOR', 'SELLER', 'ADMIN'), updateRescueStatus);

// PUT /api/rescue/:id/collect — Assigned SELLER/COLLECTOR completes collection with photo
router.put('/:id/collect', authenticateUser, authorizeRole('COLLECTOR', 'SELLER', 'ADMIN'),
  upload.single('collection_photo'), processUpload('honeychain/collection'), completeCollection);

module.exports = router;
