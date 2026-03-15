# PostgreSQL Security Implementation Guide

## What's Already Done ✅

1. ✅ Created `app_user` account with limited permissions
2. ✅ Updated server/.env to use `app_user`
3. ✅ Verified server boots successfully with new credentials
4. ✅ Tested API endpoints work with new user
5. ✅ Created comprehensive security audit report

## What You Should Do Next

### IMMEDIATE (Critical for Production)

#### Step 1: Strengthen postgres Superuser Password
```sql
-- Connect as postgres
ALTER USER postgres WITH PASSWORD 'your_very_secure_postgres_password_here';
```

**Why**: The postgres account is the superuser; it should have a strong password even though it's localhost-only.

#### Step 2: Verify .env is in .gitignore
```bash
# Check that .env files are ignored
cat server/.gitignore
```

Should include:
```
.env
.env.local
.env.*.local
node_modules/
```

#### Step 3: Document Database Setup
Keep a secure record (NOT in git) of:
- postgres password
- app_user password
- These passwords should be:
  - Stored in 1Password, LastPass, or similar
  - Never shared via email/Slack
  - Never committed to git
  - Changed regularly in production

---

### RECOMMENDED (For Better Security)

#### Step 1: Enable Connection Logging
Edit `C:\Program Files\PostgreSQL\17\data\postgresql.conf`:

```conf
# Find these lines and change them:
log_connections = on              # Log connection attempts
log_disconnections = on           # Log when users disconnect
log_lock_waits = on              # Log long locks
log_statement = 'all'            # Log all SQL (only for debugging!)
log_min_duration_statement = 1000 # Log queries > 1 second
```

Then restart PostgreSQL:
```powershell
Restart-Service -Name "PostgreSQL 17"
```

**Why**: You want to know if someone is trying to connect or if there are problems.

#### Step 2: Update listen_addresses for Clarity
Edit `C:\Program Files\PostgreSQL\17\data\postgresql.conf`:

```conf
# Change from:
listen_addresses = '*'

# To:
listen_addresses = 'localhost,127.0.0.1,::1'
```

Then restart PostgreSQL.

**Why**: This makes it clearer that only localhost is accepted, even though HBA already restricts it.

#### Step 3: Create Read-Only User (Optional)
For reports/analytics without write access:

```sql
-- Create read-only user
CREATE USER readonly_user WITH PASSWORD 'readonly_secure_password';
GRANT CONNECT ON DATABASE look_up_book_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Set as default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

---

### PRODUCTION-READY (Before Going Live)

#### Step 1: SSL/TLS Encryption
If connecting remotely (not recommended for database):

```conf
# In postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# In pg_hba.conf
hostssl all app_user localhost scram-sha-256
```

#### Step 2: Connection Pooling
For production with multiple app servers, use PgBouncer:

```ini
[databases]
look_up_book_db = host=localhost port=5432 dbname=look_up_book_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
```

#### Step 3: Regular Backups
```powershell
# Daily backup script
pg_dump -U postgres -h localhost look_up_book_db > "backup_$(Get-Date -Format 'yyyyMMdd').sql"
```

#### Step 4: Monitoring
Monitor these metrics:
- Connection count
- Lock waits
- Disk space
- Query performance

---

## Testing Your Setup

### Test 1: Verify app_user Permissions
```sql
-- Connect as app_user
psql -U app_user -h localhost -d look_up_book_db

-- These should work:
SELECT COUNT(*) FROM books;        -- ✅ Should return count
SELECT COUNT(*) FROM authors;      -- ✅ Should return count
INSERT INTO user_book_likes (user_id, book_id, liked) VALUES (1, 1, true);
SELECT * FROM user_book_likes;     -- ✅ Should work

-- These should FAIL:
CREATE TABLE test_table (id INT);  -- ❌ Should get "permission denied"
DROP TABLE books;                  -- ❌ Should get "permission denied"
CREATE USER test_user;             -- ❌ Should get "permission denied"
```

### Test 2: Verify Server Connectivity
```bash
npm start
# Look for:
# DB Connection: app_user@localhost:5432/look_up_book_db
# Database pool created successfully
# Server is running on port 5000
```

### Test 3: Verify API Works
```bash
# In browser or curl:
curl http://localhost:5000/api/tableName

# Should return JSON array with 10 books
```

### Test 4: Check Credentials Handling
```bash
# Verify .env is not in git
git status
# Should NOT show server/.env

