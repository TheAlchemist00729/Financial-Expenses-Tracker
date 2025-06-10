const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, './.env'),
});

console.log('[DB] Using DATABASE_URL:', process.env.DATABASE_URL);

const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isProduction && { ssl: { rejectUnauthorized: false } }),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};


