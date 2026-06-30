const { Pool } = require('c:/Users/palap/backend/node_modules/pg');
const pool = new Pool({ user: 'postgres', password: 'asdfg258', host: 'localhost', port: 5432, database: 'qino_fruit_store' });

async function run() {
  try {
    // Check columns in orders table
    const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY ordinal_position");
    console.log('ORDERS columns:', cols.rows.map(r => r.column_name).join(', '));
    
    // Add courier_id column if missing
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id INTEGER REFERENCES users(id)`);
    console.log('courier_id column ensured');
    
    // Add courier_name for display if needed
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`);
    console.log('completed_at column ensured');
    
    // Ensure payment_slips has all needed columns
    await pool.query(`ALTER TABLE payment_slips ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP`);
    console.log('payment_slips.verified_at ensured');
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
