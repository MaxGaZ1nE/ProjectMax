// run-ban-migration.cjs
// รัน: node run-ban-migration.cjs  (จาก d:\mongkol\qino-template-fruit-store)
// ไม่ต้องใช้ dotenv - ใช้ default values ตรงๆ

const { Client } = require('pg');

(async () => {
  // ใช้ defaults เดียวกับ run-migration.js ที่มีอยู่
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'asdfg258',
    database: 'qino_fruit_store',
  });

  try {
    await c.connect();
    console.log('✅ Connected to database: qino_fruit_store');

    const statements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
      `CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned)`,
    ];

    for (const sql of statements) {
      try {
        await c.query(sql);
        console.log('✅', sql.substring(0, 80));
      } catch (e) {
        console.log('ℹ️ (already exists or note):', e.message.substring(0, 100));
      }
    }

    // Verify
    const result = await c.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('\n📋 Users table columns now:');
    result.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    console.log('\n✅ Migration done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await c.end();
  }
})();
