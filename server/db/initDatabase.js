require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool, testConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

const CREATE_TABLES = `

-- USERS (all roles)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER','SELLER','EXPERT','COLLECTOR','ADMIN')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SELLER PROFILES
CREATE TABLE IF NOT EXISTS seller_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_name VARCHAR(255),
  experience_years INTEGER,
  village VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  number_of_colonies INTEGER,
  bee_species TEXT[],
  honey_types TEXT[],
  production_capacity INTEGER,
  verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    verification_status IN ('PENDING','UNDER_REVIEW','FIELD_VERIFICATION','VERIFIED','REJECTED','SUSPENDED')
  ),
  farm_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPERT PROFILES
CREATE TABLE IF NOT EXISTS expert_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qualification VARCHAR(500),
  specialization VARCHAR(500),
  experience_years INTEGER,
  organization VARCHAR(255),
  village VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  languages TEXT[],
  bio TEXT,
  verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    verification_status IN ('PENDING','UNDER_REVIEW','VERIFIED','REJECTED','SUSPENDED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLLECTOR PROFILES
CREATE TABLE IF NOT EXISTS collector_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  experience_years INTEGER,
  village VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    verification_status IN ('PENDING','UNDER_REVIEW','VERIFIED','REJECTED','SUSPENDED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FARMS
CREATE TABLE IF NOT EXISTS farms (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_name VARCHAR(255) NOT NULL,
  address TEXT,
  village VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  farm_photo TEXT,
  description TEXT,
  verification_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    verification_status IN ('PENDING','VERIFIED','REJECTED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BEE COLONIES
CREATE TABLE IF NOT EXISTS bee_colonies (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  colony_count INTEGER NOT NULL DEFAULT 0,
  bee_species VARCHAR(255),
  health_status VARCHAR(50) DEFAULT 'HEALTHY' CHECK (
    health_status IN ('HEALTHY','FAIR','POOR','CRITICAL')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HONEY PRODUCTS
CREATE TABLE IF NOT EXISTS honey_products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  honey_type VARCHAR(100),
  price_per_kg DECIMAL(10,2) NOT NULL,
  available_quantity DECIMAL(10,2) DEFAULT 0,
  harvest_date DATE,
  image_url TEXT,
  status VARCHAR(30) DEFAULT 'ACTIVE' CHECK (
    status IN ('ACTIVE','INACTIVE','OUT_OF_STOCK','PENDING_APPROVAL')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HONEY BATCHES
CREATE TABLE IF NOT EXISTS honey_batches (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(30) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES honey_products(id) ON DELETE SET NULL,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  harvest_date DATE,
  quantity DECIMAL(10,2),
  unit VARCHAR(20) DEFAULT 'kg',
  sample_id VARCHAR(100),
  lab_report_id INTEGER,
  laboratory_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    laboratory_status IN ('PENDING','SUBMITTED','COMPLIANT','NON_COMPLIANT','REJECTED')
  ),
  processing_status VARCHAR(30) DEFAULT 'PENDING',
  packaging_status VARCHAR(30) DEFAULT 'PENDING',
  batch_status VARCHAR(30) DEFAULT 'CREATED' CHECK (
    batch_status IN ('CREATED','LAB_PENDING','LAB_SUBMITTED','APPROVED','LISTED','SOLD_OUT','REJECTED')
  ),
  qr_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAB REPORTS
CREATE TABLE IF NOT EXISTS lab_reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(50) UNIQUE NOT NULL,
  batch_id INTEGER NOT NULL REFERENCES honey_batches(id) ON DELETE RESTRICT,
  sample_id VARCHAR(100),
  laboratory_name VARCHAR(500) NOT NULL,
  accreditation_no VARCHAR(100),
  test_date DATE,
  report_date DATE,
  moisture_content DECIMAL(5,2),
  reducing_sugars DECIMAL(5,2),
  sucrose_content DECIMAL(5,2),
  hmf DECIMAL(8,2),
  diastase_activity DECIMAL(5,2),
  c4_sugar_result TEXT,
  other_parameters JSONB,
  overall_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    overall_status IN ('PENDING','COMPLIANT','NON_COMPLIANT')
  ),
  report_file TEXT,
  verification_status VARCHAR(30) DEFAULT 'PENDING',
  is_demo_data BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRACEABILITY EVENTS
CREATE TABLE IF NOT EXISTS traceability_events (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES honey_batches(id) ON DELETE RESTRICT,
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN (
      'FARM_REGISTERED','HIVE_CREATED','HARVESTED','SAMPLE_COLLECTED',
      'LAB_SUBMITTED','LAB_TESTED','PROCESSING_COMPLETED','PACKAGED',
      'LISTED','ORDERED','SHIPPED','DELIVERED','OTHER'
    )
  ),
  event_description TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  verification_status VARCHAR(30) DEFAULT 'UNVERIFIED',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  shipping_name VARCHAR(255),
  shipping_phone VARCHAR(20),
  payment_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    payment_status IN ('PENDING','PAID','FAILED','REFUNDED')
  ),
  order_status VARCHAR(30) DEFAULT 'PENDING' CHECK (
    order_status IN ('PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','PICKED_UP','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER STATUS HISTORY (tracks every status transition)
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name VARCHAR(255),
  changed_by_role VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES honey_products(id) ON DELETE SET NULL,
  batch_id INTEGER REFERENCES honey_batches(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BEE RESCUE REQUESTS
CREATE TABLE IF NOT EXISTS bee_rescue_requests (
  id SERIAL PRIMARY KEY,
  request_number VARCHAR(30) UNIQUE NOT NULL,
  reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reporter_name VARCHAR(255),
  reporter_phone VARCHAR(20),
  photo_url TEXT,
  description TEXT NOT NULL,
  approximate_size VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location_description TEXT,
  status VARCHAR(30) DEFAULT 'REPORTED' CHECK (
    status IN ('REPORTED','UNDER_REVIEW','COLLECTOR_ASSIGNED','SCHEDULED','COLLECTED','COMPLETED','CANCELLED')
  ),
  assigned_collector INTEGER REFERENCES users(id) ON DELETE SET NULL,
  collector_notes TEXT,
  honey_quantity_kg DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MENTORSHIP REQUESTS
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(30) DEFAULT 'REQUESTED' CHECK (
    status IN ('REQUESTED','ACCEPTED','ACTIVE','COMPLETED','REJECTED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FARMER QUESTIONS
CREATE TABLE IF NOT EXISTS farmer_questions (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category VARCHAR(100),
  status VARCHAR(30) DEFAULT 'OPEN' CHECK (
    status IN ('OPEN','ANSWERED','CLOSED')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPERT ANSWERS
CREATE TABLE IF NOT EXISTS expert_answers (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES farmer_questions(id) ON DELETE CASCADE,
  expert_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES honey_products(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, order_id, product_id)
);

-- FRAUD FLAGS
CREATE TABLE IF NOT EXISTS fraud_flags (
  id SERIAL PRIMARY KEY,
  flag_type VARCHAR(100) NOT NULL,
  flagged_user INTEGER REFERENCES users(id) ON DELETE SET NULL,
  flagged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'LOW' CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  status VARCHAR(30) DEFAULT 'PENDING_REVIEW' CHECK (
    status IN ('PENDING_REVIEW','INVESTIGATING','RESOLVED','DISMISSED')
  ),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_seller ON honey_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON honey_products(status);
CREATE INDEX IF NOT EXISTS idx_batches_seller ON honey_batches(seller_id);
CREATE INDEX IF NOT EXISTS idx_batches_batch_id ON honey_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_batch ON traceability_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_rescue_status ON bee_rescue_requests(status);
CREATE INDEX IF NOT EXISTS idx_questions_farmer ON farmer_questions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_batch ON lab_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history ON order_status_history(order_id);
`;

