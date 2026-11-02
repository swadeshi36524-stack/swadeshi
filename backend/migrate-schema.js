
const pool = require('./db');

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      
      -- We will add user_id to orders if it does not exist
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        phone_number TEXT PRIMARY KEY,
        language TEXT,
        state TEXT,
        last_category TEXT,
        last_product_id TEXT,
        pagination_offset INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    pool.end();
  }
}

run();
