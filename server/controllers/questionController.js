const { pool } = require('../config/db');

// GET /api/questions — all open questions (public)
const getQuestions = async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT fq.*, u.name AS farmer_name,
        COUNT(ea.id) AS answer_count
      FROM farmer_questions fq
      JOIN users u ON u.id = fq.farmer_id
      LEFT JOIN expert_answers ea ON ea.question_id = fq.id
      WHERE fq.status != 'CLOSED'
    `;
    const params = [];
    if (category) { params.push(category); query += ` AND fq.category = $${params.length}`; }
    query += ` GROUP BY fq.id, u.name ORDER BY fq.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ questions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
};

// POST /api/questions
const askQuestion = async (req, res) => {
  try {
    const { question, category } = req.body;
    if (!question) return res.status(400).json({ error: 'Question text is required.' });

    const result = await pool.query(`
      INSERT INTO farmer_questions (farmer_id, question, category)
      VALUES ($1, $2, $3) RETURNING *
    `, [req.user.id, question, category || null]);

    res.status(201).json({ message: 'Question submitted.', question: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit question.' });
  }
};

// GET /api/questions/:id/answers
const getAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await pool.query(`
      SELECT fq.*, u.name AS farmer_name
      FROM farmer_questions fq JOIN users u ON u.id = fq.farmer_id
      WHERE fq.id = $1
    `, [id]);
    if (question.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });

    const answers = await pool.query(`
      SELECT ea.*, u.name AS expert_name, u.role AS expert_role,
        ep.qualification, ep.specialization, ep.experience_years, ep.verification_status
      FROM expert_answers ea
      JOIN users u ON u.id = ea.expert_id
      LEFT JOIN expert_profiles ep ON ep.user_id = ea.expert_id
      WHERE ea.question_id = $1
      ORDER BY ea.helpful_count DESC, ea.created_at ASC
    `, [id]);

    res.json({ question: question.rows[0], answers: answers.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch answers.' });
  }
};

// POST /api/questions/:id/answers — EXPERT, SELLER, ADMIN
const answerQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ error: 'Answer text is required.' });

    const q = await pool.query('SELECT id FROM farmer_questions WHERE id = $1', [id]);
    if (q.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });

    const result = await pool.query(`
      INSERT INTO expert_answers (question_id, expert_id, answer)
      VALUES ($1, $2, $3) RETURNING *
    `, [id, req.user.id, answer]);

    await pool.query(
      `UPDATE farmer_questions SET status = 'ANSWERED', updated_at = NOW() WHERE id = $1 AND status = 'OPEN'`,
      [id]
    );

    res.status(201).json({ message: 'Answer submitted.', answer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit answer.' });
  }
};

module.exports = { getQuestions, askQuestion, getAnswers, answerQuestion };
