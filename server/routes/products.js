const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, getMyProducts } = require('../controllers/productController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.get('/', getProducts);                                          // public
router.get('/seller/mine', authenticateUser, authorizeRole('SELLER'), getMyProducts);
router.get('/:id', getProductById);                                    // public
router.post('/', authenticateUser, authorizeRole('SELLER'), createProduct);
router.put('/:id', authenticateUser, authorizeRole('SELLER', 'ADMIN'), updateProduct);

module.exports = router;
