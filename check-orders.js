const { Pool } = require('c:/Users/palap/backend/node_modules/pg');
const pool = new Pool({ user: 'postgres', password: 'asdfg258', host: 'localhost', port: 5432, database: 'qino_fruit_store' });
pool.query('SELECT id, status, courier_id FROM orders ORDER BY created_at DESC LIMIT 5').then(r => { console.log(r.rows); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
