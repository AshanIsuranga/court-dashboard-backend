const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432
});

// Test connection + query
const testDB = async () => {
  try {
    const res = await pool.query('SELECT "username" FROM admin');
    console.log("DB Connected");
    console.log("Sample Data:", res.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  }
};

module.exports = {
  pool,
  testDB
};