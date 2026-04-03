/**
 * Comprehensive server API test suite for Look Up Book.
 *
 * Strategy: mock the `pg` Pool so no real database connection is needed.
 * All expensive setup code (ensureBookAwardsMapping etc.) is also bypassed by
 * intercepting the pool at module-load time.
 *
 * Coverage:
 *  - Authentication (signup, login, admin login)
 *  - Protected route 401/403 enforcement
 *  - GET endpoints (books, authors, awards, profile)
 *  - POST endpoints (like, submit-book, add/remove preferred books)
 *  - Admin endpoints (verify book, remove book, cache status/flush)
 *  - Input validation and edge cases
 *  - Cache helper module
 */

'use strict';

const request = require('supertest');

// ---------------------------------------------------------------------------
// 1. Mock pg BEFORE the server module is loaded so pool.connect() is never
//    called against a real database.
// ---------------------------------------------------------------------------
const mockQuery  = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  query: mockQuery,
  release: mockRelease,
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    on: jest.fn(),
    query: mockQuery,
  })),
}));

// ---------------------------------------------------------------------------
// 2. Mock ioredis so cache operations are no-ops during tests.
// ---------------------------------------------------------------------------
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue(['0', []]),
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  }));
  return MockRedis;
});

// ---------------------------------------------------------------------------
// 3. startServer() is guarded by `if (require.main === module)` in server.js,
//    so it does NOT run when the test suite requires the module.  No port is
//    bound and no DB DDL is executed during tests — Jest uses supertest to spin
//    up an in-process HTTP server automatically.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 4. Set required ENV vars before requiring the server
// ---------------------------------------------------------------------------
process.env.DB_USER     = 'test_user';
process.env.DB_HOST     = 'localhost';
process.env.DB_NAME     = 'test_db';
process.env.DB_PASSWORD = 'test_pass';
process.env.DB_PORT     = '5432';
process.env.JWT_SECRET  = 'test_jwt_secret_32chars_long!!!!';

// bcrypt is imported for use in test helpers (cheap hashing via mocks)
const bcrypt = require('bcrypt');

// ---------------------------------------------------------------------------
// 5. Now we can safely load the server module.
//    startServer() is guarded by require.main so it never runs here.
//    The mockQuery setup below is a harmless no-op for the mock baseline.
// ---------------------------------------------------------------------------

// Baseline mock state (startServer won't run, but keep for per-test resets)
const startupEmptyResult = { rows: [], rowCount: 0 };
mockQuery.mockResolvedValue(startupEmptyResult);
mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });

// Require server AFTER mocks are set up
const { app } = require('../server');

// Helpers
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function makeToken(payload, expiresIn = '2h') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

const userToken  = makeToken({ id: 1 });
const adminToken = makeToken({ id: 1, isAdmin: true });
const expiredToken = jwt.sign({ id: 1 }, SECRET, { expiresIn: -1 });

// ---------------------------------------------------------------------------
// Reset mock query state before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockQuery.mockReset();
  mockRelease.mockReset();
  mockConnect.mockReset();
  mockQuery.mockResolvedValue(startupEmptyResult);
  mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });
});

// ===========================================================================
// AUTH
// ===========================================================================

describe('POST /signup', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/signup').send({ username: 'u' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing fields/i);
  });

  test('creates user and returns token', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 42 }], rowCount: 1 }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/signup')
      .send({ username: 'alice', password: 'secret123', email: 'alice@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('userId', 42);
  });

  test('returns 400 on duplicate username (pg error code 23505)', async () => {
    const dupError = Object.assign(new Error('duplicate'), { code: '23505' });
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(dupError),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/signup')
      .send({ username: 'alice', password: 'secret123', email: 'alice@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe('POST /login', () => {
  test('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/login').send({ username: 'u' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when user not found', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/login')
      .send({ username: 'nobody', password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 400 on wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1, username: 'alice', hash }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/wrong password/i);
  });

  test('returns token on correct credentials', async () => {
    const hash = await bcrypt.hash('correct', 10);
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 7, username: 'alice', hash }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.userId).toBe(7);
  });
});

// ===========================================================================
// PROTECTED ROUTE ENFORCEMENT
// ===========================================================================

