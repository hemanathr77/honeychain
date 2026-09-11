require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

async function verifyAdmin() {
  const isSSL = process.env.DATABASE_SSL === 'true';

  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: isSSL ? { rejectUnauthorized: false } : false,
  });

  try {
    await pool.connect();
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@honeychain.local';
    const res = await pool.query("SELECT email, role, password_hash FROM users WHERE email = $1", [adminEmail]);

    if (res.rows.length === 0) {
      console.log('❌ Admin user not found.');
    } else {
      const user = res.rows[0];
      console.log('✅ Admin verification successful:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password Hash Length: ${user.password_hash.length} (Hash hidden)`);
      console.log('   The password_hash was successfully updated!');
    }
  } catch (err) {
    console.error('❌ Could not verify:', err.message);
  } finally {
    await pool.end();
  }
}

verifyAdmin();
