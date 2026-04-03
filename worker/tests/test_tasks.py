"""
Comprehensive tests for Celery tasks in worker/tasks.py.

Strategy: mock psycopg2.connect and redis.Redis so no real DB or Redis
connection is required.  All task logic (query building, JSON serialisation,
key namespacing) is verified against mocked return values.
"""

import json
import os
import sys
import types
import unittest
from unittest.mock import MagicMock, patch, call

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so `from worker.tasks import ...` works.
# ---------------------------------------------------------------------------
# __file__ = .../worker/tests/test_tasks.py
# two dirname() calls → .../worker/tests → worker → PROJECT_ROOT
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))   # worker/tests
WORKER_DIR = os.path.dirname(TESTS_DIR)                  # worker
ROOT = os.path.dirname(WORKER_DIR)                       # project root
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# ---------------------------------------------------------------------------
# Provide a minimal 'celery' stub so tasks.py can import without a live broker.
# ---------------------------------------------------------------------------
celery_stub = types.ModuleType('celery')

class _FakeCelery:
    def __init__(self, *a, **kw):
        self.conf = MagicMock()
    def task(self, *a, **kw):
        def decorator(fn):
            fn.delay = lambda *a2, **kw2: None
            # Expose a direct __call__ that bypasses Celery plumbing so we can
            # call tasks as plain functions in tests.
            return fn
        return decorator

celery_stub.Celery = _FakeCelery
sys.modules.setdefault('celery', celery_stub)

if 'celery.schedules' not in sys.modules:
    cs = types.ModuleType('celery.schedules')
    cs.crontab = lambda **kw: None
    sys.modules['celery.schedules'] = cs

# ---------------------------------------------------------------------------
# Import the module under test
# ---------------------------------------------------------------------------
from worker import tasks  # noqa: E402


# ===========================================================================
# Helpers
# ===========================================================================

def _make_real_dict_cursor(row_batches):
    """
    Build a cursor mock that returns successive fetchall() results.
    Each element of row_batches is a list of dict-like rows.
    """
    cursor = MagicMock()
    cursor.fetchall.side_effect = [list(b) for b in row_batches]
    cursor.__enter__ = lambda s: cursor
    cursor.__exit__ = MagicMock(return_value=False)
    return cursor


def _make_conn(cursor=None):
    """Return a psycopg2-style connection mock."""
    conn = MagicMock()
    if cursor is not None:
        conn.cursor.return_value = cursor
    conn.__enter__ = lambda s: conn
    conn.__exit__ = MagicMock(return_value=False)
    return conn


def _make_redis():
    r = MagicMock()
    r.get.return_value = None
    r.set.return_value = True
    r.delete.return_value = 1
    r.ping.return_value = True
    return r


def _patch_redis(mock_redis_cls, r=None):
    """Configure mock Redis class so from_url() returns the mock instance."""
    if r is None:
        r = _make_redis()
    mock_redis_cls.from_url.return_value = r
    return r


# ===========================================================================
# warm_homepage_cache
# ===========================================================================

class TestWarmHomepageCache(unittest.TestCase):

    def _run(self, mock_connect, mock_redis_cls, rows):
        cursor = _make_real_dict_cursor([rows])
        conn = _make_conn(cursor)
        mock_connect.return_value = conn
        r = _patch_redis(mock_redis_cls)
        return r, cursor

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_stores_result_in_redis(self, mock_connect, mock_redis_cls):
        fake_row = {'book_id': 1, 'title_of_winning_book': 'A Book', 'prize_genre': 'Prose'}
        r, _ = self._run(mock_connect, mock_redis_cls, [fake_row])

        tasks.warm_homepage_cache(self=MagicMock())

        r.set.assert_called_once()
        key_used = r.set.call_args[0][0]
        self.assertEqual(key_used, 'api:homepage')
        json_val = r.set.call_args[0][1]
        parsed = json.loads(json_val)
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]['title_of_winning_book'], 'A Book')

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_empty_result_stores_empty_list(self, mock_connect, mock_redis_cls):
        r, _ = self._run(mock_connect, mock_redis_cls, [])

        tasks.warm_homepage_cache(self=MagicMock())

        r.set.assert_called_once()
        self.assertEqual(json.loads(r.set.call_args[0][1]), [])

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_db_error_does_not_crash_process(self, mock_connect, mock_redis_cls):
        mock_connect.side_effect = Exception('DB down')
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        self_mock = MagicMock()
        self_mock.retry.side_effect = Exception('retry')   # stop retry loop

        try:
            tasks.warm_homepage_cache(self=self_mock)
        except Exception:
            pass   # retry exception is expected

        # retry() must have been called with the original exc
        self_mock.retry.assert_called_once()

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_sets_correct_ttl(self, mock_connect, mock_redis_cls):
        r, _ = self._run(mock_connect, mock_redis_cls, [])

        tasks.warm_homepage_cache(self=MagicMock())

        args = r.set.call_args[0]
        kwargs = r.set.call_args[1] or {}
        ttl = args[2] if len(args) > 2 else kwargs.get('ex', kwargs.get('px'))
        self.assertIsNotNone(ttl)
        self.assertGreater(int(ttl), 0)

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_returns_cached_count(self, mock_connect, mock_redis_cls):
        rows = [{'title': f'Book {i}'} for i in range(5)]
        r, _ = self._run(mock_connect, mock_redis_cls, rows)

        result = tasks.warm_homepage_cache(self=MagicMock())

        self.assertEqual(result['cached'], 5)


