# Look Up Book - Complete Setup & Testing Guide

## Prerequisites

Before proceeding, ensure you have the following installed:

1. **PostgreSQL 14+** - Download from [postgresql.org](https://www.postgresql.org/download/)
2. **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
3. **Git** - Download from [git-scm.com](https://git-scm.com/)

---

## Step 1: Set Up PostgreSQL Database

### Option A: Using Command Line (Recommended)

#### 1.1 Open PostgreSQL Command Prompt
- Windows: Search for "SQL Shell (psql)" in Start Menu
- Or open Command Prompt and navigate to PostgreSQL bin folder:
  ```
  cd "C:\Program Files\PostgreSQL\15\bin"
  ```

#### 1.2 Connect to PostgreSQL
```bash
psql -U postgres
```

When prompted, enter your PostgreSQL password (set during installation).

#### 1.3 Create Database
```sql
CREATE DATABASE look_up_book_db;
```

#### 1.4 Load the Data
```sql
\q
```

Exit psql, then run:
```bash
cd "C:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\server"

psql -U postgres -d look_up_book_db -f consolidated_database.sql
```

This will take a few minutes to import 100,000+ records.

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin (installed with PostgreSQL)
2. Right-click "Databases" → "Create" → "Database"
3. Name: `look_up_book_db`
4. Click "Create"
5. Right-click the new database → "Query Tool"
6. Copy entire contents of `consolidated_database.sql`
7. Paste into query window and execute

---

## Step 2: Configure Environment Variables

✅ **Already Done!** Your `.env` file is located at:
```
server/.env
```

### Current Configuration:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=look_up_book_db
DB_PASSWORD=postgres
DB_PORT=5432
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
PORT=5000
```

### ⚠️ Important Security Notes:
- **DO NOT** commit `.env` to GitHub - it's protected by `.gitignore`
- Change `DB_PASSWORD` to your actual PostgreSQL password
- In production, use a strong `JWT_SECRET`
- The `.gitignore` file prevents accidental commits

---

## Step 3: Install Dependencies

### 3.1 Server Dependencies
```bash
cd server
npm install
```

### 3.2 Client Dependencies (Optional - if testing frontend)
```bash
cd ../client
npm install
```

---

## Step 4: Test the Server

### 4.1 Start Server
```bash
cd server
npm start
```

Or directly with Node:
```bash
node server.js
```

**Expected Output:**
```
Server is running on port 5000
```

### 4.2 Verify Database Connection

The server will automatically:
- Connect to PostgreSQL
- Load environment variables from `.env`
- Initialize the connection pool

If you see no errors, the database is connected! ✅

---

## Step 5: Test API Endpoints

### Setup: Open New Terminal/Command Prompt

While the server is running, test the endpoints using curl or Postman.

### Test 1: Get Random Books
**Endpoint:** `GET http://localhost:5000/api/tableName`

```bash
curl http://localhost:5000/api/tableName
```

**Expected:** Returns 10 random books with title, genre, year, and like/dislike counts

### Test 2: Get All Authors
**Endpoint:** `GET http://localhost:5000/api/authors`

```bash
curl http://localhost:5000/api/authors
```

**Expected:** Returns list of 1,360 authors with ID, name

### Test 3: Get Books by Author ID
**Endpoint:** `GET http://localhost:5000/api/books/:authorId`

```bash
curl http://localhost:5000/api/books/1
```

**Expected:** Returns books by author ID 1

### Test 4: Get All Awards
**Endpoint:** `GET http://localhost:5000/api/awards`

```bash
curl http://localhost:5000/api/awards
```

**Expected:** Returns 21 literary awards

### Test 5: Get Books by Award ID
**Endpoint:** `GET http://localhost:5000/api/awards/:awardId`

```bash
curl http://localhost:5000/api/awards/1
```

**Expected:** Returns books that won award ID 1

### Test 6: Get Books for Profile
**Endpoint:** `GET http://localhost:5000/api/books-for-profile`

```bash
curl http://localhost:5000/api/books-for-profile
```

**Expected:** Returns distinct books with authors

### Test 7: Create a User (Signup)
**Endpoint:** `POST http://localhost:5000/signup`

```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected:** Returns JWT token and user ID

### Test 8: Admin Login
**Endpoint:** `POST http://localhost:5000/admin/login`

```bash
curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Drewadoo",
    "password": "your_admin_password"
  }'
```

**Expected:** Returns JWT token and admin ID
**Note:** Check database for admin password hash

### Test 9: User Login
**Endpoint:** `POST http://localhost:5000/login`

```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**Expected:** Returns JWT token and user ID

### Test 10: Like/Dislike a Book
**Endpoint:** `POST http://localhost:5000/api/like`

```bash
curl -X POST http://localhost:5000/api/like \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookId": 1,
    "liked": true
  }'
```

**Expected:** Returns like/dislike counts

### Test 11: Get Unverified Books
**Endpoint:** `GET http://localhost:5000/api/unverified-books`

```bash
curl http://localhost:5000/api/unverified-books
```

**Expected:** Returns books pending verification

### Test 12: Add Book to Preferences
**Endpoint:** `POST http://localhost:5000/api/user/add-book`

```bash
curl -X POST http://localhost:5000/api/user/add-book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookId": 1
  }'
```

**Expected:** Book added to user preferences

---

## Step 6: Using Postman (Alternative)

1. **Download Postman** from [postman.com](https://www.postman.com/)

2. **Import Collection** (Optional):
   - Create requests for each endpoint above
   - Save as collection for future testing

3. **Quick Test**:
   - Set request to `GET`
   - URL: `http://localhost:5000/api/authors`
   - Click Send
   - Should see author list

---

## Troubleshooting

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to PATH:
```
C:\Program Files\PostgreSQL\15\bin
```

### Issue: "Cannot connect to database"
**Solution:** 
1. Verify PostgreSQL is running
2. Check `.env` credentials match your setup
3. Ensure database `look_up_book_db` exists

### Issue: "ENOENT: no such file or directory"
**Solution:** Ensure you're in correct directory:
```bash
cd "C:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\Springboard_Capstone_Project_2_Look_Up_Book-main\server"
```

### Issue: Port 5000 already in use
**Solution:** 
- Kill process on port 5000, or
- Change PORT in `.env` to different number

### Issue: "dotenv" module not found
**Solution:**
```bash
npm install dotenv
```

---

## Environment Configuration Details

### .env File Location
```
server/.env
```

### Protected from GitHub
✅ The `.gitignore` file ensures `.env` is never committed:
```
/.env
/.env.local
/.env.*.local
```

### To Set Production Credentials
1. Create `.env.production` locally
2. Update with production database details
3. Never commit to GitHub
4. Use in production environment only

---

## Database Schema Overview

**8 Tables Created:**
- `admins` - Admin users
- `users` - Regular users
- `authors` - 1,360 book authors
- `books` - 81,725 books
- `awards` - 21 literary awards
- `people` - 3,115 writer records
- `user_book_likes` - Engagement tracking
- `user_preferred_books` - User favorites

**Total Records:** 100,000+

---

## Next Steps

1. ✅ Database loaded and configured
2. ✅ Server tested and working
3. ✅ API endpoints operational
4. 🔄 Deploy frontend (React) - see `client/README.md`
5. 🔄 Set up GitHub secrets for CI/CD

---

## Support Files

- **Database:** `server/consolidated_database.sql` (9.9 MB)
- **Converter Script:** `convert_data_to_sql.py` (for future migrations)
- **Documentation:** `DATABASE_MIGRATION_SUMMARY.md`
- **Migration Details:** `MIGRATION_CHECKLIST.md`

---

**Setup Completed!** Your Look Up Book app is ready to use. 🎉

For questions or issues, refer to the documentation files or check the server logs.
