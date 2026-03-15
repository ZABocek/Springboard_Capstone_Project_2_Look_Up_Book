#!/usr/bin/env python3
"""
Database Fix Script: Properly populate authors, assign IDs, and set verified flags
This script reads the data files and properly rebuilds the database
"""

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os

# Database connection
DB_HOST = 'localhost'
DB_USER = 'postgres'
DB_PASSWORD = 'postgres'
DB_NAME = 'look_up_book_db'

# Data paths
DATA_DIR = r'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\data\data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd'
WINNERS_JUDGES_FILE = os.path.join(DATA_DIR, 'major_literary_prizes', 'major_literary_prizes-winners_judges.tsv')
METADATA_FILE = os.path.join(DATA_DIR, 'major_literary_prizes', 'major_literary_prizes-hathitrust_metadata.tsv')

def connect_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        return None

def load_and_process_data():
    """Load data files and return structured data"""
    print("Loading data files...")
    
    # Load winners/judges data
    print(f"Reading: {WINNERS_JUDGES_FILE}")
    winners_judges_df = pd.read_csv(WINNERS_JUDGES_FILE, sep='\t', dtype=str)
    
    # Load metadata
    print(f"Reading: {METADATA_FILE}")
    metadata_df = pd.read_csv(METADATA_FILE, sep='\t', dtype=str)
    
    # Filter out 'No Winner' entries
    winners_judges_df = winners_judges_df[winners_judges_df['full_name'] != 'No Winner'].copy()
    
    # Create unique sorted authors list
    authors = winners_judges_df[['full_name', 'given_name', 'last_name', 'person_id']].drop_duplicates().copy()
    authors = authors[authors['full_name'].notna()].copy()
    authors = authors.sort_values(['last_name', 'given_name']).reset_index(drop=True)
    authors['author_id'] = range(1, len(authors) + 1)
    
    print(f"Found {len(authors)} unique authors")
    print(f"Sample authors:\n{authors.head()}")
    
    return winners_judges_df, metadata_df, authors

def fix_database_schema(conn):
    """Update database schema to properly handle author IDs"""
    cursor = conn.cursor()
    
    try:
        # Clear existing data but keep schema
        print("Clearing existing data...")
        cursor.execute("DELETE FROM public.user_preferred_books;")
        cursor.execute("DELETE FROM public.user_book_likes;")
        cursor.execute("DELETE FROM public.books;")
        cursor.execute("DELETE FROM public.awards;")
        cursor.execute("DELETE FROM public.authors;")
        cursor.execute("DELETE FROM public.people;")
        cursor.execute("DELETE FROM public.users;")
        cursor.execute("DELETE FROM public.admins;")
        
        conn.commit()
        print("Data cleared successfully")
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error clearing data: {e}")
        return False
    
    return True

def populate_authors(conn, authors_df):
    """Populate authors table with properly sorted IDs"""
    cursor = conn.cursor()
    
    try:
        print("Populating authors table...")
        
        # Prepare author data
        author_data = []
        for idx, row in authors_df.iterrows():
            author_data.append((
                row['author_id'],  # id
                row['given_name'],
                row['last_name'],
                row['full_name']
            ))
        
        # Insert authors
        insert_query = """
            INSERT INTO public.authors (id, given_name, last_name, full_name)
            VALUES %s
        """
        
        execute_values(cursor, insert_query, author_data)
        conn.commit()
        
        print(f"Inserted {len(author_data)} authors")
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error populating authors: {e}")
        return False

