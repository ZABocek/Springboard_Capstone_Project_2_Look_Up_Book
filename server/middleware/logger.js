'use strict';

/**
 * Request logger middleware.
 * Logs method, path, status code, and elapsed time for every request.
 */
module.exports = function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - started;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${elapsed}ms)`);
  });
  next();
};
