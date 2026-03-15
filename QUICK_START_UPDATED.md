# Look Up Book - Quick Start Guide (Updated)

## What Changed?

This project was updated with important security improvements. Here's what you need to know:

### Database User
- **OLD**: `postgres` (superuser - too powerful for an app)
- **NEW**: `app_user` (restricted - only needed permissions)
- **Password**: `look_up_book_app_secure_2025`

### Environment Variables
The `.env` file in the `server/` folder has been updated with the new credentials.

## Getting Started

### 1. Install Dependencies

```powershell
# Root level
npm install

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Start Application

From project root:
```powershell
npm start
```

This starts BOTH server and client simultaneously using `concurrently`:
- **Server**: http://localhost:5000
- **Client**: http://localhost:3000

### 3. First Time Setup Checklist

- [ ] PostgreSQL 17+ running on localhost:5432
- [ ] Database `look_up_book_db` created
- [ ] `app_user` database user created (should already be created)
- [ ] `npm install` completed in root, server, and client
- [ ] `.env` file exists in server folder with correct credentials
- [ ] `npm start` runs without errors
- [ ] Can access http://localhost:3000 in browser

## Environment Variables (server/.env)

These are already set correctly, but here's what each does:

```env
# Database connection
DB_USER=app_user                              # Database user (restricted permissions)
DB_HOST=localhost                             # Database server
DB_NAME=look_up_book_db                       # Database name
DB_PASSWORD=look_up_book_app_secure_2025      # App user password
DB_PORT=5432                                  # PostgreSQL port

# Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server config
NODE_ENV=development                          # Use 'production' for prod
PORT=5000                                     # Server API port
```

## Database User Permissions

The `app_user` account has been granted:

✅ **CAN DO**:
- Read all books, authors, awards data
- Insert new user_book_likes (like/dislike)
- Update user profiles
- View unverified books (for admin panel)

❌ **CANNOT DO**:
- Create/drop tables
- Alter table structure
- Create new users
- Access other databases
- Make administrative changes

This follows the principle of least privilege - the app only gets the permissions it needs.

## What's New in This Session

### 1. Database Security (POSTGRESQL_SECURITY_AUDIT.md)
Comprehensive security audit with:
- Vulnerability assessment
- Recommendations for production
- Step-by-step hardening guide

### 2. Environment Template (.env.example)
Shows all environment variables needed - use this as reference when setting up new environment.

### 3. Session Summary (SESSION_COMPLETION_SUMMARY.md)
Complete documentation of:
- Data integrity verification
- Security improvements
- Test results
- Recommendations

## Verification

To verify everything is working:

1. **Server starts**: Look for this in console:
   ```
   DB Connection: app_user@localhost:5432/look_up_book_db
   Server is running on port 5000
   ```

2. **Client compiles**: React dev server should show:
   ```
   Compiled successfully!
   You can now view your-app-name in the browser.
   ```

3. **API responds**: Open browser to:
   - Homepage: http://localhost:3000
   - API: http://localhost:5000/api/tableName
   - Should see 10 random books with titles, genres, years

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running
- Verify database `look_up_book_db` exists
- Verify `app_user` was created with correct password
- Check `.env` file has correct credentials

### "app_user not found"
The app_user should already be created. If not, run:
```sql
CREATE USER app_user WITH PASSWORD 'look_up_book_app_secure_2025';
GRANT CONNECT ON DATABASE look_up_book_db TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_user;
GRANT INSERT, UPDATE, DELETE ON books, user_book_likes, users TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Port 5000 or 3000 already in use
Either close other processes using those ports, or change in:
- Server port: modify `.env` `PORT=5000`
- Client port: modify `.env.REACT_APP_API_PORT=3000` or change proxy in client/package.json

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to git (it's in .gitignore)
- Never share database passwords in Slack/email
- Change `JWT_SECRET` before going to production
- Create strong passwords for both `postgres` and `app_user` in production

## Next Steps

After verifying everything works:

1. Test user registration and login
2. Test like/dislike functionality
3. Test search features
4. Test admin verification panel
5. Review POSTGRESQL_SECURITY_AUDIT.md for production recommendations

## Quick Reference

| Task | Command |
|------|---------|
| Start app | `npm start` (from root) |
| Stop app | `Ctrl+C` |
| Check server only | `cd server && npm start` |
| Check client only | `cd client && npm start` |
| Install dependencies | `npm install` (in each folder) |
| View API | Visit `http://localhost:5000/api/tableName` |
| View app | Visit `http://localhost:3000` |

## Questions?

See the following files for detailed info:
- **Data Issues**: See SERVER.md section on `/api/tableName`
- **Security**: Read `POSTGRESQL_SECURITY_AUDIT.md`
- **What Changed**: Read `SESSION_COMPLETION_SUMMARY.md`
- **Environment Setup**: See `.env.example`

---

**Updated**: January 3, 2025  
**Version**: 1.2 (with app_user security hardening)
