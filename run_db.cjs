const { Pool } = require('c:/Users/palap/backend/node_modules/pg');
const pool = new Pool({
    user: 'postgres',
    password: 'asdfg258',
    host: 'localhost',
    port: 5432,
    database: 'qino_fruit_store'
});
pool.query('CREATE TABLE IF NOT EXISTS payment_slips (id VARCHAR(50) PRIMARY KEY, order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE, slip_image TEXT NOT NULL, amount DECIMAL(10,2) NOT NULL, status VARCHAR(50) DEFAULT \'pending\', admin_note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)').then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
