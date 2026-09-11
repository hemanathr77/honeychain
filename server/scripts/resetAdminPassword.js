require('dotenv').config({ path: require('path').join(__dirname, '../../.env') }); // In case running from root
require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); // In case running from server dir
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const reqVars = ['DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_SSL', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missing = reqVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('❌ ERROR: Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nThis script MUST be run with your Neon production variables injected.');
    console.error('It will NOT fall back to localhost.');
    process.exit(1);
  }

  const isSSL = process.env.DATABASE_SSL === 'true';

  // Safe diagnostics
  console.log('\n🔍 Configuration Diagnosed:');
  const host = process.env.DATABASE_HOST;
  const maskedHost = host.length > 8 ? host.substring(0, 4) + '...' + host.substring(host.length - 4) : '***';
  console.log(`   Database host: ${maskedHost}`);
  console.log(`   Database name: ${process.env.DATABASE_NAME}`);
  console.log(`   Database user: ${process.env.DATABASE_USER}`);
  console.log(`   SSL enabled:   ${isSSL}\n`);

  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
  });

  try {
    // Verify connection to the database
    await pool.connect();
    console.log('✅ Connected to database securely.');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Find the admin user
    const findRes = await pool.query("SELECT id FROM users WHERE email = $1 AND role = 'ADMIN'", [adminEmail]);

    if (findRes.rows.length === 0) {
      console.error('❌ Error: No ADMIN user found with the provided email.');
      process.exit(1);
    }

    // Hash the new password securely
    const hash = await bcrypt.hash(adminPassword, 12);

    // Update ONLY the password for that specific admin user
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2 AND role = 'ADMIN'", [hash, adminEmail]);

    console.log('✅ Admin password has been successfully reset.');
  } catch (err) {
    console.error('❌ An error occurred during the password reset process.');
    // Keep error output generic, avoiding any leak of credentials/hashes
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
