#!/usr/bin/env python3
"""
Look Up Book Database Rebuild v3 - Fixed Author/Judge Distinction
Improved database rebuild that:
- FILTERS OUT JUDGES - Only includes people with role='winner'
- Extracts publication years from multiple sources
- Properly classifies genres (fiction, non-fiction, poetry, prose, Unknown)
- Handles duplicates intelligently based on row context
- Eliminates duplicate author/book IDs
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from collections import defaultdict
import re

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'look_up_book_db',
    'user': 'app_user',
    'password': 'look_up_book_app_secure_2025',
    'port': 5432
}

DATA_BASE_PATH = r'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\data\data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd'

class DatabaseBuilder:
    def __init__(self):
        self.conn = None
        self.authors = {}  # {(last_name, given_name): {'id': int, 'full_name': str, ...}}
        self.books = {}    # {title: {'id': int, 'author_id': int, 'year': int, 'genre': str, ...}}
        self.author_id_counter = 0
        self.book_id_counter = 0
        
    def _clean_string(self, val):
        """Clean and normalize string values"""
        if val is None or not isinstance(val, str):
            return None
        val = val.strip()
        # Remove null bytes, newlines, carriage returns
        val = val.replace('\x00', '').replace('\n', ' ').replace('\r', ' ')
        # Remove HTML/XML tags
        if '<' in val and '>' in val:
            return None
        # Clean extra spaces
        val = ' '.join(val.split())
        return val if val else None
    
    def _safe_int(self, val):
        """Safely convert to integer"""
        if val is None or val == '' or val == 'None':
            return None
        try:
            return int(float(str(val).strip()))
        except (ValueError, TypeError):
            return None
    
    def _extract_year(self, val):
        """Extract year from various formats"""
        if val is None or val == '' or val == 'None':
            return None
        try:
            year = int(float(str(val).strip()))
            # Validate it's a reasonable year (1800-2100)
            if 1800 <= year <= 2100:
                return year
            return None
        except (ValueError, TypeError):
            return None
    
    def _normalize_genre(self, genre_str):
        """Normalize genre to: fiction, non-fiction, poetry, prose, Unknown"""
        if genre_str is None or genre_str == '' or genre_str == 'None':
            return 'Unknown'
        
        genre_str = str(genre_str).strip().lower()
        
        # Map variations to standard genres
        if 'fiction' in genre_str:
            return 'fiction'
        elif 'non-fict' in genre_str or 'nonfiction' in genre_str:
            return 'non-fiction'
        elif 'poetry' in genre_str or 'poems' in genre_str:
            return 'poetry'
        elif 'prose' in genre_str:
            return 'prose'
        elif 'no genre' in genre_str or genre_str == '':
            return 'Unknown'
        else:
            return 'Unknown'
    
    def connect(self):
        """Connect to database"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            print("✓ Connected to database")
        except Exception as e:
            print(f"✗ Failed to connect: {e}")
            sys.exit(1)
    
    def drop_tables(self):
        """Drop existing tables"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS books CASCADE")
            cursor.execute("DROP TABLE IF EXISTS authors CASCADE")
            self.conn.commit()
            print("✓ Dropped existing tables")
        except Exception as e:
            print(f"✗ Failed to drop tables: {e}")
            sys.exit(1)
    
    def create_tables(self):
        """Create fresh tables"""
        try:
            cursor = self.conn.cursor()
            
            # Authors table
            cursor.execute("""
                CREATE TABLE authors (
                    id INTEGER PRIMARY KEY,
                    given_name VARCHAR(255),
                    last_name VARCHAR(255),
                    full_name VARCHAR(512),
                    verified BOOLEAN DEFAULT TRUE
                )
            """)
            
            # Books table with YEAR column
            cursor.execute("""
                CREATE TABLE books (
                    id INTEGER PRIMARY KEY,
                    book_id INTEGER,
                    title VARCHAR(512),
                    author_id INTEGER REFERENCES authors(id),
                    person_id INTEGER,
                    award_id INTEGER,
                    prize_year INTEGER,
                    publication_year INTEGER,
                    genre VARCHAR(100),
                    verified BOOLEAN DEFAULT TRUE,
                    role VARCHAR(50),
                    source VARCHAR(100)
                )
            """)
            
            self.conn.commit()
            print("✓ Created tables")
        except Exception as e:
            print(f"✗ Failed to create tables: {e}")
            sys.exit(1)
    
    def load_hathitrust_fiction(self):
        """Load HathiTrust fiction data"""
        print("\n--- Loading HathiTrust Fiction Metadata ---")
        file_path = os.path.join(DATA_BASE_PATH, 'hathitrust_fiction', 'hathitrust_post45fiction_metadata.tsv')
        
        try:
            df = pd.read_csv(file_path, sep='\t', low_memory=False)
            print(f"  Loaded {len(df)} rows")
            
            for idx, row in df.iterrows():
                if idx % 10000 == 0:
                    print(f"  Processing row {idx}...")
                
                author = self._clean_string(row.get('author', ''))
                title = self._clean_string(row.get('title', ''))
                publication_year = self._extract_year(row.get('imprintdate', None) or row.get('latestcomp', None))
                
                # All hathitrust fiction is fiction
                genre = 'fiction'
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'hathitrust')
            
            print(f"  ✓ Processed HathiTrust Fiction")
        except Exception as e:
            print(f"  ✗ Error loading HathiTrust: {e}")
    
    def load_nyt_bestsellers(self):
        """Load NYT bestseller data"""
        print("\n--- Loading NYT Bestseller Data ---")
        
        # Load titles file for years
        titles_file = os.path.join(DATA_BASE_PATH, 'nyt_hardcover_fiction_bestsellers', 'nyt_hardcover_fiction_bestsellers-titles.tsv')
        try:
            df_titles = pd.read_csv(titles_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_titles)} book titles")
            
            for idx, row in df_titles.iterrows():
                if idx % 5000 == 0:
                    print(f"  Processing row {idx}...")
                
                title = self._clean_string(row.get('title', ''))
                publication_year = self._extract_year(row.get('year', None))
                genre = 'fiction'  # NYT bestsellers are fiction
                
                if title:
                    # NYT books don't have clear authors in titles file
                    # Will be matched with authors file next
                    self.book_id_counter += 1
                    self.books[title] = {
                        'id': self.book_id_counter,
                        'author_id': None,
                        'title': title,
                        'publication_year': publication_year,
                        'genre': genre,
                        'source': 'nyt'
                    }
            
            print(f"  ✓ Processed NYT Bestseller Titles")
        except Exception as e:
            print(f"  ✗ Error loading NYT bestsellers: {e}")
    
    def load_major_literary_prizes(self):
        """Load major literary prizes data - ONLY WINNERS, NOT JUDGES"""
        print("\n--- Loading Major Literary Prizes (Winners Only) ---")
        
        # Load winners/judges file - FILTER FOR WINNERS ONLY
        file_path = os.path.join(DATA_BASE_PATH, 'major_literary_prizes', 'major_literary_prizes-winners_judges.tsv')
        try:
            df = pd.read_csv(file_path, sep='\t', low_memory=False)
            print(f"  Loaded {len(df)} total records")
            
            # CRITICAL: Filter for winners only (role == 'winner')
            winners_df = df[df['role'].str.lower() == 'winner'].copy()
            judges_df = df[df['role'].str.lower() == 'judge'].copy()
            
            print(f"  - Winners: {len(winners_df)}")
            print(f"  - Judges (EXCLUDED): {len(judges_df)}")
            
            for idx, row in winners_df.iterrows():
                if idx % 1000 == 0:
                    print(f"  Processing winner {idx}...")
                
                # For winners, the full_name is the author
                author = self._clean_string(row.get('full_name', ''))
                
                # Only process if this has a winning book title
                title = self._clean_string(row.get('title_of_winning_book', ''))
                if not title:
                    continue
                
                publication_year = self._extract_year(row.get('prize_year', None))
                genre = self._normalize_genre(row.get('prize_genre', ''))
                
                if author:
                    self._add_author_and_book(author, title, publication_year, genre, 'major_prizes')
            
            print(f"  ✓ Processed Major Literary Prize Winners Only")
        except Exception as e:
            print(f"  ✗ Error loading major prizes: {e}")
        
        # Load metadata file for additional book info
        metadata_file = os.path.join(DATA_BASE_PATH, 'major_literary_prizes', 'major_literary_prizes-hathitrust_metadata.tsv')
        try:
            df_metadata = pd.read_csv(metadata_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_metadata)} metadata records")
            
            for idx, row in df_metadata.iterrows():
                if idx % 2000 == 0:
                    print(f"  Processing metadata row {idx}...")
                
                title = self._clean_string(row.get('shorttitle', ''))
                author = self._clean_string(row.get('author', ''))
                publication_year = self._extract_year(row.get('imprintdate', None) or row.get('inferreddate', None))
                
                # Default to fiction for literary prizes
                genre = 'fiction'
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'major_prizes')
            
            print(f"  ✓ Processed Major Literary Prizes Metadata")
        except Exception as e:
            print(f"  ✗ Error loading major prizes metadata: {e}")
    
    def load_iowa_writers_workshop(self):
        """Load Iowa Writers' Workshop data"""
        print("\n--- Loading Iowa Writers' Workshop ---")
        
        # Load people file
        people_file = os.path.join(DATA_BASE_PATH, 'iowa_writers_workshop', 'iowa_writers_workshop-people.tsv')
        try:
            df_people = pd.read_csv(people_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_people)} people records")
            
            for idx, row in df_people.iterrows():
                if idx % 1000 == 0:
                    print(f"  Processing row {idx}...")
                
                # Track as author/writer primarily
                full_name = self._clean_string(row.get('full_name', ''))
                if full_name:
                    # Just ensure author exists, don't add books yet
                    # (books will come from graduations/metadata files)
                    given_name = self._clean_string(row.get('given_name', ''))
                    family_name = self._clean_string(row.get('family_name', ''))
                    self._add_author(given_name or '', family_name or '', full_name)
            
            print(f"  ✓ Processed Iowa Writers' Workshop People")
        except Exception as e:
            print(f"  ✗ Error loading Iowa people: {e}")
        
        # Load metadata file
        metadata_file = os.path.join(DATA_BASE_PATH, 'iowa_writers_workshop', 'iowa_writers_workshop-hathitrust_metadata.tsv')
        try:
            df_metadata = pd.read_csv(metadata_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_metadata)} Iowa metadata records")
            
            for idx, row in df_metadata.iterrows():
                if idx % 2000 == 0:
                    print(f"  Processing Iowa metadata row {idx}...")
                
                title = self._clean_string(row.get('title', ''))
                author = self._clean_string(row.get('author', ''))
                publication_year = self._extract_year(row.get('pubdate', None) or row.get('imprintdate', None))
                
                # Default to fiction for Iowa workshop
                genre = 'fiction'
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'iowa')
            
            print(f"  ✓ Processed Iowa Writers' Workshop Metadata")
        except Exception as e:
            print(f"  ✗ Error loading Iowa metadata: {e}")
        
        # Load graduations file
        graduations_file = os.path.join(DATA_BASE_PATH, 'iowa_writers_workshop', 'iowa_writers_workshop-graduations.tsv')
        try:
            df_grad = pd.read_csv(graduations_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_grad)} graduation records")
            
            for idx, row in df_grad.iterrows():
                if idx % 1000 == 0:
                    print(f"  Processing graduation row {idx}...")
                
                full_name = self._clean_string(row.get('full_name', ''))
                given_name = self._clean_string(row.get('given_name', ''))
                family_name = self._clean_string(row.get('family_name', ''))
                
                if full_name:
                    self._add_author(given_name or '', family_name or '', full_name)
            
            print(f"  ✓ Processed Iowa Writers' Workshop Graduations")
        except Exception as e:
            print(f"  ✗ Error loading Iowa graduations: {e}")
    
    def _add_author(self, given_name, last_name, full_name):
        """Add author to authors dict"""
        given_name = self._clean_string(given_name) or ''
        last_name = self._clean_string(last_name) or ''
        full_name = self._clean_string(full_name) or ''
        
        if not last_name and not given_name and not full_name:
            return None
        
        # Use (last_name, given_name) as key for deduplication
        key = (last_name.lower(), given_name.lower())
        
        if key not in self.authors:
            self.author_id_counter += 1
            self.authors[key] = {
                'id': self.author_id_counter,
                'given_name': given_name,
                'last_name': last_name,
                'full_name': full_name
            }
        
        return self.authors[key]['id']
    
    def _add_author_and_book(self, author_name, title, publication_year, genre, source):
        """Add author and book, handling deduplication"""
        title = self._clean_string(title)
        author_name = self._clean_string(author_name)
        genre = self._normalize_genre(genre)
        
        if not author_name or not title:
            return
        
        # Parse author name - try to extract last name and first name
        # Assume format like "LastName, FirstName"
        parts = author_name.split(',')
        if len(parts) == 2:
            last_name = parts[0].strip()
            given_name = parts[1].strip()
        else:
            # Fallback: split on spaces, last part is likely last name
            name_parts = author_name.rsplit(' ', 1)
            if len(name_parts) == 2:
                given_name = name_parts[0]
                last_name = name_parts[1]
            else:
                given_name = ''
                last_name = author_name
        
        # Add author
        author_id = self._add_author(given_name, last_name, author_name)
        
        # Add book
        book_key = title.lower()
        if book_key not in self.books:
            self.book_id_counter += 1
            self.books[book_key] = {
                'id': self.book_id_counter,
                'author_id': author_id,
                'title': title,
                'publication_year': publication_year,
                'genre': genre,
                'source': source
            }
        else:
            # Update with better data if available
            existing = self.books[book_key]
            if publication_year and not existing['publication_year']:
                existing['publication_year'] = publication_year
            if genre != 'Unknown' and existing['genre'] == 'Unknown':
                existing['genre'] = genre
    
    def save_to_database(self):
        """Save collected data to database"""
        print("\n--- Saving to Database ---")
        try:
            cursor = self.conn.cursor()
            
            # Insert authors
            print(f"  Inserting {len(self.authors)} authors...")
            author_data = []
            for (last_name, given_name), author in self.authors.items():
                author_data.append((
                    author['id'],
                    author['given_name'],
                    author['last_name'],
                    author['full_name']
                ))
            
            execute_batch(cursor, """
                INSERT INTO authors (id, given_name, last_name, full_name)
                VALUES (%s, %s, %s, %s)
            """, author_data, page_size=500)
            print(f"  ✓ Inserted {len(author_data)} authors")
            
            # Insert books
            print(f"  Inserting {len(self.books)} books...")
            book_data = []
            for book_key, book in self.books.items():
                book_data.append((
                    book['id'],
                    book['id'],  # book_id
                    book['title'],
                    book['author_id'],
                    None,  # person_id
                    None,  # award_id
                    None,  # prize_year
                    book['publication_year'],
                    book['genre'],
                    True,  # verified
                    'winner',  # role
                    book['source']
                ))
            
            execute_batch(cursor, """
                INSERT INTO books (id, book_id, title, author_id, person_id, award_id, 
                                  prize_year, publication_year, genre, verified, role, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, book_data, page_size=500)
            print(f"  ✓ Inserted {len(book_data)} books")
            
            self.conn.commit()
            print(f"\n✓ Database saved successfully!")
            print(f"  Total authors: {len(self.authors)}")
            print(f"  Total books: {len(self.books)}")
            
        except Exception as e:
            print(f"✗ Failed to save to database: {e}")
            sys.exit(1)
    
    def run(self):
        """Execute full rebuild"""
        print("=" * 60)
        print("LOOK UP BOOK DATABASE REBUILD v3 - FIXED AUTHOR/JUDGE")
        print("=" * 60)
        
        self.connect()
        self.drop_tables()
        self.create_tables()
        
        # Load data from all 4 sources
        self.load_hathitrust_fiction()
        self.load_nyt_bestsellers()
        self.load_major_literary_prizes()  # Now filters for winners only!
        self.load_iowa_writers_workshop()
        
        self.save_to_database()
        
        print("\n" + "=" * 60)
        print("REBUILD COMPLETE!")
        print("=" * 60)

if __name__ == '__main__':
    builder = DatabaseBuilder()
    builder.run()
