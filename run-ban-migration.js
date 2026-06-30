// run-ban-migration.js
// รัน: node run-ban-migration.js
// จาก directory: d:\mongkol\qino-template-fruit-store

require('dotenv').config({ path: __dirname + '/.env' });
const { Client } = require('pg');

(async () => {
  const c = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'asdfg258',
    database: process.env.DB_DATABASE || 'qino_fruit_store',
  });

  await c.connect();
  console.log('✅ Connected to database:', process.env.DB_DATABASE || 'qino_fruit_store');

  const migrations = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    `CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned)`,
  ];

  for (const sql of migrations) {
    try {
      await c.query(sql);
      console.log('✅ OK:', sql.substring(0, 80));
    } catch (e) {
      console.log('ℹ️  Note:', e.message.substring(0, 100));
    }
  }

  // Verify columns
  const result = await c.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position;
  `);
  console.log('\n📋 Users table columns:');
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name} (${row.data_type})`);
  });

  await c.end();
  console.log('\n✅ Migration completed!');
})();
