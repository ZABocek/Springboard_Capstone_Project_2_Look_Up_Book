#!/usr/bin/env python3
"""
Update books with prize_year data from the major_literary_prizes dataset
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

def update_prize_years():
    """Update books table with prize_year data from the TSV file"""
    print("Loading prize year data from TSV file...")
    df = pd.read_csv(WINNERS_JUDGES_FILE, sep='\t', dtype=str)
    
    # Filter for only winners (not judges)
    winners_df = df[df['role'] == 'winner'].copy()
    print(f"Found {len(winners_df)} winner records")
    
    conn = connect_db()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    try:
        print("\nUpdating books with prize_year data...")
        
        # Get the awards mapping
        awards_result = cursor.execute(
            "SELECT id, prize_name FROM public.awards;"
        )
        cursor.execute("SELECT id, prize_name FROM public.awards;")
        awards_rows = cursor.fetchall()
        award_name_to_id = {row[1]: row[0] for row in awards_rows}
        print(f"Loaded {len(award_name_to_id)} awards mapping")
        
        # Get books that have award_id but null prize_year
        cursor.execute(
            "SELECT id, title FROM public.books WHERE award_id IS NOT NULL AND prize_year IS NULL LIMIT 10;"
        )
        sample_books = cursor.fetchall()
        print(f"\nSample of books with award but no prize_year:")
        for bid, title in sample_books:
            print(f"  ID {bid}: {title[:50]}")
        
        # Build update statements
        update_count = 0
        updates = []
        
        for idx, row in winners_df.iterrows():
            prize_name = str(row.get('prize_name', '')).strip() if pd.notna(row.get('prize_name')) else ''
            prize_year = str(row.get('prize_year', '')).strip() if pd.notna(row.get('prize_year')) else ''
            title = str(row.get('title_of_winning_book', '')).strip() if pd.notna(row.get('title_of_winning_book')) else ''
            
            # Skip if missing required data
            if not prize_name or not prize_year or not title:
                continue
            
            # Convert prize_year to int
            try:
                prize_year_int = int(float(prize_year))
            except:
                continue
            
            # Find award ID
            award_id = award_name_to_id.get(prize_name)
            if not award_id:
                continue
            
            # Clean the title for matching (remove MARC metadata)
            title_clean = title.replace(" / | $c: by", "").replace(" | $c: ", "").replace(" | ", "").split(" / ")[0].strip()
            
            # Find matching book (by title and award_id)
            cursor.execute(
                "SELECT id FROM public.books WHERE award_id = %s AND prize_year IS NULL AND (title ILIKE %s OR title ILIKE %s) LIMIT 1;",
                (award_id, title_clean + '%', '%' + title_clean.split()[0] + '%')
            )
            result = cursor.fetchone()
            if result:
                book_id = result[0]
                updates.append((prize_year_int, book_id))
                update_count += 1
        
        # Apply updates
        print(f"\nApplying {update_count} updates...")
        for prize_year, book_id in updates:
            cursor.execute(
                "UPDATE public.books SET prize_year = %s WHERE id = %s;",
                (prize_year, book_id)
            )
        
        conn.commit()
        print(f"✓ Updated {update_count} books with prize_year")
        
        # Verify results
        cursor.execute(
            "SELECT COUNT(*) FROM public.books WHERE award_id IS NOT NULL AND prize_year IS NOT NULL;"
        )
        verified_count = cursor.fetchone()[0]
        print(f"\n✓ Books with both award_id AND prize_year: {verified_count}")
        
        # Show sample results
        cursor.execute("""
            SELECT b.id, b.title, a.prize_name, b.prize_year 
            FROM books b 
            LEFT JOIN awards a ON b.award_id = a.id 
            WHERE b.award_id IS NOT NULL AND b.prize_year IS NOT NULL 
            LIMIT 5;
        """)
        print(f"\nSample of updated books:")
        for row in cursor.fetchall():
            print(f"  {row[2]} ({row[3]}): {row[1][:40]}")
        
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("UPDATE BOOKS WITH PRIZE YEARS")
    print("=" * 60)
    update_prize_years()
    print("\n" + "=" * 60)
    print("COMPLETE!")
    print("=" * 60)