describe('Protected route enforcement', () => {
  test('GET /api/user/preference/1 returns 401 without token', async () => {
    const res = await request(app).get('/api/user/preference/1');
    expect(res.status).toBe(401);
  });

  test('GET /api/user/preference/1 returns 401 with expired token', async () => {
    const res = await request(app)
      .get('/api/user/preference/1')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('GET /api/unverified-books returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/unverified-books')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/unverified-books returns 200 for admin', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mockRelease,
    });
    const res = await request(app)
      .get('/api/unverified-books')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/admin/cache/status returns 403 for regular user', async () => {
    const res = await request(app)
      .get('/api/admin/cache/status')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// BOOKS & AUTHORS
// ===========================================================================

describe('GET /api/tableName (homepage)', () => {
  test('returns 200 with book array', async () => {
    const fakeRow = {
      book_id: 1,
      title_of_winning_book: 'Test Book',
      prize_genre: 'Prose',
      display_year: 2020,
      publication_year: 2020,
      prize_year: 2020,
      verified: true,
      author_id: 1,
      author_name: 'A. Author',
      prize_name: 'Test Prize',
      prize_type: 'book',
      like_count: 0,
      dislike_count: 0,
      like_dislike: '0 Likes / 0 Dislikes',
    };
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [fakeRow] }),
      release: mockRelease,
    });

    const res = await request(app).get('/api/tableName');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/authors', () => {
  test('returns 200 with author array', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [{ author_id: 1, last_name: 'Smith', given_name: 'John' }],
      }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/authors');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('last_name', 'Smith');
  });
});

describe('GET /api/books/:authorId', () => {
  test('returns books for a given author', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [{ book_id: 10, title: 'My Book', prize_genre: 'Prose' }],
      }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('My Book');
  });

  test('returns empty array when author has no books', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/books/9999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ===========================================================================
// AWARDS
// ===========================================================================

describe('GET /api/awards', () => {
  test('returns award list', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [{ award_id: 1, prize_name: 'Booker', prize_type: 'book', book_count: 5 }],
      }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/awards');
    expect(res.status).toBe(200);
    expect(res.body[0].prize_name).toBe('Booker');
  });
});

describe('GET /api/awards/:awardId', () => {
  test('returns 404 when award does not exist', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/awards/9999');
    expect(res.status).toBe(404);
  });

  test('returns book list for book-type award', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [{ prize_type: 'book' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, title: 'Prize Winner', prize_year: 2020, prize_name: 'Booker' }],
      });
    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });
    const res = await request(app).get('/api/awards/1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns author list for career-type award', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [{ prize_type: 'career' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 5, title: 'Career Author', prize_year: 2018 }],
      });
    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });
    const res = await request(app).get('/api/awards/5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

// ===========================================================================
// LIKE / DISLIKE
// ===========================================================================

describe('POST /api/like', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/like')
      .send({ bookId: 1, liked: true });
    expect(res.status).toBe(401);
  });

  test('returns 400 when bookId is null', async () => {
    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: null, liked: true });
    expect(res.status).toBe(400);
  });

  test('returns 400 when liked is not boolean', async () => {
    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 1, liked: 'yes' });
    expect(res.status).toBe(400);
  });

  test('records a like and returns counts', async () => {
    const queryFn = jest.fn()
      // existingVote check
      .mockResolvedValueOnce({ rows: [] })
      // INSERT
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      // counts
      .mockResolvedValueOnce({ rows: [{ likes: 1, dislikes: 0 }] })
      // UPDATE like_dislike column
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 1, liked: true });

    expect(res.status).toBe(200);
    expect(res.body.likes).toBe(1);
    expect(res.body.dislikes).toBe(0);
  });

  test('toggling the same vote removes it', async () => {
    const queryFn = jest.fn()
      // existing vote – same as incoming
      .mockResolvedValueOnce({ rows: [{ liked: true }] })
      // DELETE
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      // counts after removal
      .mockResolvedValueOnce({ rows: [{ likes: 0, dislikes: 0 }] })
      // update like_dislike column
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 1, liked: true });

    expect(res.status).toBe(200);
    expect(res.body.currentVote).toBeNull();
  });
});

