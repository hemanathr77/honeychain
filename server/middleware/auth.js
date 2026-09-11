const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Middleware: Verify JWT and attach user to req.user
 */
async function authenticateUser(req, res, next) {
  try {
    let token;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // Fallback: check HTTP-only cookie
    else if (req.cookies && req.cookies.hc_token) {
      token = req.cookies.hc_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (validates account still active)
    const result = await pool.query(
      'SELECT id, name, email, role, is_verified, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid session token.' });
    }
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error.' });
  }
}

/**
 * Middleware factory: Restrict to specific roles
 * Usage: authorizeRole('ADMIN', 'SELLER')
 */
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This resource requires one of: ${roles.join(', ')}.`
      });
    }
    next();
  };
}

module.exports = { authenticateUser, authorizeRole };
