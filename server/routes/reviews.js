const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRole } = require('../middleware/auth');
const { submitReview, getProductReviews } = require('../controllers/reviewController');

// Only customers can submit reviews
router.post('/', authenticateUser, authorizeRole('CUSTOMER'), submitReview);

// Public: get reviews for a product
router.get('/product/:id', getProductReviews);

module.exports = router;
