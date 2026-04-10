const { pool } = require('../config/db');

// Login for admin users
exports.loginAdminUserDao = async (userName) => {
  try {
    const sql = `
      SELECT *
      FROM public.admin
      WHERE "username" = $1
    `;
    const res = await pool.query(sql, [userName]);
    return res.rows[0]; // array of users
  } catch (err) {
    throw err;
  }
};

// Login for officers
exports.loginOfficerDao = async (userName) => {
  try {
    const sql = `
      SELECT *
      FROM public.officers
      WHERE "officercode" = $1
    `;
    const res = await pool.query(sql, [userName]);
    return res.rows[0]; // array of officers
  } catch (err) {
    throw err;
  }
};