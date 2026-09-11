const { pool } = require('../config/db');

// GET /api/farms — seller's own farms
const getMyFarms = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, COUNT(bc.id) AS colony_count_total
      FROM farms f
      LEFT JOIN bee_colonies bc ON bc.farm_id = f.id
      WHERE f.seller_id = $1
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `, [req.user.id]);
    res.json({ farms: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch farms.' });
  }
};

// POST /api/farms
const createFarm = async (req, res) => {
  try {
    const { farm_name, address, village, district, state, latitude, longitude, description } = req.body;
    if (!farm_name) return res.status(400).json({ error: 'Farm name is required.' });

    const result = await pool.query(`
      INSERT INTO farms (seller_id, farm_name, address, village, district, state, latitude, longitude, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [req.user.id, farm_name, address || null, village || null, district || null,
        state || null, latitude || null, longitude || null, description || null]);

    res.status(201).json({ message: 'Farm created.', farm: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create farm.' });
  }
};

// GET /api/farms/:id/colonies
const getFarmColonies = async (req, res) => {
  try {
    const { id } = req.params;
    // Verify ownership
    const farm = await pool.query('SELECT * FROM farms WHERE id = $1 AND seller_id = $2', [id, req.user.id]);
    if (farm.rows.length === 0) return res.status(404).json({ error: 'Farm not found.' });

    const result = await pool.query('SELECT * FROM bee_colonies WHERE farm_id = $1', [id]);
    res.json({ colonies: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch colonies.' });
  }
};

// POST /api/farms/:id/colonies
const addColony = async (req, res) => {
  try {
    const { id } = req.params;
    const farm = await pool.query('SELECT * FROM farms WHERE id = $1 AND seller_id = $2', [id, req.user.id]);
    if (farm.rows.length === 0) return res.status(404).json({ error: 'Farm not found.' });

    const { colony_count, bee_species, health_status, notes } = req.body;
    const result = await pool.query(`
      INSERT INTO bee_colonies (farm_id, colony_count, bee_species, health_status, notes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [id, parseInt(colony_count) || 1, bee_species || null, health_status || 'HEALTHY', notes || null]);

    res.status(201).json({ message: 'Colony added.', colony: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add colony.' });
  }
};

module.exports = { getMyFarms, createFarm, getFarmColonies, addColony };
