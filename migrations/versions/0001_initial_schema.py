"""Initial schema – captures all tables managed inline by server.js startup.

This migration supersedes the hand-rolled DDL that server.js ran on every
start via ensureBookAwardsMapping / ensureAuthorAwardsModel /
ensureLikeDislikeInfrastructure.  Running ``alembic upgrade head`` from the
project root will bring a blank database to the current state.

Revision ID: 0001
Revises: (none – first migration)
Create Date: 2026-04-03
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Sequence used for book_id generation
    # ------------------------------------------------------------------
    op.execute(
        "CREATE SEQUENCE IF NOT EXISTS unique_id_seq START 1 INCREMENT 1;"
    )

    # ------------------------------------------------------------------
    # Core tables (CREATE IF NOT EXISTS – safe to run against an existing DB)
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.users (
            id          SERIAL PRIMARY KEY,
            username    VARCHAR(255) UNIQUE NOT NULL,
            email       VARCHAR(255) UNIQUE NOT NULL,
            hash        VARCHAR(255) NOT NULL,
            reading_preference VARCHAR(255),
            favorite_genre     VARCHAR(255)
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.authors (
            id         INTEGER PRIMARY KEY,
            given_name VARCHAR(255),
            last_name  VARCHAR(255),
            full_name  VARCHAR(512)
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.awards (
            id           SERIAL PRIMARY KEY,
            prize_name   VARCHAR(255),
            prize_type   VARCHAR(50)  DEFAULT 'book',
            prize_year   INTEGER,
            prize_genre  VARCHAR(100),
            prize_amount NUMERIC
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.books (
            id               INTEGER PRIMARY KEY,
            book_id          BIGINT,
            title            TEXT,
            author_id        INTEGER REFERENCES public.authors(id) ON DELETE SET NULL,
            award_id         INTEGER REFERENCES public.awards(id)  ON DELETE SET NULL,
            publication_year INTEGER,
            prize_year       INTEGER,
            genre            VARCHAR(100),
            person_id        INTEGER,
            role             VARCHAR(100),
            source           VARCHAR(100),
            verified         BOOLEAN DEFAULT FALSE,
            like_dislike     TEXT
        );
        """
    )

    # ------------------------------------------------------------------
    # book_awards junction table
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.book_awards (
            id         SERIAL PRIMARY KEY,
            book_id    INTEGER NOT NULL REFERENCES public.books(id)  ON DELETE CASCADE,
            award_id   INTEGER NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
            UNIQUE (book_id, award_id)
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_book_awards_book_id  ON public.book_awards(book_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_book_awards_award_id ON public.book_awards(award_id);"
    )

    # ------------------------------------------------------------------
    # author_awards table
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.author_awards (
            id           SERIAL PRIMARY KEY,
            author_id    INTEGER NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
            award_id     INTEGER NOT NULL REFERENCES public.awards(id)  ON DELETE CASCADE,
            prize_year   INTEGER,
            role         VARCHAR(100),
            source       VARCHAR(100),
            verified     BOOLEAN DEFAULT TRUE,
            created_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
            prize_amount NUMERIC,
            like_dislike TEXT DEFAULT 'Not Applicable',
            UNIQUE (author_id, award_id, prize_year, role, source)
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_author_awards_author_id ON public.author_awards(author_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_author_awards_award_id ON public.author_awards(award_id);"
    )

    # ------------------------------------------------------------------
    # user_preferred_books
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.user_preferred_books (
            id             SERIAL PRIMARY KEY,
            user_id        INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            book_id        INTEGER          REFERENCES public.books(id) ON DELETE CASCADE,
            author_award_id INTEGER         REFERENCES public.author_awards(id) ON DELETE CASCADE,
            CONSTRAINT user_preferred_books_exactly_one_ref CHECK (
                (book_id IS NOT NULL AND author_award_id IS NULL)
                OR (book_id IS NULL AND author_award_id IS NOT NULL)
            )
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferred_books_user_book_unique
        ON public.user_preferred_books (user_id, book_id)
        WHERE book_id IS NOT NULL;
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferred_books_user_author_award_unique
        ON public.user_preferred_books (user_id, author_award_id)
        WHERE author_award_id IS NOT NULL;
        """
    )

    # ------------------------------------------------------------------
    # admins table (supports both legacy "password" + new "password_hash")
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.admins (
            id            SERIAL PRIMARY KEY,
            username      VARCHAR(255) UNIQUE NOT NULL,
            email         VARCHAR(255),
            password_hash VARCHAR(255)
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email_unique
        ON public.admins ((LOWER(email)))
        WHERE email IS NOT NULL;
        """
    )

    # ------------------------------------------------------------------
    # Like / dislike tables
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.user_book_likes (
            id      SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            book_id INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
            liked   BOOLEAN NOT NULL,
            likedon DATE DEFAULT CURRENT_DATE,
            UNIQUE (user_id, book_id)
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS public.admin_book_likes (
            id       SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
            book_id  INTEGER NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
            liked    BOOLEAN NOT NULL,
            likedon  DATE DEFAULT CURRENT_DATE,
            UNIQUE (admin_id, book_id)
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_book_likes_book_id  ON public.user_book_likes(book_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_admin_book_likes_book_id ON public.admin_book_likes(book_id);"
    )

    # ------------------------------------------------------------------
    # Performance indexes on hot query columns
    # ------------------------------------------------------------------
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_books_author_id       ON public.books(author_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_books_award_id        ON public.books(award_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_books_verified_role   ON public.books(verified, role);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_author_awards_verified ON public.author_awards(verified, role);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_awards_prize_type     ON public.awards(prize_type);"
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.execute("DROP TABLE IF EXISTS public.admin_book_likes CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.user_book_likes CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.user_preferred_books CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.admins CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.author_awards CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.book_awards CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.books CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.awards CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.authors CASCADE;")
    op.execute("DROP TABLE IF EXISTS public.users CASCADE;")
    op.execute("DROP SEQUENCE IF EXISTS unique_id_seq;")
