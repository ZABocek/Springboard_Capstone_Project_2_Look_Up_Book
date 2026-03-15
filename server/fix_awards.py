#!/usr/bin/env python3
"""
Database Fix Script v2: Consolidate Awards
This script rebuilds the database with only unique awards (not duplicated by year)
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

def load_data():
    """Load data files and identify unique awards"""
    print("Loading winners/judges data...")
    df = pd.read_csv(WINNERS_JUDGES_FILE, sep='\t', dtype=str)
    
    # Get unique awards (by prize_name and prize_institution only, not by year)
    unique_awards = df[['prize_name', 'prize_institution']].drop_duplicates().sort_values('prize_name').reset_index(drop=True)
    
    print(f"Found {len(unique_awards)} unique awards:")
    for idx, row in unique_awards.iterrows():
        print(f"  {idx+1:2d}. {row['prize_name']:50s} | {row['prize_institution']}")
    
    return df, unique_awards

def fix_awards_table(conn, unique_awards):
    """Rebuild awards table with only unique awards"""
    cursor = conn.cursor()
    
    try:
        print("\nClearing awards table...")
        # Temporarily disable foreign key constraints
        cursor.execute("ALTER TABLE public.books DISABLE TRIGGER ALL;")
        cursor.execute("DELETE FROM public.awards;")
        cursor.execute("ALTER TABLE public.books ENABLE TRIGGER ALL;")
        
        print("Inserting unique awards...")
        awards_data = []
        for idx, row in unique_awards.iterrows():
            award_id = idx + 1
            awards_data.append((
                award_id,
                award_id,  # award_id field
                row['prize_name'],
                row['prize_institution'],
                None,  # prize_year (now NULL since we're not duplicating by year)
                None   # prize_genre (now NULL since we're not duplicating by genre)
            ))
        
        insert_query = """
            INSERT INTO public.awards (id, award_id, prize_name, prize_institution, prize_year, prize_genre)
            VALUES %s
        """
        execute_values(cursor, insert_query, awards_data)
        conn.commit()
        
        print(f"Inserted {len(awards_data)} unique awards")
        
        # Create lookup for award_name to award_id
        award_lookup = {}
        for idx, row in unique_awards.iterrows():
            award_lookup[row['prize_name']] = idx + 1
        
        return award_lookup
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {e}")
        return None

def update_books_with_correct_awards(conn, df, award_lookup):
    """Update books table to reference the correct consolidated awards"""
    cursor = conn.cursor()
    
    try:
        print("\nUpdating books to reference consolidated awards...")
        
        # First, clear the award_id from all books
        cursor.execute("UPDATE public.books SET award_id = NULL;")
        
        # Then update with the correct consolidated award_id
        books_to_update = []
        for idx, row in df.iterrows():
            book_db_id = idx + 1  # Assuming books were inserted in same order
            prize_name = row['prize_name']
            consolidated_award_id = award_lookup.get(prize_name)
            
            if consolidated_award_id:
                books_to_update.append((consolidated_award_id, book_db_id))
        
        # Batch update books
        for award_id, book_id in books_to_update:
            cursor.execute(
                "UPDATE public.books SET award_id = %s WHERE id = %s",
                (award_id, book_id)
            )
        
        conn.commit()
        print(f"Updated {len(books_to_update)} book-award associations")
        
        return True
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error updating books: {e}")
        return False

def verify_fix(conn):
    """Verify the fix"""
    cursor = conn.cursor()
    
    print("\n" + "="*60)
    print("VERIFICATION REPORT")
    print("="*60 + "\n")
    
    # Count awards
    cursor.execute("SELECT COUNT(*) FROM public.awards")
    award_count = cursor.fetchone()[0]
    print(f"✓ Awards table: {award_count} unique awards")
    
    # Show all awards
    print("\n✓ All Awards in Database:")
    cursor.execute("SELECT id, prize_name, prize_institution FROM public.awards ORDER BY id")
    for award_id, prize_name, institution in cursor.fetchall():
        print(f"  [{award_id:2d}] {prize_name:50s} | {institution}")
    
    # Check books-awards linkage
    cursor.execute("""
        SELECT COUNT(DISTINCT award_id) 
        FROM public.books 
        WHERE award_id IS NOT NULL
    """)
    linked_awards = cursor.fetchone()[0]
    print(f"\n✓ Books linked to awards: {linked_awards} different awards")
    
    # Check verified status
    cursor.execute("""
        SELECT COUNT(*) FROM public.books WHERE verified = true;
    """)
    verified_count = cursor.fetchone()[0]
    print(f"✓ Verified award winners: {verified_count}")
    
    # Show sample books by award
    print("\n✓ Sample Books by Award:")
    cursor.execute("""
        SELECT a.id, a.prize_name, COUNT(*) as book_count
        FROM public.awards a
        LEFT JOIN public.books b ON a.id = b.award_id
        WHERE b.id IS NOT NULL
        GROUP BY a.id, a.prize_name
        ORDER BY a.id
        LIMIT 10
    """)
    for award_id, prize_name, book_count in cursor.fetchall():
        print(f"  Award {award_id:2d}: {prize_name:50s} - {book_count} entries")
    
    conn.close()
    
    print("\n" + "="*60)
    print("FIX COMPLETE!")
    print("="*60)

def main():
    """Main execution"""
    print("="*60)
    print("DATABASE FIX v2: CONSOLIDATE AWARDS")
    print("Rebuild awards table with unique awards only")
    print("="*60 + "\n")
    
    # Load data
    df, unique_awards = load_data()
    
    # Connect to database
    conn = connect_db()
    if not conn:
        return
    
    # Fix awards
    award_lookup = fix_awards_table(conn, unique_awards)
    if not award_lookup:
        return
    
    # Update books
    if not update_books_with_correct_awards(conn, df, award_lookup):
        return
    
    # Verify
    verify_fix(conn)

if __name__ == '__main__':
    main()
