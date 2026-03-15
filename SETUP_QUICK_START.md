# SETUP INSTRUCTIONS - Look Up Book

## 📋 Quick Start Checklist

Follow these steps to get your Look Up Book app running locally.

---

## Step 1: Prerequisites ✅

Ensure you have installed:
- [PostgreSQL 14+](https://www.postgresql.org/download/)
- [Node.js 16+](https://nodejs.org/)
- [Git](https://git-scm.com/)

Verify installations:
```bash
psql --version
node --version
npm --version
```

---

## Step 2: Database Setup 🗄️

### Create Database

Open PostgreSQL command prompt or terminal:

```bash
# Connect to PostgreSQL (if not already connected)
psql -U postgres
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE look_up_book_db;
\q
```

### Load Data

Navigate to the server directory and load the consolidated database:

```bash
cd server
psql -U postgres -d look_up_book_db -f consolidated_database.sql
```

**This will take 2-5 minutes** to import 100,000+ records. You should see progress output ending with the admin user insertion.

### Verify Database

```bash
psql -U postgres -d look_up_book_db -c "SELECT COUNT(*) FROM books;"
```

Expected output: `81725` books

---

## Step 3: Environment Configuration 🔐

### Your .env File

Located at: `server/.env`

**Current content:**
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

### Update Credentials

**Edit `server/.env` with your actual PostgreSQL password:**

1. Open `server/.env` in your text editor
2. Update `DB_PASSWORD=` with your PostgreSQL password (if different)
3. **Important:** Never commit this file to GitHub
4. The `.gitignore` file protects it automatically ✅

### Security Notes

- ✅ `.env` is protected by `.gitignore`
- ✅ Won't be accidentally committed to GitHub
- ✅ Each developer has their own local credentials
- 🔒 Change `JWT_SECRET` before production deployment

---

## Step 4: Install Dependencies 📦

### Server

```bash
cd server
npm install
```

This installs all Node.js packages including:
- Express (web framework)
- pg (PostgreSQL driver)
- dotenv (environment variables)
- bcrypt (password hashing)
- jsonwebtoken (JWT authentication)

### Client (Optional - if testing frontend)

```bash
cd client
npm install
```

---

## Step 5: Start the Server 🚀

### Start Development Server

```bash
cd server
npm start
```

Or directly:
```bash
node server.js
```

**Expected output:**
```
Server is running on port 5000
```

If you see errors about database connection, verify:
1. PostgreSQL is running
2. Database credentials in `.env` are correct
3. `look_up_book_db` database exists

### Server Running? ✅

If no errors appear, your server is ready!

---

## Step 6: Test the API 🧪

### Option A: Using Python Script (Recommended)

**Easiest way to test all endpoints:**

```bash
# From the root directory
python test_api_endpoints.py
```

This will:
- ✅ Test all 12 API endpoints
- ✅ Create test data
- ✅ Verify database connection
- ✅ Show results with pass/fail status

**Expected output:**
```
✅ Server Connection
✅ Get Random Books
✅ Get Authors
✅ Get Books by Author
✅ Get Awards
✅ Get Books by Award
✅ Get Books for Profile
✅ User Signup
✅ User Login
✅ Like Book
✅ Get User Preferences
✅ Add Book to Profile

🎉 All critical tests passed!
```

### Option B: Using curl

```bash
# Get random books
curl http://localhost:5000/api/tableName

# Get authors
curl http://localhost:5000/api/authors

# Get awards
curl http://localhost:5000/api/awards
```

### Option C: Using Postman

1. Download [Postman](https://www.postman.com/)
2. Create new request:
   - Method: `GET`
   - URL: `http://localhost:5000/api/authors`
   - Click Send

Should return JSON with author data.

---

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tableName` | Get 10 random books |
| GET | `/api/authors` | Get all authors |
| GET | `/api/books/:authorId` | Get books by author |
| GET | `/api/awards` | Get all awards |
| GET | `/api/awards/:awardId` | Get books by award |
| GET | `/api/books-for-profile` | Get books for profile |
| POST | `/signup` | Create new user |
| POST | `/login` | User login |
| POST | `/admin/login` | Admin login |
| POST | `/api/like` | Like/dislike a book |
| GET | `/api/user/preference/:userId` | Get user preferences |
| POST | `/api/user/add-book` | Add book to profile |

---

## Troubleshooting 🔧

### Problem: "psql: command not found"

**Solution:** PostgreSQL is not in PATH

Windows:
1. Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\15`)
2. Open Command Prompt
3. Run: `"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres`

Or add PostgreSQL to PATH permanently.

### Problem: "Cannot connect to database"

**Solution:** Database server not running

Windows:
1. Open Services (services.msc)
2. Look for "postgresql-x64-15" (or your version)
3. Ensure it's running (green arrow)
4. If not, right-click → Start

Or start from terminal:
```bash
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

### Problem: "ECONNREFUSED 127.0.0.1:5432"

**Solution:** PostgreSQL connection failed

Check:
1. PostgreSQL service is running
2. `DB_HOST` in `.env` is correct (`localhost` or `127.0.0.1`)
3. `DB_PORT` is correct (default: 5432)
4. `DB_PASSWORD` matches your PostgreSQL password

### Problem: "Error: connect ENOENT /var/run/postgresql/.s.PGSQL.5432"

**Solution:** PostgreSQL socket error (Mac/Linux)

The database is looking for a Unix socket. Verify PostgreSQL installation or use TCP connection:
```env
DB_HOST=localhost
```

### Problem: "dotenv is not defined"

**Solution:** dotenv package not installed

```bash
cd server
npm install dotenv
```

### Problem: "Port 5000 already in use"

**Solution:** Another application is using port 5000

Option 1: Kill the process:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

Option 2: Use different port:
```env
PORT=5001
```

Then access: `http://localhost:5001`

### Problem: Database import hangs

**Solution:** Large file import is slow

This is normal. The consolidated database is 9.9 MB with 100,000+ records.

Wait for completion (5-10 minutes on slower systems).

Monitor progress:
```bash
psql -U postgres -d look_up_book_db -c "SELECT COUNT(*) FROM books;"
```

Should increase as data loads.

---

## Project Structure 📁

```
Springboard_Capstone_Project_2_Look_Up_Book-main/
├── server/
│   ├── .env                          # 🔐 Environment variables (DO NOT COMMIT)
│   ├── .gitignore                    # Protects .env from GitHub
│   ├── server.js                     # Express server (fixed & ready)
│   ├── consolidated_database.sql     # Database with all data
│   └── package.json                  # Dependencies
├── client/
│   ├── src/                          # React components
│   ├── public/                       # Static files
│   └── package.json
├── data/                             # Original TSV data files
├── convert_data_to_sql.py            # Data conversion script
├── test_api_endpoints.py             # API test suite
├── COMPLETE_SETUP_GUIDE.md           # Full setup documentation
├── DATABASE_MIGRATION_SUMMARY.md     # Migration details
├── MIGRATION_CHECKLIST.md            # Progress tracking
├── .gitignore                        # GitHub ignore rules
└── README.md                         # Project overview
```

---

## Security Checklist ✅

Before deploying to production:

- [ ] `.env` file is in `.gitignore` (already done)
- [ ] Change `JWT_SECRET` to a strong, random string
- [ ] Update `DB_PASSWORD` to a strong password
- [ ] Enable HTTPS for all connections
- [ ] Set `NODE_ENV=production`
- [ ] Use environment-specific `.env.production`
- [ ] Never commit `.env` to GitHub
- [ ] Review and update CORS settings
- [ ] Enable database backups

---

## Database Details 🗂️

**Schema:**
- `admins` - Admin users (1 default admin provided)
- `users` - Regular users
- `authors` - 1,360 book authors
- `books` - 81,725 books (from HathiTrust, NYT, Literary Prizes, Iowa Workshop)
- `awards` - 21 literary awards
- `people` - 3,115 writer biographical records
- `user_book_likes` - User engagement tracking
- `user_preferred_books` - User favorite books

**Admin Login:**
- Username: `Drewadoo`
- Email: `zabocek@gmail.com`
- Password: (Hashed in database - reset if needed)

---

## Development Workflow 💻

### Regular Development

```bash
# Terminal 1: Start server
cd server
npm start

# Terminal 2: Start client (optional)
cd client
npm start

# Terminal 3: Run tests
python test_api_endpoints.py
```

### Making Changes

1. Edit files as needed
2. Server auto-restarts on changes (if using nodemon)
3. Test endpoints with Python script
4. Commit to GitHub (`.env` is protected ✅)

### Adding New Features

1. Update `server/server.js` with new endpoints
2. Update database schema if needed
3. Test with `test_api_endpoints.py`
4. Deploy changes

---

## Next Steps 🎯

After successful setup:

1. ✅ **Verify Database** - Run test script
2. 🎨 **Frontend** - Start React dev server in `client/`
3. 🚀 **Deploy** - Use your preferred hosting service
4. 📚 **Documentation** - Update README as needed
5. 🔐 **Security** - Update credentials for production

---

## Support & Documentation 📖

- **Full Setup Guide:** `COMPLETE_SETUP_GUIDE.md`
- **Database Details:** `DATABASE_MIGRATION_SUMMARY.md`
- **Migration Info:** `MIGRATION_CHECKLIST.md`
- **Test Script:** `test_api_endpoints.py`

---

## GitHub Information 🐙

**Repository:** https://github.com/ZABocek/Springboard_Capstone_Project_2_Look_Up_Book

**Security:**
- `.env` is protected by `.gitignore` ✅
- All sensitive data stays local
- No credentials in version control

---

**Setup Complete!** 🎉

Your Look Up Book app is ready for development.

Start the server: `cd server && npm start`

Test the API: `python test_api_endpoints.py`

Questions? Check the documentation files above.
