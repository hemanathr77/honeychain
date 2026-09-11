require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

/**
 * Connects to the default 'postgres' database and creates 'honeychain' if it
 * doesn't exist yet. Called automatically on every server startup.
 */
async function ensureDatabase() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    database: 'postgres', // connect to default db to create ours
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
  });

  try {
    await client.connect();

    const check = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'honeychain'"
    );

    if (check.rows.length === 0) {
      console.log('⏳ Database "honeychain" not found — creating it...');
      await client.query('CREATE DATABASE honeychain');
      console.log('✅ Database "honeychain" created successfully!');
    } else {
      console.log('✅ Database "honeychain" exists — using it.');
    }
  } catch (err) {
    console.error('❌ Could not ensure database exists:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = { ensureDatabase };

// Allow running directly: node db/createDb.js
if (require.main === module) {
  ensureDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
