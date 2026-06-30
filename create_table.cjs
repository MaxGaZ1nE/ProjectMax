const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'asdfg258',
    host: 'localhost',
    port: 5432,
    database: 'qino_fruit_store'
});

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_slips (
                id VARCHAR(50) PRIMARY KEY,
                order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                slip_image TEXT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                admin_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table payment_slips created successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
