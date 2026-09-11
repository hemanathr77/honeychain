const { pool } = require('../config/db');

// POST /api/reviews — CUSTOMER only, must have completed order for this product
const submitReview = async (req, res) => {
  try {
    const { product_id, order_id, rating, review_text } = req.body;

    if (!product_id || !order_id || !rating) {
      return res.status(400).json({ error: 'Product, order, and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify this customer has a delivered order containing this product
    const orderCheck = await pool.query(`
      SELECT o.id, hp.seller_id
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN honey_products hp ON hp.id = oi.product_id
      WHERE o.id = $1
        AND o.customer_id = $2
        AND oi.product_id = $3
        AND o.order_status = 'DELIVERED'
    `, [order_id, req.user.id, product_id]);

    if (orderCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'You can only review products from your delivered orders.'
      });
    }

    const seller_id = orderCheck.rows[0].seller_id;

    // Check for duplicate
    const existing = await pool.query(
      'SELECT id FROM reviews WHERE customer_id = $1 AND order_id = $2 AND product_id = $3',
      [req.user.id, order_id, product_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this product for this order.' });
    }

    const result = await pool.query(`
      INSERT INTO reviews (customer_id, product_id, order_id, seller_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, product_id, order_id, seller_id, parseInt(rating), review_text || null]);

    res.status(201).json({ message: 'Review submitted successfully.', review: result.rows[0] });
  } catch (err) {
    console.error('submitReview error:', err.message);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
};

// GET /api/reviews/product/:id — public, reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.id, r.rating, r.review_text, r.created_at,
        u.name AS reviewer_name
      FROM reviews r
      JOIN users u ON u.id = r.customer_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
    `, [id]);

    const stats = await pool.query(`
      SELECT COALESCE(AVG(rating), 0) AS avg_rating, COUNT(*) AS total_reviews
      FROM reviews WHERE product_id = $1
    `, [id]);

    res.json({
      reviews: result.rows,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error('getProductReviews error:', err.message);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

module.exports = { submitReview, getProductReviews };
