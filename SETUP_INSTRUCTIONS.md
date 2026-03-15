# Setup Instructions for Book Database

## Quick Start

### Prerequisites
- PostgreSQL 12+ installed and running
- Node.js and npm installed
- The Look Up Book application files

### Step 1: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (if not exists)
CREATE DATABASE look_up_book_db;
\q
```

### Step 2: Load Consolidated Database Schema
```bash
# From the project root directory
psql -U postgres -d look_up_book_db -f server/consolidated_database.sql
```

This will:
- Create all necessary tables (books, authors, awards, people, users, admins, etc.)
- Create all sequences for auto-incrementing IDs
- Insert 81,725 books with metadata
- Insert 1,360 authors
- Insert 21 literary awards
- Insert 3,115 people records
- Create default admin account

### Step 3: Configure Environment Variables
Create or update `.env` file in the server directory:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=look_up_book_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_secret_key_here
```

### Step 4: Install Dependencies and Start Server
```bash
cd server
npm install
node server.js
```

The server should start on port 5000.

### Step 5: Test the Setup
Try accessing an endpoint:
```bash
# Get random books
curl http://localhost:5000/api/tableName

# Login as admin
curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Drewadoo","password":"your_admin_password"}'
```

## Database Contents

### Available Data
- **81,725 Books** from multiple sources:
  - 75,954 from HathiTrust Fiction collection
  - 7,431 from NYT Bestsellers
  - 7,133+ from Literary Prizes
  
- **1,360 Authors** with biographical information

- **21 Literary Awards** including:
  - Pulitzer Prize
  - National Book Award
  - PEN America Awards
  - And more...

- **3,115 People Records** from Iowa Writers Workshop and other sources

### Default Admin
- Username: `Drewadoo`
- Email: `zabocek@gmail.com`

## Troubleshooting

### Issue: "tablename does not exist"
- Old queries were still referencing the old table
- Make sure you've run the latest `server.js` file after the migration

### Issue: "password authentication failed"
- Check your DB_PASSWORD in `.env` matches your PostgreSQL setup
- Ensure the DB_USER has access to the database

### Issue: "database does not exist"
- Create the database first: `CREATE DATABASE look_up_book_db;`
- Then load the SQL file

### Issue: Port 5000 already in use
- Change the port in `server.js` at the bottom of the file
- Or kill the process using port 5000

## Data Files Location

Raw TSV data files are available at:
```
/data/data-fd3921e84d182dea82a7615f0a9dccbaaab6dedd/
├── hathitrust_fiction/
├── iowa_writers_workshop/
├── major_literary_prizes/
└── nyt_hardcover_fiction_bestsellers/
```

The Python converter script (`convert_data_to_sql.py`) can be re-run to regenerate the SQL file if needed.

## File Manifest

**New Files:**
- `server/consolidated_database.sql` - Complete database schema and data (9.9 MB)
- `DATABASE_MIGRATION_SUMMARY.md` - Detailed migration documentation
- `convert_data_to_sql.py` - Data conversion script

**Modified Files:**
- `server/server.js` - All database queries updated

**Deleted Files:**
- `server/current-database-7.sql` - Old database file

---

**Last Updated:** December 18, 2025