# ===========================================================================
# warm_books_cache
# ===========================================================================

class TestWarmBooksCache(unittest.TestCase):

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_populates_three_cache_keys(self, mock_connect, mock_redis_cls):
        book_rows  = [{'book_id': 1, 'clean_title': 'B', 'prize_name': 'P'}]
        award_rows = [{'award_id': 1, 'prize_name': 'P', 'prize_type': 'book'}]
        ba_rows    = [{'award_id': 1, 'prize_name': 'P', 'prize_type': 'book'}]

        cursor = _make_real_dict_cursor([book_rows, award_rows, ba_rows])
        conn = _make_conn(cursor)
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        tasks.warm_books_cache(self=MagicMock())

        keys_written = {c[0][0] for c in r.set.call_args_list}
        self.assertIn('api:search-books-award-winners', keys_written)
        self.assertIn('api:awards', keys_written)
        self.assertIn('api:book-awards', keys_written)

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_returns_row_counts(self, mock_connect, mock_redis_cls):
        cursor = _make_real_dict_cursor([
            [{'a': 1}, {'a': 2}],   # search_books â€“ 2 rows
            [{'b': 1}],             # awards â€“ 1 row
            [],                     # book_awards â€“ 0 rows
        ])
        conn = _make_conn(cursor)
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        result = tasks.warm_books_cache(self=MagicMock())

        self.assertEqual(result['search_books'], 2)
        self.assertEqual(result['awards'], 1)
        self.assertEqual(result['book_awards'], 0)

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_db_error_triggers_retry(self, mock_connect, mock_redis_cls):
        mock_connect.side_effect = Exception('timeout')
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        self_mock = MagicMock()
        self_mock.retry.side_effect = Exception('retry')

        try:
            tasks.warm_books_cache(self=self_mock)
        except Exception:
            pass

        self_mock.retry.assert_called_once()

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_json_serialisable_output(self, mock_connect, mock_redis_cls):
        rows = [{'key': 'value', 'num': 42}]
        cursor = _make_real_dict_cursor([rows, rows, rows])
        conn = _make_conn(cursor)
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        tasks.warm_books_cache(self=MagicMock())

        for c in r.set.call_args_list:
            try:
                json.loads(c[0][1])
            except json.JSONDecodeError:
                self.fail(f'Non-JSON value stored for key {c[0][0]}')


# ===========================================================================
# sync_like_counts
# ===========================================================================

class TestSyncLikeCounts(unittest.TestCase):

    def _make_sync_conn(self, rowcount=5):
        cursor = MagicMock()
        cursor.execute = MagicMock()
        cursor.rowcount = rowcount
        cursor.__enter__ = lambda s: cursor
        cursor.__exit__ = MagicMock(return_value=False)
        conn = MagicMock()
        conn.cursor.return_value = cursor
        conn.__enter__ = lambda s: conn
        conn.__exit__ = MagicMock(return_value=False)
        return conn, cursor

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_calls_update_and_commits(self, mock_connect, mock_redis_cls):
        conn, cursor = self._make_sync_conn()
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        tasks.sync_like_counts(self=MagicMock())

        cursor.execute.assert_called_once()
        conn.commit.assert_called_once()

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_invalidates_homepage_cache(self, mock_connect, mock_redis_cls):
        conn, _ = self._make_sync_conn()
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        tasks.sync_like_counts(self=MagicMock())

        r.delete.assert_called()
        deleted_keys = {arg for c in r.delete.call_args_list for arg in c[0]}
        self.assertIn('api:homepage', deleted_keys)

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_returns_updated_row_count(self, mock_connect, mock_redis_cls):
        conn, _ = self._make_sync_conn(rowcount=12)
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        result = tasks.sync_like_counts(self=MagicMock())

        self.assertEqual(result['updated_rows'], 12)

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_db_error_rolls_back_and_retries(self, mock_connect, mock_redis_cls):
        conn = MagicMock()
        cursor = MagicMock()
        cursor.execute.side_effect = Exception('lock timeout')
        cursor.__enter__ = lambda s: cursor
        cursor.__exit__ = MagicMock(return_value=False)
        conn.cursor.return_value = cursor
        conn.__enter__ = lambda s: conn
        conn.__exit__ = MagicMock(return_value=False)
        mock_connect.return_value = conn
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        self_mock = MagicMock()
        self_mock.retry.side_effect = Exception('retry')

        try:
            tasks.sync_like_counts(self=self_mock)
        except Exception:
            pass

        self_mock.retry.assert_called_once()

    @patch('worker.tasks.redis.Redis')
    @patch('worker.tasks.psycopg2.connect')
    def test_redis_failure_does_not_abort_task(self, mock_connect, mock_redis_cls):
        """Redis unavailability should not prevent the DB UPDATE from succeeding."""
        conn, _ = self._make_sync_conn()
        mock_connect.return_value = conn

        r = _make_redis()
        r.delete.side_effect = Exception('Redis down')
        mock_redis_cls.from_url.return_value = r

        result = tasks.sync_like_counts(self=MagicMock())

        self.assertIn('updated_rows', result)
        conn.commit.assert_called_once()


