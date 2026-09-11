const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
  getExperts, getExpertById, getMyProfile, updateProfile, getDashboardStats
} = require('../controllers/expertController');

// Public routes
router.get('/', getExperts);

// Specific routes BEFORE :id
router.get('/profile/me', authenticateUser, authorizeRole('EXPERT'), getMyProfile);
router.put('/profile', authenticateUser, authorizeRole('EXPERT'), updateProfile);
router.get('/dashboard/stats', authenticateUser, authorizeRole('EXPERT'), getDashboardStats);

// Param routes last
router.get('/:id', getExpertById);

module.exports = router;
