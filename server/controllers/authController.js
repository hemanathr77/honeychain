const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { body, validationResult } = require('express-validator');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, password, role, ...profileData } = req.body;

  const allowedRoles = ['CUSTOMER', 'SELLER', 'EXPERT', 'COLLECTOR'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Admin accounts cannot be registered publicly.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check email uniqueness
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), email.toLowerCase(), phone || null, password_hash, role]
    );
    const user = userResult.rows[0];

    // Create role profile
    if (role === 'SELLER') {
      await client.query(
        `INSERT INTO seller_profiles (user_id, farm_name, village, district, state)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, profileData.farm_name || null, profileData.village || null,
         profileData.district || null, profileData.state || null]
      );
    } else if (role === 'EXPERT') {
      await client.query(
        `INSERT INTO expert_profiles (user_id, qualification, specialization, experience_years)
         VALUES ($1, $2, $3, $4)`,
        [user.id, profileData.qualification || null,
         profileData.specialization || null,
         profileData.experience_years ? parseInt(profileData.experience_years) : null]
      );
    } else if (role === 'COLLECTOR') {
      await client.query(
        `INSERT INTO collector_profiles (user_id, village, district, state, experience_years)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, profileData.village || null, profileData.district || null,
         profileData.state || null,
         profileData.experience_years ? parseInt(profileData.experience_years) : null]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user.id);
    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);

    // Set HTTP-only cookie
    res.cookie('hc_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('hc_token');
  res.json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, is_verified, is_active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').notEmpty().withMessage('Role is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { register, login, logout, me, registerValidation, loginValidation };