# Verify .env exists locally
ls -la server/.env
# Should exist and have correct credentials
```

---

## Security Checklist for Deployment

### Before Going to Production
- [ ] Change postgres password to something strong
- [ ] Verify app_user has limited permissions (not superuser)
- [ ] Ensure .env file is in .gitignore
- [ ] Test database backup works
- [ ] Test database restore works
- [ ] Set up monitoring for connections
- [ ] Document all database users and their purposes
- [ ] Review and enable appropriate logging
- [ ] Test all API endpoints work
- [ ] Verify HTTPS is enabled for web server
- [ ] Plan password rotation schedule
- [ ] Document disaster recovery procedures

### During Production
- [ ] Monitor database connections daily
- [ ] Check logs for failed connection attempts
- [ ] Rotate passwords every 90 days
- [ ] Take daily backups
- [ ] Test backup restoration monthly
- [ ] Review user permissions quarterly
- [ ] Monitor disk space growth

### Database User Summary
```sql
-- What we have now:
postgres       -- Superuser for administration (change password!)
app_user       -- Application (books, user_book_likes, users)

-- What you might want to add:
readonly_user  -- Reports and analytics (no write access)
backup_user    -- Automated backups
monitor_user   -- Monitoring tools
```

---

## Quick Command Reference

### Database Backup
```powershell
# Full backup
pg_dump -U app_user -h localhost look_up_book_db > backup.sql

# Restore from backup
psql -U app_user -h localhost look_up_book_db < backup.sql

# Backup with timestamp
pg_dump -U app_user -h localhost look_up_book_db > "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### User Management
```sql
-- List all users
\du

-- Change password
ALTER USER app_user WITH PASSWORD 'new_password';

-- Grant permissions
GRANT SELECT ON books TO app_user;

-- Check user permissions
SELECT * FROM information_schema.role_table_grants 
WHERE grantee = 'app_user';
```

### Connection Troubleshooting
```powershell
# Test connection
psql -U app_user -h localhost -d look_up_book_db -c "SELECT 1"

# Check if PostgreSQL is running
Get-Service PostgreSQL*

# View PostgreSQL logs
Get-Content "C:\Program Files\PostgreSQL\17\data\log\*.log" | Tail -50
```

---

## Common Issues & Solutions

### Issue: "password authentication failed for user 'app_user'"
**Solutions**:
1. Verify password in .env matches what was set in database
2. Verify app_user exists: `\du` in psql
3. Reset password: `ALTER USER app_user WITH PASSWORD 'newpass';`
4. Verify no typos in .env file

### Issue: "permission denied for schema public"
**Solution**: Grant schema permission:
```sql
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Issue: "Database does not exist"
**Solutions**:
1. Verify database name in .env matches actual database
2. List databases: `\l` in psql
3. Create if needed: `CREATE DATABASE look_up_book_db;`

### Issue: "Connection refused"
**Solutions**:
1. Verify PostgreSQL is running: `Get-Service PostgreSQL*`
2. Verify port 5432 is correct: `netstat -ano | findstr 5432`
3. Verify listen_addresses in postgresql.conf
4. Restart PostgreSQL: `Restart-Service PostgreSQL*`

---

## Next Security Enhancements

Once the above is secure, consider:

1. **Row-Level Security (RLS)**
   - Restrict books data by user
   - Prevent users from seeing other users' data

2. **Audit Logging**
   - Track who did what and when
   - Store in separate audit table

3. **Rate Limiting**
   - Prevent API abuse
   - Implement in Express middleware

4. **Web Application Firewall**
   - Protect against SQL injection (already protected by parameterized queries)
   - Protect against XSS (already protected by React escaping)

5. **Encryption at Rest**
   - Encrypt sensitive data in database
   - For PII like user emails

---

## Resources

- PostgreSQL Official Docs: https://www.postgresql.org/docs/17/
- Security Best Practices: https://www.postgresql.org/docs/17/sql-syntax.html#SQL-PREFIX-SYNTAX
- Connection Security: https://www.postgresql.org/docs/17/libpq-ssl.html
- Role Management: https://www.postgresql.org/docs/17/user-manag.html

## Questions?

Review these files:
- `POSTGRESQL_SECURITY_AUDIT.md` - Detailed audit findings
- `SESSION_COMPLETION_SUMMARY.md` - What was changed and why
- `QUICK_START_UPDATED.md` - Getting started guide

---

**Last Updated**: January 3, 2025  
**Status**: ✅ Ready for Implementation  
**Priority**: HIGH for app_user verification, MEDIUM for additional hardening
