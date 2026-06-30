// Run migration for seller_registrations table
// Execute from backend directory
require('dotenv').config({ path: __dirname + '/.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

(async () => {
  const c = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'asdfg258',
    database: process.env.DB_DATABASE || 'qino_fruit_store',
  });

  await c.connect();
  console.log('Connected to database');

  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', 'add-seller-registrations.sql'),
    'utf-8'
  );

  const stmts = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const s of stmts) {
    try {
      await c.query(s + ';');
      console.log('OK:', s.substring(0, 70));
    } catch (e) {
      console.log('Note:', e.message.substring(0, 100));
    }
  }

  await c.end();
  console.log('Migration completed!');
})();
