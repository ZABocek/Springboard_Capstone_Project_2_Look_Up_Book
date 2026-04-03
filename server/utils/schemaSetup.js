'use strict';

/**
 * One-time (idempotent) DDL helpers run at server startup.
 *
 * Each function checks whether the schema objects it needs already exist
 * before creating them, so they are safe to run on every boot without
 * dropping or truncating any data.  This is a requirement enforced by the
 * launcher (launch.bat) and verified by the launcher test suite
 * (server/__tests__/launcher.test.js).
 *
 * Exports:
 *   resolveOrCreateUserIdForAdmin
 *   ensureBookAwardsMapping
 *   ensureAuthorAwardsModel
 *   ensureLikeDislikeInfrastructure
 */

const { pool } = require('../db');
const { withClient } = require('./dbHelpers');

// ---------------------------------------------------------------------------
// Admin helper
// ---------------------------------------------------------------------------

/**
 * Find the `users` row linked to an admin by email, or create one if it does
 * not yet exist.  This lets admins use all user-facing features (profile,
 * saved books, etc.) without maintaining a separate identity.
 *
 * Returns the user id on success, or null if the admin has no email address
 * or if the lookup / insert fails for any reason (non-fatal).
 */
async function resolveOrCreateUserIdForAdmin(adminRecord, passwordHashFallback) {
  if (!adminRecord?.email) {
    return null;
  }

  try {
    return await withClient(async (client) => {
      const normalizedEmail = adminRecord.email.trim().toLowerCase();
      const existing = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);

      if (existing.rows[0]) {
        return existing.rows[0].id;
      }

      const safeUsername = `admin_${adminRecord.id}_${adminRecord.username || 'user'}`;
      const inserted = await client.query(
        'INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id',
        [safeUsername, normalizedEmail, passwordHashFallback || 'admin_profile_link']
      );

      if (inserted.rows[0]) {
        return inserted.rows[0].id;
      }

      const retry = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
      return retry.rows[0]?.id || null;
    });
  } catch (error) {
    console.error('Admin user-link error (non-fatal):', error.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Schema setup: book_awards junction table
// ---------------------------------------------------------------------------

/**
 * Creates the `book_awards` junction table if it does not already exist,
 * adds the necessary indexes, and back-fills rows from `books.award_id` so
 * that every book with a legacy award_id is represented in the new table.
 *
 * Idempotent — safe to call on every server boot.
 */
async function ensureBookAwardsMapping() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.book_awards (
        id SERIAL PRIMARY KEY,
        book_id integer NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
        award_id integer NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
        created_at timestamp without time zone DEFAULT now(),
        UNIQUE (book_id, award_id)
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_book_awards_book_id ON public.book_awards(book_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_book_awards_award_id ON public.book_awards(award_id);');

    await client.query(`
      INSERT INTO public.book_awards (book_id, award_id)
      SELECT DISTINCT b.id, b.award_id
      FROM public.books b
      WHERE b.award_id IS NOT NULL
      ON CONFLICT (book_id, award_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Book-awards mapping ensured.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Schema setup: author_awards + career-award migration
// ---------------------------------------------------------------------------

/**
 * Creates the `author_awards` table for career-type awards (where the prize
 * is given to an author's body of work rather than a specific book), migrates
 * existing career-award rows out of `books` into `author_awards`, and updates
 * `user_preferred_books` to reference the new table via `author_award_id`.
 *
 * Also adds the optional `author_award_id` FK column to `user_preferred_books`
 * and enforces a CHECK constraint that ensures each saved preference references
 * exactly one of (book_id, author_award_id).
 *
 * Idempotent — safe to call on every server boot.
 */
async function ensureAuthorAwardsModel() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.author_awards (
        id SERIAL PRIMARY KEY,
        author_id integer NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
        award_id integer NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
        prize_year integer,
        role varchar(100),
        source varchar(100),
        verified boolean DEFAULT true,
        created_at timestamp without time zone DEFAULT now(),
        UNIQUE (author_id, award_id, prize_year, role, source)
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_author_awards_author_id ON public.author_awards(author_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_author_awards_award_id ON public.author_awards(award_id);');

    await client.query(`
      ALTER TABLE public.author_awards
      ADD COLUMN IF NOT EXISTS prize_amount numeric;
    `);

    await client.query(`
      ALTER TABLE public.author_awards
      ADD COLUMN IF NOT EXISTS like_dislike text DEFAULT 'Not Applicable';
    `);

    await client.query(`
      UPDATE public.author_awards aa
      SET prize_amount = aw.prize_amount
      FROM public.awards aw
      WHERE aa.award_id = aw.id
        AND aa.prize_amount IS NULL
        AND aw.prize_amount IS NOT NULL;
    `);

    await client.query(`
      UPDATE public.author_awards
      SET like_dislike = 'Not Applicable'
      WHERE like_dislike IS NULL OR TRIM(like_dislike) = '';
    `);

    await client.query(`
      ALTER TABLE public.user_preferred_books
      ADD COLUMN IF NOT EXISTS author_award_id integer REFERENCES public.author_awards(id) ON DELETE CASCADE;
    `);

    await client.query('ALTER TABLE public.user_preferred_books ALTER COLUMN book_id DROP NOT NULL;');

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferred_books_user_book_unique
      ON public.user_preferred_books (user_id, book_id)
      WHERE book_id IS NOT NULL;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferred_books_user_author_award_unique
      ON public.user_preferred_books (user_id, author_award_id)
      WHERE author_award_id IS NOT NULL;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'user_preferred_books_exactly_one_ref'
        ) THEN
          ALTER TABLE public.user_preferred_books
          ADD CONSTRAINT user_preferred_books_exactly_one_ref
          CHECK (
            (book_id IS NOT NULL AND author_award_id IS NULL)
            OR (book_id IS NULL AND author_award_id IS NOT NULL)
          );
        END IF;
      END
      $$;
    `);

    await client.query(`
      WITH career_books AS (
        SELECT DISTINCT
          b.author_id,
          COALESCE(ba.award_id, b.award_id) AS award_id,
          COALESCE(b.prize_year, aw.prize_year) AS prize_year,
          COALESCE(b.role, 'winner') AS role,
          COALESCE(b.source, 'major_literary_prizes') AS source,
          COALESCE(b.verified, true) AS verified
        FROM public.books b
        LEFT JOIN public.book_awards ba ON ba.book_id = b.id
        LEFT JOIN public.awards aw ON aw.id = COALESCE(ba.award_id, b.award_id)
        WHERE b.author_id IS NOT NULL
          AND COALESCE(aw.prize_type, '') = 'career'
      )
      INSERT INTO public.author_awards (author_id, award_id, prize_year, role, source, verified)
      SELECT author_id, award_id, prize_year, role, source, verified
      FROM career_books
      WHERE award_id IS NOT NULL
      ON CONFLICT (author_id, award_id, prize_year, role, source) DO NOTHING;
    `);

    await client.query(`
      WITH career_books AS (
        SELECT DISTINCT
          b.id AS legacy_book_id,
          b.author_id,
          COALESCE(ba.award_id, b.award_id) AS award_id,
          COALESCE(b.prize_year, aw.prize_year) AS prize_year,
          COALESCE(b.role, 'winner') AS role,
          COALESCE(b.source, 'major_literary_prizes') AS source
        FROM public.books b
        LEFT JOIN public.book_awards ba ON ba.book_id = b.id
        LEFT JOIN public.awards aw ON aw.id = COALESCE(ba.award_id, b.award_id)
        WHERE b.author_id IS NOT NULL
          AND COALESCE(aw.prize_type, '') = 'career'
      )
      UPDATE public.user_preferred_books upb
      SET author_award_id = aa.id,
          book_id = NULL
      FROM career_books cb
      JOIN public.author_awards aa
        ON aa.author_id = cb.author_id
       AND aa.award_id = cb.award_id
       AND COALESCE(aa.prize_year, -1) = COALESCE(cb.prize_year, -1)
       AND COALESCE(aa.role, '') = COALESCE(cb.role, '')
       AND COALESCE(aa.source, '') = COALESCE(cb.source, '')
      WHERE upb.book_id = cb.legacy_book_id
        AND upb.author_award_id IS NULL;
    `);

    await client.query(`
      DELETE FROM public.books b
      USING (
        SELECT DISTINCT b2.id
        FROM public.books b2
        LEFT JOIN public.book_awards ba ON ba.book_id = b2.id
        LEFT JOIN public.awards aw ON aw.id = COALESCE(ba.award_id, b2.award_id)
        WHERE COALESCE(aw.prize_type, '') = 'career'
      ) doomed
      WHERE b.id = doomed.id;
    `);

    await client.query('COMMIT');
    console.log('Author-awards model ensured.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Schema setup: like/dislike tables + admins table
// ---------------------------------------------------------------------------

/**
 * Creates `admins`, `user_book_likes`, and `admin_book_likes` tables if they
 * do not exist, adds missing columns to any existing `admins` table (email,
 * password_hash), and back-fills the `books.like_dislike` summary column so
 * every book starts with a "0 Likes / 0 Dislikes" display string.
 *
 * Handles legacy `admins` tables that have a plain-text `password` column by
 * copying the value into `password_hash` without breaking existing deployments.
 *
 * Idempotent — safe to call on every server boot.
 */
async function ensureLikeDislikeInfrastructure() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);

    await client.query(`
      ALTER TABLE public.admins
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);

    await client.query(`
      ALTER TABLE public.admins
      ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique
      ON public.admins ((LOWER(email)))
      WHERE email IS NOT NULL;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'admins'
            AND column_name = 'password'
        ) THEN
          UPDATE public.admins
          SET password_hash = COALESCE(NULLIF(password_hash, ''), password)
          WHERE password_hash IS NULL OR password_hash = '';
        END IF;
      END
      $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'admins'
            AND column_name = 'password'
        ) THEN
          UPDATE public.admins
          SET password = COALESCE(NULLIF(password, ''), password_hash)
          WHERE password IS NULL OR TRIM(password) = '';

          EXECUTE 'ALTER TABLE public.admins ALTER COLUMN password DROP NOT NULL';
        END IF;
      END
      $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_book_likes (
        id SERIAL PRIMARY KEY,
        user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        book_id integer NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
        liked boolean NOT NULL,
        likedon date DEFAULT CURRENT_DATE,
        UNIQUE (user_id, book_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.admin_book_likes (
        id SERIAL PRIMARY KEY,
        admin_id integer NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
        book_id integer NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
        liked boolean NOT NULL,
        likedon date DEFAULT CURRENT_DATE,
        UNIQUE (admin_id, book_id)
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_user_book_likes_book_id ON public.user_book_likes(book_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_book_likes_book_id ON public.admin_book_likes(book_id);');

    await client.query(`
      ALTER TABLE public.books
      ADD COLUMN IF NOT EXISTS like_dislike text;
    `);

    await client.query(`
      UPDATE public.books b
      SET like_dislike = CONCAT(
        COALESCE(v.likes, 0),
        ' Likes / ',
        COALESCE(v.dislikes, 0),
        ' Dislikes'
      )
      FROM (
        SELECT
          book_id,
          SUM(CASE WHEN liked THEN 1 ELSE 0 END)::int AS likes,
          SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END)::int AS dislikes
        FROM (
          SELECT book_id, liked FROM public.user_book_likes
          UNION ALL
          SELECT book_id, liked FROM public.admin_book_likes
        ) all_votes
        GROUP BY book_id
      ) v
      WHERE b.id = v.book_id;
    `);

    await client.query(`
      UPDATE public.books
      SET like_dislike = '0 Likes / 0 Dislikes'
      WHERE like_dislike IS NULL OR TRIM(like_dislike) = '';
    `);

    await client.query(`
      ALTER TABLE public.author_awards
      ADD COLUMN IF NOT EXISTS like_dislike text DEFAULT 'Not Applicable';
    `);

    await client.query(`
      UPDATE public.author_awards
      SET like_dislike = 'Not Applicable'
      WHERE like_dislike IS NULL OR TRIM(like_dislike) = '';
    `);

    await client.query('COMMIT');
    console.log('Like/dislike infrastructure ensured.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  resolveOrCreateUserIdForAdmin,
  ensureBookAwardsMapping,
  ensureAuthorAwardsModel,
  ensureLikeDislikeInfrastructure,
};
