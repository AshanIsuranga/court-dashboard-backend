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

exports.changePasswordDao = async ({ userId, password }) => {
    const sql = `
        UPDATE public.officers
        SET 
            password = $1,
            ispasswordchanged = 1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id
    `;

    const values = [password, userId];

    try {
        const result = await pool.query(sql, values);
        return result.rows[0];
    } catch (err) {
        throw err;
    }
};