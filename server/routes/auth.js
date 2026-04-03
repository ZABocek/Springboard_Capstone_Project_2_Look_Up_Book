'use strict';

/**
 * Auth routes blueprint.
 *
 * POST /signup
 * POST /login
 * POST /admin/login
 * POST /admin/register
 * GET  /api/is-admin/:userId
 * GET  /admin/profile-user
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const { withClient } = require('../utils/dbHelpers');
const { resolveOrCreateUserIdForAdmin } = require('../utils/schemaSetup');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// User signup
// ---------------------------------------------------------------------------
router.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Incorrect form submission - missing fields' });
  }

  try {
    // bcrypt with cost factor 10 — expensive enough to slow brute-force attacks
    // while staying fast enough for normal registration traffic.
    const hash = await bcrypt.hash(password, 10);

    const user = await withClient(async (client) => {
      // The UNIQUE constraints on username and email cause a pg error code 23505
      // on collision — caught below and converted to a user-friendly 400.
      const result = await client.query(
        'INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING id',
        [username.trim(), email.trim(), hash]
      );
      return result.rows[0];
    });

    // Issue a short-lived JWT so the client can authenticate immediately after signup.
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Signup error:', err);

    // pg unique-violation error code — duplicate username or email
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    return res.status(500).json({ message: 'Error registering new user', error: err.message });
  }
});

// ---------------------------------------------------------------------------
// User login
// ---------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Incorrect form submission - missing username or password' });
  }

  try {
    const user = await withClient(async (client) => {
      const result = await client.query(
        'SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)',
        [username.trim()]
      );

      return result.rows[0] || null;
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found - please sign up first' });
    }

    const isValid = await bcrypt.compare(password, user.hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Admin login
// ---------------------------------------------------------------------------
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Incorrect form submission - missing username or password' });
  }

  try {
    const admin = await withClient(async (client) => {
      const result = await client.query(
        `
          SELECT *
          FROM admins
          WHERE LOWER(username) = LOWER($1)
             OR LOWER(COALESCE(email, '')) = LOWER($1)
          ORDER BY id
          LIMIT 1;
        `,
        [username.trim()]
      );
      return result.rows[0] || null;
    });

    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Wrong credentials' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(admin, admin.password_hash);

    const token = jwt.sign({ id: admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, adminId: admin.id, userId: userId || null, username: admin.username, email: admin.email || null });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Error logging in as admin' });
  }
});

// ---------------------------------------------------------------------------
// Admin registration (first admin only)
// ---------------------------------------------------------------------------
router.post('/admin/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const createdAdmin = await withClient(async (client) => {
      // Safety gate: only allow the very first admin to be created this way.
      // Once an admin row exists, this endpoint is permanently closed so it
      // cannot be used to escalate privileges after initial setup.
      const adminCountResult = await client.query('SELECT COUNT(*)::int AS admin_count FROM admins');
      const adminCount = adminCountResult.rows[0]?.admin_count || 0;

      if (adminCount > 0) {
        return { blocked: true };
      }

      // Derive a username from the email local-part if none was supplied.
      const resolvedUsername = (username || email.split('@')[0] || '').trim();

      if (!resolvedUsername) {
        throw new Error('A valid username could not be determined for the new admin account.');
      }

      const hash = await bcrypt.hash(password, 10);

      // Some older DB instances have a legacy plain-text `password` column.
      // We detect its presence at runtime and write to both columns if needed
      // to keep those deployments functional without a schema migration.
      const hasLegacyPasswordColumnResult = await client.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'admins'
              AND column_name = 'password'
          ) AS has_legacy_password_column;
        `
      );

      const hasLegacyPasswordColumn = hasLegacyPasswordColumnResult.rows[0]?.has_legacy_password_column;

      const result = hasLegacyPasswordColumn
        ? await client.query(
          `
            INSERT INTO admins (username, email, password, password_hash)
            VALUES ($1, $2, $3, $3)
            RETURNING id, username, email;
          `,
          [resolvedUsername, email.trim().toLowerCase(), hash]
        )
        : await client.query(
          'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
          [resolvedUsername, email.trim().toLowerCase(), hash]
        );

      return { blocked: false, admin: result.rows[0], passwordHash: hash };
    });

    if (createdAdmin.blocked) {
      return res.status(403).json({ message: 'Admin registration is closed because an admin account already exists.' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(
      createdAdmin.admin,
      createdAdmin.passwordHash
    );

    const token = jwt.sign({ id: createdAdmin.admin.id, isAdmin: true }, JWT_SECRET, { expiresIn: '2h' });
    return res.status(201).json({
      token,
      adminId: createdAdmin.admin.id,
      userId: userId || null,
      username: createdAdmin.admin.username,
      email: createdAdmin.admin.email,
    });
  } catch (error) {
    console.error('Admin registration error:', error);

    if (error.code === '23505') {
      return res.status(400).json({ message: 'Admin username or email already exists.' });
    }

    return res.status(500).json({ message: 'Error creating admin account' });
  }
});

// ---------------------------------------------------------------------------
// Check admin status
// ---------------------------------------------------------------------------
router.get('/api/is-admin/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;

  if (Number(req.user.id) !== Number(userId)) {
    return res.status(403).json({ isAdmin: false, message: 'Access forbidden' });
  }

  try {
    const admin = await withClient(async (client) => {
      const result = await client.query('SELECT id, username FROM admins WHERE id = $1', [userId]);
      return result.rows[0] || null;
    });

    if (!admin) {
      return res.status(404).json({ isAdmin: false, message: 'Admin not found' });
    }

    return res.json({ isAdmin: true, username: admin.username });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ message: 'Error checking admin status' });
  }
});

// ---------------------------------------------------------------------------
// Resolve admin's linked user profile ID
// ---------------------------------------------------------------------------
router.get('/admin/profile-user', requireAdmin, async (req, res) => {
  try {
    const admin = await withClient(async (client) => {
      const result = await client.query(
        'SELECT id, username, email, password_hash FROM admins WHERE id = $1 LIMIT 1',
        [req.user.id]
      );
      return result.rows[0] || null;
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(admin, admin.password_hash);

    if (!userId) {
      return res.status(500).json({ message: 'Unable to resolve admin profile user' });
    }

    return res.json({ userId });
  } catch (error) {
    console.error('Error resolving admin profile user:', error);
    return res.status(500).json({ message: 'Error resolving admin profile user' });
  }
});

module.exports = router;
