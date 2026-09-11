const { pool } = require('../config/db');

// GET /api/products — public, paginated, filtered
const getProducts = async (req, res) => {
  try {
    const { search, honey_type, min_price, max_price, verified_only, lab_tested, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = ["hp.status = 'ACTIVE'"];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(hp.name ILIKE $${params.length} OR hp.description ILIKE $${params.length} OR hp.honey_type ILIKE $${params.length})`);
    }
    if (honey_type) {
      params.push(honey_type);
      conditions.push(`hp.honey_type = $${params.length}`);
    }
    if (min_price) {
      params.push(parseFloat(min_price));
      conditions.push(`hp.price_per_kg >= $${params.length}`);
    }
    if (max_price) {
      params.push(parseFloat(max_price));
      conditions.push(`hp.price_per_kg <= $${params.length}`);
    }
    if (verified_only === 'true') {
      conditions.push(`sp.verification_status = 'VERIFIED'`);
    }
    if (lab_tested === 'true') {
      conditions.push(`EXISTS (
        SELECT 1 FROM honey_batches hb
        JOIN lab_reports lr ON lr.batch_id = hb.id
        WHERE hb.product_id = hp.id AND lr.overall_status = 'COMPLIANT'
      )`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(parseInt(limit), offset);
    const query = `
      SELECT
        hp.id, hp.name, hp.description, hp.honey_type, hp.price_per_kg,
        hp.available_quantity, hp.harvest_date, hp.image_url, hp.status,
        hp.seller_id, hp.created_at,
        u.name AS seller_name,
        sp.verification_status AS seller_verification,
        sp.district, sp.state,
        EXISTS (
          SELECT 1 FROM honey_batches hb
          JOIN lab_reports lr ON lr.batch_id = hb.id
          WHERE hb.product_id = hp.id AND lr.overall_status = 'COMPLIANT'
        ) AS lab_tested,
        (SELECT batch_id FROM honey_batches WHERE product_id = hp.id ORDER BY created_at DESC LIMIT 1) AS latest_batch_id,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM honey_products hp
      JOIN users u ON u.id = hp.seller_id
      LEFT JOIN seller_profiles sp ON sp.user_id = hp.seller_id
      LEFT JOIN reviews r ON r.product_id = hp.id
      ${whereClause}
      GROUP BY hp.id, u.name, sp.verification_status, sp.district, sp.state
      ORDER BY hp.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    // Count total
    const countParams = params.slice(0, params.length - 2);
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM honey_products hp
       JOIN users u ON u.id = hp.seller_id
       LEFT JOIN seller_profiles sp ON sp.user_id = hp.seller_id
       ${whereClause}`,
      countParams
    );

    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('getProducts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        hp.*,
        u.name AS seller_name, u.email AS seller_email,
        sp.verification_status AS seller_verification,
        sp.village, sp.district, sp.state, sp.farm_description,
        sp.experience_years, sp.number_of_colonies,
        f.farm_name, f.latitude AS farm_lat, f.longitude AS farm_lng,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(r.id) AS review_count
      FROM honey_products hp
      JOIN users u ON u.id = hp.seller_id
      LEFT JOIN seller_profiles sp ON sp.user_id = hp.seller_id
      LEFT JOIN farms f ON f.id = hp.farm_id
      LEFT JOIN reviews r ON r.product_id = hp.id
      WHERE hp.id = $1
      GROUP BY hp.id, u.name, u.email, sp.verification_status, sp.village,
               sp.district, sp.state, sp.farm_description, sp.experience_years,
               sp.number_of_colonies, f.farm_name, f.latitude, f.longitude
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Get reviews
    const reviews = await pool.query(`
      SELECT r.rating, r.review_text, r.created_at, u.name AS reviewer_name
      FROM reviews r JOIN users u ON u.id = r.customer_id
      WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 10
    `, [id]);

    res.json({ product: result.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error('getProductById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
};

// POST /api/products — SELLER only
const createProduct = async (req, res) => {
  try {
    const { name, description, honey_type, price_per_kg, available_quantity, harvest_date, farm_id, image_url } = req.body;

    if (!name || !price_per_kg) {
      return res.status(400).json({ error: 'Product name and price are required.' });
    }

    // Verify farm belongs to seller
    if (farm_id) {
      const farmCheck = await pool.query('SELECT id FROM farms WHERE id = $1 AND seller_id = $2', [farm_id, req.user.id]);
      if (farmCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Farm not found or does not belong to you.' });
      }
    }

    const result = await pool.query(`
      INSERT INTO honey_products (seller_id, farm_id, name, description, honey_type, price_per_kg, available_quantity, harvest_date, image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
      RETURNING *
    `, [req.user.id, farm_id || null, name, description || null, honey_type || null,
        parseFloat(price_per_kg), parseFloat(available_quantity) || 0,
        harvest_date || null, image_url || null]);

    res.status(201).json({ message: 'Product created successfully.', product: result.rows[0] });
  } catch (err) {
    console.error('createProduct error:', err.message);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

// PUT /api/products/:id — SELLER only (own products)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM honey_products WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    if (existing.rows[0].seller_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You can only edit your own products.' });
    }

    const { name, description, honey_type, price_per_kg, available_quantity, harvest_date, image_url, status } = req.body;
    const result = await pool.query(`
      UPDATE honey_products SET
        name = COALESCE($1, name), description = COALESCE($2, description),
        honey_type = COALESCE($3, honey_type), price_per_kg = COALESCE($4, price_per_kg),
        available_quantity = COALESCE($5, available_quantity),
        harvest_date = COALESCE($6, harvest_date), image_url = COALESCE($7, image_url),
        status = COALESCE($8, status), updated_at = NOW()
      WHERE id = $9 RETURNING *
    `, [name, description, honey_type, price_per_kg ? parseFloat(price_per_kg) : null,
        available_quantity ? parseFloat(available_quantity) : null,
        harvest_date, image_url, status, id]);

    res.json({ message: 'Product updated.', product: result.rows[0] });
  } catch (err) {
    console.error('updateProduct error:', err.message);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// GET /api/products/seller/mine — SELLER's own products
const getMyProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT hp.*, f.farm_name,
        COALESCE(AVG(r.rating), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS review_count,
        COUNT(DISTINCT hb.id) AS batch_count
      FROM honey_products hp
      LEFT JOIN farms f ON f.id = hp.farm_id
      LEFT JOIN reviews r ON r.product_id = hp.id
      LEFT JOIN honey_batches hb ON hb.product_id = hp.id
      WHERE hp.seller_id = $1
      GROUP BY hp.id, f.farm_name
      ORDER BY hp.created_at DESC
    `, [req.user.id]);
    res.json({ products: result.rows });
  } catch (err) {
    console.error('getMyProducts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your products.' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, getMyProducts };
