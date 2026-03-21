const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - started;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${elapsed}ms)`);
  });
  next();
});

// Accept optional client diagnostics without polluting logs with 404 noise.
app.post('/api/client-debug-log', (_req, res) => {
  res.status(204).end();
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const jwtSecret = process.env.JWT_SECRET;

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice('Bearer '.length);
}

function authenticateToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  return authenticateToken(req, res, () => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
  });
}

function authorizeSelfOrAdmin(getRequestedUserId) {
  return (req, res, next) => {
    authenticateToken(req, res, () => {
      const requestedUserId = Number(getRequestedUserId(req));
      const authenticatedUserId = Number(req.user?.id);

      if (req.user?.isAdmin || requestedUserId === authenticatedUserId) {
        return next();
      }

      return res.status(403).json({ message: 'Forbidden' });
    });
  };
}

async function generateUniqueId(client) {
  const result = await client.query("SELECT nextval('unique_id_seq') AS id");
  return result.rows[0].id;
}

async function withClient(handler, res) {
  const client = await pool.connect();

  try {
    return await handler(client);
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
}

async function resolveOrCreateUserIdForAdmin(adminRecord, passwordHashFallback, res) {
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
    }, res);
  } catch (error) {
    console.error('Admin user-link error (non-fatal):', error.message);
    return null;
  }
}

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

app.post('/signup', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Incorrect form submission - missing fields' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await withClient(async (client) => {
      const result = await client.query(
        'INSERT INTO users (username, email, hash) VALUES ($1, $2, $3) RETURNING id',
        [username.trim(), email.trim(), hash]
      );
      return result.rows[0];
    }, res);

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '2h' });
    return res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Signup error:', err);

    if (err.code === '23505') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    return res.status(500).json({ message: 'Error registering new user', error: err.message });
  }
});

app.post('/admin/login', async (req, res) => {
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
    }, res);

    if (!admin) {
      return res.status(400).json({ message: 'Admin not found' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Wrong credentials' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(admin, admin.password_hash, res);

    const token = jwt.sign({ id: admin.id, isAdmin: true }, jwtSecret, { expiresIn: '2h' });
    return res.json({ token, adminId: admin.id, userId: userId || null, username: admin.username, email: admin.email || null });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Error logging in as admin' });
  }
});

app.post('/admin/register', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const createdAdmin = await withClient(async (client) => {
      const adminCountResult = await client.query('SELECT COUNT(*)::int AS admin_count FROM admins');
      const adminCount = adminCountResult.rows[0]?.admin_count || 0;

      if (adminCount > 0) {
        return { blocked: true };
      }

      const resolvedUsername = (username || email.split('@')[0] || '').trim();

      if (!resolvedUsername) {
        throw new Error('A valid username could not be determined for the new admin account.');
      }

      const hash = await bcrypt.hash(password, 10);
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
    }, res);

    if (createdAdmin.blocked) {
      return res.status(403).json({ message: 'Admin registration is closed because an admin account already exists.' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(
      createdAdmin.admin,
      createdAdmin.passwordHash,
      res
    );

    const token = jwt.sign({ id: createdAdmin.admin.id, isAdmin: true }, jwtSecret, { expiresIn: '2h' });
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

app.get('/api/is-admin/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;

  if (Number(req.user.id) !== Number(userId)) {
    return res.status(403).json({ isAdmin: false, message: 'Access forbidden' });
  }

  try {
    const admin = await withClient(async (client) => {
      const result = await client.query('SELECT id, username FROM admins WHERE id = $1', [userId]);
      return result.rows[0] || null;
    }, res);

    if (!admin) {
      return res.status(404).json({ isAdmin: false, message: 'Admin not found' });
    }

    return res.json({ isAdmin: true, username: admin.username });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ message: 'Error checking admin status' });
  }
});

app.get('/admin/profile-user', requireAdmin, async (req, res) => {
  try {
    const admin = await withClient(async (client) => {
      const result = await client.query(
        'SELECT id, username, email, password_hash FROM admins WHERE id = $1 LIMIT 1',
        [req.user.id]
      );
      return result.rows[0] || null;
    }, res);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const userId = await resolveOrCreateUserIdForAdmin(admin, admin.password_hash, res);

    if (!userId) {
      return res.status(500).json({ message: 'Unable to resolve admin profile user' });
    }

    return res.json({ userId });
  } catch (error) {
    console.error('Error resolving admin profile user:', error);
    return res.status(500).json({ message: 'Error resolving admin profile user' });
  }
});

app.get('/api/unverified-books', requireAdmin, async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching unverified books:', error);
    return res.status(500).json({ message: 'Error fetching unverified books' });
  }
});

app.patch('/api/books/:bookId/verification', requireAdmin, async (req, res) => {
  const { bookId } = req.params;
  const { verified } = req.body;

  if (typeof verified !== 'boolean') {
    return res.status(400).json({ message: 'verified must be a boolean value' });
  }

  try {
    const rowCount = await withClient(async (client) => {
      if (verified) {
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

      const deleteResult = await client.query(
        'DELETE FROM books WHERE id = $1 AND source = $2',
        [Number(bookId), 'user_submitted']
      );

      return deleteResult.rowCount;
    }, res);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json({ message: 'Book verification status updated successfully' });
  } catch (error) {
    console.error('Error updating book verification status:', error);
    return res.status(500).json({ message: 'Error updating book verification status' });
  }
});

app.get('/api/verified-submitted-books', requireAdmin, async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching verified submitted books:', error);
    return res.status(500).json({ message: 'Error fetching verified submitted books' });
  }
});

app.delete('/api/admin/books/:bookId', requireAdmin, async (req, res) => {
  const { bookId } = req.params;

  try {
    const rowCount = await withClient(async (client) => {
      const result = await client.query(
        'DELETE FROM books WHERE id = $1 AND source = $2',
        [Number(bookId), 'user_submitted']
      );

      return result.rowCount;
    }, res);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.json({ message: 'Book removed successfully' });
  } catch (error) {
    console.error('Error removing submitted book:', error);
    return res.status(500).json({ message: 'Error removing submitted book' });
  }
});

app.post('/api/submit-book', authenticateToken, async (req, res) => {
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

  const parsedPrizeYear = prizeYear == null || prizeYear === '' ? null : Number(prizeYear);
  if (parsedPrizeYear !== null && !Number.isInteger(parsedPrizeYear)) {
    return res.status(400).json({ message: 'Prize year must be a whole number.' });
  }

  try {
    const insertedBook = await withClient(async (client) => {
      await client.query('BEGIN');

      try {
        const awardCheckResult = await client.query(
          'SELECT id, prize_type FROM awards WHERE id = $1 LIMIT 1',
          [parsedAwardId]
        );

        if (awardCheckResult.rows.length === 0) {
          throw new Error('Selected award does not exist.');
        }

        if ((awardCheckResult.rows[0].prize_type || '').toLowerCase() === 'career') {
          throw new Error('Only book awards can be used when submitting a book.');
        }

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
          authorId = existingAuthorResult.rows[0].id;
        } else {
          const nextAuthorIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM authors');
          const newAuthorId = nextAuthorIdResult.rows[0].id;
          const authorResult = await client.query(
            'INSERT INTO authors (id, given_name, last_name, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
            [newAuthorId, givenName.trim(), lastName.trim(), fullName.trim()]
          );
          authorId = authorResult.rows[0].id;
        }

        const nextBookRowIdResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 AS id FROM books');
        const rowId = nextBookRowIdResult.rows[0].id;
        const bookId = await generateUniqueId(client);
        const result = await client.query(
          `
            INSERT INTO books (id, book_id, title, author_id, prize_year, genre, verified, role, source, award_id)
            VALUES ($1, $2, $3, $4, $5, $6, false, 'pending', 'user_submitted', $7)
            RETURNING *;
          `,
          [rowId, bookId, titleOfWinningBook.trim(), authorId, parsedPrizeYear, prizeGenre || null, parsedAwardId]
        );

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
    }, res);

    return res.json(insertedBook);
  } catch (error) {
    console.error('Error submitting new book for verification:', error);

    if (error.message === 'Selected award does not exist.' || error.message === 'Only book awards can be used when submitting a book.') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Error submitting new book for verification' });
  }
});

app.post('/login', async (req, res) => {
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
    }, res);

    if (!user) {
      return res.status(400).json({ message: 'User not found - please sign up first' });
    }

    const isValid = await bcrypt.compare(password, user.hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '2h' });
    return res.json({ token, userId: user.id });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

app.get('/api/tableName', async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching books from database:', error);
    return res.status(500).json({ message: 'Error fetching books', details: error.message });
  }
});

app.get('/api/authors', async (req, res) => {
  try {
    const rows = await withClient(async (client) => {
      const result = await client.query(
        'SELECT id AS author_id, last_name, given_name FROM authors ORDER BY last_name, given_name'
      );
      return result.rows;
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return res.status(500).json({ message: 'Error fetching authors' });
  }
});

app.get('/api/books/:authorId', async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error(`Error fetching books for author ${authorId}:`, error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

app.get('/api/awards', async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching awards:', error);
    return res.status(500).json({ message: 'Error fetching awards' });
  }
});

app.get('/api/book-awards', async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching book awards:', error);
    return res.status(500).json({ message: 'Error fetching book awards' });
  }
});

app.get('/api/awards/:awardId', async (req, res) => {
  const { awardId } = req.params;

  try {
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
    }, res);

    if (rows === null) {
      return res.status(404).json({ message: 'Award not found' });
    }

    return res.json(rows);
  } catch (error) {
    console.error(`Error fetching books for award ${awardId}:`, error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

app.post('/api/like', authenticateToken, async (req, res) => {
  const { bookId, liked } = req.body;

  if (bookId == null || typeof liked !== 'boolean') {
    return res.status(400).json({ message: 'bookId and liked are required' });
  }

  try {
    const payload = await withClient(async (client) => {
      const isAdmin = Boolean(req.user?.isAdmin);
      const actorId = Number(req.user?.id);

      if (!Number.isInteger(actorId)) {
        throw new TypeError('Unable to resolve current user identity.');
      }

      const likesTable = isAdmin ? 'admin_book_likes' : 'user_book_likes';
      const actorColumn = isAdmin ? 'admin_id' : 'user_id';

      const existingVote = await client.query(
        `
          SELECT liked
          FROM ${likesTable}
          WHERE ${actorColumn} = $1 AND book_id = $2
          LIMIT 1;
        `,
        [actorId, bookId]
      );

      let currentVote = liked;

      if (existingVote.rows.length > 0) {
        const previousVote = existingVote.rows[0].liked;

        if (previousVote === liked) {
          await client.query(
            `
              DELETE FROM ${likesTable}
              WHERE ${actorColumn} = $1 AND book_id = $2;
            `,
            [actorId, bookId]
          );
          currentVote = null;
        } else {
          await client.query(
            `
              UPDATE ${likesTable}
              SET liked = $3, likedon = NOW()::date
              WHERE ${actorColumn} = $1 AND book_id = $2;
            `,
            [actorId, bookId, liked]
          );
          currentVote = liked;
        }
      } else {
        await client.query(
          `
            INSERT INTO ${likesTable} (${actorColumn}, book_id, liked, likedon)
            VALUES ($1, $2, $3, NOW()::date);
          `,
          [actorId, bookId, liked]
        );
      }

      const countsResult = await client.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN liked THEN 1 ELSE 0 END), 0)::int AS likes,
            COALESCE(SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END), 0)::int AS dislikes
          FROM (
            SELECT book_id, liked FROM user_book_likes
            UNION ALL
            SELECT book_id, liked FROM admin_book_likes
          ) all_votes
          WHERE book_id = $1;
        `,
        [bookId]
      );

      const counts = countsResult.rows[0];

      await client.query(
        `
          UPDATE books
          SET like_dislike = $2
          WHERE id = $1;
        `,
        [bookId, `${counts.likes} Likes / ${counts.dislikes} Dislikes`]
      );

      return {
        ...counts,
        currentVote,
      };
    }, res);

    return res.json({ message: 'Success', likes: payload.likes, dislikes: payload.dislikes, currentVote: payload.currentVote });
  } catch (error) {
    console.error('Error processing like/dislike', error);
    return res.status(500).json({ message: 'Error processing like/dislike' });
  }
});

