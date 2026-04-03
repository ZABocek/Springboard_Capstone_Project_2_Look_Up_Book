'use strict';

/**
 * Central configuration module.
 *
 * Loads .env once here so every sub-module that requires config.js gets a
 * consistent, already-resolved view of all environment variables.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ---------------------------------------------------------------------------
// Cache key constants – shared by route handlers and the Celery cache-warmer.
// ---------------------------------------------------------------------------
const CACHE_KEYS = {
  HOMEPAGE: 'api:homepage',
  SEARCH_BOOKS: 'api:search-books-award-winners',
  BOOKS_FOR_PROFILE: 'api:books-for-profile',
  AWARDS: 'api:awards',
  BOOK_AWARDS: 'api:book-awards',
  AWARD_DETAIL: (id) => `api:awards:${id}`,
};

module.exports = {
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: process.env.DB_PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  CACHE_KEYS,
};
