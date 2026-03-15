#!/usr/bin/env python3
"""
Comprehensive database rebuild script for Look Up Book project.
This script loads all data from multiple sources and rebuilds the database
with proper IDs, relationships, and all required columns.
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import os
import sys
from collections import defaultdict
from datetime import datetime
import json

# Database connection parameters
DB_HOST = 'localhost'
DB_PORT = 5432
DB_NAME = 'look_up_book_db'
DB_USER = 'app_user'
DB_PASSWORD = 'look_up_book_app_secure_2025'

# Data folder paths
DATA_BASE_PATH = r'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\data\data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd'

DATA_SOURCES = {
    'hathitrust_fiction': {
        'path': os.path.join(DATA_BASE_PATH, 'hathitrust_fiction'),
        'metadata_file': 'hathitrust_post45fiction_metadata.tsv',
        'source_name': 'hathitrust_fiction'
    },
    'nyt_bestsellers': {
        'path': os.path.join(DATA_BASE_PATH, 'nyt_hardcover_fiction_bestsellers'),
        'metadata_file': 'nyt_hardcover_fiction_bestsellers-hathitrust_metadata.tsv',
        'titles_file': 'nyt_hardcover_fiction_bestsellers-titles.tsv',
        'source_name': 'nyt_bestsellers'
    },
    'major_prizes': {
        'path': os.path.join(DATA_BASE_PATH, 'major_literary_prizes'),
        'metadata_file': 'major_literary_prizes-hathitrust_metadata.tsv',
        'winners_file': 'major_literary_prizes-winners_judges.tsv',
        'source_name': 'major_prizes'
    },
    'iowa_workshop': {
        'path': os.path.join(DATA_BASE_PATH, 'iowa_writers_workshop'),
        'metadata_file': 'iowa_writers_workshop-hathitrust_metadata.tsv',
        'people_file': 'iowa_writers_workshop-people.tsv',
        'graduations_file': 'iowa_writers_workshop-graduations.tsv',
        'source_name': 'iowa_workshop'
    }
}

class DatabaseBuilder:
    def __init__(self):
        self.conn = None
        self.authors_dict = {}  # {author_full_name: {id, given_name, last_name, full_name}}
        self.books_dict = {}    # {title: {id, title, author_id, ...}}
        self.awards_dict = {}   # {award_name: {id, prize_name, ...}}
        self.people_dict = {}   # {person_id: {id, full_name, ...}}
        self.judges_dict = {}   # {judge_name: {id, role: 'judge', ...}}
        
        self.author_list = []   # List to collect all authors
        self.book_list = []     # List to collect all books
        self.award_list = []    # List to collect all awards
        self.people_list = []   # List to collect all people
        
        print("[INFO] DatabaseBuilder initialized")
    
    def _safe_int(self, value):
        """Safely convert value to int or None"""
        if value is None or value == '':
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None
    
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            print(f"[SUCCESS] Connected to database {DB_NAME}")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to connect to database: {e}")
            return False
    
    def disconnect_db(self):
        """Disconnect from database"""
        if self.conn:
            self.conn.close()
            print("[INFO] Disconnected from database")
    
    def drop_and_recreate_tables(self):
        """Drop and recreate all tables"""
        try:
            cur = self.conn.cursor()
            
            # Drop tables in reverse order of dependencies
            drop_statements = [
                "DROP TABLE IF EXISTS user_preferred_books CASCADE;",
                "DROP TABLE IF EXISTS user_book_likes CASCADE;",
                "DROP TABLE IF EXISTS books CASCADE;",
                "DROP TABLE IF EXISTS awards CASCADE;",
                "DROP TABLE IF EXISTS authors CASCADE;",
                "DROP TABLE IF EXISTS people CASCADE;",
                "DROP TABLE IF EXISTS admins CASCADE;",
                "DROP TABLE IF EXISTS users CASCADE;",
                
                # Drop sequences
                "DROP SEQUENCE IF EXISTS user_preferred_books_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS user_book_likes_like_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS books_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS awards_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS authors_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS people_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS admins_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS users_id_seq CASCADE;",
                "DROP SEQUENCE IF EXISTS unique_id_seq CASCADE;",
            ]
            
            for statement in drop_statements:
                cur.execute(statement)
            
            # Create sequences
            sequence_statements = [
                "CREATE SEQUENCE admins_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE users_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE authors_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE books_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE awards_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE people_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE user_book_likes_like_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE user_preferred_books_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
                "CREATE SEQUENCE unique_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;",
            ]
            
            for statement in sequence_statements:
                cur.execute(statement)
            
            # Create tables
            table_statements = [
                """
                CREATE TABLE admins (
                    id INTEGER NOT NULL DEFAULT nextval('admins_id_seq'),
                    username VARCHAR(50) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (id)
                );
                """,
                """
                CREATE TABLE users (
                    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'),
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    hash VARCHAR(255) NOT NULL,
                    reading_preference VARCHAR(255),
                    favorite_genre VARCHAR(255),
                    PRIMARY KEY (id)
                );
                """,
                """
                CREATE TABLE authors (
                    id INTEGER NOT NULL DEFAULT nextval('authors_id_seq'),
                    given_name VARCHAR(255),
                    last_name VARCHAR(255),
                    full_name VARCHAR(512),
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (id)
                );
                """,
                """
                CREATE TABLE people (
                    id INTEGER NOT NULL DEFAULT nextval('people_id_seq'),
                    person_id INTEGER,
                    full_name VARCHAR(512),
                    given_name VARCHAR(255),
                    middle_name VARCHAR(255),
                    family_name VARCHAR(255),
                    pen_name VARCHAR(255),
                    gender VARCHAR(50),
                    country VARCHAR(255),
                    elite_institution VARCHAR(255),
                    graduate_degree VARCHAR(255),
                    mfa_degree VARCHAR(255),
                    biography TEXT,
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (id)
                );
                """,
                """
                CREATE TABLE awards (
                    id INTEGER NOT NULL DEFAULT nextval('awards_id_seq'),
                    award_id INTEGER,
                    prize_name VARCHAR(255),
                    prize_institution VARCHAR(255),
                    prize_year INTEGER,
                    prize_genre VARCHAR(100),
                    prize_type VARCHAR(50),
                    prize_amount NUMERIC,
                    award_category VARCHAR(100),
                    verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (id)
                );
                """,
                """
                CREATE TABLE books (
                    id INTEGER NOT NULL DEFAULT nextval('books_id_seq'),
                    book_id INTEGER,
                    title VARCHAR(512),
                    author_id INTEGER,
                    person_id INTEGER,
                    award_id INTEGER,
                    prize_year INTEGER,
                    genre VARCHAR(100),
                    verified BOOLEAN DEFAULT FALSE,
                    role VARCHAR(50),
                    source VARCHAR(100),
                    hathitrust_id VARCHAR(255),
                    inferred_date INTEGER,
                    print_date INTEGER,
                    created_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (id),
                    FOREIGN KEY (author_id) REFERENCES authors(id),
                    FOREIGN KEY (award_id) REFERENCES awards(id)
                );
                """,
                """
                CREATE TABLE user_book_likes (
                    like_id INTEGER NOT NULL DEFAULT nextval('user_book_likes_like_id_seq'),
                    user_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    likedon DATE NOT NULL,
                    liked BOOLEAN,
                    PRIMARY KEY (like_id),
                    UNIQUE (user_id, book_id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (book_id) REFERENCES books(id)
                );
                """,
                """
                CREATE TABLE user_preferred_books (
                    id INTEGER NOT NULL DEFAULT nextval('user_preferred_books_id_seq'),
                    user_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (book_id) REFERENCES books(id)
                );
                """
            ]
            
            for statement in table_statements:
                cur.execute(statement)
            
            self.conn.commit()
            print("[SUCCESS] Tables recreated successfully")
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[ERROR] Failed to recreate tables: {e}")
            return False
    
    def load_hathitrust_data(self):
        """Load HathiTrust fiction metadata"""
        try:
            filepath = os.path.join(DATA_SOURCES['hathitrust_fiction']['path'], 
                                   DATA_SOURCES['hathitrust_fiction']['metadata_file'])
            print(f"\n[INFO] Loading HathiTrust data from {filepath}")
            
            df = pd.read_csv(filepath, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(df)} records from HathiTrust")
            
            for idx, row in df.iterrows():
                try:
                    title = row.get('shorttitle', '').strip() if pd.notna(row.get('shorttitle')) else ''
                    author_full = row.get('author', '').strip() if pd.notna(row.get('author')) else ''
                    given_name = row.get('given_name', '').strip() if pd.notna(row.get('given_name')) else ''
                    last_name = row.get('last_name', '').strip() if pd.notna(row.get('last_name')) else ''
                    hathitrust_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                    oclc_id = row.get('oclc', '') if pd.notna(row.get('oclc')) else None
                    inferred_date = row.get('inferreddate', '') if pd.notna(row.get('inferreddate')) else None
                    print_date = row.get('imprintdate', '') if pd.notna(row.get('imprintdate')) else None
                    
                    # Create author entry
                    if author_full or given_name or last_name:
                        author_key = author_full if author_full else f"{given_name} {last_name}".strip()
                        if author_key and author_key not in self.authors_dict:
                            self.authors_dict[author_key] = {
                                'given_name': given_name,
                                'last_name': last_name,
                                'full_name': author_full if author_full else f"{given_name} {last_name}".strip(),
                                'source': 'hathitrust_fiction'
                            }
                    
                    # Create book entry
                    if title:
                        if title not in self.books_dict:
                            self.books_dict[title] = {
                                'title': title,
                                'author_name': author_full if author_full else f"{given_name} {last_name}".strip(),
                                'genre': 'fiction',
                                'hathitrust_id': hathitrust_id,
                                'oclc_id': oclc_id,
                                'inferred_date': inferred_date,
                                'print_date': print_date,
                                'source': 'hathitrust_fiction'
                            }
                except Exception as e:
                    print(f"[WARNING] Error processing HathiTrust row {idx}: {e}")
                    continue
            
            print(f"[SUCCESS] Loaded {len(self.authors_dict)} authors and {len(self.books_dict)} books from HathiTrust")
        except Exception as e:
            print(f"[ERROR] Failed to load HathiTrust data: {e}")
    
    def load_nyt_data(self):
        """Load NYT bestsellers data"""
        try:
            # Load metadata
            metadata_path = os.path.join(DATA_SOURCES['nyt_bestsellers']['path'],
                                        DATA_SOURCES['nyt_bestsellers']['metadata_file'])
            print(f"\n[INFO] Loading NYT metadata from {metadata_path}")
            
            metadata_df = pd.read_csv(metadata_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(metadata_df)} metadata records from NYT")
            
            metadata_map = {}
            for idx, row in metadata_df.iterrows():
                hathi_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                if hathi_id:
                    metadata_map[hathi_id] = row
            
            # Load titles
            titles_path = os.path.join(DATA_SOURCES['nyt_bestsellers']['path'],
                                      DATA_SOURCES['nyt_bestsellers']['titles_file'])
            print(f"[INFO] Loading NYT titles from {titles_path}")
            
            titles_df = pd.read_csv(titles_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(titles_df)} title records from NYT")
            
            for idx, row in titles_df.iterrows():
                try:
                    title = row.get('primary_isbn13', '').strip() if pd.notna(row.get('primary_isbn13')) else ''
                    hathi_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                    
                    if hathi_id in metadata_map:
                        meta = metadata_map[hathi_id]
                        title = meta.get('shorttitle', '').strip() if pd.notna(meta.get('shorttitle')) else ''
                        author_full = meta.get('author', '').strip() if pd.notna(meta.get('author')) else ''
                        given_name = meta.get('given_name', '').strip() if pd.notna(meta.get('given_name')) else ''
                        last_name = meta.get('last_name', '').strip() if pd.notna(meta.get('last_name')) else ''
                        
                        if author_full or given_name or last_name:
                            author_key = author_full if author_full else f"{given_name} {last_name}".strip()
                            if author_key and author_key not in self.authors_dict:
                                self.authors_dict[author_key] = {
                                    'given_name': given_name,
                                    'last_name': last_name,
                                    'full_name': author_key,
                                    'source': 'nyt_bestsellers'
                                }
                        
                        if title:
                            if title not in self.books_dict:
                                self.books_dict[title] = {
                                    'title': title,
                                    'author_name': author_key if author_key else '',
                                    'genre': 'fiction',
                                    'hathitrust_id': hathi_id,
                                    'source': 'nyt_bestsellers'
                                }
                except Exception as e:
                    print(f"[WARNING] Error processing NYT row {idx}: {e}")
                    continue
            
            print(f"[SUCCESS] Loaded authors and books from NYT bestsellers")
        except Exception as e:
            print(f"[ERROR] Failed to load NYT data: {e}")
    
    def load_major_prizes_data(self):
        """Load major literary prizes data"""
        try:
            # Load metadata
            metadata_path = os.path.join(DATA_SOURCES['major_prizes']['path'],
                                        DATA_SOURCES['major_prizes']['metadata_file'])
            print(f"\n[INFO] Loading major prizes metadata from {metadata_path}")
            
            metadata_df = pd.read_csv(metadata_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(metadata_df)} metadata records from major prizes")
            
            metadata_map = {}
            for idx, row in metadata_df.iterrows():
                hathi_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                if hathi_id:
                    metadata_map[hathi_id] = row
            
            # Load winners/judges
            winners_path = os.path.join(DATA_SOURCES['major_prizes']['path'],
                                       DATA_SOURCES['major_prizes']['winners_file'])
            print(f"[INFO] Loading winners/judges from {winners_path}")
            
            winners_df = pd.read_csv(winners_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(winners_df)} winner/judge records from major prizes")
            
            for idx, row in winners_df.iterrows():
                try:
                    hathi_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                    person_name = row.get('person_name', '').strip() if pd.notna(row.get('person_name')) else ''
                    prize_name = row.get('prize_name', '').strip() if pd.notna(row.get('prize_name')) else ''
                    role = row.get('role', '').strip() if pd.notna(row.get('role')) else 'unknown'  # 'author' or 'judge'
                    prize_year = row.get('prize_year', '') if pd.notna(row.get('prize_year')) else None
                    
                    # Process based on role
                    if person_name:
                        if role.lower() == 'author' or role.lower() == 'winner':
                            # This is an author/winner
                            if person_name not in self.authors_dict:
                                parts = person_name.split(',', 1)
                                last_name = parts[0].strip() if len(parts) > 0 else ''
                                given_name = parts[1].strip() if len(parts) > 1 else ''
                                self.authors_dict[person_name] = {
                                    'given_name': given_name,
                                    'last_name': last_name,
                                    'full_name': person_name,
                                    'source': 'major_prizes'
                                }
                        elif role.lower() == 'judge':
                            # This is a judge
                            if person_name not in self.judges_dict:
                                parts = person_name.split(',', 1)
                                last_name = parts[0].strip() if len(parts) > 0 else ''
                                given_name = parts[1].strip() if len(parts) > 1 else ''
                                self.judges_dict[person_name] = {
                                    'given_name': given_name,
                                    'last_name': last_name,
                                    'full_name': person_name,
                                    'role': 'judge',
                                    'source': 'major_prizes'
                                }
                    
                    # Process associated book if hathi_id exists
                    if hathi_id and hathi_id in metadata_map:
                        meta = metadata_map[hathi_id]
                        title = meta.get('shorttitle', '').strip() if pd.notna(meta.get('shorttitle')) else ''
                        author_full = meta.get('author', '').strip() if pd.notna(meta.get('author')) else ''
                        given_name = meta.get('given_name', '').strip() if pd.notna(meta.get('given_name')) else ''
                        last_name = meta.get('last_name', '').strip() if pd.notna(meta.get('last_name')) else ''
                        
                        if title:
                            if title not in self.books_dict:
                                self.books_dict[title] = {
                                    'title': title,
                                    'author_name': author_full if author_full else f"{given_name} {last_name}".strip(),
                                    'genre': 'fiction',
                                    'hathitrust_id': hathi_id,
                                    'prize_name': prize_name,
                                    'prize_year': prize_year,
                                    'role': role,
                                    'source': 'major_prizes'
                                }
                except Exception as e:
                    print(f"[WARNING] Error processing major prizes row {idx}: {e}")
                    continue
            
            print(f"[SUCCESS] Loaded authors, judges, and books from major prizes")
        except Exception as e:
            print(f"[ERROR] Failed to load major prizes data: {e}")
    
    def load_iowa_workshop_data(self):
        """Load Iowa Writers' Workshop data"""
        try:
            # Load people
            people_path = os.path.join(DATA_SOURCES['iowa_workshop']['path'],
                                      DATA_SOURCES['iowa_workshop']['people_file'])
            print(f"\n[INFO] Loading Iowa workshop people from {people_path}")
            
            people_df = pd.read_csv(people_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(people_df)} people records from Iowa workshop")
            
            people_map = {}
            for idx, row in people_df.iterrows():
                try:
                    person_id = row.get('person_id', '') if pd.notna(row.get('person_id')) else None
                    full_name = row.get('full_name', '').strip() if pd.notna(row.get('full_name')) else ''
                    given_name = row.get('given_name', '').strip() if pd.notna(row.get('given_name')) else ''
                    family_name = row.get('family_name', '').strip() if pd.notna(row.get('family_name')) else ''
                    
                    if person_id and full_name:
                        people_map[str(person_id)] = {
                            'person_id': person_id,
                            'full_name': full_name,
                            'given_name': given_name,
                            'family_name': family_name
                        }
                        
                        if full_name not in self.authors_dict:
                            self.authors_dict[full_name] = {
                                'given_name': given_name,
                                'last_name': family_name,
                                'full_name': full_name,
                                'source': 'iowa_workshop'
                            }
                except Exception as e:
                    print(f"[WARNING] Error processing Iowa workshop people row {idx}: {e}")
                    continue
            
            # Load metadata
            metadata_path = os.path.join(DATA_SOURCES['iowa_workshop']['path'],
                                        DATA_SOURCES['iowa_workshop']['metadata_file'])
            print(f"[INFO] Loading Iowa workshop metadata from {metadata_path}")
            
            metadata_df = pd.read_csv(metadata_path, sep='\t', dtype=str)
            print(f"[INFO] Loaded {len(metadata_df)} metadata records from Iowa workshop")
            
            for idx, row in metadata_df.iterrows():
                try:
                    title = row.get('shorttitle', '').strip() if pd.notna(row.get('shorttitle')) else ''
                    author_full = row.get('author', '').strip() if pd.notna(row.get('author')) else ''
                    given_name = row.get('given_name', '').strip() if pd.notna(row.get('given_name')) else ''
                    last_name = row.get('last_name', '').strip() if pd.notna(row.get('last_name')) else ''
                    hathi_id = row.get('hathi_id', '').strip() if pd.notna(row.get('hathi_id')) else ''
                    
                    if title:
                        if title not in self.books_dict:
                            self.books_dict[title] = {
                                'title': title,
                                'author_name': author_full if author_full else f"{given_name} {last_name}".strip(),
                                'genre': 'fiction',
                                'hathitrust_id': hathi_id,
                                'source': 'iowa_workshop'
                            }
                except Exception as e:
                    print(f"[WARNING] Error processing Iowa workshop metadata row {idx}: {e}")
                    continue
            
            print(f"[SUCCESS] Loaded authors and books from Iowa workshop")
        except Exception as e:
            print(f"[ERROR] Failed to load Iowa workshop data: {e}")
    
    def assign_author_ids(self):
        """Assign author IDs based on sorted last_name, given_name"""
        try:
            print("\n[INFO] Assigning author IDs (sorted by last_name, given_name)...")
            
            # Create list of authors with sorting keys
            author_list = []
            for author_key, author_data in self.authors_dict.items():
                last_name = author_data.get('last_name', '').lower().strip()
                given_name = author_data.get('given_name', '').lower().strip()
                full_name = author_data.get('full_name', '')
                
                author_list.append({
                    'last_name': last_name,
                    'given_name': given_name,
                    'full_name': full_name,
                    'given_name_orig': author_data.get('given_name', ''),
                    'last_name_orig': author_data.get('last_name', ''),
                    'source': author_data.get('source', ''),
                    'original_key': author_key
                })
            
            # Sort by last_name then given_name
            author_list.sort(key=lambda x: (x['last_name'], x['given_name']))
            
            # Assign IDs
            self.author_list = []
            for idx, author_data in enumerate(author_list, start=1):
                author_record = {
                    'id': idx,
                    'given_name': author_data['given_name_orig'],
                    'last_name': author_data['last_name_orig'],
                    'full_name': author_data['full_name'],
                    'source': author_data['source']
                }
                self.author_list.append(author_record)
                
                # Update mapping to include ID
                self.authors_dict[author_data['original_key']]['id'] = idx
            
            print(f"[SUCCESS] Assigned IDs to {len(self.author_list)} authors")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to assign author IDs: {e}")
            return False
    
    def assign_book_ids(self):
        """Assign book IDs based on sorted title"""
        try:
            print("\n[INFO] Assigning book IDs (sorted by title)...")
            
            # Create sorted list of books
            book_list = []
            for title, book_data in self.books_dict.items():
                title_sort = title.lower().strip()
                book_list.append({
                    'title_sort': title_sort,
                    'title': title,
                    'author_name': book_data.get('author_name', ''),
                    'genre': book_data.get('genre', 'Unknown'),
                    'hathitrust_id': book_data.get('hathitrust_id', ''),
                    'oclc_id': book_data.get('oclc_id'),
                    'inferred_date': book_data.get('inferred_date'),
                    'print_date': book_data.get('print_date'),
                    'prize_name': book_data.get('prize_name', ''),
                    'prize_year': book_data.get('prize_year'),
                    'role': book_data.get('role', ''),
                    'source': book_data.get('source', '')
                })
            
            # Sort by title
            book_list.sort(key=lambda x: x['title_sort'])
            
            # Assign IDs and look up author_id
            self.book_list = []
            for idx, book_data in enumerate(book_list, start=1):
                # Find author_id
                author_id = None
                author_name = book_data['author_name']
                if author_name and author_name in self.authors_dict:
                    author_id = self.authors_dict[author_name].get('id')
                
                book_record = {
                    'id': idx,
                    'book_id': idx,
                    'title': book_data['title'],
                    'author_id': author_id,
                    'genre': book_data['genre'],
                    'hathitrust_id': book_data['hathitrust_id'],
                    'oclc_id': book_data['oclc_id'],
                    'inferred_date': book_data['inferred_date'],
                    'print_date': book_data['print_date'],
                    'prize_name': book_data['prize_name'],
                    'prize_year': book_data['prize_year'],
                    'role': book_data['role'],
                    'source': book_data['source'],
                    'verified': True  # Mark as verified since loaded from trusted sources
                }
                self.book_list.append(book_record)
            
            print(f"[SUCCESS] Assigned IDs to {len(self.book_list)} books")
            return True
        except Exception as e:
            print(f"[ERROR] Failed to assign book IDs: {e}")
            return False
    
    def insert_authors(self):
        """Insert authors into database"""
        try:
            if not self.author_list:
                print("[WARNING] No authors to insert")
                return True
            
            print(f"\n[INFO] Inserting {len(self.author_list)} authors...")
            
            cur = self.conn.cursor()
            
            insert_sql = """
                INSERT INTO authors (id, given_name, last_name, full_name, verified)
                VALUES (%s, %s, %s, %s, %s)
            """
            
            values = [
                (
                    a['id'],
                    a['given_name'],
                    a['last_name'],
                    a['full_name'],
                    True
                )
                for a in self.author_list
            ]
            
            execute_batch(cur, insert_sql, values, page_size=1000)
            self.conn.commit()
            
            print(f"[SUCCESS] Inserted {len(self.author_list)} authors")
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[ERROR] Failed to insert authors: {e}")
            return False
    
    def insert_books(self):
        """Insert books into database"""
        try:
            if not self.book_list:
                print("[WARNING] No books to insert")
                return True
            
            print(f"\n[INFO] Inserting {len(self.book_list)} books...")
            
            cur = self.conn.cursor()
            
            insert_sql = """
                INSERT INTO books 
                (id, book_id, title, author_id, genre, hathitrust_id, 
                 inferred_date, print_date, prize_year, role, source, verified)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = [
                (
                    b['id'],
                    b['book_id'],
                    b['title'],
                    b['author_id'],
                    b['genre'],
                    b['hathitrust_id'],
                    self._safe_int(b.get('inferred_date')),
                    self._safe_int(b.get('print_date')),
                    self._safe_int(b.get('prize_year')),
                    b['role'],
                    b['source'],
                    b['verified']
                )
                for b in self.book_list
            ]
            
            execute_batch(cur, insert_sql, values, page_size=1000)
            self.conn.commit()
            
            print(f"[SUCCESS] Inserted {len(self.book_list)} books")
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[ERROR] Failed to insert books: {e}")
            return False
    
    def verify_database(self):
        """Verify database integrity"""
        try:
            print("\n[INFO] Verifying database integrity...")
            
            cur = self.conn.cursor()
            
            # Check author count
            cur.execute("SELECT COUNT(*) FROM authors;")
            author_count = cur.fetchone()[0]
            print(f"[INFO] Total authors: {author_count}")
            
            # Check book count
            cur.execute("SELECT COUNT(*) FROM books;")
            book_count = cur.fetchone()[0]
            print(f"[INFO] Total books: {book_count}")
            
            # Check columns in books table
            cur.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'books' ORDER BY ordinal_position;
            """)
            columns = [row[0] for row in cur.fetchall()]
            column_count = len(columns)
            print(f"[INFO] Total columns in books table: {column_count}")
            print(f"[INFO] Columns: {', '.join(columns)}")
            
            # Check authors without IDs
            cur.execute("SELECT COUNT(*) FROM books WHERE author_id IS NULL;")
            null_authors = cur.fetchone()[0]
            print(f"[INFO] Books with NULL author_id: {null_authors}")
            
            # Check for unknown genres
            cur.execute("SELECT COUNT(*) FROM books WHERE genre IS NULL OR genre = 'Unknown';")
            unknown_genres = cur.fetchone()[0]
            print(f"[INFO] Books with Unknown/NULL genre: {unknown_genres}")
            
            # Sample data
            print("\n[INFO] Sample books from database:")
            cur.execute("""
                SELECT id, title, author_id, genre, prize_year, verified 
                FROM books LIMIT 10;
            """)
            samples = cur.fetchall()
            for sample in samples:
                print(f"  ID: {sample[0]}, Title: {sample[1]}, Author ID: {sample[2]}, Genre: {sample[3]}, Year: {sample[4]}, Verified: {sample[5]}")
            
            cur.close()
            
            # Summary
            print("\n" + "="*60)
            print("DATABASE VERIFICATION SUMMARY")
            print("="*60)
            print(f"Total Authors: {author_count}")
            print(f"Total Books: {book_count}")
            print(f"Table Columns: {column_count}")
            print(f"Books with NULL author_id: {null_authors}")
            print(f"Books with Unknown genre: {unknown_genres}")
            print("="*60)
            
            if author_count > 0 and book_count > 0 and column_count >= 20:
                print("\n[SUCCESS] Database verification passed!")
                return True
            else:
                print("\n[WARNING] Database may not meet specifications")
                return False
        except Exception as e:
            print(f"[ERROR] Failed to verify database: {e}")
            return False
    
    def run(self):
        """Execute the full database rebuild"""
        try:
            print("="*60)
            print("STARTING DATABASE REBUILD")
            print("="*60)
            
            # Connect to database
            if not self.connect_db():
                return False
            
            # Drop and recreate tables
            if not self.drop_and_recreate_tables():
                return False
            
            # Load data from all sources
            self.load_hathitrust_data()
            self.load_nyt_data()
            self.load_major_prizes_data()
            self.load_iowa_workshop_data()
            
            print(f"\n[INFO] Total unique authors loaded: {len(self.authors_dict)}")
            print(f"[INFO] Total unique books loaded: {len(self.books_dict)}")
            print(f"[INFO] Total judges loaded: {len(self.judges_dict)}")
            
            # Assign IDs
            if not self.assign_author_ids():
                return False
            
            if not self.assign_book_ids():
                return False
            
            # Insert data
            if not self.insert_authors():
                return False
            
            if not self.insert_books():
                return False
            
            # Verify database
            if not self.verify_database():
                return False
            
            print("\n[SUCCESS] Database rebuild completed successfully!")
            return True
        except Exception as e:
            print(f"[ERROR] Critical error during rebuild: {e}")
            return False
        finally:
            self.disconnect_db()

# Main execution
if __name__ == "__main__":
    builder = DatabaseBuilder()
    success = builder.run()
    sys.exit(0 if success else 1)
