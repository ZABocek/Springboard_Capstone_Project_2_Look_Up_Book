'use strict';

/**
 * Low-level database helpers.
 *
 * withClient      – acquire a client from the pool, run a handler, always release
 * generateUniqueId – get the next value from the unique_id_seq sequence
 */

const { pool } = require('../db');

/**
 * Runs `handler(client)` inside a checked-out pool client and always releases
 * the client afterwards, even on error.
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} handler
 * @returns {Promise<any>}
 */
async function withClient(handler) {
  const client = await pool.connect();
  try {
    return await handler(client);
  } finally {
    client.release();
  }
}

/**
 * Returns the next integer from the `unique_id_seq` sequence.
 * Must be called inside an already-open `withClient` block.
 *
 * @param {import('pg').PoolClient} client
 * @returns {Promise<number>}
 */
async function generateUniqueId(client) {
  const result = await client.query("SELECT nextval('unique_id_seq') AS id");
  return result.rows[0].id;
}

module.exports = { withClient, generateUniqueId };
