'use strict';

/**
 * Profile routes blueprint.
 *
 * GET  /api/user/preference/:userId      — read user preferences
 * POST /api/user/preference/update       — update user preferences
 * GET  /api/user/:userId/preferred-books — list saved books
 * POST /api/user/add-book                — add book / career entry to profile
 * POST /api/user/remove-book             — remove book / career entry from profile
 * POST /api/submit-book                  — submit a new book for admin review
 */

const express = require('express');

const cache = require('../cache');
const { CACHE_KEYS } = require('../config');
const { authenticateToken, authorizeSelfOrAdmin } = require('../middleware/auth');
const { withClient, generateUniqueId } = require('../utils/dbHelpers');

const router = express.Router();

// ---------------------------------------------------------------------------
// Read user preferences
// ---------------------------------------------------------------------------
router.get('/api/user/preference/:userId', authorizeSelfOrAdmin((req) => req.params.userId), async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await withClient(async (client) => {
      const result = await client.query(
        'SELECT username, reading_preference, favorite_genre FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({ message: 'Error fetching user preferences' });
  }
});

// ---------------------------------------------------------------------------
// Update user preferences
// ---------------------------------------------------------------------------
router.post('/api/user/preference/update', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
  const { userId, readingPreference, favoriteGenre } = req.body;

  try {
    await withClient(async (client) => {
      await client.query(
        'UPDATE users SET reading_preference = $1, favorite_genre = $2 WHERE id = $3',
        [readingPreference || null, favoriteGenre || null, userId]
      );
    });

    return res.json({ message: 'User preferences updated successfully' });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({ message: 'Error updating user preferences' });
  }
});

