const express = require('express');
const router = express.Router();
const {
  getDashboard, getPendingSellers, verifySeller,
  suspendUser, getAllUsers, getFraudFlags,
  getPendingExperts, verifyExpert,
  getAllRescueRequests, getNearbyAssignees, assignRescue, getAllBatches,
} = require('../controllers/adminController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const adminOnly = [authenticateUser, authorizeRole('ADMIN')];

// Dashboard
router.get('/dashboard', ...adminOnly, getDashboard);

// Users
router.get('/users', ...adminOnly, getAllUsers);
router.put('/users/:id/suspend', ...adminOnly, suspendUser);

// Seller/Expert verifications
router.get('/verifications/sellers', ...adminOnly, getPendingSellers);
router.put('/verifications/sellers/:id', ...adminOnly, verifySeller);
router.get('/verifications/experts', ...adminOnly, getPendingExperts);
router.put('/verifications/experts/:id', ...adminOnly, verifyExpert);

// Fraud flags
router.get('/fraud-flags', ...adminOnly, getFraudFlags);

// Rescue management
router.get('/rescue', ...adminOnly, getAllRescueRequests);
router.get('/rescue/:id/nearby', ...adminOnly, getNearbyAssignees);
router.post('/rescue/:id/assign', ...adminOnly, assignRescue);

// Batches
router.get('/batches', ...adminOnly, getAllBatches);

module.exports = router;
