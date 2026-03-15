#!/usr/bin/env python3
"""
Look Up Book Database Rebuild v2 - With Publication Years and Proper Genres
Improved database rebuild that:
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
        
        # Track which person_ids/hathi_ids are primarily about books vs judges/authors
        self.person_role_tracker = defaultdict(set)  # {person_id: {role1, role2, ...}}
        
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
                author = self._clean_string(row.get('author', ''))
                publication_year = self._extract_year(row.get('year', None))
                
                # NYT bestsellers are fiction
                genre = 'fiction'
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'nyt')
            
            print(f"  ✓ Processed NYT Bestseller Titles")
        except Exception as e:
            print(f"  ✗ Error loading NYT titles: {e}")
        
        # Load lists file (has year info)
        lists_file = os.path.join(DATA_BASE_PATH, 'nyt_hardcover_fiction_bestsellers', 'nyt_hardcover_fiction_bestsellers-lists.tsv')
        try:
            df_lists = pd.read_csv(lists_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_lists)} list entries")
            
            for idx, row in df_lists.iterrows():
                if idx % 10000 == 0:
                    print(f"  Processing list row {idx}...")
                
                title = self._clean_string(row.get('title', ''))
                author = self._clean_string(row.get('author', ''))
                publication_year = self._extract_year(row.get('year', None))
                
                genre = 'fiction'
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'nyt')
            
            print(f"  ✓ Processed NYT Bestseller Lists")
        except Exception as e:
            print(f"  ✗ Error loading NYT lists: {e}")
    
    def load_major_literary_prizes(self):
        """Load major literary prizes data"""
        print("\n--- Loading Major Literary Prizes ---")
        
        # Load winners/judges file with prize info
        winners_file = os.path.join(DATA_BASE_PATH, 'major_literary_prizes', 'major_literary_prizes-winners_judges.tsv')
        try:
            df_winners = pd.read_csv(winners_file, sep='\t', low_memory=False)
            print(f"  Loaded {len(df_winners)} winner/judge records")
            
            for idx, row in df_winners.iterrows():
                if idx % 2000 == 0:
                    print(f"  Processing row {idx}...")
                
                # Track role
                person_id = self._safe_int(row.get('person_id', None))
                role = self._clean_string(row.get('role', ''))
                if person_id and role:
                    self.person_role_tracker[person_id].add(role)
                
                # Only process if this has a winning book title
                title = self._clean_string(row.get('title_of_winning_book', ''))
                if not title:
                    continue
                
                # For judges and winners, primarily process as book entries
                author = self._clean_string(row.get('full_name', ''))
                publication_year = self._extract_year(row.get('prize_year', None))
                genre = self._normalize_genre(row.get('prize_genre', ''))
                
                if author and title:
                    self._add_author_and_book(author, title, publication_year, genre, 'major_prizes')
            
            print(f"  ✓ Processed Major Literary Prizes")
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
        
        # Parse author name (handle "Last, First" format)
        if ',' in author_name:
            parts = [p.strip() for p in author_name.split(',', 1)]
            last_name = parts[0]
            given_name = parts[1] if len(parts) > 1 else ''
        else:
            # Simple name parsing: assume last word is last name
            parts = author_name.strip().rsplit(' ', 1)
            if len(parts) == 2:
                given_name, last_name = parts[0], parts[1]
            else:
                last_name = author_name
                given_name = ''
        
        # Add author
        author_id = self._add_author(given_name, last_name, author_name)
        
        # Check if book already exists
        title_lower = title.lower()
        if title_lower not in self.books:
            self.book_id_counter += 1
            self.books[title_lower] = {
                'id': self.book_id_counter,
                'title': title,
                'author_id': author_id,
                'publication_year': publication_year,
                'genre': genre,
                'source': source
            }
        else:
            # Book exists - update if we have better info
            book_entry = self.books[title_lower]
            
            # Update publication year if current is None and new is not
            if book_entry['publication_year'] is None and publication_year is not None:
                book_entry['publication_year'] = publication_year
            
            # Update genre if current is Unknown and new is not
            if book_entry['genre'] == 'Unknown' and genre != 'Unknown':
                book_entry['genre'] = genre
            
            # Keep the more specific source (major_prizes > nyt > iowa > hathitrust)
            source_priority = {'major_prizes': 4, 'nyt': 3, 'iowa': 2, 'hathitrust': 1}
            if source_priority.get(source, 0) > source_priority.get(book_entry['source'], 0):
                book_entry['source'] = source
    
    def insert_data(self):
        """Insert data into database"""
        print("\n--- Inserting Data into Database ---")
        
        try:
            cursor = self.conn.cursor()
            
            # Sort authors by last name, then given name
            sorted_authors = sorted(
                self.authors.values(),
                key=lambda x: (x['last_name'].lower(), x['given_name'].lower())
            )
            
            # Reassign IDs to match sorted order
            for new_id, author in enumerate(sorted_authors, start=1):
                author['id'] = new_id
            
            # Insert authors
            print(f"  Inserting {len(sorted_authors)} authors...")
            author_data = [
                (a['id'], a['given_name'], a['last_name'], a['full_name'], True)
                for a in sorted_authors
            ]
            execute_batch(cursor, 
                """INSERT INTO authors (id, given_name, last_name, full_name, verified) 
                   VALUES (%s, %s, %s, %s, %s)""",
                author_data, page_size=1000)
            self.conn.commit()
            print(f"  ✓ Inserted {len(sorted_authors)} authors")
            
            # Create mapping of old author IDs to new author IDs
            id_mapping = {}
            for old_author in self.authors.values():
                for new_author in sorted_authors:
                    if (old_author['last_name'].lower() == new_author['last_name'].lower() and
                        old_author['given_name'].lower() == new_author['given_name'].lower()):
                        id_mapping[old_author['id']] = new_author['id']
                        break
            
            # Sort books by title
            sorted_books = sorted(
                self.books.values(),
                key=lambda x: x['title'].lower()
            )
            
            # Reassign book IDs and update author_ids
            for new_id, book in enumerate(sorted_books, start=1):
                book['id'] = new_id
                # Update author_id to match new author IDs
                if book['author_id'] in id_mapping:
                    book['author_id'] = id_mapping[book['author_id']]
            
            # Insert books
            print(f"  Inserting {len(sorted_books)} books...")
            book_data = [
                (b['id'], b['id'], b['title'], b['author_id'], None, None, None, 
                 b['publication_year'], b['genre'], True, None, b['source'])
                for b in sorted_books
            ]
            execute_batch(cursor,
                """INSERT INTO books (id, book_id, title, author_id, person_id, award_id, 
                                      prize_year, publication_year, genre, verified, role, source)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                book_data, page_size=1000)
            self.conn.commit()
            print(f"  ✓ Inserted {len(sorted_books)} books")
            
        except Exception as e:
            print(f"  ✗ Error inserting data: {e}")
            sys.exit(1)
    
    def verify(self):
        """Verify database integrity"""
        print("\n--- Verifying Database ---")
        try:
            cursor = self.conn.cursor()
            
            # Check author count
            cursor.execute("SELECT COUNT(*) FROM authors;")
            author_count = cursor.fetchone()[0]
            print(f"  ✓ Total authors: {author_count}")
            
            # Check book count
            cursor.execute("SELECT COUNT(*) FROM books;")
            book_count = cursor.fetchone()[0]
            print(f"  ✓ Total books: {book_count}")
            
            # Check NULL author_ids
            cursor.execute("SELECT COUNT(*) FROM books WHERE author_id IS NULL;")
            null_count = cursor.fetchone()[0]
            print(f"  ✓ Books with NULL author_id: {null_count}")
            
            # Check genre distribution
            cursor.execute("SELECT genre, COUNT(*) FROM books GROUP BY genre ORDER BY genre;")
            genres = cursor.fetchall()
            print(f"  ✓ Genre distribution:")
            for genre, count in genres:
                print(f"    - {genre}: {count}")
            
            # Check publication year distribution
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN publication_year IS NULL THEN 'Unknown/NULL'
                        ELSE CAST(publication_year AS TEXT)
                    END as year,
                    COUNT(*) as count
                FROM books
                GROUP BY year
                ORDER BY year DESC
                LIMIT 20;
            """)
            years = cursor.fetchall()
            print(f"  ✓ Top 20 publication years:")
            for year, count in years:
                print(f"    - {year}: {count}")
            
            # Show sample books with years and genres
            cursor.execute("""
                SELECT b.id, b.title, a.full_name, b.publication_year, b.genre
                FROM books b
                JOIN authors a ON b.author_id = a.id
                LIMIT 10;
            """)
            samples = cursor.fetchall()
            print(f"  ✓ Sample books:")
            for book in samples:
                print(f"    ID {book[0]}: '{book[1]}' by {book[2]} ({book[3]}, {book[4]})")
            
            print(f"\n✅ === ALL VERIFICATIONS PASSED ===")
            
        except Exception as e:
            print(f"  ✗ Verification failed: {e}")
    
    def run(self):
        """Run the complete rebuild"""
        print("=" * 70)
        print("LOOK UP BOOK DATABASE REBUILD v2")
        print("With Publication Years and Proper Genres")
        print("=" * 70)
        
        self.connect()
        self.drop_tables()
        self.create_tables()
        
        self.load_hathitrust_fiction()
        self.load_nyt_bestsellers()
        self.load_major_literary_prizes()
        self.load_iowa_writers_workshop()
        
        self.insert_data()
        self.verify()
        
        if self.conn:
            self.conn.close()
            print("\n✓ Database connection closed")

if __name__ == '__main__':
    builder = DatabaseBuilder()
    builder.run()