// ---------------------------------------------------------------------------
// List preferred books for a user
// ---------------------------------------------------------------------------
router.get('/api/user/:userId/preferred-books', authorizeSelfOrAdmin((req) => req.params.userId), async (req, res) => {
  const { userId } = req.params;

  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
          SELECT
            CASE
              WHEN upb.author_award_id IS NOT NULL THEN 'career'
              ELSE 'book'
            END AS preference_type,
            COALESCE(upb.author_award_id, b.id) AS preference_id,
            b.id AS book_id,
            upb.author_award_id,
            CASE
              WHEN upb.author_award_id IS NOT NULL THEN 'Career Award'
              ELSE b.title
            END AS title_of_winning_book,
            COALESCE(book_author.full_name, career_author.full_name, 'Unknown') AS full_name,
            COALESCE(award_names.prize_names, legacy_aw.prize_name, career_aw.prize_name, 'N/A') AS prize_name,
            COALESCE(
              b.prize_year,
              award_year_lookup.award_year,
              legacy_aw.prize_year,
              career_entry.prize_year,
              career_aw.prize_year
            ) AS prize_year
          FROM user_preferred_books upb
          LEFT JOIN books b ON upb.book_id = b.id
          LEFT JOIN authors book_author ON b.author_id = book_author.id
          LEFT JOIN awards legacy_aw ON b.award_id = legacy_aw.id
          LEFT JOIN author_awards career_entry ON upb.author_award_id = career_entry.id
          LEFT JOIN authors career_author ON career_entry.author_id = career_author.id
          LEFT JOIN awards career_aw ON career_entry.award_id = career_aw.id
          LEFT JOIN LATERAL (
            SELECT MAX(aw.prize_year) AS award_year
            FROM book_awards ba
            JOIN awards aw ON aw.id = ba.award_id
            WHERE ba.book_id = b.id
              AND aw.prize_year IS NOT NULL
          ) award_year_lookup ON true
          LEFT JOIN LATERAL (
            SELECT STRING_AGG(DISTINCT aw.prize_name, ', ' ORDER BY aw.prize_name) AS prize_names
            FROM book_awards ba
            JOIN awards aw ON aw.id = ba.award_id
            WHERE ba.book_id = b.id
          ) award_names ON true
          WHERE upb.user_id = $1
            AND COALESCE(
              b.prize_year,
              award_year_lookup.award_year,
              legacy_aw.prize_year,
              career_entry.prize_year,
              career_aw.prize_year
            ) IS NOT NULL
          ORDER BY COALESCE(
            b.prize_year,
            award_year_lookup.award_year,
            legacy_aw.prize_year,
            career_entry.prize_year,
            career_aw.prize_year
          ) DESC NULLS LAST, COALESCE(book_author.full_name, career_author.full_name), COALESCE(b.title, 'Career Award');
        `,
        [userId]
      );

      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error("Error fetching user's preferred books:", error);
    return res.status(500).json({ message: "Error fetching user's preferred books" });
  }
});

// ---------------------------------------------------------------------------
// Add a book or career entry to profile
// ---------------------------------------------------------------------------
router.post('/api/user/add-book', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
  const { userId, bookId, authorAwardId, entryType, entryId } = req.body;

  const resolvedEntryType = entryType || (authorAwardId != null ? 'career' : 'book');
  const resolvedBookId = resolvedEntryType === 'book' ? Number(bookId ?? entryId) : null;
  const resolvedAuthorAwardId = resolvedEntryType === 'career' ? Number(authorAwardId ?? entryId) : null;

  if (userId == null || (resolvedBookId == null && resolvedAuthorAwardId == null)) {
    return res.status(400).json({ message: 'userId and a valid selection are required' });
  }

  try {
    const rowCount = await withClient(async (client) => {
      const result = resolvedEntryType === 'career'
        ? await client.query(
          `
            INSERT INTO user_preferred_books (user_id, book_id, author_award_id)
            SELECT $1, NULL, $2
            WHERE NOT EXISTS (
              SELECT 1
              FROM user_preferred_books
              WHERE user_id = $1 AND author_award_id = $2
            );
          `,
          [userId, resolvedAuthorAwardId]
        )
        : await client.query(
          `
            INSERT INTO user_preferred_books (user_id, book_id, author_award_id)
            SELECT $1, $2, NULL
            WHERE NOT EXISTS (
              SELECT 1
              FROM user_preferred_books
              WHERE user_id = $1 AND book_id = $2
            );
          `,
          [userId, resolvedBookId]
        );

      return result.rowCount;
    });

    if (rowCount === 0) {
      return res.status(409).json({ message: 'That entry is already in your profile.' });
    }

    return res.json({ message: 'Selection added to profile successfully' });
  } catch (error) {
    console.error('Error adding book to profile:', error);
    return res.status(500).json({ message: 'Error adding book to profile' });
  }
});

// ---------------------------------------------------------------------------
// Remove a book or career entry from profile
// ---------------------------------------------------------------------------
router.post('/api/user/remove-book', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
  const { userId, bookId, authorAwardId, entryType, entryId } = req.body;

  const resolvedEntryType = entryType || (authorAwardId != null ? 'career' : 'book');
  const resolvedBookId = resolvedEntryType === 'book' ? Number(bookId ?? entryId) : null;
  const resolvedAuthorAwardId = resolvedEntryType === 'career' ? Number(authorAwardId ?? entryId) : null;

  if (userId == null || (resolvedBookId == null && resolvedAuthorAwardId == null)) {
    return res.status(400).json({ message: 'userId and a valid selection are required' });
  }

  try {
    await withClient(async (client) => {
      if (resolvedEntryType === 'career') {
        await client.query(
          'DELETE FROM user_preferred_books WHERE user_id = $1 AND author_award_id = $2',
          [userId, resolvedAuthorAwardId]
        );
        return;
      }

      await client.query('DELETE FROM user_preferred_books WHERE user_id = $1 AND book_id = $2', [userId, resolvedBookId]);
    });

    return res.json({ message: 'Entry removed from profile successfully' });
  } catch (error) {
    console.error('Error removing book from profile:', error);
    return res.status(500).json({ message: 'Error removing book from profile' });
  }
});

// ---------------------------------------------------------------------------
// Submit a new book for admin review
// ---------------------------------------------------------------------------
router.post('/api/submit-book', authenticateToken, async (req, res) => {
  const {
    fullName,
    givenName,
    lastName,
    titleOfWinningBook,
    prizeYear,
    prizeGenre,
    awardId,
  } = req.body;

  if (!fullName || !givenName || !lastName || !titleOfWinningBook || !awardId) {
    return res.status(400).json({ message: 'Missing required book submission fields' });
  }

  const parsedAwardId = Number(awardId);
  if (!Number.isInteger(parsedAwardId) || parsedAwardId <= 0) {
    return res.status(400).json({ message: 'A valid book award must be selected.' });
  }

  // prizeYear is optional — an empty string or null resolves to NULL in the DB.
  const parsedPrizeYear = prizeYear == null || prizeYear === '' ? null : Number(prizeYear);
  if (parsedPrizeYear !== null && !Number.isInteger(parsedPrizeYear)) {
    return res.status(400).json({ message: 'Prize year must be a whole number.' });
  }

  try {
    const insertedBook = await withClient(async (client) => {
      // Wrap all inserts in a transaction so a failure in any step (e.g. the
      // book_awards junction insert) rolls back everything atomically.
      await client.query('BEGIN');

      try {
        // --- Validate the chosen award ---
        const awardCheckResult = await client.query(
          'SELECT id, prize_type FROM awards WHERE id = $1 LIMIT 1',
          [parsedAwardId]
        );

        if (awardCheckResult.rows.length === 0) {
          throw new Error('Selected award does not exist.');
        }

        // Career awards are for authors, not books — reject them here so the
        // admin queue only ever receives genuinely book-type submissions.
        if ((awardCheckResult.rows[0].prize_type || '').toLowerCase() === 'career') {
          throw new Error('Only book awards can be used when submitting a book.');
        }

        // --- Resolve author (re-use existing row or create a new one) ---
        // Case-insensitive match on full_name OR the given_name+last_name pair
        // to avoid creating duplicates when the same author is submitted twice.
        const existingAuthorResult = await client.query(
          `
            SELECT id
            FROM authors
            WHERE LOWER(COALESCE(full_name, '')) = LOWER($1)
               OR (LOWER(COALESCE(given_name, '')) = LOWER($2) AND LOWER(COALESCE(last_name, '')) = LOWER($3))
            ORDER BY id
            LIMIT 1;
          `,
          [fullName.trim(), givenName.trim(), lastName.trim()]
        );

        let authorId;

        if (existingAuthorResult.rows.length > 0) {
          // Re-use the existing author row to maintain referential integrity.
          authorId = existingAuthorResult.rows[0].id;
        } else {
          // Compute a new sequential ID manually (no SERIAL/auto-increment on
          // this table in the current schema) then insert the new author.
          const nextAuthorIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM authors');
          const newAuthorId = nextAuthorIdResult.rows[0].id;
          const authorResult = await client.query(
            'INSERT INTO authors (id, given_name, last_name, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
            [newAuthorId, givenName.trim(), lastName.trim(), fullName.trim()]
          );
          authorId = authorResult.rows[0].id;
        }

        // --- Insert the book with verified = false and source = 'user_submitted' ---
        // The book sits in the admin queue until explicitly verified or rejected.
        const nextBookRowIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM books');
        const rowId = nextBookRowIdResult.rows[0].id;
        const bookId = await generateUniqueId(client); // uses unique_id_seq sequence
        const result = await client.query(
          `
            INSERT INTO books (id, book_id, title, author_id, prize_year, genre, verified, role, source, award_id)
            VALUES ($1, $2, $3, $4, $5, $6, false, 'pending', 'user_submitted', $7)
            RETURNING *;
          `,
          [rowId, bookId, titleOfWinningBook.trim(), authorId, parsedPrizeYear, prizeGenre || null, parsedAwardId]
        );

        // Also populate the book_awards junction table so the award relationship
        // is queryable through the normalised schema (not just via books.award_id).
        await client.query(
          `
            INSERT INTO book_awards (book_id, award_id)
            VALUES ($1, $2)
            ON CONFLICT (book_id, award_id) DO NOTHING;
          `,
          [result.rows[0].id, parsedAwardId]
        );

        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    // Submitted books go into the unverified queue; flush profile/search caches
    // so the admin panel sees the latest state immediately.
    cache.del(CACHE_KEYS.BOOKS_FOR_PROFILE, CACHE_KEYS.SEARCH_BOOKS).catch(() => {});
    return res.json(insertedBook);
  } catch (error) {
    console.error('Error submitting new book for verification:', error);

    if (error.message === 'Selected award does not exist.' || error.message === 'Only book awards can be used when submitting a book.') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error submitting new book for verification' });
  }
});

module.exports = router;
