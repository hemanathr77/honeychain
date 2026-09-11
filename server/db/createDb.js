require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Client } = require('pg');

/**
 * Connects to the default 'postgres' database and creates 'honeychain' if it
 * doesn't exist yet. Called automatically on every server startup.
 */
async function ensureDatabase() {
  const targetDbName = process.env.DATABASE_NAME || 'honeychain';
  const isSSL = process.env.DATABASE_SSL === 'true';
  const sslConfig = isSSL ? { rejectUnauthorized: false } : false;

  // First, try to connect directly to the target database.
  // In cloud environments like Neon/Render, the DB is already created
  // and we might not have access to the 'postgres' default database.
  const targetClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    database: targetDbName,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    ssl: sslConfig,
  });

  try {
    await targetClient.connect();
    console.log(`✅ Database "${targetDbName}" exists and is accessible.`);
    console.log(`   Database host: ${process.env.DATABASE_HOST || 'localhost'}`);
    console.log(`   Database SSL enabled: ${isSSL}`);
    await targetClient.end();
    return; // Successfully connected, no creation needed.
  } catch (err) {
    // 3D000 is the PostgreSQL error code for "database does not exist"
    if (err.code !== '3D000') {
      console.error('❌ Could not ensure database exists (connection failed):', err.message);
      throw err;
    }
    console.log(`⏳ Database "${targetDbName}" not found. Attempting to create it...`);
  } finally {
    try { await targetClient.end(); } catch (e) { /* ignore */ }
  }

  // Fallback: Connect to the default 'postgres' database to create the target database.
  // This is primarily for local development.
  const defaultClient = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    database: 'postgres',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    ssl: sslConfig,
  });

  try {
    await defaultClient.connect();
    await defaultClient.query(`CREATE DATABASE ${targetDbName}`);
    console.log(`✅ Database "${targetDbName}" created successfully!`);
  } catch (err) {
    console.error(`❌ Failed to create database "${targetDbName}":`, err.message);
    throw err;
  } finally {
    await defaultClient.end();
  }
}

module.exports = { ensureDatabase };

// Allow running directly: node db/createDb.js
if (require.main === module) {
  ensureDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
