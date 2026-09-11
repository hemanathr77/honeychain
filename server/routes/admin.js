const express = require('express');
const router = express.Router();
const {
  getDashboard, getPendingSellers, verifySeller,
  suspendUser, getAllUsers, getFraudFlags,
  getPendingExperts, verifyExpert
} = require('../controllers/adminController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

const adminOnly = [authenticateUser, authorizeRole('ADMIN')];

router.get('/dashboard', ...adminOnly, getDashboard);
router.get('/users', ...adminOnly, getAllUsers);
router.put('/users/:id/suspend', ...adminOnly, suspendUser);
router.get('/verifications/sellers', ...adminOnly, getPendingSellers);
router.put('/verifications/sellers/:id', ...adminOnly, verifySeller);
router.get('/verifications/experts', ...adminOnly, getPendingExperts);
router.put('/verifications/experts/:id', ...adminOnly, verifyExpert);
router.get('/fraud-flags', ...adminOnly, getFraudFlags);

module.exports = router;
