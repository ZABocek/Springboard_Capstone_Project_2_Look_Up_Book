'use strict';

/**
 * Catalog routes blueprint.
 *
 * GET /api/tableName            — homepage random selection
 * GET /api/authors              — all authors for search
 * GET /api/books/:authorId      — books by a specific author
 * GET /api/books-for-profile    — full catalog for profile page (with dedup)
 * GET /api/search-books-award-winners — award-winners for search
 */

const express = require('express');

const cache = require('../cache');
const { CACHE_KEYS } = require('../config');
const { withClient } = require('../utils/dbHelpers');

const router = express.Router();

// ---------------------------------------------------------------------------
// Homepage random selection (8 books + 2 career awards)
// The query uses two CTEs joined by UNION ALL so the homepage always shows a
// mix of book-award winners and career-award recipients in a single response.
// ---------------------------------------------------------------------------
router.get('/api/tableName', cache.cacheMiddleware(CACHE_KEYS.HOMEPAGE, cache.TTL.HOMEPAGE), async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(`
        WITH book_enriched AS (
          SELECT
            b.id AS book_id,
            b.title AS title_of_winning_book,
            COALESCE(b.genre, 'Unknown') AS prize_genre,
            COALESCE(b.prize_year, b.publication_year) AS display_year,
            b.publication_year,
            b.prize_year,
            b.verified,
            b.author_id,
            COALESCE(a.full_name, 'Unknown') AS author_name,
            COALESCE(award_names.prize_names, legacy_aw.prize_name, 'N/A') AS prize_name,
            COALESCE(award_names.prize_types, legacy_aw.prize_type, 'book') AS prize_type,
            COALESCE(CAST(l.like_count AS INTEGER), 0) AS like_count,
            COALESCE(CAST(l.dislike_count AS INTEGER), 0) AS dislike_count,
            COALESCE(
              b.like_dislike,
              CONCAT(
                COALESCE(CAST(l.like_count AS INTEGER), 0),
                ' Likes / ',
                COALESCE(CAST(l.dislike_count AS INTEGER), 0),
                ' Dislikes'
              )
            ) AS like_dislike
          FROM books b
          LEFT JOIN authors a ON b.author_id = a.id
          LEFT JOIN awards legacy_aw ON b.award_id = legacy_aw.id
          LEFT JOIN LATERAL (
            SELECT
              STRING_AGG(DISTINCT aw.prize_name, ', ' ORDER BY aw.prize_name) AS prize_names,
              STRING_AGG(DISTINCT aw.prize_type, ', ' ORDER BY aw.prize_type) AS prize_types
            FROM book_awards ba
            JOIN awards aw ON aw.id = ba.award_id
            WHERE ba.book_id = b.id
          ) award_names ON true
          LEFT JOIN (
            SELECT
              book_id,
              COUNT(*) FILTER (WHERE liked = true) AS like_count,
              COUNT(*) FILTER (WHERE liked = false) AS dislike_count
            FROM (
              SELECT book_id, liked FROM user_book_likes
              UNION ALL
              SELECT book_id, liked FROM admin_book_likes
            ) all_votes
            GROUP BY book_id
          ) l ON b.id = l.book_id
          WHERE b.verified = true
            AND (
              b.award_id IS NOT NULL
              OR EXISTS (
                SELECT 1
                FROM book_awards ba
                JOIN awards aw ON aw.id = ba.award_id
                WHERE ba.book_id = b.id
                  AND COALESCE(aw.prize_type, '') <> 'career'
              )
            )
        ), career_enriched AS (
          SELECT
            NULL::integer AS book_id,
            'Career Award'::text AS title_of_winning_book,
            COALESCE(aw.prize_genre, 'Unknown') AS prize_genre,
            COALESCE(aa.prize_year, aw.prize_year) AS display_year,
            NULL::integer AS publication_year,
            COALESCE(aa.prize_year, aw.prize_year) AS prize_year,
            COALESCE(aa.verified, true) AS verified,
            aa.author_id,
            COALESCE(a.full_name, 'Unknown') AS author_name,
            aw.prize_name,
            'career'::text AS prize_type,
            0::integer AS like_count,
            0::integer AS dislike_count,
            COALESCE(aa.like_dislike, 'Not Applicable') AS like_dislike
          FROM author_awards aa
          JOIN awards aw ON aw.id = aa.award_id
          LEFT JOIN authors a ON a.id = aa.author_id
          WHERE COALESCE(aa.verified, true) = true
            AND COALESCE(aa.role, 'winner') = 'winner'
            AND COALESCE(aw.prize_type, '') = 'career'
            AND COALESCE(aa.prize_year, aw.prize_year) IS NOT NULL
        )
        SELECT *
        FROM (
          SELECT *
          FROM book_enriched
          ORDER BY RANDOM()
          LIMIT 8
        ) book_rows
        UNION ALL
        SELECT *
        FROM (
          SELECT *
          FROM career_enriched
          ORDER BY RANDOM()
          LIMIT 2
        ) career_rows;
      `);

      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching books from database:', error);
    return res.status(500).json({ message: 'Error fetching books', details: error.message });
  }
});

