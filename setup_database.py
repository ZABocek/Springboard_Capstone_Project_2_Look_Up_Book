#!/usr/bin/env python3
"""
Database setup script - creates database and grants permissions
"""

import psycopg2
from psycopg2 import sql

def setup_database():
    """Setup database and user permissions"""
    try:
        # Connect as postgres (admin user)
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='postgres',
            user='postgres',
            password='postgres'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("[INFO] Connected as postgres admin")
        
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = 'look_up_book_db';")
        if cur.fetchone():
            print("[INFO] Database look_up_book_db already exists")
            
            # Drop and recreate
            print("[INFO] Dropping existing database...")
            cur.execute("DROP DATABASE IF EXISTS look_up_book_db;")
            print("[SUCCESS] Database dropped")
        
        # Create database
        print("[INFO] Creating database...")
        cur.execute("CREATE DATABASE look_up_book_db;")
        print("[SUCCESS] Database created")
        
        # Check if user exists
        cur.execute("SELECT 1 FROM pg_user WHERE usename = 'app_user';")
        if cur.fetchone():
            print("[INFO] User app_user already exists")
        else:
            print("[INFO] Creating user app_user...")
            cur.execute("CREATE USER app_user WITH PASSWORD 'look_up_book_app_secure_2025';")
            print("[SUCCESS] User created")
        
        # Grant privileges
        print("[INFO] Granting privileges...")
        cur.execute("GRANT ALL PRIVILEGES ON DATABASE look_up_book_db TO app_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;")
        print("[SUCCESS] Privileges granted")
        
        cur.close()
        conn.close()
        
        # Now connect to the new database as postgres to grant schema privileges
        print("[INFO] Connecting to look_up_book_db as postgres...")
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='look_up_book_db',
            user='postgres',
            password='postgres'
        )
        cur = conn.cursor()
        
        # Grant schema privileges
        cur.execute("GRANT USAGE ON SCHEMA public TO app_user;")
        cur.execute("GRANT CREATE ON SCHEMA public TO app_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;")
        cur.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;")
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("[SUCCESS] Database setup completed successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to setup database: {e}")
        return False

if __name__ == "__main__":
    setup_database()
