#!/usr/bin/env python3
"""
Rebuild the Look Up Book dataset from all four data subfolders.

Key behaviors:
- Rebuilds authors, awards, books, author_awards, and book_awards from source TSV files.
- Includes both book awards and author career awards (winner rows only).
- Ensures award-winning book rows have author_id and prize_year.
- Assigns deterministic IDs:
  - authors: sorted by last_name then given_name
  - awards: book awards first, then career awards, then other; alphabetic within type
    - books: sorted by title
"""

from __future__ import annotations

import csv
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import psycopg2
from psycopg2.extras import execute_values


@dataclass
class AuthorDraft:
    given_name: str
    last_name: str
    full_name: str


@dataclass
class AwardDraft:
    prize_name: str
    prize_type: str
    prize_institution: Optional[str]
    prize_genre: Optional[str]


@dataclass
class BookDraft:
    title: Optional[str]
    author_key: str
    source: str
    genre: Optional[str]
    prize_year: Optional[int]
    publication_year: Optional[int]
    award_key: Optional[str]
    role: str


@dataclass
class AuthorAwardDraft:
    author_key: str
    award_key: str
    source: str
    prize_year: Optional[int]
    role: str


def load_env_file(env_path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not env_path.exists():
        return values

    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def normalize_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def clean_text(value: Optional[str]) -> str:
    if value is None:
        return ""
    return normalize_spaces(str(value).replace("\x00", " "))


def parse_year(value: Optional[str]) -> Optional[int]:
    text = clean_text(value)
    if not text:
        return None

    m = re.search(r"(18\d{2}|19\d{2}|20\d{2}|2100)", text)
    if not m:
        return None

    year = int(m.group(1))
    if 1800 <= year <= 2100:
        return year
    return None


def normalize_name_key(given_name: str, last_name: str, full_name: str) -> str:
    return "|".join(
        [
            re.sub(r"[^a-z0-9]+", "", given_name.lower()),
            re.sub(r"[^a-z0-9]+", "", last_name.lower()),
            re.sub(r"[^a-z0-9]+", "", full_name.lower()),
        ]
    )


def parse_author_name(full_name: str, given_name: str = "", last_name: str = "") -> Tuple[str, str, str]:
    gn = clean_text(given_name)
    ln = clean_text(last_name)
    fn = clean_text(full_name)

    if gn and ln:
        if not fn:
            fn = normalize_spaces(f"{gn} {ln}")
        return gn, ln, fn

    if "," in fn:
        left, right = fn.split(",", 1)
        ln = clean_text(left)
        gn = clean_text(right)
    elif fn:
        parts = fn.split(" ")
        if len(parts) == 1:
            ln = parts[0]
            gn = ""
        else:
            gn = " ".join(parts[:-1])
            ln = parts[-1]

    if not fn:
        fn = normalize_spaces(f"{gn} {ln}")

    return gn, ln, fn


def tsv_rows(file_path: Path):
    with file_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            yield row


def award_type_rank(prize_type: str) -> int:
    t = prize_type.lower()
    if t == "book":
        return 0
    if t == "career":
        return 1
    return 2


def book_sort_key(row: BookDraft, author_lookup: Dict[str, AuthorDraft]):
    author = author_lookup[row.author_key]
    title = clean_text(row.title)
    if title:
        return (0, title.lower(), author.last_name.lower(), author.given_name.lower(), row.prize_year or 9999)
    return (1, author.last_name.lower(), author.given_name.lower(), row.prize_year or 9999)


def main() -> None:
    root = Path(__file__).resolve().parent
    data_root_candidates = list((root / "data").glob("data-*"))
    if not data_root_candidates:
        raise RuntimeError("Could not find data/data-* folder.")
    data_root = data_root_candidates[0]

    env = load_env_file(root / "server" / ".env")

    db_host = env.get("DB_HOST", "localhost")
    db_port = int(env.get("DB_PORT", "5432"))
    db_name = env.get("DB_NAME", "look_up_book_db")
    db_user = env.get("DB_USER", "app_user")
    db_password = env.get("DB_PASSWORD", "look_up_book_app_secure_2025")

    authors: Dict[str, AuthorDraft] = {}
    awards: Dict[str, AwardDraft] = {}
    books: List[BookDraft] = []
    author_awards: List[AuthorAwardDraft] = []

    def ensure_author(full_name: str, given_name: str = "", last_name: str = "") -> str:
        gn, ln, fn = parse_author_name(full_name, given_name, last_name)
        if not fn:
            fn = "Unknown Author"
        key = normalize_name_key(gn, ln, fn)
        if key not in authors:
            authors[key] = AuthorDraft(given_name=gn, last_name=ln, full_name=fn)
        return key

    def ensure_award(prize_name: str, prize_type: str, institution: str = "", genre: str = "") -> Optional[str]:
        name = clean_text(prize_name)
        if not name:
            return None
        ptype = clean_text(prize_type).lower() or "other"
        key = f"{ptype}|{name.lower()}"
        if key not in awards:
            awards[key] = AwardDraft(
                prize_name=name,
                prize_type=ptype,
                prize_institution=clean_text(institution) or None,
                prize_genre=clean_text(genre) or None,
            )
        return key

    # 1) major_literary_prizes (award-bearing core dataset)
    winners_file = data_root / "major_literary_prizes" / "major_literary_prizes-winners_judges.tsv"
    for row in tsv_rows(winners_file):
        role = clean_text(row.get("role", "")).lower()
        if role != "winner":
            continue

        full_name = clean_text(row.get("full_name", ""))
        given_name = clean_text(row.get("given_name", ""))
        last_name = clean_text(row.get("last_name", ""))
        title = clean_text(row.get("title_of_winning_book", ""))

        award_name = clean_text(row.get("prize_name", ""))
        award_type = clean_text(row.get("prize_type", "")).lower()
        prize_year = parse_year(row.get("prize_year"))
        prize_genre = clean_text(row.get("prize_genre", ""))
        institution = clean_text(row.get("prize_institution", ""))

        if not award_type:
            award_type = "book" if title else "career"

        author_key = ensure_author(full_name=full_name, given_name=given_name, last_name=last_name)
        award_key = ensure_award(award_name, award_type, institution, prize_genre)

        # Keep only award winner rows that have a year.
        if prize_year is None or award_key is None:
            continue

        if award_type == "book":
            if not title:
                continue
            books.append(
                BookDraft(
                    title=title,
                    author_key=author_key,
                    source="major_literary_prizes",
                    genre=prize_genre or "Unknown",
                    prize_year=prize_year,
                    publication_year=None,
                    award_key=award_key,
                    role="winner",
                )
            )
        else:
            author_awards.append(
                AuthorAwardDraft(
                    author_key=author_key,
                    award_key=award_key,
                    source="major_literary_prizes",
                    prize_year=prize_year,
                    role="winner",
                )
            )

    # 2) catalog books from the other subfolders (plus metadata from major prizes)
    catalog_sources = [
        (data_root / "hathitrust_fiction" / "hathitrust_post45fiction_metadata.tsv", "hathitrust_fiction"),
        (
            data_root / "nyt_hardcover_fiction_bestsellers" / "nyt_hardcover_fiction_bestsellers-hathitrust_metadata.tsv",
            "nyt_hardcover_fiction_bestsellers",
        ),
        (data_root / "major_literary_prizes" / "major_literary_prizes-hathitrust_metadata.tsv", "major_literary_prizes_metadata"),
        (data_root / "iowa_writers_workshop" / "iowa_writers_workshop-hathitrust_metadata.tsv", "iowa_writers_workshop"),
    ]

    for file_path, source_name in catalog_sources:
        for row in tsv_rows(file_path):
            title = clean_text(row.get("shorttitle") or row.get("title") or "")
            if not title:
                continue

            full_name = clean_text(row.get("author") or row.get("full_name") or "")
            given_name = clean_text(row.get("given_name") or "")
            last_name = clean_text(row.get("last_name") or row.get("family_name") or "")

            if not (full_name or given_name or last_name):
                continue

            publication_year = parse_year(row.get("imprintdate") or row.get("inferreddate") or row.get("pubdate"))
            genre = clean_text(row.get("genre") or "") or "fiction"

            author_key = ensure_author(full_name=full_name, given_name=given_name, last_name=last_name)
            books.append(
                BookDraft(
                    title=title,
                    author_key=author_key,
                    source=source_name,
                    genre=genre,
                    prize_year=None,
                    publication_year=publication_year,
                    award_key=None,
                    role="catalog",
                )
            )

    # 3) iowa people as authors
    iowa_people_file = data_root / "iowa_writers_workshop" / "iowa_writers_workshop-people.tsv"
    for row in tsv_rows(iowa_people_file):
        ensure_author(
            full_name=clean_text(row.get("full_name") or ""),
            given_name=clean_text(row.get("given_name") or ""),
            last_name=clean_text(row.get("family_name") or ""),
        )

    # Deduplicate books (keep first by deterministic order input)
    dedup_books: Dict[Tuple[str, str, Optional[int], Optional[str], str], BookDraft] = {}
    for b in books:
        dedup_key = (
            clean_text(b.title).lower(),
            b.author_key,
            b.prize_year,
            b.award_key,
            b.role,
        )
        if dedup_key not in dedup_books:
            dedup_books[dedup_key] = b

    books = list(dedup_books.values())

    dedup_author_awards: Dict[Tuple[str, str, Optional[int], str, str], AuthorAwardDraft] = {}
    for author_award in author_awards:
        dedup_key = (
            author_award.author_key,
            author_award.award_key,
            author_award.prize_year,
            author_award.role,
            author_award.source,
        )
        if dedup_key not in dedup_author_awards:
            dedup_author_awards[dedup_key] = author_award

    author_awards = list(dedup_author_awards.values())

    # Assign deterministic IDs
    sorted_authors = sorted(
        authors.items(),
        key=lambda kv: (kv[1].last_name.lower(), kv[1].given_name.lower(), kv[1].full_name.lower()),
    )
    author_id_by_key: Dict[str, int] = {k: i + 1 for i, (k, _) in enumerate(sorted_authors)}

    sorted_awards = sorted(
        awards.items(),
        key=lambda kv: (award_type_rank(kv[1].prize_type), kv[1].prize_name.lower()),
    )
    award_id_by_key: Dict[str, int] = {k: i + 1 for i, (k, _) in enumerate(sorted_awards)}

    books.sort(key=lambda row: book_sort_key(row, authors))

    # Prepare insert payloads
    author_rows = []
    for key, a in sorted_authors:
        author_rows.append(
            (
                author_id_by_key[key],
                a.given_name or None,
                a.last_name or None,
                a.full_name or None,
                True,
            )
        )

    award_rows = []
    for key, aw in sorted_awards:
        award_id = award_id_by_key[key]
        award_rows.append(
            (
                award_id,
                award_id,
                aw.prize_name,
                aw.prize_institution,
                None,
                aw.prize_genre,
                aw.prize_type,
                None,
            )
        )

    author_award_rows = []
    for i, author_award in enumerate(
        sorted(
            author_awards,
            key=lambda row: (
                author_id_by_key[row.author_key],
                award_id_by_key[row.award_key],
                row.prize_year or 9999,
                row.source.lower(),
            ),
        ),
        start=1,
    ):
        author_award_rows.append(
            (
                i,
                author_id_by_key[author_award.author_key],
                award_id_by_key[author_award.award_key],
                author_award.prize_year,
                author_award.role,
                author_award.source,
                True,
            )
        )

    book_rows = []
    book_award_rows = []
    for i, b in enumerate(books, start=1):
        award_id = award_id_by_key[b.award_key] if b.award_key else None
        author_id = author_id_by_key[b.author_key]
        book_rows.append(
            (
                i,
                i,
                b.title,
                author_id,
                None,
                award_id,
                b.prize_year,
                b.publication_year,
                b.genre,
                True,
                b.role,
                b.source,
            )
        )
        if award_id is not None:
            book_award_rows.append((i, award_id))

    conn = psycopg2.connect(
        host=db_host,
        port=db_port,
        database=db_name,
        user=db_user,
        password=db_password,
    )

    try:
        with conn:
            with conn.cursor() as cur:
                # Ensure schema compatibility with current app queries.
                cur.execute(
                    """
                    ALTER TABLE books
                    ADD COLUMN IF NOT EXISTS publication_year INTEGER;
                    """
                )

                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS author_awards (
                        id SERIAL PRIMARY KEY,
                        author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
                        award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
                        prize_year INTEGER,
                        role VARCHAR(100),
                        source VARCHAR(100),
                        verified BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                        UNIQUE (author_id, award_id, prize_year, role, source)
                    );
                    """
                )

                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS book_awards (
                        id SERIAL PRIMARY KEY,
                        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
                        award_id INTEGER NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
                        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                        UNIQUE (book_id, award_id)
                    );
                    """
                )

                # Clear data tables while preserving users/admins.
                cur.execute("TRUNCATE TABLE user_preferred_books, user_book_likes, book_awards, author_awards, books, awards, people, authors RESTART IDENTITY CASCADE;")

                execute_values(
                    cur,
                    """
                    INSERT INTO authors (id, given_name, last_name, full_name, verified)
                    VALUES %s
                    """,
                    author_rows,
                    page_size=2000,
                )

                execute_values(
                    cur,
                    """
                    INSERT INTO awards (id, award_id, prize_name, prize_institution, prize_year, prize_genre, prize_type, prize_amount)
                    VALUES %s
                    """,
                    award_rows,
                    page_size=1000,
                )

                execute_values(
                    cur,
                    """
                    INSERT INTO books (id, book_id, title, author_id, person_id, award_id, prize_year, publication_year, genre, verified, role, source)
                    VALUES %s
                    """,
                    book_rows,
                    page_size=2000,
                )

                if author_award_rows:
                    execute_values(
                        cur,
                        """
                        INSERT INTO author_awards (id, author_id, award_id, prize_year, role, source, verified)
                        VALUES %s
                        """,
                        author_award_rows,
                        page_size=1000,
                    )

                if book_award_rows:
                    execute_values(
                        cur,
                        """
                        INSERT INTO book_awards (book_id, award_id)
                        VALUES %s
                        ON CONFLICT (book_id, award_id) DO NOTHING
                        """,
                        book_award_rows,
                        page_size=2000,
                    )

                # Keep sequences aligned for future inserts.
                cur.execute("SELECT setval('authors_id_seq', COALESCE((SELECT MAX(id) FROM authors), 1), true);")
                cur.execute("SELECT setval('awards_id_seq', COALESCE((SELECT MAX(id) FROM awards), 1), true);")
                cur.execute("SELECT setval('books_id_seq', COALESCE((SELECT MAX(id) FROM books), 1), true);")
                cur.execute("SELECT setval('author_awards_id_seq', COALESCE((SELECT MAX(id) FROM author_awards), 1), true);")

        print("Rebuild complete.")
        print(f"Authors inserted: {len(author_rows)}")
        print(f"Awards inserted: {len(award_rows)}")
        print(f"Books inserted: {len(book_rows)}")
        print(f"Author/Award links inserted: {len(author_award_rows)}")
        print(f"Book/Award links inserted: {len(book_award_rows)}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
