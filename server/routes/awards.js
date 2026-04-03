'use strict';

/**
 * Awards routes blueprint.
 *
 * GET /api/awards
 * GET /api/book-awards
 * GET /api/awards/:awardId
 */

const express = require('express');

const cache = require('../cache');
const { CACHE_KEYS } = require('../config');
const { withClient } = require('../utils/dbHelpers');

const router = express.Router();

// ---------------------------------------------------------------------------
// All awards (books + career)
// ---------------------------------------------------------------------------
router.get('/api/awards', cache.cacheMiddleware(CACHE_KEYS.AWARDS, cache.TTL.AWARDS), async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(`
        SELECT
          a.id AS award_id,
          a.prize_name,
          a.prize_type,
          CASE
            WHEN a.prize_type = 'career' THEN COALESCE(career_counts.author_count, 0)::int
            ELSE COALESCE(book_counts.book_count, 0)::int
          END AS book_count
        FROM awards a
        LEFT JOIN (
          SELECT
            ba.award_id,
            COUNT(DISTINCT ba.book_id)::int AS book_count
          FROM book_awards ba
          JOIN books b ON b.id = ba.book_id
          WHERE b.verified = true
          GROUP BY ba.award_id
        ) book_counts ON book_counts.award_id = a.id
        LEFT JOIN (
          SELECT
            aa.award_id,
            COUNT(DISTINCT aa.author_id)::int AS author_count
          FROM author_awards aa
          WHERE COALESCE(aa.verified, true) = true
            AND COALESCE(aa.role, 'winner') = 'winner'
          GROUP BY aa.award_id
        ) career_counts ON career_counts.award_id = a.id
        WHERE a.prize_name IS NOT NULL AND a.prize_name <> ''
        ORDER BY a.prize_name;
      `);
      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return res.status(500).json({ message: 'Error fetching awards' });
  }
});

// ---------------------------------------------------------------------------
// Book-only awards (excludes career awards)
// ---------------------------------------------------------------------------
router.get('/api/book-awards', cache.cacheMiddleware(CACHE_KEYS.BOOK_AWARDS, cache.TTL.BOOK_AWARDS), async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(`
        SELECT
          a.id AS award_id,
          a.prize_name,
          a.prize_type,
          COALESCE(book_counts.book_count, 0)::int AS book_count
        FROM awards a
        LEFT JOIN (
          SELECT
            ba.award_id,
            COUNT(DISTINCT ba.book_id)::int AS book_count
          FROM book_awards ba
          JOIN books b ON b.id = ba.book_id
          WHERE b.verified = true
          GROUP BY ba.award_id
        ) book_counts ON book_counts.award_id = a.id
        WHERE a.prize_name IS NOT NULL
          AND a.prize_name <> ''
          AND COALESCE(a.prize_type, '') <> 'career'
        ORDER BY a.prize_name;
      `);

      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching book awards:', error);
    return res.status(500).json({ message: 'Error fetching book awards' });
  }
});

// ---------------------------------------------------------------------------
// Award detail (books or authors for a specific award)
// ---------------------------------------------------------------------------
router.get('/api/awards/:awardId', async (req, res) => {
  const { awardId } = req.params;
  const cacheKey = CACHE_KEYS.AWARD_DETAIL(awardId);

  try {
    // --- cache read ---
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    res.setHeader('X-Cache', 'MISS');

    const rows = await withClient(async (client) => {
      const awardTypeResult = await client.query('SELECT prize_type FROM awards WHERE id = $1', [awardId]);

      if (awardTypeResult.rows.length === 0) {
        return null;
      }

      const prizeType = awardTypeResult.rows[0].prize_type;
      let queryText;

      if (prizeType === 'career') {
        queryText = `
          SELECT
            aa.id,
            NULL::integer AS book_id,
            COALESCE(auth.full_name, 'Unknown Author') AS title,
            aa.author_id,
            NULL::integer AS person_id,
            aa.award_id,
            COALESCE(aa.prize_year, a.prize_year) AS prize_year,
            a.prize_genre AS genre,
            COALESCE(aa.verified, true) AS verified,
            aa.role,
            aa.source,
            a.prize_name,
            a.prize_type,
            COALESCE(aa.prize_amount, a.prize_amount) AS prize_amount
          FROM author_awards aa
          JOIN awards a ON aa.award_id = a.id
          LEFT JOIN authors auth ON aa.author_id = auth.id
          WHERE aa.award_id = $1
            AND COALESCE(aa.verified, true) = true
            AND COALESCE(aa.role, 'winner') = 'winner'
            AND COALESCE(aa.prize_year, a.prize_year) IS NOT NULL
          ORDER BY COALESCE(auth.full_name, 'Unknown Author'), aa.prize_year DESC NULLS LAST;
        `;
      } else {
        queryText = `
          SELECT DISTINCT ON (b.title, b.prize_year)
            b.id,
            b.book_id,
            b.title,
            b.author_id,
            b.person_id,
            ba.award_id,
            COALESCE(b.prize_year, a.prize_year) AS prize_year,
            b.genre,
            b.verified,
            b.role,
            b.source,
            a.prize_name,
            a.prize_type,
            a.prize_amount
          FROM books b
          JOIN book_awards ba ON ba.book_id = b.id
          JOIN awards a ON ba.award_id = a.id
          WHERE ba.award_id = $1
            AND b.verified = true
            AND b.title IS NOT NULL
            AND b.title <> ''
            AND COALESCE(b.prize_year, a.prize_year) IS NOT NULL
          ORDER BY b.title, b.prize_year DESC NULLS LAST;
        `;
      }

      const result = await client.query(queryText, [awardId]);
      return result.rows;
    });

    if (rows === null) {
      return res.status(404).json({ message: 'Award not found' });
    }

    // --- cache write ---
    await cache.set(cacheKey, rows, cache.TTL.AWARD_DETAIL);
    return res.json(rows);
  } catch (error) {
    console.error(`Error fetching books for award ${awardId}:`, error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

module.exports = router;