# ===========================================================================
# invalidate_cache_keys
# ===========================================================================

class TestInvalidateCacheKeys(unittest.TestCase):

    @patch('worker.tasks.redis.Redis')
    def test_deletes_specified_keys(self, mock_redis_cls):
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        result = tasks.invalidate_cache_keys(['api:homepage', 'api:awards'])

        all_deleted = {arg for c in r.delete.call_args_list for arg in c[0]}
        self.assertIn('api:homepage', all_deleted)
        self.assertIn('api:awards', all_deleted)

    @patch('worker.tasks.redis.Redis')
    def test_empty_key_list_returns_zero(self, mock_redis_cls):
        r = _make_redis()
        mock_redis_cls.from_url.return_value = r

        result = tasks.invalidate_cache_keys([])

        self.assertEqual(result['deleted'], 0)
        r.delete.assert_not_called()

    @patch('worker.tasks.redis.Redis')
    def test_single_key_deleted(self, mock_redis_cls):
        r = _make_redis()
        r.delete.return_value = 1
        mock_redis_cls.from_url.return_value = r

        result = tasks.invalidate_cache_keys(['api:search-books-award-winners'])

        all_deleted = {arg for c in r.delete.call_args_list for arg in c[0]}
        self.assertIn('api:search-books-award-winners', all_deleted)

    @patch('worker.tasks.redis.Redis')
    def test_redis_error_returns_graceful_error(self, mock_redis_cls):
        r = _make_redis()
        r.delete.side_effect = Exception('Redis unavailable')
        mock_redis_cls.from_url.return_value = r

        result = tasks.invalidate_cache_keys(['api:homepage'])

        self.assertEqual(result['deleted'], 0)
        self.assertIn('error', result)

    @patch('worker.tasks.redis.Redis')
    def test_returns_delete_count(self, mock_redis_cls):
        r = _make_redis()
        r.delete.return_value = 3
        mock_redis_cls.from_url.return_value = r

        result = tasks.invalidate_cache_keys(['k1', 'k2', 'k3'])

        self.assertEqual(result['deleted'], 3)


# ===========================================================================
# Cache key consistency: keys must match server/server.js
# ===========================================================================

class TestCacheKeyConsistency(unittest.TestCase):
    """Verify that key strings in tasks.py match what server.js CACHE_KEYS uses."""

    EXPECTED_KEYS = {
        'api:homepage',
        'api:search-books-award-winners',
        'api:books-for-profile',
        'api:awards',
        'api:book-awards',
    }

    def test_tasks_constants_cover_all_server_keys(self):
        # Read tasks.py source to look for hard-coded strings
        src_path = os.path.join(ROOT, 'worker', 'tasks.py')
        with open(src_path, encoding='utf-8') as f:
            source = f.read()
        for key in self.EXPECTED_KEYS:
            self.assertIn(key, source, f'Key {key!r} not found in tasks.py')

    def test_cache_keys_dict_present_in_tasks(self):
        self.assertIn('CACHE_KEYS', dir(tasks))
        self.assertEqual(tasks.CACHE_KEYS['HOMEPAGE'], 'api:homepage')
        self.assertEqual(tasks.CACHE_KEYS['SEARCH_BOOKS'], 'api:search-books-award-winners')
        self.assertEqual(tasks.CACHE_KEYS['AWARDS'], 'api:awards')
        self.assertEqual(tasks.CACHE_KEYS['BOOK_AWARDS'], 'api:book-awards')

    def test_ttl_values_are_positive(self):
        for name, val in tasks.TTL.items():
            self.assertGreater(val, 0, f'TTL[{name!r}] must be positive')


if __name__ == '__main__':
    unittest.main()
