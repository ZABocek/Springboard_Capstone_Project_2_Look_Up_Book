/**
 * Graceful-shutdown test suite for the Look Up Book server.
 *
 * Tests are grouped into four areas:
 *
 *  1. shutdown()                – async resource-closing sequence
 *  2. registerShutdownHandlers() – OS signal registration + safety-net timer
 *  3. cache.quit()              – Redis disconnect helper (edge cases)
 *  4. server.js startup safety  – pool.end() never called at module load time
 *
 * None of these tests bind a real port, touch a real database, or connect
 * to Redis.  pg and ioredis are mocked before any module is loaded.
 */

'use strict';

// ---------------------------------------------------------------------------
// Global mocks — must come before any require() of application modules
// ---------------------------------------------------------------------------

const mockEnd     = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() });
const mockQuery   = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    end: mockEnd,
    on: jest.fn(),
    query: mockQuery,
  })),
}));

const mockQuit = jest.fn().mockResolvedValue(undefined);
const mockRedisOn = jest.fn();

jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    scan: jest.fn().mockResolvedValue(['0', []]),
    connect: jest.fn().mockResolvedValue(undefined),
    on: mockRedisOn,
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: mockQuit,
  }));
  return MockRedis;
});

// Required ENV vars (pool constructor reads these)
process.env.DB_USER     = 'test_user';
process.env.DB_HOST     = 'localhost';
process.env.DB_NAME     = 'test_db';
process.env.DB_PASSWORD = 'test_pass';
process.env.DB_PORT     = '5432';
process.env.JWT_SECRET  = 'test_jwt_secret_32chars_long!!!!';

// ---------------------------------------------------------------------------
// Module loads — after mocks are wired
// ---------------------------------------------------------------------------
const { shutdown, registerShutdownHandlers } = require('../utils/gracefulShutdown');
const cache = require('../cache');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal mock HTTP server that behaves like the object returned by
 * app.listen(): has a `.close(cb)` method that immediately calls the callback.
 */
function makeMockServer() {
  return {
    close: jest.fn((cb) => { if (typeof cb === 'function') cb(); }),
  };
}

// ---------------------------------------------------------------------------
// 1. shutdown() — async resource-closing sequence
// ---------------------------------------------------------------------------

