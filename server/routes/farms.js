const express = require('express');
const router = express.Router();
const { getMyFarms, createFarm, getFarmColonies, addColony } = require('../controllers/farmController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateUser, authorizeRole('SELLER'), getMyFarms);
router.post('/', authenticateUser, authorizeRole('SELLER'), createFarm);
router.get('/:id/colonies', authenticateUser, authorizeRole('SELLER'), getFarmColonies);
router.post('/:id/colonies', authenticateUser, authorizeRole('SELLER'), addColony);

module.exports = router;
