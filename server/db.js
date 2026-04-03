'use strict';

/**
 * Database pool singleton.
 *
 * All route modules and utilities import pool from here so there is exactly
 * one connection pool for the entire application lifetime.
 */

const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  user: config.DB_USER,
  host: config.DB_HOST,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  port: config.DB_PORT,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = { pool };
