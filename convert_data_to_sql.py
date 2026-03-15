#!/usr/bin/env python3
"""
Convert TSV data files to PostgreSQL SQL format
This script consolidates all book-related data into a single SQL database file
"""

import os
import csv
from pathlib import Path
from datetime import datetime

# Data directory
DATA_DIR = Path(__file__).parent / "data" / "data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd"

class SQLGenerator:
    def __init__(self):
        self.sql_statements = []
        self.book_id_counter = 1
        self.author_id_counter = 1
        self.person_id_counter = 1
        self.award_id_counter = 1
        self.books_data = {}
        self.authors_data = {}
        self.people_data = {}
        self.awards_data = {}
        
    def add_header(self):
        """Add PostgreSQL dump header"""
        header = f"""--
-- PostgreSQL database dump
--

-- Generated: {datetime.now()}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

"""
        self.sql_statements.append(header)
    
    def create_sequences(self):
        """Create sequences for IDs"""
        sequences = """--
-- Sequences
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.authors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.awards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.user_book_likes_like_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.user_preferred_books_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.unique_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

"""
        self.sql_statements.append(sequences)
    
    def create_tables(self):
        """Create all necessary tables"""
        tables = """--
-- Tables
--

CREATE TABLE public.admins (
    id integer NOT NULL DEFAULT nextval('public.admins_id_seq'::regclass),
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE public.users (
    id integer NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
    username character varying(50) NOT NULL UNIQUE,
    email character varying(100) NOT NULL UNIQUE,
    hash character varying(255) NOT NULL,
    reading_preference character varying(255),
    favorite_genre character varying(255),
    PRIMARY KEY (id)
);

CREATE TABLE public.authors (
    id integer NOT NULL DEFAULT nextval('public.authors_id_seq'::regclass),
    given_name character varying(255),
    last_name character varying(255),
    full_name character varying(512),
    PRIMARY KEY (id)
);

CREATE TABLE public.people (
    id integer NOT NULL DEFAULT nextval('public.people_id_seq'::regclass),
    person_id integer,
    full_name character varying(512),
    given_name character varying(255),
    middle_name character varying(255),
    family_name character varying(255),
    pen_name character varying(255),
    gender character varying(50),
    country character varying(255),
    elite_institution character varying(255),
    graduate_degree character varying(255),
    mfa_degree character varying(255),
    PRIMARY KEY (id)
);

CREATE TABLE public.awards (
    id integer NOT NULL DEFAULT nextval('public.awards_id_seq'::regclass),
    award_id integer,
    prize_name character varying(255),
    prize_institution character varying(255),
    prize_year integer,
    prize_genre character varying(100),
    prize_type character varying(50),
    prize_amount numeric,
    PRIMARY KEY (id)
);

CREATE TABLE public.books (
    id integer NOT NULL DEFAULT nextval('public.books_id_seq'::regclass),
    book_id integer,
    title character varying(512),
    author_id integer,
    person_id integer,
    award_id integer,
    prize_year integer,
    genre character varying(100),
    verified boolean DEFAULT false,
    role character varying(50),
    source character varying(100),
    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES public.authors(id),
    FOREIGN KEY (award_id) REFERENCES public.awards(id)
);

CREATE TABLE public.user_book_likes (
    like_id integer NOT NULL DEFAULT nextval('public.user_book_likes_like_id_seq'::regclass),
    user_id integer NOT NULL,
    book_id integer NOT NULL,
    likedon date NOT NULL,
    liked boolean,
    PRIMARY KEY (like_id),
    UNIQUE (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (book_id) REFERENCES public.books(id)
);

CREATE TABLE public.user_preferred_books (
    id integer NOT NULL DEFAULT nextval('public.user_preferred_books_id_seq'::regclass),
    user_id integer NOT NULL,
    book_id integer NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (book_id) REFERENCES public.books(id)
);

"""
        self.sql_statements.append(tables)
    
    def escape_sql_string(self, value):
        """Escape special characters in SQL strings"""
        if value is None or value == '':
            return 'NULL'
        if isinstance(value, bool):
            return 'true' if value else 'false'
        if isinstance(value, (int, float)):
            return str(value)
        # Escape single quotes
        value = str(value).replace("'", "''")
        return f"'{value}'"
    
    def read_tsv_file(self, filepath):
        """Read a TSV file and return list of dictionaries"""
        data = []
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                reader = csv.DictReader(f, delimiter='\t')
                for row in reader:
                    if row:  # Skip empty rows
                        data.append(row)
            print(f"✓ Read {len(data)} rows from {filepath.name}")
        except Exception as e:
            print(f"✗ Error reading {filepath}: {e}")
        return data
    
    def process_hathitrust_fiction(self):
        """Process HathiTrust Fiction metadata"""
        filepath = DATA_DIR / "hathitrust_fiction" / "hathitrust_post45fiction_metadata.tsv"
        data = self.read_tsv_file(filepath)
        
        for row in data:
            try:
                title = row.get('title', '').strip()
                author = row.get('author', '').strip()
                
                if title and author:
                    # Create author
                    author_parts = author.split(',')
                    last_name = author_parts[0].strip() if len(author_parts) > 0 else ''
                    given_name = author_parts[1].strip() if len(author_parts) > 1 else ''
                    
                    # Store book data
                    self.books_data[self.book_id_counter] = {
                        'title': title,
                        'author': author,
                        'given_name': given_name,
                        'last_name': last_name,
                        'year': row.get('latestcomp', '').strip() or '1946',
                        'genre': 'fiction',
                        'source': 'hathitrust'
                    }
                    self.book_id_counter += 1
            except Exception as e:
                print(f"  Warning: Error processing row: {e}")
    
    def process_iowa_workshop(self):
        """Process Iowa Writers Workshop data"""
        people_file = DATA_DIR / "iowa_writers_workshop" / "iowa_writers_workshop-people.tsv"
        people_data = self.read_tsv_file(people_file)
        
        for row in people_data:
            try:
                self.people_data[self.person_id_counter] = {
                    'person_id': row.get('person_id'),
                    'full_name': row.get('full_name', '').strip(),
                    'given_name': row.get('given_name', '').strip(),
                    'family_name': row.get('family_name', '').strip(),
                    'gender': row.get('gender', '').strip(),
                    'country': row.get('country', '').strip()
                }
                self.person_id_counter += 1
            except Exception as e:
                print(f"  Warning: Error processing row: {e}")
    
    def process_major_literary_prizes(self):
        """Process major literary prizes data"""
        filepath = DATA_DIR / "major_literary_prizes" / "major_literary_prizes-winners_judges.tsv"
        data = self.read_tsv_file(filepath)
        
        for row in data:
            try:
                title = row.get('title_of_winning_book', '').strip()
                author = row.get('full_name', '').strip()
                prize_name = row.get('prize_name', '').strip()
                
                if title and author and prize_name:
                    # Create or get award
                    award_key = (prize_name, row.get('prize_institution', '').strip())
                    if award_key not in self.awards_data:
                        self.awards_data[award_key] = {
                            'name': prize_name,
                            'institution': row.get('prize_institution', '').strip(),
                            'genre': row.get('prize_genre', '').strip(),
                            'type': row.get('prize_type', '').strip(),
                            'amount': row.get('prize_amount', '').strip() or 'NULL'
                        }
                    
                    # Create author
                    author_key = (row.get('given_name', '').strip(), row.get('last_name', '').strip())
                    if author_key not in self.authors_data:
                        self.authors_data[author_key] = {
                            'given_name': author_key[0],
                            'last_name': author_key[1],
                            'full_name': author
                        }
                    
                    # Store book data
                    self.books_data[self.book_id_counter] = {
                        'title': title,
                        'author': author,
                        'given_name': row.get('given_name', '').strip(),
                        'last_name': row.get('last_name', '').strip(),
                        'year': row.get('prize_year', '').strip() or '2000',
                        'genre': row.get('prize_genre', '').strip() or 'prose',
                        'source': 'major_literary_prizes',
                        'role': row.get('role', '').strip(),
                        'award': prize_name,
                        'verified': True
                    }
                    self.book_id_counter += 1
            except Exception as e:
                print(f"  Warning: Error processing row: {e}")
    
    def process_nyt_bestsellers(self):
        """Process NYT bestsellers data"""
        filepath = DATA_DIR / "nyt_hardcover_fiction_bestsellers" / "nyt_hardcover_fiction_bestsellers-titles.tsv"
        data = self.read_tsv_file(filepath)
        
        for row in data:
            try:
                title = row.get('title', '').strip()
                author = row.get('author', '').strip()
                
                if title and author:
                    # Create author
                    author_parts = author.split()
                    last_name = author_parts[-1] if author_parts else ''
                    given_name = ' '.join(author_parts[:-1]) if len(author_parts) > 1 else ''
                    
                    # Store book data
                    self.books_data[self.book_id_counter] = {
                        'title': title,
                        'author': author,
                        'given_name': given_name,
                        'last_name': last_name,
                        'year': row.get('year', '').strip() or '2000',
                        'genre': 'fiction',
                        'source': 'nyt_bestsellers'
                    }
                    self.book_id_counter += 1
            except Exception as e:
                print(f"  Warning: Error processing row: {e}")
    
    def generate_insert_statements(self):
        """Generate SQL INSERT statements"""
        inserts = "\n--\n-- Data\n--\n\n"
        
        # Insert authors
        if self.authors_data:
            inserts += "-- Authors\n"
            inserts += "INSERT INTO public.authors (given_name, last_name, full_name) VALUES\n"
            author_values = []
            for author_key, author_info in self.authors_data.items():
                values = (
                    self.escape_sql_string(author_info['given_name']),
                    self.escape_sql_string(author_info['last_name']),
                    self.escape_sql_string(author_info['full_name'])
                )
                author_values.append(f"({values[0]}, {values[1]}, {values[2]})")
            inserts += ",\n".join(author_values) + ";\n\n"
        
        # Insert awards
        if self.awards_data:
            inserts += "-- Awards\n"
            inserts += "INSERT INTO public.awards (prize_name, prize_institution, prize_genre, prize_type, prize_amount) VALUES\n"
            award_values = []
            for award_key, award_info in self.awards_data.items():
                amount = award_info['amount'] if award_info['amount'] != 'NULL' else 'NULL'
                values = (
                    self.escape_sql_string(award_info['name']),
                    self.escape_sql_string(award_info['institution']),
                    self.escape_sql_string(award_info['genre']),
                    self.escape_sql_string(award_info['type']),
                    amount
                )
                award_values.append(f"({values[0]}, {values[1]}, {values[2]}, {values[3]}, {values[4]})")
            inserts += ",\n".join(award_values) + ";\n\n"
        
        # Insert people
        if self.people_data:
            inserts += "-- People\n"
            inserts += "INSERT INTO public.people (person_id, full_name, given_name, family_name, gender, country) VALUES\n"
            people_values = []
            for person_key, person_info in self.people_data.items():
                values = (
                    person_info.get('person_id') or 'NULL',
                    self.escape_sql_string(person_info['full_name']),
                    self.escape_sql_string(person_info['given_name']),
                    self.escape_sql_string(person_info['family_name']),
                    self.escape_sql_string(person_info['gender']),
                    self.escape_sql_string(person_info['country'])
                )
                people_values.append(f"({values[0]}, {values[1]}, {values[2]}, {values[3]}, {values[4]}, {values[5]})")
                if len(people_values) >= 1000:  # Batch inserts
                    inserts += ",\n".join(people_values) + ";\n"
                    people_values = []
            if people_values:
                inserts += ",\n".join(people_values) + ";\n\n"
        
        # Insert books
        if self.books_data:
            inserts += "-- Books\n"
            inserts += "INSERT INTO public.books (book_id, title, author_id, prize_year, genre, verified, role, source) VALUES\n"
            book_values = []
            for book_id, book_info in self.books_data.items():
                verified = 'true' if book_info.get('verified', False) else 'false'
                values = (
                    book_id,
                    self.escape_sql_string(book_info['title']),
                    'NULL',  # author_id - would need proper mapping
                    book_info['year'],
                    self.escape_sql_string(book_info['genre']),
                    verified,
                    self.escape_sql_string(book_info.get('role', 'author')),
                    self.escape_sql_string(book_info['source'])
                )
                book_values.append(f"({values[0]}, {values[1]}, {values[2]}, {values[3]}, {values[4]}, {values[5]}, {values[6]}, {values[7]})")
                if len(book_values) >= 500:  # Batch inserts
                    inserts += ",\n".join(book_values) + ";\n"
                    book_values = []
            if book_values:
                inserts += ",\n".join(book_values) + ";\n\n"
        
        # Insert default admin
        inserts += "-- Admin user\n"
        inserts += "INSERT INTO public.admins (username, email, password_hash, created_at) VALUES "
        inserts += "('Drewadoo', 'zabocek@gmail.com', '$2b$10$lTV6fugrJAS5Maf.r/ifp.1qbyUfbzsSwwjnSYyw0EayQzTbMAHsm', NOW());\n"
        
        self.sql_statements.append(inserts)
    
    def add_footer(self):
        """Add PostgreSQL dump footer"""
        footer = """
--
-- Restore ownership and privileges
--

ALTER TABLE public.admins OWNER TO postgres;
ALTER TABLE public.users OWNER TO postgres;
ALTER TABLE public.authors OWNER TO postgres;
ALTER TABLE public.people OWNER TO postgres;
ALTER TABLE public.awards OWNER TO postgres;
ALTER TABLE public.books OWNER TO postgres;
ALTER TABLE public.user_book_likes OWNER TO postgres;
ALTER TABLE public.user_preferred_books OWNER TO postgres;

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER SEQUENCE public.authors_id_seq OWNED BY public.authors.id;
ALTER SEQUENCE public.awards_id_seq OWNED BY public.awards.id;
ALTER SEQUENCE public.people_id_seq OWNED BY public.people.id;
ALTER SEQUENCE public.books_id_seq OWNED BY public.books.id;
ALTER SEQUENCE public.user_book_likes_like_id_seq OWNED BY public.user_book_likes.like_id;
ALTER SEQUENCE public.user_preferred_books_id_seq OWNED BY public.user_preferred_books.id;

--
-- End of data
--

"""
        self.sql_statements.append(footer)
    
    def generate_sql(self):
        """Generate complete SQL file"""
        print("\n📊 Starting data conversion process...")
        
        self.add_header()
        self.create_sequences()
        self.create_tables()
        
        print("\n📚 Processing data files...")
        self.process_hathitrust_fiction()
        self.process_iowa_workshop()
        self.process_major_literary_prizes()
        self.process_nyt_bestsellers()
        
        print(f"\n📝 Generating SQL statements...")
        print(f"  - {len(self.books_data)} books")
        print(f"  - {len(self.authors_data)} authors")
        print(f"  - {len(self.awards_data)} awards")
        print(f"  - {len(self.people_data)} people")
        
        self.generate_insert_statements()
        self.add_footer()
        
        return "".join(self.sql_statements)

def main():
    """Main entry point"""
    print("🚀 Book Database SQL Converter")
    print("=" * 50)
    
    generator = SQLGenerator()
    sql_content = generator.generate_sql()
    
    # Write to file
    output_file = DATA_DIR.parent.parent / "server" / "consolidated_database.sql"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(sql_content)
        print(f"\n✅ SQL file generated successfully!")
        print(f"📁 Saved to: {output_file}")
        print(f"📊 File size: {len(sql_content) / 1024:.2f} KB")
    except Exception as e:
        print(f"❌ Error writing SQL file: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
