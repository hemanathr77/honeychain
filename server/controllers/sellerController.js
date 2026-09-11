const { pool } = require('../config/db');

// GET /api/sellers — list verified sellers (public)
const getSellers = async (req, res) => {
  try {
    const { state, district, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = ["'VERIFIED'"];
    const conditions = [`sp.verification_status = 'VERIFIED'`];

    if (state) {
      params.push(state);
      conditions.push(`sp.state ILIKE $${params.length}`);
    }
    if (district) {
      params.push(district);
      conditions.push(`sp.district ILIKE $${params.length}`);
    }

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.created_at,
        sp.farm_name, sp.experience_years, sp.village, sp.district, sp.state,
        sp.number_of_colonies, sp.bee_species, sp.honey_types,
        sp.production_capacity, sp.verification_status, sp.farm_description,
        COUNT(DISTINCT hp.id) AS product_count
      FROM seller_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN honey_products hp ON hp.seller_id = u.id AND hp.status = 'ACTIVE'
      WHERE sp.verification_status = 'VERIFIED'
      GROUP BY u.id, u.name, u.created_at, sp.farm_name, sp.experience_years,
               sp.village, sp.district, sp.state, sp.number_of_colonies,
               sp.bee_species, sp.honey_types, sp.production_capacity,
               sp.verification_status, sp.farm_description
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params.slice(1));

    res.json({ sellers: result.rows });
  } catch (err) {
    console.error('getSellers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sellers.' });
  }
};

// GET /api/sellers/:id — public seller profile
const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.created_at,
        sp.farm_name, sp.experience_years, sp.village, sp.district, sp.state,
        sp.latitude, sp.longitude, sp.number_of_colonies, sp.bee_species,
        sp.honey_types, sp.production_capacity, sp.verification_status,
        sp.farm_description,
        COUNT(DISTINCT hp.id) AS product_count,
        COUNT(DISTINCT f.id) AS farm_count
      FROM seller_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN honey_products hp ON hp.seller_id = u.id AND hp.status = 'ACTIVE'
      LEFT JOIN farms f ON f.seller_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.created_at, sp.farm_name, sp.experience_years,
               sp.village, sp.district, sp.state, sp.latitude, sp.longitude,
               sp.number_of_colonies, sp.bee_species, sp.honey_types,
               sp.production_capacity, sp.verification_status, sp.farm_description
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found.' });
    }
    res.json({ seller: result.rows[0] });
  } catch (err) {
    console.error('getSellerById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch seller.' });
  }
};

// GET /api/sellers/profile/me — seller's own profile
const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sp.*, u.name, u.email, u.phone, u.is_verified
      FROM seller_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller profile not found.' });
    }
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('getMyProfile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your profile.' });
  }
};

// PUT /api/sellers/profile — update seller profile
const updateProfile = async (req, res) => {
  try {
    const {
      farm_name, experience_years, village, district, state,
      latitude, longitude, number_of_colonies, bee_species,
      honey_types, production_capacity, farm_description
    } = req.body;

    const result = await pool.query(`
      UPDATE seller_profiles SET
        farm_name = COALESCE($1, farm_name),
        experience_years = COALESCE($2, experience_years),
        village = COALESCE($3, village),
        district = COALESCE($4, district),
        state = COALESCE($5, state),
        latitude = COALESCE($6, latitude),
        longitude = COALESCE($7, longitude),
        number_of_colonies = COALESCE($8, number_of_colonies),
        bee_species = COALESCE($9, bee_species),
        honey_types = COALESCE($10, honey_types),
        production_capacity = COALESCE($11, production_capacity),
        farm_description = COALESCE($12, farm_description),
        updated_at = NOW()
      WHERE user_id = $13
      RETURNING *
    `, [
      farm_name || null, experience_years ? parseInt(experience_years) : null,
      village || null, district || null, state || null,
      latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
      number_of_colonies ? parseInt(number_of_colonies) : null,
      bee_species || null, honey_types || null,
      production_capacity ? parseInt(production_capacity) : null,
      farm_description || null, req.user.id
    ]);

    res.json({ message: 'Profile updated successfully.', profile: result.rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// GET /api/sellers/dashboard — seller stats from DB
const getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM honey_products WHERE seller_id = $1) AS total_products,
        (SELECT COUNT(*) FROM honey_products WHERE seller_id = $1 AND status = 'ACTIVE') AS active_products,
        (SELECT COUNT(*) FROM honey_batches WHERE seller_id = $1) AS total_batches,
        (SELECT COUNT(*) FROM farms WHERE seller_id = $1) AS total_farms,
        (SELECT COALESCE(SUM(oi.quantity * oi.price), 0)
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN honey_products hp ON hp.id = oi.product_id
         WHERE hp.seller_id = $1 AND o.order_status != 'CANCELLED') AS total_revenue,
        (SELECT COUNT(DISTINCT o.id)
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN honey_products hp ON hp.id = oi.product_id
         WHERE hp.seller_id = $1) AS total_orders,
        (SELECT COALESCE(AVG(r.rating), 0)
         FROM reviews r WHERE r.seller_id = $1) AS avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE seller_id = $1) AS review_count
    `, [sellerId]);

    // Recent orders for this seller
    const recentOrders = await pool.query(`
      SELECT o.id, o.order_number, o.order_status, o.created_at,
        u.name AS customer_name,
        SUM(oi.quantity * oi.price) AS order_total,
        STRING_AGG(oi.product_name, ', ') AS products
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN honey_products hp ON hp.id = oi.product_id
      JOIN users u ON u.id = o.customer_id
      WHERE hp.seller_id = $1
      GROUP BY o.id, o.order_number, o.order_status, o.created_at, u.name
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [sellerId]);

    res.json({ stats: stats.rows[0], recent_orders: recentOrders.rows });
  } catch (err) {
    console.error('getDashboardStats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};

module.exports = { getSellers, getSellerById, getMyProfile, updateProfile, getDashboardStats };
