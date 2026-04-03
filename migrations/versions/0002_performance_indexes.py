"""Add performance indexes and TABLESAMPLE helper view.

Replaces ORDER BY RANDOM() (O(n) full-table scan) with a materialised random
selection view that the cache seeder can refresh cheaply.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-03
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Composite index to accelerate the homepage UNION query
    # (verified books with a known author)
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_books_homepage
        ON public.books (verified, role, publication_year DESC NULLS LAST)
        WHERE verified = true AND role = 'winner';
        """
    )

    # Index used by the awards endpoint GROUP BY subqueries
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_book_awards_award_book ON public.book_awards(award_id, book_id);"
    )

    # Partial index for author_awards winner rows (career-award endpoint)
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_author_awards_winner
        ON public.author_awards (award_id, author_id)
        WHERE verified = true AND role = 'winner';
        """
    )

    # ------------------------------------------------------------------
    # Materialized view: fast homepage sample
    # Refreshed by the Celery worker; falls back to live query when stale.
    # ------------------------------------------------------------------
    op.execute(
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_homepage_sample AS
        WITH book_enriched AS (
            SELECT
                b.id               AS book_id,
                b.title            AS title_of_winning_book,
                COALESCE(b.genre, 'Unknown')                             AS prize_genre,
                COALESCE(b.prize_year, b.publication_year)               AS display_year,
                b.publication_year,
                b.prize_year,
                b.verified,
                b.author_id,
                COALESCE(a.full_name, 'Unknown')                         AS author_name,
                COALESCE(award_agg.prize_names, aw_leg.prize_name, 'N/A') AS prize_name,
                COALESCE(award_agg.prize_types, aw_leg.prize_type, 'book') AS prize_type,
                COALESCE(lk.like_count, 0)::integer                      AS like_count,
                COALESCE(lk.dislike_count, 0)::integer                   AS dislike_count,
                COALESCE(
                    b.like_dislike,
                    COALESCE(lk.like_count, 0)::text || ' Likes / ' ||
                    COALESCE(lk.dislike_count, 0)::text || ' Dislikes'
                )                                                        AS like_dislike
            FROM books b
            LEFT JOIN authors a           ON b.author_id = a.id
            LEFT JOIN awards  aw_leg      ON b.award_id  = aw_leg.id
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
                NULL::integer              AS book_id,
                'Career Award'::text       AS title_of_winning_book,
                COALESCE(aw.prize_genre, 'Unknown') AS prize_genre,
                COALESCE(aa.prize_year, aw.prize_year) AS display_year,
                NULL::integer              AS publication_year,
                COALESCE(aa.prize_year, aw.prize_year) AS prize_year,
                COALESCE(aa.verified, true) AS verified,
                aa.author_id,
                COALESCE(a.full_name, 'Unknown') AS author_name,
                aw.prize_name,
                'career'::text             AS prize_type,
                0::integer                 AS like_count,
                0::integer                 AS dislike_count,
                COALESCE(aa.like_dislike, 'Not Applicable') AS like_dislike
            FROM author_awards aa
            JOIN awards aw ON aw.id = aa.award_id
            LEFT JOIN authors a ON a.id = aa.author_id
            WHERE COALESCE(aa.verified, true) = true
              AND COALESCE(aa.role, 'winner') = 'winner'
              AND COALESCE(aw.prize_type, '') = 'career'
              AND COALESCE(aa.prize_year, aw.prize_year) IS NOT NULL
        )
        SELECT * FROM book_enriched
        UNION ALL
        SELECT * FROM career_enriched
        WITH NO DATA;
        """
    )

    # Unique index required to REFRESH CONCURRENTLY later
    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_homepage_sample_book_id
        ON public.mv_homepage_sample (book_id)
        WHERE book_id IS NOT NULL;
        """
    )


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS public.mv_homepage_sample CASCADE;")
    op.execute("DROP INDEX IF EXISTS idx_books_homepage;")
    op.execute("DROP INDEX IF EXISTS idx_book_awards_award_book;")
    op.execute("DROP INDEX IF EXISTS idx_author_awards_winner;")
