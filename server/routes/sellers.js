const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const {
  getSellers, getSellerById, getMyProfile, updateProfile, getDashboardStats
} = require('../controllers/sellerController');

// Public routes
router.get('/', getSellers);

// Specific routes BEFORE :id to avoid conflict
router.get('/profile/me', authenticateUser, authorizeRole('SELLER'), getMyProfile);
router.put('/profile', authenticateUser, authorizeRole('SELLER'), updateProfile);
router.get('/dashboard/stats', authenticateUser, authorizeRole('SELLER'), getDashboardStats);

// Param routes last
router.get('/:id', getSellerById);

module.exports = router;