app.get('/api/user/preference/:userId', authorizeSelfOrAdmin((req) => req.params.userId), async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await withClient(async (client) => {
      const result = await client.query(
        'SELECT username, reading_preference, favorite_genre FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    }, res);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({ message: 'Error fetching user preferences' });
  }
});

app.post('/api/user/preference/update', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
  const { userId, readingPreference, favoriteGenre } = req.body;

  try {
    await withClient(async (client) => {
      await client.query(
        'UPDATE users SET reading_preference = $1, favorite_genre = $2 WHERE id = $3',
        [readingPreference || null, favoriteGenre || null, userId]
      );
    }, res);

    return res.json({ message: 'User preferences updated successfully' });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return res.status(500).json({ message: 'Error updating user preferences' });
  }
});

app.get('/api/books-for-profile', async (req, res) => {
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
    }, res);

    return res.json(books);
  } catch (error) {
    console.error('Error fetching books for profile:', error);
    return res.status(500).json({ message: 'Error fetching books' });
  }
});

app.get('/api/search-books-award-winners', async (req, res) => {
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
    }, res);

    return res.json(books);
  } catch (error) {
    console.error('Error fetching search-books award winners:', error);
    return res.status(500).json({ message: 'Error fetching search books' });
  }
});

app.get('/api/user/:userId/preferred-books', authorizeSelfOrAdmin((req) => req.params.userId), async (req, res) => {
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
    }, res);

    return res.json(rows);
  } catch (error) {
    console.error("Error fetching user's preferred books:", error);
    return res.status(500).json({ message: "Error fetching user's preferred books" });
  }
});

app.post('/api/user/add-book', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
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
    }, res);

    if (rowCount === 0) {
      return res.status(409).json({ message: 'That entry is already in your profile.' });
    }

    return res.json({ message: 'Selection added to profile successfully' });
  } catch (error) {
    console.error('Error adding book to profile:', error);
    return res.status(500).json({ message: 'Error adding book to profile' });
  }
});

app.post('/api/user/remove-book', authorizeSelfOrAdmin((req) => req.body.userId), async (req, res) => {
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
    }, res);

    return res.json({ message: 'Entry removed from profile successfully' });
  } catch (error) {
    console.error('Error removing book from profile:', error);
    return res.status(500).json({ message: 'Error removing book from profile' });
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

async function startServer() {
  await ensureBookAwardsMapping();
  await ensureAuthorAwardsModel();
  await ensureLikeDislikeInfrastructure();

  const server = app.listen(5000, () => {
    console.log('Server is running on port 5000');
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