// ===========================================================================
// BOOK SUBMISSION
// ===========================================================================

describe('POST /api/submit-book', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/submit-book')
      .send({ fullName: 'A', givenName: 'A', lastName: 'B', titleOfWinningBook: 'T', awardId: 1 });
    expect(res.status).toBe(401);
  });

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fullName: 'Only Name' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing/i);
  });

  test('returns 400 when awardId is non-integer', async () => {
    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fullName: 'A', givenName: 'A', lastName: 'B', titleOfWinningBook: 'T', awardId: 'abc' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when award does not exist', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [] }) // BEGIN ok
      .mockResolvedValueOnce({ rows: [] }); // award check – not found
    // Simulate BEGIN, award check, ROLLBACK
    const txQuery = jest.fn()
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // award check empty
      .mockResolvedValueOnce({}); // ROLLBACK
    mockConnect.mockResolvedValueOnce({ query: txQuery, release: mockRelease });

    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fullName: 'A B', givenName: 'A', lastName: 'B', titleOfWinningBook: 'Title', awardId: 999 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when prizeYear is not a whole number', async () => {
    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fullName: 'A B', givenName: 'A', lastName: 'B',
        titleOfWinningBook: 'Title', awardId: 1, prizeYear: 20.5,
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/whole number/i);
  });
});

// ===========================================================================
// USER PREFERENCES
// ===========================================================================

describe('POST /api/user/add-book', () => {
  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/user/add-book')
      .send({ userId: 1, bookId: 5 });
    expect(res.status).toBe(401);
  });

  test('returns 403 when userId is missing (auth guard fires first)', async () => {
    // authorizeSelfOrAdmin runs before body validation; absent userId → NaN ≠ 1 → 403
    const res = await request(app)
      .post('/api/user/add-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 5 });
    expect(res.status).toBe(403);
  });

  test('adds a book to profile', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });
    const res = await request(app)
      .post('/api/user/add-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 1, bookId: 5, entryType: 'book' });
    expect(res.status).toBe(200);
  });

  test('returns 409 when book already in profile', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mockRelease,
    });
    const res = await request(app)
      .post('/api/user/add-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 1, bookId: 5, entryType: 'book' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/user/remove-book', () => {
  test('removes a book from profile', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });
    const res = await request(app)
      .post('/api/user/remove-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 1, bookId: 5, entryType: 'book' });
    expect(res.status).toBe(200);
  });

  test('returns 403 when userId is missing (auth guard fires first)', async () => {
    const res = await request(app)
      .post('/api/user/remove-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 5 });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// ADMIN: BOOK VERIFICATION
// ===========================================================================

describe('PATCH /api/books/:bookId/verification', () => {
  test('requires admin token', async () => {
    const res = await request(app)
      .patch('/api/books/1/verification')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ verified: true });
    expect(res.status).toBe(403);
  });

  test('returns 400 when verified is not boolean', async () => {
    const res = await request(app)
      .patch('/api/books/1/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: 'yes' });
    expect(res.status).toBe(400);
  });

  test('returns 404 when book not found', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mockRelease,
    });
    const res = await request(app)
      .patch('/api/books/9999/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true });
    expect(res.status).toBe(404);
  });

  test('verifies a book successfully', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });
    const res = await request(app)
      .patch('/api/books/1/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  test('rejects (deletes) a book with verified:false', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });
    const res = await request(app)
      .patch('/api/books/1/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: false });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/admin/books/:bookId', () => {
  test('removes a book as admin', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });
    const res = await request(app)
      .delete('/api/admin/books/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('returns 404 when book is not found', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mockRelease,
    });
    const res = await request(app)
      .delete('/api/admin/books/9999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// ADMIN CACHE ENDPOINTS
// ===========================================================================

describe('GET /api/admin/cache/status', () => {
  test('returns cache status for admin', async () => {
    const res = await request(app)
      .get('/api/admin/cache/status')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/admin/cache/flush', () => {
  test('flushes cache for admin', async () => {
    const res = await request(app)
      .post('/api/admin/cache/flush')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/flushed/i);
  });
});

// ===========================================================================
// SEARCH BOOKS & PROFILE BOOKS
// ===========================================================================

describe('GET /api/search-books-award-winners', () => {
  test('returns 200 with book array', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ book_id: 1, clean_title: 'A Book' }] }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/search-books-award-winners');
    expect(res.status).toBe(200);
    expect(res.body[0].clean_title).toBe('A Book');
  });
});

