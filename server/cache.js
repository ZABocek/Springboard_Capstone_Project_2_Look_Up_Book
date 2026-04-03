/**
 * Redis cache helper for the Look Up Book server.
 *
 * Uses ioredis with graceful degradation: if Redis is unreachable the helper
 * simply falls through so every request still works – just without caching.
 *
 * TTLs (seconds):
 *   HOMEPAGE_TTL           300   (5 min  – refreshed by Celery worker)
 *   BOOKS_FOR_PROFILE_TTL  1800  (30 min – mostly static book catalog)
 *   SEARCH_BOOKS_TTL       1800  (30 min – mostly static award-winner list)
 *   AWARDS_TTL             1800  (30 min – award names change very rarely)
 *   AWARD_DETAIL_TTL        600  (10 min – per-award winner lists)
 */

const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const TTL = {
  HOMEPAGE: 300,
  BOOKS_FOR_PROFILE: 1800,
  SEARCH_BOOKS: 1800,
  AWARDS: 1800,
  BOOK_AWARDS: 1800,
  AWARD_DETAIL: 600,
};

let client = null;
let redisAvailable = false;

function getClient() {
  if (client) return client;

  client = new Redis(REDIS_URL, {
    // Don't throw on initial connect failure – degrade gracefully
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
    maxRetriesPerRequest: 1,
  });

  client.on('connect', () => {
    redisAvailable = true;
    console.log('[Redis] Connected to', REDIS_URL);
  });

  client.on('error', (err) => {
    redisAvailable = false;
    // Log only the first error per connection cycle to avoid log spam
    console.warn('[Redis] Unavailable – caching disabled:', err.message);
  });

  client.on('close', () => {
    redisAvailable = false;
  });

  client.connect().catch(() => {
    // Swallow connection errors – we degrade gracefully
  });

  return client;
}

/**
 * Try to read a cached JSON value.
 * Returns the parsed object on hit, or null on miss / Redis unavailable.
 */
async function get(key) {
  if (!redisAvailable) return null;
  try {
    const raw = await getClient().get(key);
    if (raw == null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Store a JSON-serialisable value with an explicit TTL (seconds).
 * Silently swallows errors so callers never fail because of Redis.
 */
async function set(key, value, ttlSeconds) {
  if (!redisAvailable) return;
  try {
    await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // noop
  }
}

/**
 * Delete one or more keys (e.g. on a write that invalidates the cache).
 */
async function del(...keys) {
  if (!redisAvailable || keys.length === 0) return;
  try {
    await getClient().del(...keys);
  } catch {
    // noop
  }
}

/**
 * Delete all keys matching a glob pattern.
 * Use sparingly – SCAN is O(n) over the keyspace.
 */
async function delPattern(pattern) {
  if (!redisAvailable) return;
  try {
    const redis = getClient();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      cursor = nextCursor;
    } while (cursor !== '0');
  } catch {
    // noop
  }
}

/**
 * Express middleware factory.
 * Usage:  app.get('/api/expensive', cacheMiddleware('my:key', TTL.SEARCH_BOOKS), handler)
 */
function cacheMiddleware(key, ttlSeconds) {
  return async (req, res, next) => {
    const cached = await get(key);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    res.setHeader('X-Cache', 'MISS');
    // Monkey-patch res.json so we can intercept the response body and cache it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        set(key, body, ttlSeconds);
      }
      return originalJson(body);
    };
    return next();
  };
}

/**
 * Disconnect the Redis client cleanly.
 *
 * Sets `client` to null and clears `redisAvailable` *before* calling
 * `c.quit()`, so any concurrent in-flight request sees the cache as
 * unavailable and falls through to the database rather than trying to
 * use a half-closed connection.
 *
 * Safe to call even if Redis was never initialised (lazy-init means
 * `client` may still be null), and idempotent — calling it twice is fine.
 */
async function quit() {
  if (!client) return;
  const c = client;
  client = null;
  redisAvailable = false;
  try {
    await c.quit();
  } catch {
    // Best-effort — the process is already exiting.
  }
}

module.exports = { get, set, del, delPattern, cacheMiddleware, quit, TTL };
