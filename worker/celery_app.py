"""
Celery application configuration for Look Up Book background workers.

Workers are started with:
  celery -A worker.celery_app worker --loglevel=info

Beat (periodic tasks) is started with:
  celery -A worker.celery_app beat --loglevel=info
"""

import os
from pathlib import Path

from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

# Load the server env so DB and Redis credentials are available
_env_path = Path(__file__).resolve().parent.parent / "server" / ".env"
load_dotenv(dotenv_path=_env_path, override=False)

REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")

app = Celery(
    "look_up_book",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["worker.tasks"],
)

app.conf.update(
    # Serialisation
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    # Timezone
    timezone="UTC",
    enable_utc=True,
    # Worker pool
    worker_prefetch_multiplier=1,   # FIFO – important for I/O-heavy tasks
    task_acks_late=True,            # Only ack after task completes
    # Result expiry
    result_expires=3600,
    # Beat schedule – periodic cache warming
    beat_schedule={
        # Re-warm homepage cache every 4 minutes (TTL is 5 min)
        "warm-homepage-cache": {
            "task": "worker.tasks.warm_homepage_cache",
            "schedule": crontab(minute="*/4"),
        },
        # Re-warm the large book-catalog caches every 20 minutes (TTL is 30 min)
        "warm-books-cache": {
            "task": "worker.tasks.warm_books_cache",
            "schedule": crontab(minute="*/20"),
        },
        # Daily like-count sync (keeps books.like_dislike column consistent)
        "sync-like-counts": {
            "task": "worker.tasks.sync_like_counts",
            "schedule": crontab(hour="*/6", minute="0"),
        },
    },
)