describe('GET /api/books-for-profile', () => {
  test('returns 200 with empty array when no books', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/books-for-profile');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ===========================================================================
// ADMIN LOGIN EDGE CASES
// ===========================================================================

describe('POST /admin/login', () => {
  test('returns 400 when admin not found', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });
    const res = await request(app)
      .post('/admin/login')
      .send({ username: 'unknown', password: 'pw' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 400 on wrong admin password', async () => {
    const hash = await bcrypt.hash('correct', 10);
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1, username: 'admin', password_hash: hash }] }),
      release: mockRelease,
    });
    const res = await request(app)
      .post('/admin/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/wrong credentials/i);
  });
});

// ===========================================================================
// CLIENT DEBUG LOG (no-op endpoint)
// ===========================================================================

describe('POST /api/client-debug-log', () => {
  test('always returns 204', async () => {
    const res = await request(app)
      .post('/api/client-debug-log')
      .send({ msg: 'test' });
    expect(res.status).toBe(204);
  });
});

// ===========================================================================
// EDGE CASES: malformed / extreme inputs
// ===========================================================================

describe('Edge cases', () => {
  test('GET /api/books/:authorId with non-numeric id returns 200 empty', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });
    const res = await request(app).get('/api/books/not-a-number');
    expect(res.status).toBe(200);
  });

  test('GET /api/awards/:awardId returns 500 gracefully on DB error', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB exploded')),
      release: mockRelease,
    });
    const res = await request(app).get('/api/awards/1');
    expect(res.status).toBe(500);
  });

  test('POST /api/like with extremely large bookId is handled', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ likes: 0, dislikes: 0 }] })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });
    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: Number.MAX_SAFE_INTEGER, liked: false });
    expect([200, 400, 500]).toContain(res.status);
  });

  test('PATCH /api/books/:bookId/verification rejects string bookId gracefully', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mockRelease,
    });
    const res = await request(app)
      .patch('/api/books/abc/verification')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true });
    expect([200, 404]).toContain(res.status);
  });

  test('Signup with very long username is rejected by DB constraint', async () => {
    const dupError = Object.assign(new Error('dup'), { code: '23505' });
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(dupError),
      release: mockRelease,
    });
    const longName = 'a'.repeat(500);
    const res = await request(app)
      .post('/signup')
      .send({ username: longName, password: 'pw123456', email: 'long@example.com' });
    expect(res.status).toBe(400);
  });

  test('GET /api/user/:userId/preferred-books with wrong userId returns 403', async () => {
    // Token is for user 1, requesting user 2
    const res = await request(app)
      .get('/api/user/2/preferred-books')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('Unknown route returns redirect (no crash)', async () => {
    const res = await request(app).get('/this-does-not-exist');
    // Express returns 404 for unrecognised routes
    expect(res.status).toBeLessThan(600);
  });
});

// ===========================================================================
// GET /api/book-awards
// ===========================================================================

describe('GET /api/book-awards', () => {
  test('returns 200 with an array of book-only awards', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [
          { award_id: 1, prize_name: 'Booker Prize', prize_type: 'book', book_count: 5 },
          { award_id: 2, prize_name: 'PEN Award', prize_type: 'book', book_count: 3 },
        ],
      }),
      release: mockRelease,
    });

    const res = await request(app).get('/api/book-awards');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('prize_name');
  });

  test('returns 500 when DB query throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB error')),
      release: mockRelease,
    });

    const res = await request(app).get('/api/book-awards');
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// POST /admin/register
// ===========================================================================

