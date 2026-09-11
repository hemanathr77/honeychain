const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrderById,
  getSellerOrders, updateOrderStatus, getAllOrders
} = require('../controllers/orderController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

// CUSTOMER routes
router.post('/', authenticateUser, authorizeRole('CUSTOMER'), createOrder);
router.get('/mine', authenticateUser, authorizeRole('CUSTOMER'), getMyOrders);

// SELLER routes
router.get('/seller/mine', authenticateUser, authorizeRole('SELLER'), getSellerOrders);

// ADMIN — all orders
router.get('/admin/all', authenticateUser, authorizeRole('ADMIN'), getAllOrders);

// Status update — SELLER, COLLECTOR, ADMIN
router.put('/:id/status', authenticateUser, authorizeRole('SELLER', 'COLLECTOR', 'ADMIN'), updateOrderStatus);

// Single order — CUSTOMER (own), SELLER (own products), ADMIN (any)
router.get('/:id', authenticateUser, authorizeRole('CUSTOMER', 'SELLER', 'ADMIN'), getOrderById);

module.exports = router;