def populate_awards_and_books(conn, winners_judges_df, metadata_df, authors_df):
    """Populate awards and books tables"""
    cursor = conn.cursor()
    
    try:
        print("Processing awards and books...")
        
        # Create author lookup by full_name
        author_lookup = {}
        for idx, row in authors_df.iterrows():
            author_lookup[row['full_name']] = row['author_id']
        
        # Get unique awards
        awards_data = winners_judges_df[['prize_name', 'prize_institution', 'prize_year', 'prize_genre']].drop_duplicates()
        awards_dict = {}
        award_counter = 1
        
        for idx, row in awards_data.iterrows():
            award_key = (row['prize_name'], row['prize_year'], row['prize_genre'])
            if award_key not in awards_dict:
                awards_dict[award_key] = award_counter
                award_counter += 1
        
        # Insert awards
        awards_to_insert = []
        for (prize_name, prize_year, prize_genre), award_id in awards_dict.items():
            prize_inst = winners_judges_df[
                (winners_judges_df['prize_name'] == prize_name) & 
                (winners_judges_df['prize_year'].astype(str) == str(prize_year))
            ]['prize_institution'].iloc[0]
            
            awards_to_insert.append((
                award_id,
                award_id,  # award_id field
                prize_name,
                prize_inst,
                int(prize_year) if pd.notna(prize_year) else None,
                prize_genre
            ))
        
        insert_award_query = """
            INSERT INTO public.awards (id, award_id, prize_name, prize_institution, prize_year, prize_genre)
            VALUES %s
        """
        execute_values(cursor, insert_award_query, awards_to_insert)
        print(f"Inserted {len(awards_to_insert)} awards")
        
        # Now process books with proper author_id and verified flag
        books_to_insert = []
        
        for idx, row in winners_judges_df.iterrows():
            author_full_name = row['full_name']
            author_id = author_lookup.get(author_full_name)
            
            if author_id:
                # Get the award_id for this book
                award_key = (row['prize_name'], row['prize_year'], row['prize_genre'])
                award_id = awards_dict.get(award_key)
                
                # Verified only if the person is a WINNER, not a judge
                is_winner = row['role'].lower() == 'winner'
                title = row.get('title_of_winning_book', f"{row['prize_name']} Winner")
                
                books_to_insert.append((
                    idx + 1,  # book_id
                    idx + 1,  # id
                    title if pd.notna(title) else f"{row['prize_name']} {row['prize_year']}",
                    author_id,  # author_id
                    row.get('person_id'),  # person_id
                    award_id,  # award_id
                    int(row['prize_year']) if pd.notna(row['prize_year']) else None,  # prize_year
                    row.get('prize_genre', 'unknown'),  # genre
                    is_winner,  # verified - TRUE only for winners
                    row['role'],  # role
                    'major_literary_prizes'  # source
                ))
        
        insert_book_query = """
            INSERT INTO public.books 
            (book_id, id, title, author_id, person_id, award_id, prize_year, genre, verified, role, source)
            VALUES %s
        """
        
        execute_values(cursor, insert_book_query, books_to_insert)
        conn.commit()
        
        print(f"Inserted {len(books_to_insert)} books")
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error populating books/awards: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_database(conn):
    """Run verification queries"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("DATABASE VERIFICATION REPORT")
    print("="*60 + "\n")
    
    # Authors summary
    cursor.execute("SELECT COUNT(*), MIN(id), MAX(id) FROM public.authors")
    count, min_id, max_id = cursor.fetchone()
    print(f"✓ Authors: {count} total, ID range: {min_id}-{max_id}")
    
    # Books summary
    cursor.execute("""
        SELECT COUNT(*), 
               SUM(CASE WHEN verified = true THEN 1 ELSE 0 END),
               SUM(CASE WHEN author_id IS NOT NULL THEN 1 ELSE 0 END),
               SUM(CASE WHEN award_id IS NOT NULL THEN 1 ELSE 0 END)
        FROM public.books
    """)
    total_books, verified_books, books_with_author, books_with_award = cursor.fetchone()
    print(f"✓ Books: {total_books} total")
    print(f"  - Verified (Award Winners): {verified_books}")
    print(f"  - With Author Links: {books_with_author}")
    print(f"  - With Award Links: {books_with_award}")
    
    # Awards summary
    cursor.execute("SELECT COUNT(*) FROM public.awards")
    award_count = cursor.fetchone()[0]
    print(f"✓ Awards: {award_count} total")
    
    # Sample verified books
    print("\n✓ Sample Verified Award-Winning Books:")
    cursor.execute("""
        SELECT b.id, b.title, a.full_name, b.prize_year
        FROM public.books b
        LEFT JOIN public.authors a ON b.author_id = a.id
        WHERE b.verified = true
        LIMIT 5
    """)
    for book_id, title, author, year in cursor.fetchall():
        print(f"  [{book_id}] {title[:50]}... by {author} ({year})")
    
    # Check data integrity
    print("\n✓ Data Integrity Checks:")
    cursor.execute("SELECT COUNT(*) FROM public.books WHERE author_id IS NULL")
    null_authors = cursor.fetchone()[0]
    print(f"  - Books without author_id: {null_authors}")
    
    cursor.execute("SELECT COUNT(*) FROM public.authors WHERE id IS NULL")
    null_author_ids = cursor.fetchone()[0]
    print(f"  - Authors with NULL id: {null_author_ids}")
    
    conn.close()

def main():
    """Main execution"""
    print("="*60)
    print("DATABASE FIX SCRIPT")
    print("Assign Author IDs, Verified Flags, and Judge/Winner Distinction")
    print("="*60 + "\n")
    
    # Load data
    winners_judges_df, metadata_df, authors_df = load_and_process_data()
    
    # Connect to database
    conn = connect_db()
    if not conn:
        return
    
    # Fix database
    if not fix_database_schema(conn):
        return
    
    # Populate tables
    if not populate_authors(conn, authors_df):
        return
    
    if not populate_awards_and_books(conn, winners_judges_df, metadata_df, authors_df):
        return
    
    # Verify
    verify_database(conn)
    
    print("\n" + "="*60)
    print("DATABASE FIX COMPLETE!")
    print("="*60)

if __name__ == '__main__':
    main()