// ---------------------------------------------------------------------------
// All authors (for search)
// ---------------------------------------------------------------------------
router.get('/api/authors', cache.cacheMiddleware(CACHE_KEYS.SEARCH_BOOKS, cache.TTL.SEARCH_BOOKS), async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        'SELECT id AS author_id, last_name, given_name FROM authors ORDER BY last_name, given_name'
      );
      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return res.status(500).json({ message: 'Error fetching authors' });
  }
});

// ---------------------------------------------------------------------------
// Books by author
// ---------------------------------------------------------------------------
router.get('/api/books/:authorId', async (req, res) => {
  const { authorId } = req.params;

  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        `
          SELECT id AS book_id, title, genre AS prize_genre, publication_year, verified, author_id
          FROM books
          WHERE author_id = $1
          ORDER BY id;
        `,
        [authorId]
      );
      return result.rows;
    });

    return res.json(rows);
  } catch (error) {
    console.error(`Error fetching books for author ${authorId}:`, error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

// ---------------------------------------------------------------------------
// Full catalog for profile page (with JS-side deduplication)
// ---------------------------------------------------------------------------
router.get('/api/books-for-profile', cache.cacheMiddleware(CACHE_KEYS.BOOKS_FOR_PROFILE, cache.TTL.BOOKS_FOR_PROFILE), async (req, res) => {
  try {
    const books = await withClient(async (client) => {
      const result = await client.query(`
        WITH author_scope AS (
          SELECT
            scope_rows.author_id,
            COUNT(*) FILTER (WHERE scope_rows.prize_type = 'book') AS book_count,
            COUNT(*) FILTER (WHERE scope_rows.prize_type = 'career') AS career_count
          FROM (
            SELECT DISTINCT b.author_id, 'book'::text AS prize_type
            FROM books b
            WHERE b.verified = true
              AND b.role = 'winner'
              AND EXISTS (
                SELECT 1
                FROM book_awards ba
                JOIN awards aw ON aw.id = ba.award_id
                WHERE ba.book_id = b.id
                  AND COALESCE(aw.prize_type, '') <> 'career'
              )
            UNION
            SELECT DISTINCT aa.author_id, 'career'::text AS prize_type
            FROM author_awards aa
            JOIN awards aw ON aw.id = aa.award_id
            WHERE COALESCE(aa.verified, true) = true
              AND COALESCE(aa.role, 'winner') = 'winner'
              AND COALESCE(aw.prize_type, '') = 'career'
          ) scope_rows
          GROUP BY scope_rows.author_id
        ), book_candidates AS (
          SELECT DISTINCT ON (b.title, a.id)
            'book'::text AS entry_type,
            b.id AS entry_id,
            b.id AS book_id,
            NULL::integer AS author_award_id,
            b.title AS title_of_winning_book,
            CASE
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose' THEN 'Prose'
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry' THEN 'Poetry'
              WHEN COALESCE(TRIM(b.genre), '') = '' THEN 'Unknown'
              ELSE INITCAP(TRIM(b.genre))
            END AS prize_genre,
            COALESCE(a.full_name, 'Unknown Author') AS full_name,
            COALESCE(a.given_name, '') AS author_first_name,
            COALESCE(a.last_name, '') AS author_last_name,
            COALESCE(award_names.prize_names, ARRAY[legacy_aw.prize_name]) AS prize_names,
            COALESCE(award_names.prize_types, ARRAY[legacy_aw.prize_type]) AS prize_types,
            CASE
              WHEN COALESCE(author_scope.book_count, 0) > 0 AND COALESCE(author_scope.career_count, 0) > 0 THEN 'both'
              WHEN COALESCE(author_scope.career_count, 0) > 0 THEN 'career'
              ELSE 'book'
            END AS author_award_scope,
            COALESCE(
              b.prize_year,
              award_year_lookup.award_year,
              legacy_aw.prize_year
            )::text AS prize_year
          FROM books b
          LEFT JOIN authors a ON b.author_id = a.id
          LEFT JOIN awards legacy_aw ON b.award_id = legacy_aw.id
          LEFT JOIN LATERAL (
            SELECT MAX(aw.prize_year) AS award_year
            FROM book_awards ba
            JOIN awards aw ON aw.id = ba.award_id
            WHERE ba.book_id = b.id
              AND aw.prize_year IS NOT NULL
          ) award_year_lookup ON true
          LEFT JOIN LATERAL (
            SELECT ARRAY_AGG(DISTINCT aw.prize_name ORDER BY aw.prize_name) AS prize_names
                 , ARRAY_AGG(DISTINCT aw.prize_type ORDER BY aw.prize_type) AS prize_types
            FROM book_awards ba
            JOIN awards aw ON aw.id = ba.award_id
            WHERE ba.book_id = b.id
              AND COALESCE(aw.prize_type, '') <> 'career'
          ) award_names ON true
          LEFT JOIN author_scope ON author_scope.author_id = b.author_id
          WHERE (b.award_id IS NOT NULL OR EXISTS (SELECT 1 FROM book_awards ba WHERE ba.book_id = b.id))
            AND b.verified = true
            AND b.role = 'winner'
            AND COALESCE(a.full_name, '') <> ''
            AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
            AND COALESCE(
              b.prize_year,
              award_year_lookup.award_year,
              legacy_aw.prize_year
            ) IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM book_awards ba
              JOIN awards aw ON aw.id = ba.award_id
              WHERE ba.book_id = b.id
                AND COALESCE(aw.prize_type, '') <> 'career'
            )
          ORDER BY b.title, a.id
        ), career_candidates AS (
          SELECT
            'career'::text AS entry_type,
            aa.id AS entry_id,
            NULL::integer AS book_id,
            aa.id AS author_award_id,
            'Career Award'::text AS title_of_winning_book,
            'Unknown'::text AS prize_genre,
            COALESCE(a.full_name, 'Unknown Author') AS full_name,
            COALESCE(a.given_name, '') AS author_first_name,
            COALESCE(a.last_name, '') AS author_last_name,
            ARRAY[aw.prize_name] AS prize_names,
            ARRAY['career'::text] AS prize_types,
            CASE
              WHEN COALESCE(author_scope.book_count, 0) > 0 AND COALESCE(author_scope.career_count, 0) > 0 THEN 'both'
              WHEN COALESCE(author_scope.career_count, 0) > 0 THEN 'career'
              ELSE 'book'
            END AS author_award_scope,
            COALESCE(aa.prize_year, aw.prize_year)::text AS prize_year
          FROM author_awards aa
          JOIN awards aw ON aw.id = aa.award_id
          LEFT JOIN authors a ON aa.author_id = a.id
          LEFT JOIN author_scope ON author_scope.author_id = aa.author_id
          WHERE COALESCE(aa.verified, true) = true
            AND COALESCE(aa.role, 'winner') = 'winner'
            AND COALESCE(a.full_name, '') <> ''
            AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
            AND COALESCE(aa.prize_year, aw.prize_year) IS NOT NULL
            AND COALESCE(aw.prize_type, '') = 'career'
        ), catalog_candidates AS (
          SELECT DISTINCT ON (LOWER(b.title), b.author_id)
            'catalog'::text AS entry_type,
            b.id AS entry_id,
            b.id AS book_id,
            NULL::integer AS author_award_id,
            b.title AS title_of_winning_book,
            CASE
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose' THEN 'Prose'
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry' THEN 'Poetry'
              WHEN COALESCE(TRIM(b.genre), '') = '' THEN 'Unknown'
              ELSE INITCAP(TRIM(b.genre))
            END AS prize_genre,
            COALESCE(a.full_name, 'Unknown Author') AS full_name,
            COALESCE(a.given_name, '') AS author_first_name,
            COALESCE(a.last_name, '') AS author_last_name,
            ARRAY[]::text[] AS prize_names,
            ARRAY['catalog'::text] AS prize_types,
            CASE
              WHEN COALESCE(author_scope.book_count, 0) > 0 AND COALESCE(author_scope.career_count, 0) > 0 THEN 'both'
              WHEN COALESCE(author_scope.career_count, 0) > 0 THEN 'career'
              ELSE 'book'
            END AS author_award_scope,
            b.prize_year::text AS prize_year
          FROM books b
          LEFT JOIN authors a ON b.author_id = a.id
          LEFT JOIN author_scope ON author_scope.author_id = b.author_id
          WHERE b.role = 'catalog'
            AND COALESCE(a.full_name, '') <> ''
            AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
            AND (
              EXISTS (SELECT 1 FROM books bw WHERE bw.author_id = b.author_id AND bw.role = 'winner')
              OR EXISTS (SELECT 1 FROM author_awards aa WHERE aa.author_id = b.author_id)
            )
            AND NOT EXISTS (
              SELECT 1 FROM books bw
              WHERE bw.author_id = b.author_id
                AND LOWER(TRIM(bw.title)) = LOWER(TRIM(b.title))
                AND bw.role = 'winner'
            )
          ORDER BY LOWER(b.title), b.author_id, b.prize_year DESC NULLS LAST
        )
        SELECT *
        FROM book_candidates
        UNION ALL
        SELECT *
        FROM career_candidates
        UNION ALL
        SELECT *
        FROM catalog_candidates;
      `);

      const cleanAuthorName = (name) => {
        if (!name) return '';
        return name
          .replace(/[\[\(].*?[\]\)]/g, '')
          .replace(/&#\w+;/g, '')
          .trim()
          .replace(/\s+/g, ' ');
      };

      const dedupeMap = new Map();

      result.rows.forEach((book) => {
        let cleanTitle = book.title_of_winning_book;
        if (!cleanTitle) {
          cleanTitle = 'Career Award';
        } else {
          cleanTitle = cleanTitle.replace(/^['"]|['"]$/g, '');
          const parts = cleanTitle.split(/\s*\/\s*\|\s*|\s*\/\s*\$c:\s*/);
          if (parts.length > 0) cleanTitle = parts[0];
          cleanTitle = cleanTitle.replace(/\s*\|\s*\$c:.*$/g, '');
          cleanTitle = cleanTitle.replace(/\s*\|\s*$/, '');
          cleanTitle = cleanTitle.replace(/\s*\/\s*$/, '');
          cleanTitle = cleanTitle.replace(/\s+by\s+[A-Z][a-z\s]+\.?\s*$/i, '');
          cleanTitle = cleanTitle.replace(/[.]+$/g, '');
          cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim() || 'Unknown Title';
        }

        const authorFirstName = cleanAuthorName(book.author_first_name);
        const authorLastName = cleanAuthorName(book.author_last_name);
        const normalizedTitle = cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        const careerKeySuffix = book.entry_type === 'career'
          ? `|${(Array.isArray(book.prize_names) ? book.prize_names.join('|') : '').toLowerCase()}`
          : '';
        const dedupeKey = `${authorLastName.toLowerCase()}|${authorFirstName.toLowerCase()}|${normalizedTitle}|${book.prize_year}${careerKeySuffix}`;
        const prizeNames = Array.isArray(book.prize_names) ? book.prize_names.filter(Boolean) : [];
        const prizeTypes = Array.isArray(book.prize_types) ? book.prize_types.filter(Boolean) : [];

        if (!dedupeMap.has(dedupeKey)) {
          dedupeMap.set(dedupeKey, {
            entry_type: book.entry_type,
            entry_id: book.entry_id,
            book_id: book.book_id,
            author_award_id: book.author_award_id,
            clean_title: cleanTitle,
            prize_genre: book.prize_genre || 'Unknown',
            full_name: book.full_name,
            author_first_name: authorFirstName,
            author_last_name: authorLastName,
            prize_year: book.prize_year,
            prize_names_set: new Set(prizeNames),
            prize_types_set: new Set(prizeTypes),
            author_award_scope: book.author_award_scope || 'book',
          });
          return;
        }

        const existing = dedupeMap.get(dedupeKey);

        if (book.entry_type === 'book' && Number(book.book_id) < Number(existing.book_id)) {
          existing.entry_id = book.entry_id;
          existing.book_id = book.book_id;
        }

        if ((existing.prize_genre === 'Unknown' || !existing.prize_genre) && book.prize_genre) {
          existing.prize_genre = book.prize_genre;
        }

        prizeNames.forEach((name) => existing.prize_names_set.add(name));
        prizeTypes.forEach((name) => existing.prize_types_set.add(name));
      });

      return Array.from(dedupeMap.values()).map((entry) => ({
        entry_type: entry.entry_type,
        entry_id: entry.entry_id,
        book_id: entry.book_id,
        author_award_id: entry.author_award_id,
        clean_title: entry.clean_title,
        prize_genre: entry.prize_genre || 'Unknown',
        full_name: entry.full_name,
        author_first_name: entry.author_first_name,
        author_last_name: entry.author_last_name,
        prize_name: Array.from(entry.prize_names_set).join(', ') || 'N/A',
        prize_type: Array.from(entry.prize_types_set).join(', ') || 'book',
        author_award_scope: entry.author_award_scope,
        prize_year: entry.prize_year,
      }));
    });

    return res.json(books);
  } catch (error) {
    console.error('Error fetching books for profile:', error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

// ---------------------------------------------------------------------------
// Award-winners for search
// ---------------------------------------------------------------------------
router.get('/api/search-books-award-winners', cache.cacheMiddleware(CACHE_KEYS.SEARCH_BOOKS, cache.TTL.SEARCH_BOOKS), async (req, res) => {
  try {
    const books = await withClient(async (client) => {
      const result = await client.query(`
        WITH linked_book_awards AS (
          SELECT DISTINCT
            b.id AS book_id,
            b.title AS clean_title,
            CASE
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose' THEN 'Prose'
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry' THEN 'Poetry'
              WHEN COALESCE(TRIM(b.genre), '') = '' THEN 'Unknown'
              ELSE INITCAP(TRIM(b.genre))
            END AS prize_genre,
            COALESCE(a.full_name, 'Unknown Author') AS full_name,
            COALESCE(a.given_name, '') AS author_first_name,
            COALESCE(a.last_name, '') AS author_last_name,
            aw.prize_name,
            COALESCE(aw.prize_year, b.prize_year)::text AS prize_year
          FROM books b
          JOIN authors a ON a.id = b.author_id
          JOIN book_awards ba ON ba.book_id = b.id
          JOIN awards aw ON aw.id = ba.award_id
          WHERE b.verified = true
            AND b.role = 'winner'
            AND COALESCE(aw.prize_type, '') <> 'career'
            AND COALESCE(aw.prize_name, '') <> ''
            AND COALESCE(aw.prize_year, b.prize_year) IS NOT NULL
            AND COALESCE(a.full_name, '') <> ''
            AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
        ), legacy_book_awards AS (
          SELECT DISTINCT
            b.id AS book_id,
            b.title AS clean_title,
            CASE
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose' THEN 'Prose'
              WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry' THEN 'Poetry'
              WHEN COALESCE(TRIM(b.genre), '') = '' THEN 'Unknown'
              ELSE INITCAP(TRIM(b.genre))
            END AS prize_genre,
            COALESCE(a.full_name, 'Unknown Author') AS full_name,
            COALESCE(a.given_name, '') AS author_first_name,
            COALESCE(a.last_name, '') AS author_last_name,
            aw.prize_name,
            COALESCE(aw.prize_year, b.prize_year)::text AS prize_year
          FROM books b
          JOIN authors a ON a.id = b.author_id
          JOIN awards aw ON aw.id = b.award_id
          WHERE b.verified = true
            AND b.role = 'winner'
            AND COALESCE(aw.prize_type, '') <> 'career'
            AND COALESCE(aw.prize_name, '') <> ''
            AND COALESCE(aw.prize_year, b.prize_year) IS NOT NULL
            AND COALESCE(a.full_name, '') <> ''
            AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
            AND NOT EXISTS (
              SELECT 1
              FROM book_awards ba
              WHERE ba.book_id = b.id
            )
        )
        SELECT *
        FROM linked_book_awards
        UNION ALL
        SELECT *
        FROM legacy_book_awards
        ORDER BY author_last_name, author_first_name, clean_title, prize_year, prize_name;
      `);

      return result.rows;
    });

    return res.json(books);
  } catch (error) {
    console.error('Error fetching search-books award winners:', error);
    return res.status(500).json({ message: 'Error fetching search books' });
  }
});

module.exports = router;
