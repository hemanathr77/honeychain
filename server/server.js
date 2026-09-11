require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { initDatabase } = require('./db/initDatabase');
const { ensureDatabase } = require('./db/createDb');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files (uploaded rescue photos) ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/rescue', require('./routes/rescue'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/farms', require('./routes/farms'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/lab-reports', require('./routes/lab-reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/blockchain', require('./routes/blockchain'));

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Handle multer errors with specific messages
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message && err.message.includes('Invalid file')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    console.log('\n🍯 HoneyChain Backend Starting...\n');
    await ensureDatabase();
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✅ Server running: http://localhost:${PORT}`);
      console.log(`📡 API base: http://localhost:${PORT}/api`);
      console.log(`⏰ ${new Date().toLocaleString()}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
