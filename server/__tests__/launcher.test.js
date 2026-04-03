/**
 * Launcher / startup idempotency test suite for Look Up Book.
 *
 * These tests verify that:
 *  1. launch.bat exists and is correct enough to run without hard-coded user
 *     paths (it must use %~dp0 for self-relative path resolution).
 *  2. The server startup sequence never issues destructive DDL (no DROP TABLE,
 *     TRUNCATE, DROP DATABASE, or DROP SCHEMA statements).
 *  3. Each schemaSetup helper (ensureBookAwardsMapping, ensureAuthorAwardsModel,
 *     ensureLikeDislikeInfrastructure) can be called twice in a row without
 *     error — i.e. they are genuinely idempotent.
 *  4. The .env file provides all required configuration keys so the server
 *     can connect to the database and sign JWTs.
 *
 * The PostgreSQL pool is mocked so no live database is required.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ---------------------------------------------------------------------------
// Mock pg before any server module is loaded
// ---------------------------------------------------------------------------
const mockQuery   = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  query:   mockQuery,
  release: mockRelease,
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    on:      jest.fn(),
    query:   mockQuery,
  })),
}));

// ioredis is not used by schemaSetup directly, but db.js imports it transitively
jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    get:     jest.fn().mockResolvedValue(null),
    set:     jest.fn().mockResolvedValue('OK'),
    del:     jest.fn().mockResolvedValue(1),
    scan:    jest.fn().mockResolvedValue(['0', []]),
    connect: jest.fn().mockResolvedValue(undefined),
    on:      jest.fn(),
    ping:    jest.fn().mockResolvedValue('PONG'),
  }))
);

// Set required env vars before any module load
process.env.DB_USER     = 'test_user';
process.env.DB_HOST     = 'localhost';
process.env.DB_NAME     = 'test_db';
process.env.DB_PASSWORD = 'test_pass';
process.env.DB_PORT     = '5432';
process.env.JWT_SECRET  = 'test_jwt_secret_32chars_long!!!!';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SERVER_ROOT  = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helper: collect every SQL string passed to mockQuery across one async call
// ---------------------------------------------------------------------------
function collectSql(callArgs) {
  return callArgs
    .map((args) => (typeof args[0] === 'string' ? args[0] : ''))
    .join('\n')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Group 1: launch.bat existence and structure
// ---------------------------------------------------------------------------
describe('launch.bat', () => {
  const batPath = path.join(PROJECT_ROOT, 'launch.bat');
  let batContent;

  beforeAll(() => {
    batContent = fs.readFileSync(batPath, 'utf8');
  });

  test('exists at the project root', () => {
    expect(fs.existsSync(batPath)).toBe(true);
  });

  test('uses %%~dp0 for self-relative path resolution (no hard-coded user paths)', () => {
    // The batch file must derive ROOT from its own location, not from a
    // hard-coded absolute path like C:\Users\<someone>\...
    expect(batContent).toMatch(/%~dp0/i);
    // Should NOT contain any absolute user-specific paths
    expect(batContent).not.toMatch(/C:\\Users\\/i);
  });

  test('starts the backend via "node server.js" inside the server directory', () => {
    expect(batContent).toMatch(/node server\.js/i);
    // The /D flag of START sets the working directory — verify it targets \server
    expect(batContent).toMatch(/\\server/i);
  });

  test('starts the frontend via "npm start" inside the client directory', () => {
    expect(batContent).toMatch(/npm start/i);
    expect(batContent).toMatch(/\\client/i);
  });

  test('does NOT set BROWSER=chrome (respects the user\'s default browser)', () => {
    // We suppress CRA auto-open with BROWSER=none and let the script itself
    // open the URL, so the content should not force chrome as the BROWSER env
    expect(batContent).not.toMatch(/BROWSER=chrome/i);
  });

  test('explicitly suppresses CRA auto-open with BROWSER=none', () => {
    expect(batContent).toMatch(/BROWSER=none/i);
  });

  test('opens http://localhost:3000 after startup', () => {
    expect(batContent).toMatch(/localhost:3000/);
  });

  test('contains no DROP TABLE, TRUNCATE TABLE, or DROP DATABASE instructions', () => {
    const upper = batContent.toUpperCase();
    expect(upper).not.toMatch(/DROP\s+TABLE/);
    // Match "TRUNCATE TABLE ..." (the SQL command), not the English word "truncates"
    expect(upper).not.toMatch(/TRUNCATE\s+TABLE/);
    expect(upper).not.toMatch(/DROP\s+DATABASE/);
  });

  test('checks for the PostgreSQL service before starting the app', () => {
    expect(batContent).toMatch(/postgresql/i);
    expect(batContent).toMatch(/sc query/i);
  });

  test('kills stale node.exe processes before starting new ones', () => {
    expect(batContent).toMatch(/taskkill/i);
    expect(batContent).toMatch(/node\.exe/i);
  });
});

// ---------------------------------------------------------------------------
// Group 2: .env configuration completeness
// ---------------------------------------------------------------------------
describe('.env configuration', () => {
  const envPath = path.join(SERVER_ROOT, '.env');

  test('.env file exists in server/', () => {
    expect(fs.existsSync(envPath)).toBe(true);
  });

  test('.env contains all required keys', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    const requiredKeys = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'JWT_SECRET', 'PORT'];
    for (const key of requiredKeys) {
      expect(content).toMatch(new RegExp(`^${key}=`, 'm'));
    }
  });

  test('.env specifies PORT=5000', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    expect(content).toMatch(/^PORT=5000/m);
  });
});

// ---------------------------------------------------------------------------
// Group 3: server startup issues no destructive DDL
// ---------------------------------------------------------------------------
describe('server startup — destructive DDL check', () => {
  beforeEach(() => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
    mockConnect.mockResolvedValue({ query: mockQuery, release: mockRelease });
    jest.clearAllMocks();
  });

  test('schemaSetup source files contain no DROP TABLE or TRUNCATE statements', () => {
    const schemaPath = path.join(SERVER_ROOT, 'utils', 'schemaSetup.js');
    const src = fs.readFileSync(schemaPath, 'utf8').toUpperCase();
    expect(src).not.toMatch(/DROP\s+TABLE\b/);
    expect(src).not.toMatch(/TRUNCATE\b/);
    expect(src).not.toMatch(/DROP\s+DATABASE\b/);
    expect(src).not.toMatch(/DROP\s+SCHEMA\b/);
  });

  test('ensureBookAwardsMapping issues no destructive SQL', async () => {
    const { ensureBookAwardsMapping } = require('../utils/schemaSetup');
    await ensureBookAwardsMapping();

    const allSql = collectSql(mockQuery.mock.calls);
    expect(allSql).not.toMatch(/DROP\s+TABLE/);
    expect(allSql).not.toMatch(/TRUNCATE/);
  });

  test('ensureBookAwardsMapping is idempotent (safe to call twice)', async () => {
    const { ensureBookAwardsMapping } = require('../utils/schemaSetup');
    await expect(ensureBookAwardsMapping()).resolves.not.toThrow();
    await expect(ensureBookAwardsMapping()).resolves.not.toThrow();
  });

  test('ensureAuthorAwardsModel issues no DROP TABLE or TRUNCATE', async () => {
    const { ensureAuthorAwardsModel } = require('../utils/schemaSetup');
    await ensureAuthorAwardsModel();

    const allSql = collectSql(mockQuery.mock.calls);
    expect(allSql).not.toMatch(/DROP\s+TABLE/);
    expect(allSql).not.toMatch(/TRUNCATE/);
  });

  test('ensureAuthorAwardsModel is idempotent (safe to call twice)', async () => {
    const { ensureAuthorAwardsModel } = require('../utils/schemaSetup');
    await expect(ensureAuthorAwardsModel()).resolves.not.toThrow();
    await expect(ensureAuthorAwardsModel()).resolves.not.toThrow();
  });

  test('ensureLikeDislikeInfrastructure issues no destructive SQL', async () => {
    const { ensureLikeDislikeInfrastructure } = require('../utils/schemaSetup');
    await ensureLikeDislikeInfrastructure();

    const allSql = collectSql(mockQuery.mock.calls);
    expect(allSql).not.toMatch(/DROP\s+TABLE/);
    expect(allSql).not.toMatch(/TRUNCATE/);
  });

  test('ensureLikeDislikeInfrastructure is idempotent (safe to call twice)', async () => {
    const { ensureLikeDislikeInfrastructure } = require('../utils/schemaSetup');
    await expect(ensureLikeDislikeInfrastructure()).resolves.not.toThrow();
    await expect(ensureLikeDislikeInfrastructure()).resolves.not.toThrow();
  });

  test('all three schemaSetup helpers complete without error in sequence', async () => {
    const {
      ensureBookAwardsMapping,
      ensureAuthorAwardsModel,
      ensureLikeDislikeInfrastructure,
    } = require('../utils/schemaSetup');

    await expect(
      Promise.all([
        ensureBookAwardsMapping(),
        ensureAuthorAwardsModel(),
        ensureLikeDislikeInfrastructure(),
      ])
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Group 4: reset-users.js is NOT imported or executed during startup
// ---------------------------------------------------------------------------
describe('reset-users.js isolation', () => {
  test('server.js does not require or import reset-users', () => {
    const serverSrc = fs.readFileSync(path.join(SERVER_ROOT, 'server.js'), 'utf8');
    expect(serverSrc).not.toMatch(/reset-users/i);
  });

  test('schemaSetup.js does not require or import reset-users', () => {
    const src = fs.readFileSync(path.join(SERVER_ROOT, 'utils', 'schemaSetup.js'), 'utf8');
    expect(src).not.toMatch(/reset-users/i);
  });

  test('app.js does not require or import reset-users', () => {
    const src = fs.readFileSync(path.join(SERVER_ROOT, 'app.js'), 'utf8');
    expect(src).not.toMatch(/reset-users/i);
  });
});
