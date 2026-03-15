#!/usr/bin/env python3
"""
Simplified comprehensive database rebuild script
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import os
import sys

DB_HOST = 'localhost'
DB_PORT = 5432
DB_NAME = 'look_up_book_db'
DB_USER = 'app_user'
DB_PASSWORD = 'look_up_book_app_secure_2025'

DATA_BASE_PATH = r'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\data\data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd'

class SimpleDBBuilder:
    def __init__(self):
        self.conn = None
        self.authors = {}  # {author_name: True}
        self.books = {}    # {title: {author_name, genre}}
        
    def connect(self):
        try:
            self.conn = psycopg2.connect(
                host=DB_HOST, port=DB_PORT, database=DB_NAME,
                user=DB_USER, password=DB_PASSWORD
            )
            print("[SUCCESS] Connected to database")
            return True
        except Exception as e:
            print(f"[ERROR] Connection failed: {e}")
            return False
    
    def _clean_string(self, val):
        """Clean string value"""
        if val is None or not isinstance(val, str):
            return None
        val = val.strip()
        # Remove problematic characters
        val = val.replace('\x00', '').replace('\n', ' ').replace('\r', '')
        # Remove HTML/XML-like tags
        if '<' in val and '>' in val:
            return None
        return val if val else None
    
    def _safe_int(self, val):
        """Safely convert to int or None"""
        if val is None or val == '':
            return None
        try:
            return int(float(str(val).strip()))
        except:
            return None
    
    def drop_recreate_tables(self):
        try:
            print("[INFO] Dropping and recreating tables...")
            cur = self.conn.cursor()
            
            cur.execute("DROP TABLE IF EXISTS user_preferred_books CASCADE;")
            cur.execute("DROP TABLE IF EXISTS user_book_likes CASCADE;")
            cur.execute("DROP TABLE IF EXISTS books CASCADE;")
            cur.execute("DROP TABLE IF EXISTS awards CASCADE;")
            cur.execute("DROP TABLE IF EXISTS authors CASCADE;")
            cur.execute("DROP TABLE IF EXISTS people CASCADE;")
            cur.execute("DROP TABLE IF EXISTS admins CASCADE;")
            cur.execute("DROP TABLE IF EXISTS users CASCADE;")
            
            cur.execute("DROP SEQUENCE IF EXISTS authors_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS books_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS awards_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS people_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS users_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS admins_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS user_book_likes_like_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS user_preferred_books_id_seq CASCADE;")
            cur.execute("DROP SEQUENCE IF EXISTS unique_id_seq CASCADE;")
            
            # Create sequences
            cur.execute("CREATE SEQUENCE authors_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE books_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE awards_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE people_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE users_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE admins_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE user_book_likes_like_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE user_preferred_books_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            cur.execute("CREATE SEQUENCE unique_id_seq AS INTEGER START WITH 1 INCREMENT BY 1;")
            
            # Create tables with minimal extra columns
            cur.execute("""
                CREATE TABLE users (
                    id INTEGER NOT NULL DEFAULT nextval('users_id_seq'),
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    hash VARCHAR(255) NOT NULL,
                    reading_preference VARCHAR(255),
                    favorite_genre VARCHAR(255),
                    PRIMARY KEY (id)
                );
            """)
            
            cur.execute("""
                CREATE TABLE authors (
                    id INTEGER NOT NULL DEFAULT nextval('authors_id_seq'),
                    given_name VARCHAR(255),
                    last_name VARCHAR(255),
                    full_name VARCHAR(512),
                    verified BOOLEAN DEFAULT TRUE,
                    PRIMARY KEY (id)
                );
            """)
            
            cur.execute("""
                CREATE TABLE awards (
                    id INTEGER NOT NULL DEFAULT nextval('awards_id_seq'),
                    award_id INTEGER,
                    prize_name VARCHAR(255),
                    prize_institution VARCHAR(255),
                    prize_year INTEGER,
                    prize_genre VARCHAR(100),
                    prize_type VARCHAR(50),
                    prize_amount NUMERIC,
                    PRIMARY KEY (id)
                );
            """)
            
            cur.execute("""
                CREATE TABLE people (
                    id INTEGER NOT NULL DEFAULT nextval('people_id_seq'),
                    person_id INTEGER,
                    full_name VARCHAR(512),
                    given_name VARCHAR(255),
                    family_name VARCHAR(255),
                    PRIMARY KEY (id)
                );
            """)
            
            cur.execute("""
                CREATE TABLE books (
                    id INTEGER NOT NULL DEFAULT nextval('books_id_seq'),
                    book_id INTEGER,
                    title VARCHAR(512),
                    author_id INTEGER,
                    person_id INTEGER,
                    award_id INTEGER,
                    prize_year INTEGER,
                    genre VARCHAR(100),
                    verified BOOLEAN DEFAULT TRUE,
                    role VARCHAR(50),
                    source VARCHAR(100),
                    PRIMARY KEY (id),
                    FOREIGN KEY (author_id) REFERENCES authors(id),
                    FOREIGN KEY (award_id) REFERENCES awards(id)
                );
            """)
            
            cur.execute("""
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
            """)
            
            cur.execute("""
                CREATE TABLE user_preferred_books (
                    id INTEGER NOT NULL DEFAULT nextval('user_preferred_books_id_seq'),
                    user_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    PRIMARY KEY (id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (book_id) REFERENCES books(id)
                );
            """)
            
            self.conn.commit()
            print("[SUCCESS] Tables recreated")
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[ERROR] Table recreation failed: {e}")
            return False
    
    def load_all_data(self):
        """Load from all sources"""
        print("[INFO] Loading data from all sources...")
        
        # Load HathiTrust
        try:
            path = os.path.join(DATA_BASE_PATH, 'hathitrust_fiction', 'hathitrust_post45fiction_metadata.tsv')
            df = pd.read_csv(path, sep='\t', dtype=str, on_bad_lines='skip')
            for _, row in df.iterrows():
                title = self._clean_string(row.get('shorttitle', ''))
                author = self._clean_string(row.get('author', ''))
                given = self._clean_string(row.get('given_name', ''))
                last = self._clean_string(row.get('last_name', ''))
                
                if not title or not (author or (given and last)):
                    continue
                
                author_full = author if author else f"{given} {last}".strip()
                if author_full:
                    self.authors[author_full] = True
                    self.books[title] = {'author': author_full, 'genre': 'fiction', 'source': 'hathitrust'}
            
            print(f"[INFO] Loaded {len(self.books)} books from HathiTrust")
        except Exception as e:
            print(f"[WARNING] HathiTrust load error: {e}")
        
        # Load NYT
        try:
            path = os.path.join(DATA_BASE_PATH, 'nyt_hardcover_fiction_bestsellers', 'nyt_hardcover_fiction_bestsellers-hathitrust_metadata.tsv')
            df = pd.read_csv(path, sep='\t', dtype=str, on_bad_lines='skip')
            for _, row in df.iterrows():
                title = self._clean_string(row.get('shorttitle', ''))
                author = self._clean_string(row.get('author', ''))
                given = self._clean_string(row.get('given_name', ''))
                last = self._clean_string(row.get('last_name', ''))
                
                if not title or not (author or (given and last)):
                    continue
                
                author_full = author if author else f"{given} {last}".strip()
                if author_full and title not in self.books:
                    self.authors[author_full] = True
                    self.books[title] = {'author': author_full, 'genre': 'fiction', 'source': 'nyt'}
            
            print(f"[INFO] NYT: now have {len(self.books)} total books")
        except Exception as e:
            print(f"[WARNING] NYT load error: {e}")
        
        # Load Major Prizes
        try:
            path = os.path.join(DATA_BASE_PATH, 'major_literary_prizes', 'major_literary_prizes-hathitrust_metadata.tsv')
            df = pd.read_csv(path, sep='\t', dtype=str, on_bad_lines='skip')
            for _, row in df.iterrows():
                title = self._clean_string(row.get('shorttitle', ''))
                author = self._clean_string(row.get('author', ''))
                given = self._clean_string(row.get('given_name', ''))
                last = self._clean_string(row.get('last_name', ''))
                
                if not title or not (author or (given and last)):
                    continue
                
                author_full = author if author else f"{given} {last}".strip()
                if author_full and title not in self.books:
                    self.authors[author_full] = True
                    self.books[title] = {'author': author_full, 'genre': 'fiction', 'source': 'major_prizes'}
            
            print(f"[INFO] Major prizes: now have {len(self.books)} total books")
        except Exception as e:
            print(f"[WARNING] Major prizes load error: {e}")
        
        # Load Iowa Workshop
        try:
            path = os.path.join(DATA_BASE_PATH, 'iowa_writers_workshop', 'iowa_writers_workshop-hathitrust_metadata.tsv')
            df = pd.read_csv(path, sep='\t', dtype=str, on_bad_lines='skip')
            for _, row in df.iterrows():
                title = self._clean_string(row.get('shorttitle', ''))
                author = self._clean_string(row.get('author', ''))
                given = self._clean_string(row.get('given_name', ''))
                last = self._clean_string(row.get('last_name', ''))
                
                if not title or not (author or (given and last)):
                    continue
                
                author_full = author if author else f"{given} {last}".strip()
                if author_full and title not in self.books:
                    self.authors[author_full] = True
                    self.books[title] = {'author': author_full, 'genre': 'fiction', 'source': 'iowa'}
            
            print(f"[INFO] Iowa workshop: now have {len(self.books)} total books")
        except Exception as e:
            print(f"[WARNING] Iowa workshop load error: {e}")
        
        print(f"[SUCCESS] Loaded {len(self.authors)} unique authors, {len(self.books)} unique books")
        return True
    
    def insert_data(self):
        """Insert all data into database"""
        try:
            cur = self.conn.cursor()
            
            # Sort authors by last_name, given_name
            author_list = sorted(list(self.authors.keys()))
            author_map = {}  # author_name -> id
            
            print(f"[INFO] Inserting {len(author_list)} authors...")
            for idx, author_full in enumerate(author_list, 1):
                parts = author_full.rsplit(' ', 1) if ' ' in author_full else [author_full]
                if len(parts) == 2:
                    given_name, last_name = parts
                else:
                    given_name = ''
                    last_name = parts[0]
                
                cur.execute(
                    "INSERT INTO authors (given_name, last_name, full_name, verified) VALUES (%s, %s, %s, %s)",
                    (given_name, last_name, author_full, True)
                )
                author_map[author_full] = idx
            self.conn.commit()
            print(f"[SUCCESS] Inserted {len(author_list)} authors")
            
            # Sort books by title
            book_list = sorted(list(self.books.keys()))
            print(f"[INFO] Inserting {len(book_list)} books...")
            for idx, title in enumerate(book_list, 1):
                book_data = self.books[title]
                author_name = book_data.get('author', '')
                author_id = author_map.get(author_name)
                genre = book_data.get('genre', 'Unknown')
                source = book_data.get('source', '')
                
                cur.execute(
                    "INSERT INTO books (book_id, title, author_id, genre, verified, source) VALUES (%s, %s, %s, %s, %s, %s)",
                    (idx, title, author_id, genre, True, source)
                )
            self.conn.commit()
            print(f"[SUCCESS] Inserted {len(book_list)} books")
            
            cur.close()
            return True
        except Exception as e:
            self.conn.rollback()
            print(f"[ERROR] Insert failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def verify(self):
        """Verify database"""
        try:
            cur = self.conn.cursor()
            
            cur.execute("SELECT COUNT(*) FROM authors;")
            author_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM books;")
            book_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(DISTINCT column_name) FROM information_schema.columns WHERE table_name = 'books';")
            col_count = cur.fetchone()[0]
            
            print("\n" + "="*60)
            print("DATABASE VERIFICATION")
            print("="*60)
            print(f"Total Authors: {author_count}")
            print(f"Total Books: {book_count}")
            print(f"Columns in books table: {col_count}")
            print("="*60)
            
            cur.close()
            return author_count > 0 and book_count > 0
        except Exception as e:
            print(f"[ERROR] Verification failed: {e}")
            return False
    
    def run(self):
        try:
            if not self.connect():
                return False
            if not self.drop_recreate_tables():
                return False
            if not self.load_all_data():
                return False
            if not self.insert_data():
                return False
            if not self.verify():
                return False
            
            print("\n[SUCCESS] Database rebuild completed!")
            return True
        except Exception as e:
            print(f"[CRITICAL ERROR] {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            if self.conn:
                self.conn.close()

if __name__ == "__main__":
    builder = SimpleDBBuilder()
    success = builder.run()
    sys.exit(0 if success else 1)
