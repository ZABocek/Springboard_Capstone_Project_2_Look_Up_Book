'use strict';

/**
 * Application factory.
 *
 * createApp() builds and returns a fully-configured Express application
 * without starting a server or performing any database DDL.  This keeps
 * the test harness clean — Jest can import the app without triggering
 * schema migrations or port binding.
 */

const express = require('express');
const compression = require('compression');
const cors = require('cors');

const requestLogger = require('./middleware/logger');
const authRouter = require('./routes/auth');
const catalogRouter = require('./routes/catalog');
const awardsRouter = require('./routes/awards');
const likesRouter = require('./routes/likes');
const profileRouter = require('./routes/profile');
const adminRouter = require('./routes/admin');

function createApp() {
  const app = express();

  // --- Global middleware ---
  app.use(compression());
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // --- Utility endpoints ---
  // Silent client-side debug log sink (no-op in production)
  app.post('/api/client-debug-log', (_req, res) => res.status(204).end());

  // --- Route blueprints ---
  app.use(authRouter);
  app.use(catalogRouter);
  app.use(awardsRouter);
  app.use(likesRouter);
  app.use(profileRouter);
  app.use(adminRouter);

  return app;
}

module.exports = { createApp };
