'use strict';

/**
 * Authentication and authorisation middleware.
 *
 * Exports:
 *   getBearerToken       – extract raw JWT from Authorization header
 *   authenticateToken    – req must carry a valid JWT
 *   requireAdmin         – req must carry a valid *admin* JWT
 *   authorizeSelfOrAdmin – req must be either the target user or an admin
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Extracts the raw JWT string from the "Authorization: Bearer <token>" header.
// Returns null if the header is absent or does not use the Bearer scheme.
function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length);
}

// Middleware: verifies the JWT and attaches the decoded payload to req.user.
// Returns 401 if the token is missing, expired, or has an invalid signature.
function authenticateToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // jwt.verify throws for expired / tampered tokens
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Middleware: behaves like authenticateToken but additionally enforces that
// the token carries isAdmin: true.  Regular user tokens are rejected with 403.
function requireAdmin(req, res, next) {
  return authenticateToken(req, res, () => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
  });
}

/**
 * Middleware factory: authorises either the owner of a resource or any admin.
 *
 * @param {(req: import('express').Request) => number|string} getRequestedUserId
 *   A function that extracts the *target* user ID from the incoming request
 *   (e.g. from req.params.userId or req.body.userId).  The authenticated
 *   user (req.user.id) must match this value, or they must be an admin.
 *
 * Usage:
 *   router.get('/api/user/preference/:userId',
 *     authorizeSelfOrAdmin(req => req.params.userId), handler);
 */
function authorizeSelfOrAdmin(getRequestedUserId) {
  return (req, res, next) => {
    // First verify the token is present and valid
    authenticateToken(req, res, () => {
      const requestedUserId = Number(getRequestedUserId(req));
      const authenticatedUserId = Number(req.user?.id);

      // Allow if the requester owns the resource OR is an admin
      if (req.user?.isAdmin || requestedUserId === authenticatedUserId) {
        return next();
      }

      return res.status(403).json({ message: 'Forbidden' });
    });
  };
}

module.exports = {
  getBearerToken,
  authenticateToken,
  requireAdmin,
  authorizeSelfOrAdmin,
};