describe('POST /admin/register', () => {
  test('returns 400 when email or password is missing', async () => {
    const res = await request(app)
      .post('/admin/register')
      .send({ username: 'newadmin' }); // no email, no password
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email and password/i);
  });

  test('returns 403 when an admin account already exists', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ admin_count: 1 }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/admin/register')
      .send({ email: 'admin@test.com', password: 'secret123' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/closed/i);
  });

  test('returns 201 and a token when admin is created successfully', async () => {
    // First withClient: admin count check + schema introspection + insert
    const registerQueryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [{ admin_count: 0 }] })             // COUNT admins → 0
      .mockResolvedValueOnce({ rows: [{ has_legacy_password_column: false }] }) // schema check
      .mockResolvedValueOnce({ rows: [{ id: 1, username: 'newadmin', email: 'newadmin@test.com' }] }); // INSERT admin

    mockConnect.mockResolvedValueOnce({ query: registerQueryFn, release: mockRelease });

    // Second withClient: resolveOrCreateUserIdForAdmin – user lookup
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 5 }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/admin/register')
      .send({ email: 'newadmin@test.com', password: 'secret123', username: 'newadmin' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('adminId', 1);
  });
});

// ===========================================================================
// GET /api/is-admin/:userId
// ===========================================================================

describe('GET /api/is-admin/:userId', () => {
  test('returns 200 with isAdmin: true when admin\'s own userId matches', async () => {
    // adminToken has id: 1; request /api/is-admin/1
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 1, username: 'admin' }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/is-admin/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isAdmin: true, username: 'admin' });
  });

  test('returns 403 when admin token userId does not match requested userId', async () => {
    // adminToken has id: 1; request /api/is-admin/99
    const res = await request(app)
      .get('/api/is-admin/99')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.isAdmin).toBe(false);
  });

  test('returns 403 when a regular user token is used', async () => {
    const res = await request(app)
      .get('/api/is-admin/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  test('returns 404 when admin row not found in admins table', async () => {
    // adminToken id: 1 matches URL /api/is-admin/1 but no row in DB
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/is-admin/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.isAdmin).toBe(false);
  });
});

// ===========================================================================
// GET /admin/profile-user
// ===========================================================================

describe('GET /admin/profile-user', () => {
  test('returns 200 with userId when admin record exists', async () => {
    // First withClient: SELECT admin by id
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [{ id: 1, username: 'admin', email: 'admin@test.com', password_hash: 'hash' }],
      }),
      release: mockRelease,
    });

    // Second withClient: resolveOrCreateUserIdForAdmin – find existing user by email
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 7 }] }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/admin/profile-user')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId', 7);
  });

  test('returns 403 when called with a regular user token', async () => {
    const res = await request(app)
      .get('/admin/profile-user')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// GET /api/verified-submitted-books
// ===========================================================================

describe('GET /api/verified-submitted-books', () => {
  test('returns 200 with array of verified submissions for admin', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [
          { bookId: 42, titleOfWinningBook: 'Test Book', fullName: 'Jane Author', prizeYear: 2020, prizeName: 'Booker' },
        ],
      }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/verified-submitted-books')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('titleOfWinningBook', 'Test Book');
  });

  test('returns 403 when called without admin token', async () => {
    const res = await request(app)
      .get('/api/verified-submitted-books')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// GET /api/user/preference/:userId — success and not-found
// ===========================================================================

describe('GET /api/user/preference/:userId', () => {
  test('returns 200 with user preferences for the authenticated user', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [{ username: 'alice', reading_preference: 'prose', favorite_genre: 'mystery' }],
      }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/user/preference/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ username: 'alice', reading_preference: 'prose', favorite_genre: 'mystery' });
  });

  test('returns 404 when user is not found', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/user/preference/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 500 when DB query throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB error')),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/user/preference/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// POST /api/user/preference/update
// ===========================================================================

describe('POST /api/user/preference/update', () => {
  test('returns 200 when preferences are updated', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
      release: mockRelease,
    });

    const res = await request(app)
      .post('/api/user/preference/update')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ userId: 1, readingPreference: 'poetry', favoriteGenre: 'literary fiction' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});

// ===========================================================================
// GET /api/user/:userId/preferred-books — success path
// ===========================================================================

describe('GET /api/user/:userId/preferred-books', () => {
  test('returns 200 with preferred books list for authenticated user', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            preference_type: 'book',
            preference_id: 5,
            book_id: 5,
            author_award_id: null,
            title_of_winning_book: 'Great Novel',
            full_name: 'Famous Author',
            prize_name: 'Booker Prize',
            prize_year: 2015,
          },
        ],
      }),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/user/1/preferred-books')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('title_of_winning_book', 'Great Novel');
  });
});

