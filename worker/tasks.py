"""
Celery task definitions for Look Up Book.

All tasks are designed to be idempotent and safe to retry.

Cache key constants must stay in sync with server/server.js CACHE_KEYS.
"""

import json
import logging
import os
from pathlib import Path

import psycopg2
import psycopg2.extras
import redis
from dotenv import load_dotenv

from worker.celery_app import app

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
_env_path = Path(__file__).resolve().parent.parent / "server" / ".env"
load_dotenv(dotenv_path=_env_path, override=False)

REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")

DB_CONFIG = {
    "dbname": os.environ.get("DB_NAME", "look_up_book_db"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": int(os.environ.get("DB_PORT", "5432")),
}

# Must match CACHE_KEYS in server/server.js
CACHE_KEYS = {
    "HOMEPAGE": "api:homepage",
    "SEARCH_BOOKS": "api:search-books-award-winners",
    "BOOKS_FOR_PROFILE": "api:books-for-profile",
    "AWARDS": "api:awards",
    "BOOK_AWARDS": "api:book-awards",
}

TTL = {
    "HOMEPAGE": 300,
    "SEARCH_BOOKS": 1800,
    "BOOKS_FOR_PROFILE": 1800,
    "AWARDS": 1800,
    "BOOK_AWARDS": 1800,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_redis():
    """Return a Redis client.  Raises ConnectionError if unavailable."""
    client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
    client.ping()   # Fail fast if Redis is down
    return client


def get_db():
    """Return a psycopg2 connection with dict-style cursor."""
    return psycopg2.connect(**DB_CONFIG)


def cache_set(r: redis.Redis, key: str, value, ttl: int) -> None:
    r.set(key, json.dumps(value), ex=ttl)


# ---------------------------------------------------------------------------
# Task: warm homepage cache
# ---------------------------------------------------------------------------

HOMEPAGE_QUERY = """
WITH book_enriched AS (
    SELECT
        b.id               AS book_id,
        b.title            AS title_of_winning_book,
        COALESCE(b.genre, 'Unknown')                              AS prize_genre,
        COALESCE(b.prize_year, b.publication_year)                AS display_year,
        b.publication_year,
        b.prize_year,
        b.verified,
        b.author_id,
        COALESCE(a.full_name, 'Unknown')                          AS author_name,
        COALESCE(award_agg.prize_names, aw_leg.prize_name, 'N/A') AS prize_name,
        COALESCE(award_agg.prize_types, aw_leg.prize_type, 'book') AS prize_type,
        COALESCE(lk.like_count,    0)::int                        AS like_count,
        COALESCE(lk.dislike_count, 0)::int                        AS dislike_count,
        COALESCE(
            b.like_dislike,
            COALESCE(lk.like_count, 0)::text || ' Likes / ' ||
            COALESCE(lk.dislike_count, 0)::text || ' Dislikes'
        )                                                         AS like_dislike
    FROM books b
    LEFT JOIN authors a      ON b.author_id = a.id
    LEFT JOIN awards  aw_leg ON b.award_id  = aw_leg.id
    LEFT JOIN LATERAL (
        SELECT
            STRING_AGG(DISTINCT aw.prize_name, ', ' ORDER BY aw.prize_name) AS prize_names,
            STRING_AGG(DISTINCT aw.prize_type, ', ' ORDER BY aw.prize_type) AS prize_types
        FROM book_awards ba
        JOIN awards aw ON aw.id = ba.award_id
        WHERE ba.book_id = b.id
    ) award_agg ON true
    LEFT JOIN (
        SELECT
            book_id,
            COUNT(*) FILTER (WHERE liked = true)  AS like_count,
            COUNT(*) FILTER (WHERE liked = false) AS dislike_count
        FROM (
            SELECT book_id, liked FROM user_book_likes
            UNION ALL
            SELECT book_id, liked FROM admin_book_likes
        ) all_votes
        GROUP BY book_id
    ) lk ON b.id = lk.book_id
    WHERE b.verified = true
      AND (
        b.award_id IS NOT NULL
        OR EXISTS (
            SELECT 1 FROM book_awards ba2
            JOIN awards aw2 ON aw2.id = ba2.award_id
            WHERE ba2.book_id = b.id
              AND COALESCE(aw2.prize_type, '') <> 'career'
        )
      )
), career_enriched AS (
    SELECT
        NULL::int              AS book_id,
        'Career Award'::text   AS title_of_winning_book,
        COALESCE(aw.prize_genre, 'Unknown') AS prize_genre,
        COALESCE(aa.prize_year, aw.prize_year) AS display_year,
        NULL::int              AS publication_year,
        COALESCE(aa.prize_year, aw.prize_year) AS prize_year,
        COALESCE(aa.verified, true) AS verified,
        aa.author_id,
        COALESCE(a.full_name, 'Unknown') AS author_name,
        aw.prize_name,
        'career'::text         AS prize_type,
        0::int                 AS like_count,
        0::int                 AS dislike_count,
        COALESCE(aa.like_dislike, 'Not Applicable') AS like_dislike
    FROM author_awards aa
    JOIN awards aw ON aw.id = aa.award_id
    LEFT JOIN authors a ON a.id = aa.author_id
    WHERE COALESCE(aa.verified, true) = true
      AND COALESCE(aa.role, 'winner') = 'winner'
      AND COALESCE(aw.prize_type, '') = 'career'
      AND COALESCE(aa.prize_year, aw.prize_year) IS NOT NULL
)
SELECT * FROM (
    SELECT * FROM book_enriched ORDER BY RANDOM() LIMIT 8
) book_rows
UNION ALL
SELECT * FROM (
    SELECT * FROM career_enriched ORDER BY RANDOM() LIMIT 2
) career_rows;
"""


@app.task(bind=True, max_retries=3, default_retry_delay=10, name="worker.tasks.warm_homepage_cache")
def warm_homepage_cache(self):
    """Fetch homepage data from DB and push it into Redis cache."""
    try:
        r = get_redis()
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(HOMEPAGE_QUERY)
                rows = [dict(row) for row in cur.fetchall()]
        cache_set(r, CACHE_KEYS["HOMEPAGE"], rows, TTL["HOMEPAGE"])
        logger.info("warm_homepage_cache: cached %d rows", len(rows))
        return {"cached": len(rows)}
    except Exception as exc:
        logger.warning("warm_homepage_cache failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: warm search-books and books-for-profile caches
# ---------------------------------------------------------------------------

SEARCH_BOOKS_QUERY = """
WITH linked_book_awards AS (
    SELECT DISTINCT
        b.id AS book_id,
        b.title AS clean_title,
        CASE
            WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose'   THEN 'Prose'
            WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry'  THEN 'Poetry'
            WHEN COALESCE(TRIM(b.genre), '') = ''               THEN 'Unknown'
            ELSE INITCAP(TRIM(b.genre))
        END AS prize_genre,
        COALESCE(a.full_name,   'Unknown Author') AS full_name,
        COALESCE(a.given_name,  '')               AS author_first_name,
        COALESCE(a.last_name,   '')               AS author_last_name,
        aw.prize_name,
        COALESCE(aw.prize_year, b.prize_year)::text AS prize_year
    FROM books b
    JOIN authors a      ON a.id  = b.author_id
    JOIN book_awards ba ON ba.book_id = b.id
    JOIN awards aw      ON aw.id = ba.award_id
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
            WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'prose'  THEN 'Prose'
            WHEN LOWER(COALESCE(TRIM(b.genre), '')) = 'poetry' THEN 'Poetry'
            WHEN COALESCE(TRIM(b.genre), '') = ''              THEN 'Unknown'
            ELSE INITCAP(TRIM(b.genre))
        END AS prize_genre,
        COALESCE(a.full_name,  'Unknown Author') AS full_name,
        COALESCE(a.given_name, '')               AS author_first_name,
        COALESCE(a.last_name,  '')               AS author_last_name,
        aw.prize_name,
        COALESCE(aw.prize_year, b.prize_year)::text AS prize_year
    FROM books b
    JOIN authors a ON a.id  = b.author_id
    JOIN awards aw  ON aw.id = b.award_id
    WHERE b.verified = true
      AND b.role = 'winner'
      AND COALESCE(aw.prize_type, '') <> 'career'
      AND COALESCE(aw.prize_name, '') <> ''
      AND COALESCE(aw.prize_year, b.prize_year) IS NOT NULL
      AND COALESCE(a.full_name, '') <> ''
      AND LOWER(COALESCE(a.full_name, '')) <> 'no winner'
      AND NOT EXISTS (SELECT 1 FROM book_awards ba WHERE ba.book_id = b.id)
)
SELECT * FROM linked_book_awards
UNION ALL
SELECT * FROM legacy_book_awards
ORDER BY author_last_name, author_first_name, clean_title, prize_year, prize_name;
"""

AWARDS_QUERY = """
SELECT
    a.id   AS award_id,
    a.prize_name,
    a.prize_type,
    CASE
        WHEN a.prize_type = 'career'
            THEN COALESCE(career_counts.author_count, 0)::int
        ELSE COALESCE(book_counts.book_count, 0)::int
    END AS book_count
FROM awards a
LEFT JOIN (
    SELECT ba.award_id, COUNT(DISTINCT ba.book_id)::int AS book_count
    FROM book_awards ba
    JOIN books b ON b.id = ba.book_id
    WHERE b.verified = true
    GROUP BY ba.award_id
) book_counts ON book_counts.award_id = a.id
LEFT JOIN (
    SELECT aa.award_id, COUNT(DISTINCT aa.author_id)::int AS author_count
    FROM author_awards aa
    WHERE COALESCE(aa.verified, true) = true
      AND COALESCE(aa.role, 'winner') = 'winner'
    GROUP BY aa.award_id
) career_counts ON career_counts.award_id = a.id
WHERE a.prize_name IS NOT NULL AND a.prize_name <> ''
ORDER BY a.prize_name;
"""

BOOK_AWARDS_QUERY = """
SELECT
    a.id   AS award_id,
    a.prize_name,
    a.prize_type,
    COALESCE(book_counts.book_count, 0)::int AS book_count
FROM awards a
LEFT JOIN (
    SELECT ba.award_id, COUNT(DISTINCT ba.book_id)::int AS book_count
    FROM book_awards ba
    JOIN books b ON b.id = ba.book_id
    WHERE b.verified = true
    GROUP BY ba.award_id
) book_counts ON book_counts.award_id = a.id
WHERE a.prize_name IS NOT NULL
  AND a.prize_name <> ''
  AND COALESCE(a.prize_type, '') <> 'career'
ORDER BY a.prize_name;
"""


@app.task(bind=True, max_retries=3, default_retry_delay=10, name="worker.tasks.warm_books_cache")
def warm_books_cache(self):
    """Warm search-books and awards caches (large, mostly static datasets)."""
    try:
        r = get_redis()
        with get_db() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(SEARCH_BOOKS_QUERY)
                search_rows = [dict(row) for row in cur.fetchall()]
                cache_set(r, CACHE_KEYS["SEARCH_BOOKS"], search_rows, TTL["SEARCH_BOOKS"])

                cur.execute(AWARDS_QUERY)
                awards_rows = [dict(row) for row in cur.fetchall()]
                cache_set(r, CACHE_KEYS["AWARDS"], awards_rows, TTL["AWARDS"])

                cur.execute(BOOK_AWARDS_QUERY)
                book_awards_rows = [dict(row) for row in cur.fetchall()]
                cache_set(r, CACHE_KEYS["BOOK_AWARDS"], book_awards_rows, TTL["BOOK_AWARDS"])

        logger.info(
            "warm_books_cache: search=%d awards=%d book_awards=%d",
            len(search_rows), len(awards_rows), len(book_awards_rows),
        )
        return {
            "search_books": len(search_rows),
            "awards": len(awards_rows),
            "book_awards": len(book_awards_rows),
        }
    except Exception as exc:
        logger.warning("warm_books_cache failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: sync like/dislike counts from votes tables back into books.like_dislike
# ---------------------------------------------------------------------------

@app.task(bind=True, max_retries=2, default_retry_delay=30, name="worker.tasks.sync_like_counts")
def sync_like_counts(self):
    """Sync aggregate vote counts into books.like_dislike and bust homepage cache."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE books b
                    SET like_dislike = CONCAT(
                        COALESCE(v.likes,    0)::text, ' Likes / ',
                        COALESCE(v.dislikes, 0)::text, ' Dislikes'
                    )
                    FROM (
                        SELECT
                            book_id,
                            SUM(CASE WHEN liked THEN 1 ELSE 0 END)::int AS likes,
                            SUM(CASE WHEN NOT liked THEN 1 ELSE 0 END)::int AS dislikes
                        FROM (
                            SELECT book_id, liked FROM user_book_likes
                            UNION ALL
                            SELECT book_id, liked FROM admin_book_likes
                        ) all_votes
                        GROUP BY book_id
                    ) v
                    WHERE b.id = v.book_id;
                    """
                )
                updated = cur.rowcount
            conn.commit()

        # Bust the homepage cache so next request sees fresh counts
        try:
            r = get_redis()
            r.delete(CACHE_KEYS["HOMEPAGE"])
        except Exception:
            pass  # Redis unavailable – not critical

        logger.info("sync_like_counts: updated %d rows", updated)
        return {"updated_rows": updated}
    except Exception as exc:
        logger.warning("sync_like_counts failed: %s", exc)
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# Task: on-demand cache invalidation (called by Node.js via HTTP if needed)
# ---------------------------------------------------------------------------

@app.task(name="worker.tasks.invalidate_cache_keys")
def invalidate_cache_keys(keys: list):
    """Delete specific cache keys from Redis.

    Args:
        keys: list of Redis key strings to delete.
    """
    if not keys:
        return {"deleted": 0}
    try:
        r = get_redis()
        deleted = r.delete(*keys)
        logger.info("invalidate_cache_keys: deleted %d keys: %s", deleted, keys)
        return {"deleted": deleted}
    except Exception as exc:
        logger.warning("invalidate_cache_keys failed: %s", exc)
        return {"deleted": 0, "error": str(exc)}
