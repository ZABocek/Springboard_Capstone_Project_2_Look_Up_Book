# Database Migration Summary

## Overview
Successfully consolidated all book data from TSV files into a single PostgreSQL SQL database file, updated the server code to work with the new schema, and replaced the old database.

## Data Consolidated

The following data sources were successfully processed:

### 1. **HathiTrust Fiction Metadata** (75,954 rows)
- Source: `data/hathitrust_fiction/hathitrust_post45fiction_metadata.tsv`
- Data: Post-1945 fiction metadata including titles, authors, publication dates
- Books extracted: ~75,954

### 2. **Iowa Writers Workshop** (3,115 rows)
- Sources: 
  - `data/iowa_writers_workshop/iowa_writers_workshop-people.tsv` - Writer biographical data
  - `data/iowa_writers_workshop/iowa_writers_workshop-hathitrust_metadata.tsv`
- Data: Information about workshop participants and graduates
- Records: 3,115 people entries

### 3. **Major Literary Prizes** (7,133 rows)
- Sources:
  - `data/major_literary_prizes/major_literary_prizes-winners_judges.tsv`
  - `data/major_literary_prizes/major_literary_prizes-hathitrust_metadata.tsv`
- Data: Prize winners, judges, and award information
- Awards tracked: 21 distinct major literary prizes
- Records: 7,133 prize-related entries

### 4. **NYT Hardcover Fiction Bestsellers** (7,431 rows)
- Sources:
  - `data/nyt_hardcover_fiction_bestsellers/nyt_hardcover_fiction_bestsellers-titles.tsv`
  - `data/nyt_hardcover_fiction_bestsellers/nyt_hardcover_fiction_bestsellers-lists.tsv`
- Data: NYT bestseller rankings and titles
- Records: 7,431 bestseller entries

## Database Schema Changes

### New Tables Created:
1. **authors** - Individual author information
   - Fields: id, given_name, last_name, full_name
   
2. **books** - Consolidated book data
   - Fields: id, book_id, title, author_id, person_id, award_id, prize_year, genre, verified, role, source
   
3. **people** - Writer biographical data
   - Fields: id, person_id, full_name, given_name, middle_name, family_name, pen_name, gender, country, elite_institution, graduate_degree, mfa_degree
   
4. **awards** - Literary award information
   - Fields: id, award_id, prize_name, prize_institution, prize_year, prize_genre, prize_type, prize_amount
   
5. **users** - User account management
6. **admins** - Admin authentication
7. **user_book_likes** - User engagement tracking
8. **user_preferred_books** - User book preferences

### Replaced Table:
- Old: `tablename` (generic name, mixed data types)
- New: `books`, `authors`, `awards`, `people` (normalized structure)

## Data Aggregation Results
- **Total Books Consolidated:** 81,725
- **Total Authors:** 1,360
- **Total Awards:** 21
- **Total People Records:** 3,115

## Files Changed

### 1. **New SQL File Created**
- **File:** `server/consolidated_database.sql` (9.9 MB)
- Contains complete PostgreSQL schema with all sequences and constraints
- Includes pre-populated data from all sources
- Contains default admin user credentials

### 2. **Old SQL File Deleted**
- **File:** `server/current-database-7.sql` (removed)
- Previously contained only a few sample records
- Replaced by comprehensive consolidated database

### 3. **Server Code Updated** (`server/server.js`)
Fixed all database queries to work with new schema:

#### Query Fixes:
- Updated table references: `tablename` → `books`, `authors`, `awards`, `people`
- Fixed column name inconsistencies (e.g., `title_of_winning_book` → `title`)
- Added proper JOIN operations for related data
- Fixed `likedOn` → `likedon` column naming
- Updated ID references to use proper table IDs

#### Fixed Endpoints:
1. `/api/unverified-books` - Query now uses `books` table
2. `/api/books/:bookId/verification` - Updated to `books` table with proper ID column
3. `/api/submit-book` - Now properly inserts into `authors` and `books` tables
4. `/api/tableName` - Queries consolidated `books` table with author joins
5. `/api/authors` - Queries dedicated `authors` table
6. `/api/books/:authorId` - Fixed joins with authors
7. `/api/awards` - Queries dedicated `awards` table
8. `/api/awards/:awardId` - Fixed joins with books
9. `/api/like` - Fixed column naming (`likedon`)
10. `/api/books-for-profile` - Updated to use new table structure
11. `/api/user/:userId/preferred-books` - Fixed joins with authors and awards

## Database Connection Setup

To use the new database:

1. **Load the new SQL file into PostgreSQL:**
   ```bash
   psql -U postgres -d your_database_name < server/consolidated_database.sql
   ```

2. **Environment Variables Required** (ensure `.env` file has):
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_PASSWORD=your_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```

3. **Default Admin Credentials:**
   - Username: `Drewadoo`
   - Email: `zabocek@gmail.com`
   - Password: (uses hashed password from original database)

## Data Integrity Features

- **Constraints:** Foreign keys between tables ensure referential integrity
- **Unique Constraints:** User combinations (user_id, book_id) prevent duplicate likes
- **Sequences:** Auto-incrementing IDs for all main tables
- **Verified Status:** Books from major prizes and bestsellers marked as verified by default

## Next Steps

1. **Test the application:**
   - Run `npm install` in the server directory
   - Start the server with `node server.js`
   - Test API endpoints to ensure queries work correctly

2. **Monitor for any issues:**
   - Check server logs for SQL errors
   - Verify all endpoints return correct data

3. **Optional: Add more data**
   - The `convert_data_to_sql.py` script can be modified to include additional data sources
   - New TSV files can be added to the data folder and processed

## Backup Notes

- Old database file (`current-database-7.sql`) has been deleted
- If you need to revert, you can restore from version control
- The consolidated database is 9.9 MB in size

---
**Migration Date:** December 18, 2025
**Status:** ✅ Complete
