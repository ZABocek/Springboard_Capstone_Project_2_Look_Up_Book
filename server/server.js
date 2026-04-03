'use strict';

/**
 * Server entry point.
 *
 * This file is intentionally thin — it wires together the factory app,
 * starts the HTTP server, and runs DB schema migrations once on boot.
 *
 * When required by the test suite (require.main !== module) this file
 * exports the app and pool without calling startServer(), so Jest never
 * binds a port or triggers DDL.
 */

const { createApp } = require('./app');
const { pool } = require('./db');
const {
  ensureBookAwardsMapping,
  ensureAuthorAwardsModel,
  ensureLikeDislikeInfrastructure,
} = require('./utils/schemaSetup');

const app = createApp();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

async function startServer() {
  await ensureBookAwardsMapping();
  await ensureAuthorAwardsModel();
  await ensureLikeDislikeInfrastructure();

  const server = app.listen(5000, () => {
    console.log('Server is running on port 5000');
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

// Only start listening when executed directly (not when required by tests)
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for tests — same interface as before
module.exports = { app, pool };
