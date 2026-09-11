const { pool } = require('../config/db');

// GET /api/experts — list verified experts (public)
const getExperts = async (req, res) => {
  try {
    const { specialization, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const conditions = [`ep.verification_status = 'VERIFIED'`];

    if (specialization) {
      params.push(`%${specialization}%`);
      conditions.push(`ep.specialization ILIKE $${params.length}`);
    }

    params.push(parseInt(limit), offset);
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.created_at,
        ep.qualification, ep.specialization, ep.experience_years,
        ep.organization, ep.village, ep.district, ep.state,
        ep.languages, ep.bio, ep.verification_status,
        COUNT(DISTINCT ea.id) AS answers_given
      FROM expert_profiles ep
      JOIN users u ON u.id = ep.user_id
      LEFT JOIN expert_answers ea ON ea.expert_id = u.id
      WHERE ep.verification_status = 'VERIFIED'
      ${conditions.length > 1 ? 'AND ' + conditions.slice(1).join(' AND ') : ''}
      GROUP BY u.id, u.name, u.created_at, ep.qualification, ep.specialization,
               ep.experience_years, ep.organization, ep.village, ep.district,
               ep.state, ep.languages, ep.bio, ep.verification_status
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ experts: result.rows });
  } catch (err) {
    console.error('getExperts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch experts.' });
  }
};

// GET /api/experts/:id — public expert profile
const getExpertById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT
        u.id, u.name, u.created_at,
        ep.qualification, ep.specialization, ep.experience_years,
        ep.organization, ep.village, ep.district, ep.state,
        ep.languages, ep.bio, ep.verification_status,
        COUNT(DISTINCT ea.id) AS answers_given
      FROM expert_profiles ep
      JOIN users u ON u.id = ep.user_id
      LEFT JOIN expert_answers ea ON ea.expert_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.created_at, ep.qualification, ep.specialization,
               ep.experience_years, ep.organization, ep.village, ep.district,
               ep.state, ep.languages, ep.bio, ep.verification_status
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expert not found.' });
    }
    res.json({ expert: result.rows[0] });
  } catch (err) {
    console.error('getExpertById error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expert.' });
  }
};

// GET /api/experts/profile/me — expert's own profile
const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ep.*, u.name, u.email, u.phone, u.is_verified
      FROM expert_profiles ep
      JOIN users u ON u.id = ep.user_id
      WHERE ep.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expert profile not found.' });
    }
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('getMyExpertProfile error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your profile.' });
  }
};

// PUT /api/experts/profile — update expert profile
const updateProfile = async (req, res) => {
  try {
    const {
      qualification, specialization, experience_years,
      organization, village, district, state, languages, bio
    } = req.body;

    const result = await pool.query(`
      UPDATE expert_profiles SET
        qualification = COALESCE($1, qualification),
        specialization = COALESCE($2, specialization),
        experience_years = COALESCE($3, experience_years),
        organization = COALESCE($4, organization),
        village = COALESCE($5, village),
        district = COALESCE($6, district),
        state = COALESCE($7, state),
        languages = COALESCE($8, languages),
        bio = COALESCE($9, bio),
        updated_at = NOW()
      WHERE user_id = $10
      RETURNING *
    `, [
      qualification || null, specialization || null,
      experience_years ? parseInt(experience_years) : null,
      organization || null, village || null, district || null,
      state || null, languages || null, bio || null,
      req.user.id
    ]);

    res.json({ message: 'Expert profile updated.', profile: result.rows[0] });
  } catch (err) {
    console.error('updateExpertProfile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// GET /api/experts/dashboard — expert stats
const getDashboardStats = async (req, res) => {
  try {
    const expertId = req.user.id;

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM farmer_questions WHERE status = 'OPEN') AS open_questions,
        (SELECT COUNT(*) FROM expert_answers WHERE expert_id = $1) AS answers_given,
        (SELECT COUNT(*) FROM mentorship_requests WHERE mentor_id = $1) AS mentorship_requests,
        (SELECT COUNT(*) FROM mentorship_requests WHERE mentor_id = $1 AND status = 'ACTIVE') AS active_mentorships
    `, [expertId]);

    // Recent open questions for expert to answer
    const openQuestions = await pool.query(`
      SELECT fq.*, u.name AS farmer_name, u.role AS farmer_role,
        (SELECT COUNT(*) FROM expert_answers WHERE question_id = fq.id) AS answer_count
      FROM farmer_questions fq
      JOIN users u ON u.id = fq.farmer_id
      WHERE fq.status = 'OPEN'
      ORDER BY fq.created_at DESC
      LIMIT 10
    `);

    res.json({ stats: stats.rows[0], open_questions: openQuestions.rows });
  } catch (err) {
    console.error('getExpertDashboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch expert dashboard.' });
  }
};

module.exports = { getExperts, getExpertById, getMyProfile, updateProfile, getDashboardStats };