describe('shutdown()', () => {
  let mockServer;
  let mockPool;
  let mockCache;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = makeMockServer();
    mockPool   = { end: jest.fn().mockResolvedValue(undefined) };
    mockCache  = { quit: jest.fn().mockResolvedValue(undefined) };
  });

  it('calls httpServer.close()', async () => {
    await shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache });
    expect(mockServer.close).toHaveBeenCalledTimes(1);
  });

  it('calls pool.end()', async () => {
    await shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache });
    expect(mockPool.end).toHaveBeenCalledTimes(1);
  });

  it('calls cache.quit()', async () => {
    await shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache });
    expect(mockCache.quit).toHaveBeenCalledTimes(1);
  });

  it('does not throw if pool.end() rejects', async () => {
    mockPool.end = jest.fn().mockRejectedValue(new Error('PG boom'));
    await expect(
      shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache })
    ).resolves.toBeUndefined();
  });

  it('does not throw if cache.quit() rejects', async () => {
    mockCache.quit = jest.fn().mockRejectedValue(new Error('Redis boom'));
    await expect(
      shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache })
    ).resolves.toBeUndefined();
  });

  it('proceeds past pool.end() failure and still calls cache.quit()', async () => {
    mockPool.end = jest.fn().mockRejectedValue(new Error('PG boom'));
    await shutdown('SIGINT', { httpServer: mockServer, pool: mockPool, cache: mockCache });
    expect(mockCache.quit).toHaveBeenCalledTimes(1);
  });

  it('accepts SIGTERM as the signal argument', async () => {
    // Smoke-test: should not throw, close/end/quit all called
    await shutdown('SIGTERM', { httpServer: mockServer, pool: mockPool, cache: mockCache });
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockPool.end).toHaveBeenCalled();
    expect(mockCache.quit).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. registerShutdownHandlers() — signal registration & safety net
// ---------------------------------------------------------------------------

describe('registerShutdownHandlers()', () => {
  let processOnSpy;
  let mockServer;
  let mockPool;
  let mockCache;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = makeMockServer();
    mockPool   = { end: jest.fn().mockResolvedValue(undefined) };
    mockCache  = { quit: jest.fn().mockResolvedValue(undefined) };

    // Spy on process.on without replacing the real handler mechanism
    processOnSpy = jest.spyOn(process, 'on');
  });

  afterEach(() => {
    processOnSpy.mockRestore();
  });

  it('registers a SIGINT handler', () => {
    registerShutdownHandlers({ httpServer: mockServer, pool: mockPool, cache: mockCache });
    const sigintCalls = processOnSpy.mock.calls.filter((c) => c[0] === 'SIGINT');
    expect(sigintCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('registers a SIGTERM handler', () => {
    registerShutdownHandlers({ httpServer: mockServer, pool: mockPool, cache: mockCache });
    const sigtermCalls = processOnSpy.mock.calls.filter((c) => c[0] === 'SIGTERM');
    expect(sigtermCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('the SIGINT handler invokes shutdown() and resolves', async () => {
    // Capture the SIGINT handler that was registered
    let capturedHandler = null;
    processOnSpy.mockImplementation((event, handler) => {
      if (event === 'SIGINT') capturedHandler = handler;
      return process; // process.on() returns process for chaining
    });

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    try {
      registerShutdownHandlers({ httpServer: mockServer, pool: mockPool, cache: mockCache });
      expect(capturedHandler).not.toBeNull();

      // Invoke the captured handler as if the OS fired SIGINT
      capturedHandler();

      // shutdown() is async — flush the microtask queue
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockServer.close).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
      expect(mockCache.quit).toHaveBeenCalled();
    } finally {
      mockExit.mockRestore();
    }
  });

  it('the SIGTERM handler invokes shutdown() and resolves', async () => {
    let capturedHandler = null;
    processOnSpy.mockImplementation((event, handler) => {
      if (event === 'SIGTERM') capturedHandler = handler;
      return process;
    });

    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    try {
      registerShutdownHandlers({ httpServer: mockServer, pool: mockPool, cache: mockCache });
      expect(capturedHandler).not.toBeNull();

      capturedHandler();
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockServer.close).toHaveBeenCalled();
      expect(mockPool.end).toHaveBeenCalled();
      expect(mockCache.quit).toHaveBeenCalled();
    } finally {
      mockExit.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. cache.quit() — Redis disconnect edge cases
// ---------------------------------------------------------------------------

describe('cache.quit()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not throw when called before Redis has ever been initialised', async () => {
    // The module-level `client` variable in cache.js starts as null if no
    // get/set/del has been called yet in this Jest worker.  A fresh Jest
    // worker isolation ensures this; if cache was already warmed in a
    // previous group we reset by testing that no error is thrown regardless.
    await expect(cache.quit()).resolves.toBeUndefined();
  });

  it('is safe to call twice (idempotent)', async () => {
    // Second call should be a no-op and not throw
    await cache.quit();
    await expect(cache.quit()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. server.js startup safety
// ---------------------------------------------------------------------------

describe('server.js startup safety', () => {
  it('does not call pool.end() when the module is required (not started)', () => {
    // server.js exports { app, pool }.  When required.main !== module,
    // startServer() never runs, so pool.end() should never be called.
    const { pool } = require('../server');
    // pool.end is our mockEnd function (from the pg mock at the top)
    expect(mockEnd).not.toHaveBeenCalled();
    expect(pool).toBeDefined();
  });

  it('exports an express app', () => {
    const { app } = require('../server');
    expect(typeof app).toBe('function'); // Express apps are middleware functions
  });
});
