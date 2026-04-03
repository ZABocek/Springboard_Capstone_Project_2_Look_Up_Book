'use strict';

/**
 * Graceful shutdown utilities for the Look Up Book server.
 *
 * Exporting these functions as a separate module rather than embedding them
 * inside server.js keeps them unit-testable without starting a real HTTP
 * server or touching any database.
 *
 * shutdown()                – close HTTP server, drain PG pool, quit Redis.
 * registerShutdownHandlers() – wire SIGINT + SIGTERM to shutdown() and install
 *                             a 10-second forced-exit safety net.
 *
 * DATABASE SAFETY:
 *   PostgreSQL persists every committed transaction regardless of whether
 *   pool.end() is called explicitly.  pool.end() is still called here so
 *   idle connections are released cleanly rather than waiting for the server's
 *   idle-connection timeout to reclaim them, and so that any in-flight query
 *   is allowed to finish (or roll back) before the process exits.
 */

/**
 * Perform the full graceful shutdown sequence:
 *  1. Stop accepting new HTTP connections — in-flight requests complete.
 *  2. Drain the PostgreSQL connection pool — running queries finish.
 *  3. Disconnect the Redis client — sends QUIT so pending replies are flushed.
 *
 * Errors in steps 2 and 3 are logged but do not prevent the sequence from
 * completing, so a misbehaving dependency cannot hang the shutdown.
 *
 * @param {string} signal - The OS signal name ('SIGINT' or 'SIGTERM').
 * @param {{ httpServer: import('http').Server,
 *            pool: import('pg').Pool,
 *            cache: { quit: () => Promise<void> } }} deps
 */
async function shutdown(signal, { httpServer, pool, cache }) {
  console.log(`\n[Shutdown] Received ${signal}. Shutting down gracefully...`);

  // 1. Stop accepting new HTTP connections.  In-flight requests are allowed
  //    to complete before the server emits 'close'.
  httpServer.close(() => {
    console.log('[Shutdown] HTTP server closed.');
  });

  // 2. Drain the PG connection pool.  pool.end() waits for any checked-out
  //    clients to be returned, then destroys every underlying TCP connection.
  try {
    await pool.end();
    console.log('[Shutdown] Database pool closed.');
  } catch (err) {
    console.error('[Shutdown] Error closing database pool:', err.message);
  }

  // 3. Send QUIT to Redis so the server can flush any pending replies before
  //    closing the TCP socket.
  try {
    await cache.quit();
    console.log('[Shutdown] Redis client disconnected.');
  } catch (err) {
    console.error('[Shutdown] Error disconnecting Redis:', err.message);
  }
}

/**
 * Register SIGINT and SIGTERM handlers on the Node.js `process` object.
 *
 * Each handler:
 *  - Installs an unref'd 10-second timeout so the process force-exits if
 *    cleanup hangs (e.g. a stalled DB query) without the timer itself
 *    keeping the event loop alive.
 *  - Calls shutdown() then process.exit(0) on success.
 *  - Calls process.exit(1) if shutdown() throws.
 *
 * @param {{ httpServer: import('http').Server,
 *            pool: import('pg').Pool,
 *            cache: { quit: () => Promise<void> } }} deps
 */
function registerShutdownHandlers({ httpServer, pool, cache }) {
  function handle(signal) {
    // Safety-net: force exit if cleanup takes longer than 10 s.
    // unref() ensures this timer does not keep the event loop alive by itself.
    const forceTimer = setTimeout(() => {
      console.error(`[Shutdown] Forced exit — cleanup exceeded 10 s (${signal})`);
      process.exit(1);
    }, 10_000);
    forceTimer.unref();

    shutdown(signal, { httpServer, pool, cache })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('[Shutdown] Unexpected error:', err);
        process.exit(1);
      });
  }

  process.on('SIGINT',  () => handle('SIGINT'));
  process.on('SIGTERM', () => handle('SIGTERM'));
}

module.exports = { shutdown, registerShutdownHandlers };