async function initDatabase() {
  console.log('\n🔧 HoneyChain — Database Initialization');
  console.log('=========================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot initialize: PostgreSQL not reachable');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Create database: CREATE DATABASE honeychain;');
    console.error('   3. Set DATABASE_PASSWORD in server/.env');
    process.exit(1);
  }

  try {
    console.log('📋 Creating tables (if not exist)...');
    await pool.query(CREATE_TABLES);
    console.log('✅ All tables ready');

    // Safe column additions — run after tables are created
    await addColumnsIfNeeded();

    // Create admin from env vars if no admin exists
    await createAdminIfNeeded();

    console.log('✅ Database initialization complete\n');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  }
}

// Safely add new columns that may not exist in older DB instances
async function addColumnsIfNeeded() {
  const alterStatements = [
    // Existing migrations
    `ALTER TABLE bee_rescue_requests ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10,4)`,
    `ALTER TABLE bee_rescue_requests ADD COLUMN IF NOT EXISTS photo_captured_at TIMESTAMPTZ`,

    // ── Blockchain columns (honey_batches) ──────────────────────────────────
    `ALTER TABLE honey_batches ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(20) DEFAULT 'PENDING'`,
    `ALTER TABLE honey_batches ADD COLUMN IF NOT EXISTS blockchain_data_hash VARCHAR(66)`,
    `ALTER TABLE honey_batches ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66)`,
    `ALTER TABLE honey_batches ADD COLUMN IF NOT EXISTS blockchain_verified_at TIMESTAMPTZ`,

    // ── Blockchain columns (lab_reports) ─────────────────────────────────────
    `ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(20) DEFAULT 'PENDING'`,
    `ALTER TABLE lab_reports ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66)`,

    // ── Blockchain columns (traceability_events) ──────────────────────────────
    `ALTER TABLE traceability_events ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66)`,

    // ── Order status column expansion (idempotent constraint update) ──────────
    // PostgreSQL does not support IF NOT EXISTS on ALTER TABLE ... ADD CONSTRAINT,
    // so we use a DO block to safely modify the check constraint on existing DBs.
    `DO $$
     BEGIN
       -- Drop old check constraint if it exists (name may vary)
       ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
     EXCEPTION WHEN others THEN NULL;
     END $$`,
    `ALTER TABLE orders ADD CONSTRAINT orders_order_status_check CHECK (
       order_status IN ('PENDING','CONFIRMED','PROCESSING','READY_FOR_PICKUP','PICKED_UP','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')
     )`,
  ];
  for (const sql of alterStatements) {
    try {
      await pool.query(sql);
    } catch (err) {
      // Log but do not crash — column may already exist or type mismatch
      console.warn('⚠️  Column migration skipped:', err.message);
    }
  }
  console.log('✅ Column migrations applied (including blockchain columns)');
}

async function createAdminIfNeeded() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping admin creation');
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['ADMIN']);
  if (existing.rows.length > 0) {
    console.log('ℹ️  Admin account already exists — skipping');
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_verified, is_active)
     VALUES ($1, $2, $3, 'ADMIN', TRUE, TRUE)`,
    ['HoneyChain Admin', adminEmail, hash]
  );
  console.log(`✅ Admin account created: ${adminEmail}`);
  console.log('⚠️  IMPORTANT: Change the admin password after your first login!');
}

// Run directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { initDatabase };