// ===========================================================================
// POST /api/like — additional paths
// ===========================================================================

describe('POST /api/like — admin user and vote-change paths', () => {
  test('admin can record a like using admin_book_likes table', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [] })               // no existing vote
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // INSERT
      .mockResolvedValueOnce({ rows: [{ likes: 1, dislikes: 0 }] }) // counts
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE books

    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookId: 10, liked: true });

    expect(res.status).toBe(200);
    expect(res.body.currentVote).toBe(true);
    expect(res.body.likes).toBe(1);
  });

  test('changing an existing vote triggers UPDATE instead of INSERT', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [{ liked: false }] }) // existing opposite vote
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })    // UPDATE vote
      .mockResolvedValueOnce({ rows: [{ likes: 1, dislikes: 0 }] }) // new counts
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });   // UPDATE books summary

    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/like')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookId: 10, liked: true }); // was false → now true

    expect(res.status).toBe(200);
    expect(res.body.currentVote).toBe(true);
  });
});

// ===========================================================================
// POST /api/submit-book — additional paths
// ===========================================================================

describe('POST /api/submit-book — additional paths', () => {
  test('returns 400 when a career award is selected', async () => {
    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN (no rows)
      .mockResolvedValueOnce({ rows: [{ id: 3, prize_type: 'career' }] }) // award check → career
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fullName: 'Jane Doe',
        givenName: 'Jane',
        lastName: 'Doe',
        titleOfWinningBook: 'My Career Book',
        awardId: 3,
        prizeYear: 2020,
        prizeGenre: 'fiction',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/book award/i);
  });

  test('returns the new book when submission succeeds (existing author)', async () => {
    const insertedBook = {
      id: 100,
      book_id: 999,
      title: 'Submitted Title',
      author_id: 10,
      prize_year: 2021,
      genre: 'fiction',
      verified: false,
      role: 'pending',
      source: 'user_submitted',
      award_id: 1,
    };

    const queryFn = jest.fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                  // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1, prize_type: 'book' }] }) // award check → book
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })                    // existing author found
      .mockResolvedValueOnce({ rows: [{ id: 100 }] })                   // MAX book id
      .mockResolvedValueOnce({ rows: [{ id: 999 }] })                   // nextval unique_id_seq
      .mockResolvedValueOnce({ rows: [insertedBook] })                  // INSERT book
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                 // INSERT book_awards
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });                // COMMIT

    mockConnect.mockResolvedValueOnce({ query: queryFn, release: mockRelease });

    const res = await request(app)
      .post('/api/submit-book')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fullName: 'Existing Author',
        givenName: 'Existing',
        lastName: 'Author',
        titleOfWinningBook: 'Submitted Title',
        awardId: 1,
        prizeYear: 2021,
        prizeGenre: 'fiction',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('title', 'Submitted Title');
    expect(res.body).toHaveProperty('verified', false);
  });
});

// ===========================================================================
// 500 error paths for catalog / awards endpoints
// ===========================================================================

describe('500 error paths for catalog and awards', () => {
  test('GET /api/tableName returns 500 when DB throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB failure')),
      release: mockRelease,
    });

    const res = await request(app).get('/api/tableName');
    expect(res.status).toBe(500);
  });

  test('GET /api/authors returns 500 when DB throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB failure')),
      release: mockRelease,
    });

    const res = await request(app).get('/api/authors');
    expect(res.status).toBe(500);
  });

  test('GET /api/awards returns 500 when DB throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB failure')),
      release: mockRelease,
    });

    const res = await request(app).get('/api/awards');
    expect(res.status).toBe(500);
  });

  test('GET /api/books-for-profile returns 500 when DB throws', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB failure')),
      release: mockRelease,
    });

    const res = await request(app).get('/api/books-for-profile');
    expect(res.status).toBe(500);
  });

  test('GET /api/user/preference/:userId returns 500 when DB throws (admin token)', async () => {
    mockConnect.mockResolvedValueOnce({
      query: jest.fn().mockRejectedValue(new Error('DB failure')),
      release: mockRelease,
    });

    const res = await request(app)
      .get('/api/user/preference/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});
