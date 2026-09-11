const express = require('express');
const router = express.Router();
const { submitRescue, getRescueRequests, acceptRescue, updateRescueStatus } = require('../controllers/rescueController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/rescue — authenticated user, supports multipart/form-data photo upload
router.post('/', authenticateUser, upload.single('photo'), submitRescue);

// GET /api/rescue
router.get('/', authenticateUser, getRescueRequests);

// POST /api/rescue/:id/accept — COLLECTOR or ADMIN
router.post('/:id/accept', authenticateUser, authorizeRole('COLLECTOR', 'ADMIN'), acceptRescue);

// PUT /api/rescue/:id/status — COLLECTOR or ADMIN
router.put('/:id/status', authenticateUser, authorizeRole('COLLECTOR', 'ADMIN'), updateRescueStatus);

module.exports = router;
