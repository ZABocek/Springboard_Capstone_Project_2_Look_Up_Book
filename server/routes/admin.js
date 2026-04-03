'use strict';

/**
 * Admin moderation routes blueprint.
 *
 * All routes below require a valid admin JWT (requireAdmin).
 *
 * GET    /api/unverified-books
 * PATCH  /api/books/:bookId/verification
 * GET    /api/verified-submitted-books
 * DELETE /api/admin/books/:bookId
 * GET    /api/admin/cache/status
 * POST   /api/admin/cache/flush
 */

const express = require('express');

const cache = require('../cache');
const { CACHE_KEYS } = require('../config');
const { withClient } = require('../utils/dbHelpers');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// List books awaiting moderation
// ---------------------------------------------------------------------------
router.get('/api/unverified-books', requireAdmin, async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(`
        SELECT
          b.id AS "bookId",
          b.title AS "titleOfWinningBook",
          COALESCE(a.full_name, CONCAT_WS(' ', a.given_name, a.last_name), 'Unknown') AS "fullName"
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.id
        WHERE b.verified = false
          AND b.source = 'user_submitted'
          AND b.title IS NOT NULL
          AND b.title <> ''
        ORDER BY b.prize_year DESC NULLS LAST, b.id DESC;
      `);

      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching unverified books:', error);
    return res.status(500).json({ message: 'Error fetching unverified books' });
  }
});

// ---------------------------------------------------------------------------
// Verify or reject a user-submitted book
// ---------------------------------------------------------------------------
router.patch('/api/books/:bookId/verification', requireAdmin, async (req, res) => {
  const { bookId } = req.params;
  const { verified } = req.body;

  if (typeof verified !== 'boolean') {
    return res.status(400).json({ message: 'verified must be a boolean value' });
  }

  try {
    const rowCount = await withClient(async (client) => {
      if (verified) {
        // Approving: flip verified = true and promote role from 'pending'/'author'
        // to 'winner' so the book appears in catalog queries filtered by role.
        const result = await client.query(
          `
            UPDATE books
            SET verified = true,
                role = CASE WHEN role IN ('author', 'pending') THEN 'winner' ELSE role END
            WHERE id = $1
              AND source = 'user_submitted';
          `,
          [Number(bookId)]
        );
        return result.rowCount;
      }

      // Rejecting: hard-delete the row so it no longer occupies space or
      // appears in any query.  Only user_submitted books can be deleted here;
      // authoritative catalogue books are protected by the source filter.
      const deleteResult = await client.query(
        'DELETE FROM books WHERE id = $1 AND source = $2',
        [Number(bookId), 'user_submitted']
      );

      return deleteResult.rowCount;
    });

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Verification changes book catalog – invalidate all catalog caches
    // so the very next request re-fetches from the database.
    cache.del(
      CACHE_KEYS.HOMEPAGE,
      CACHE_KEYS.BOOKS_FOR_PROFILE,
      CACHE_KEYS.SEARCH_BOOKS
    ).catch(() => {});
    return res.json({ message: 'Book verification status updated successfully' });
  } catch (error) {
    console.error('Error updating book verification status:', error);
    return res.status(500).json({ message: 'Error updating book verification status' });
  }
});

// ---------------------------------------------------------------------------
// List previously verified user submissions
// ---------------------------------------------------------------------------
router.get('/api/verified-submitted-books', requireAdmin, async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(`
        SELECT
          b.id AS "bookId",
          b.title AS "titleOfWinningBook",
          COALESCE(a.full_name, CONCAT_WS(' ', a.given_name, a.last_name), 'Unknown') AS "fullName",
          b.prize_year AS "prizeYear",
          COALESCE(aw.prize_name, 'N/A') AS "prizeName"
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.id
        LEFT JOIN awards aw ON aw.id = b.award_id
        WHERE b.verified = true
          AND b.source = 'user_submitted'
        ORDER BY b.prize_year DESC NULLS LAST, b.id DESC;
      `);

      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching verified submitted books:', error);
    return res.status(500).json({ message: 'Error fetching verified submitted books' });
  }
});

// ---------------------------------------------------------------------------
// Hard-delete a user-submitted book
// ---------------------------------------------------------------------------
router.delete('/api/admin/books/:bookId', requireAdmin, async (req, res) => {
  const { bookId } = req.params;

  try {
    const rowCount = await withClient(async (client) => {
      const result = await client.query(
        'DELETE FROM books WHERE id = $1 AND source = $2',
        [Number(bookId), 'user_submitted']
      );

      return result.rowCount;
    });

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    cache.del(
      CACHE_KEYS.HOMEPAGE,
      CACHE_KEYS.BOOKS_FOR_PROFILE,
      CACHE_KEYS.SEARCH_BOOKS
    ).catch(() => {});
    return res.json({ message: 'Book removed successfully' });
  } catch (error) {
    console.error('Error removing submitted book:', error);
    return res.status(500).json({ message: 'Error removing submitted book' });
  }
});

// ---------------------------------------------------------------------------
// Cache management
// ---------------------------------------------------------------------------

/**
 * GET /api/admin/cache/status
 * Returns which cache keys currently have data.
 */
router.get('/api/admin/cache/status', requireAdmin, async (_req, res) => {
  try {
    const keys = Object.values(CACHE_KEYS).filter((v) => typeof v === 'string');
    const statuses = await Promise.all(
      keys.map(async (k) => {
        const hit = await cache.get(k);
        return { key: k, cached: hit !== null };
      })
    );
    return res.json(statuses);
  } catch (err) {
    return res.status(500).json({ message: 'Error checking cache status' });
  }
});

/**
 * POST /api/admin/cache/flush
 * Flush all application caches.
 */
router.post('/api/admin/cache/flush', requireAdmin, async (_req, res) => {
  try {
    const keys = Object.values(CACHE_KEYS).filter((v) => typeof v === 'string');
    await cache.del(...keys);
    return res.json({ message: 'Cache flushed', keys });
  } catch (err) {
    return res.status(500).json({ message: 'Error flushing cache' });
  }
});

module.exports = router;
