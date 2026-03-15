# Integration Testing Guide - Next Phase

**Status**: Server and client running successfully with app_user  
**Start Date**: January 3, 2025  
**Purpose**: Validate all user-facing features work correctly with new setup

---

## Pre-Testing Checklist

- [x] npm start runs without errors
- [x] Server shows: "DB Connection: app_user@localhost:5432/look_up_book_db"
- [x] Client shows: "Compiled successfully!"
- [x] http://localhost:5000 responds to API calls
- [x] http://localhost:3000 loads in browser
- [ ] You have a web browser ready
- [ ] You have PostgreSQL database tools available if needed
- [ ] You have 30-60 minutes for comprehensive testing

---

## Test Suite 1: Authentication

### Test 1.1: User Registration
**Steps**:
1. Open http://localhost:3000
2. Click "Register" or "Sign Up"
3. Enter test data:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Name: `Test User`
4. Submit form

**Expected Result**: 
- [ ] Success message or redirect to login
- [ ] Can login with these credentials
- [ ] No database errors in console
- [ ] Account appears in users table

**Failure Diagnosis**:
- Check server logs for errors
- Verify users table exists: `SELECT COUNT(*) FROM users;`
- Check .env credentials are correct

---

### Test 1.2: User Login
**Steps**:
1. Go to http://localhost:3000
2. Enter credentials from Test 1.1
3. Click "Login"

**Expected Result**:
- [ ] Redirects to homepage
- [ ] Shows "Welcome to Look Up Book!"
- [ ] Books table displays
- [ ] JWT token stored in localStorage

**Failure Diagnosis**:
- Check browser console for errors
- Check server logs
- Verify JWT_SECRET is set in .env

---

### Test 1.3: User Logout
**Steps**:
1. While logged in, click "Logout"

**Expected Result**:
- [ ] Redirects to login page
- [ ] JWT token removed from localStorage
- [ ] Cannot see protected pages without logging in

---

## Test Suite 2: Homepage & Books Display

### Test 2.1: Books Display
**Steps**:
1. Login (from Test 1.2)
2. Observe homepage

**Expected Result**:
- [ ] Table displays with columns: Title, Like/Dislike, Genre, Year, Verified, Author ID
- [ ] At least 10 books are shown
- [ ] Book titles are actual titles (NOT author names) ✅ CRITICAL
- [ ] Genre column has values ✅ CRITICAL
- [ ] Years are present
- [ ] Verified column shows True/False

**Sample Expected Books** (may vary due to RANDOM):
- "There's No Such Thing As Free Speech"
- "The Tether"
- "The Curious Case Of Benjamin Button, Apt. 3W"

**Failure Diagnosis**:
- If titles show author names: Check /api/tableName endpoint
- If genres empty: Check database has genre values
- If no books: Check verified column is true in database

---

### Test 2.2: Refresh Page
**Steps**:
1. Refresh the page (F5 or Cmd+R)

**Expected Result**:
- [ ] Different books displayed (due to RANDOM in query)
- [ ] Still logged in
- [ ] Data loads correctly
- [ ] No errors in console

---

## Test Suite 3: Like/Dislike Functionality

### Test 3.1: Like a Book
**Steps**:
1. On homepage, click the "👍 Like" icon for any book
2. Watch the like count

**Expected Result**:
- [ ] Like count increases by 1
- [ ] Dislike count unchanged
- [ ] Update happens quickly (< 1 second)
- [ ] Count is correct in database

**Verify in Database**:
```sql
SELECT book_id, liked, COUNT(*) FROM user_book_likes GROUP BY book_id, liked;
```

---

### Test 3.2: Dislike a Book
**Steps**:
1. Click the "👎 Dislike" icon for same or different book
2. Watch the dislike count

**Expected Result**:
- [ ] Dislike count increases by 1
- [ ] Like count unchanged
- [ ] Update happens quickly
- [ ] Count is correct in database

---

### Test 3.3: Like Same Book Again
**Steps**:
1. Click like on same book again

**Expected Result**:
- [ ] Like count increases again (or behavior depends on implementation)
- [ ] System allows multiple likes per user per book (or prevents duplicates)
- [ ] Behavior is consistent

---

## Test Suite 4: Search & Filter Features

### Test 4.1: Search by Author
**Steps**:
1. Click "Search Books By Authors"
2. Enter an author name from displayed books (e.g., "Gabriel Brownstein")
3. Submit search

**Expected Result**:
- [ ] Results page shows only that author's books
- [ ] All returned books have same author
- [ ] Author information is correct
- [ ] Book titles are correct

**Failure Diagnosis**:
- Check /api/books/:authorId endpoint
- Verify authors table has full_name values
- Check books table author_id matches

---

### Test 4.2: Search by Award
**Steps**:
1. Click "Search Books or Authors by Awards"
2. Select an award from dropdown
3. Submit search

**Expected Result**:
- [ ] Returns books that won that award
- [ ] Shows award details
- [ ] Shows author information
- [ ] No errors

**Failure Diagnosis**:
- Check /api/awards endpoint
- Verify awards table has data
- Check books-awards relationship

---

## Test Suite 5: User Profile

### Test 5.1: Access Profile
**Steps**:
1. Click "Profile" or "My Profile" in navigation

**Expected Result**:
- [ ] Loads profile page
- [ ] Shows user information
- [ ] Shows books user has liked
- [ ] Shows books user has disliked

---

### Test 5.2: View Liked Books
**Steps**:
1. On profile, view "Liked Books" section

**Expected Result**:
- [ ] Shows all books the user liked
- [ ] Count matches database
- [ ] Can remove likes from profile

---

## Test Suite 6: Admin Features

### Test 6.1: Access Admin Panel
**Steps**:
1. Login as admin user (if available)
2. Click "Verification of Books Submitted"

**Expected Result**:
- [ ] Shows pending books (awaiting verification)
- [ ] Shows book details
- [ ] Approve/Reject buttons present

---

### Test 6.2: Verify a Book
**Steps**:
1. Click "Approve" on a pending book

**Expected Result**:
- [ ] Book status changes to verified
- [ ] Book removed from pending list
- [ ] Appears in normal book search

**In Database**:
```sql
SELECT id, title, verified FROM books WHERE verified = true ORDER BY id DESC LIMIT 5;
```

---

### Test 6.3: Add Book from Database
**Steps**:
1. Click "Add Book from Database to Profile"
2. Search for a book
3. Click to add to profile

**Expected Result**:
- [ ] Book appears in user profile
- [ ] No duplicate if already added
- [ ] Count updates correctly

---

## Test Suite 7: API Endpoints

### Test 7.1: Test /api/tableName
```bash
curl http://localhost:5000/api/tableName
```

**Expected Result**:
- [ ] Returns JSON array with 10 books
- [ ] Each book has all required fields
- [ ] Response time < 500ms

---

### Test 7.2: Test /api/authors
```bash
curl http://localhost:5000/api/authors
```

**Expected Result**:
- [ ] Returns all authors
- [ ] Fields: id, given_name, last_name
- [ ] No empty author IDs

---

### Test 7.3: Test /api/books/:authorId
```bash
curl http://localhost:5000/api/books/1
```

**Expected Result**:
- [ ] Returns books for that author
- [ ] Each has correct author_id
- [ ] Books have all fields

---

### Test 7.4: Test /api/awards
```bash
curl http://localhost:5000/api/awards
```

**Expected Result**:
- [ ] Returns all awards
- [ ] Has award details (name, type, institution)
- [ ] Valid data format

---

## Test Suite 8: Error Handling

### Test 8.1: Invalid Login
**Steps**:
1. Try to login with wrong password

**Expected Result**:
- [ ] Shows error message
- [ ] Doesn't crash server
- [ ] Stays on login page
- [ ] User can retry

---

### Test 8.2: Invalid Author ID
**Steps**:
1. Manually visit: http://localhost:5000/api/books/99999

**Expected Result**:
- [ ] Returns empty array (no books)
- [ ] Or returns 404 with error message
- [ ] Doesn't crash server

---

### Test 8.3: Network Error Simulation
**Steps**:
1. Stop server: Press Ctrl+C
2. Try to load any page in browser

**Expected Result**:
- [ ] Shows user-friendly error message
- [ ] Doesn't show raw error to user
- [ ] Allows user to retry or go back

---

## Test Suite 9: Performance

### Test 9.1: Page Load Time
**Measurement**:
1. Open browser dev tools (F12)
2. Go to Network tab
3. Load http://localhost:3000
4. Note total load time

**Expected Result**:
- [ ] Homepage loads in < 3 seconds
- [ ] API responses < 500ms
- [ ] No failed requests

---

### Test 9.2: Database Query Performance
**Command**:
```sql
EXPLAIN ANALYZE SELECT * FROM books WHERE verified = true ORDER BY RANDOM() LIMIT 10;
```

**Expected Result**:
- [ ] Execution time < 100ms
- [ ] Reasonable query plan
- [ ] No sequential scans on large tables

---

## Test Suite 10: Data Consistency

### Test 10.1: User Likes Persist
**Steps**:
1. Like a book on homepage
2. Logout
3. Login again
4. Check if like persists

**Expected Result**:
- [ ] Like count still shows for that book
- [ ] User's liked books still in profile

---

### Test 10.2: Multiple Users
**Steps** (requires multiple accounts):
1. Login as User A, like a book
2. Open incognito window, login as User B
3. Check like counts

**Expected Result**:
- [ ] Each user's likes are tracked separately
- [ ] User B's like count doesn't include User A's likes
- [ ] Correct isolation between users

---

## Reporting Issues

For any failures, document:

1. **What you did** (steps to reproduce)
2. **What you expected** (expected result)
3. **What happened** (actual result)
4. **When it happened** (exact time, so we can check logs)
5. **Error messages** (screenshots or copy/paste)
6. **Environment** (browser, OS, etc.)

**Where to Check for Errors**:
- **Client errors**: Browser console (F12 → Console)
- **Server errors**: Terminal where npm start is running
- **Database errors**: PostgreSQL logs (C:\Program Files\PostgreSQL\17\data\log\)

---

## Success Criteria

All tests should pass with:
- [ ] 90% of tests passed
- [ ] No critical issues (crashes, data loss)
- [ ] Performance acceptable (< 1 second response times)
- [ ] All user features working
- [ ] Secure credentials in place

---

## Test Summary Template

```
Date: [Date]
Tester: [Your Name]
Duration: [Time Spent]
Version: 1.2 (with app_user security hardening)

Test Suites Run:
- Test Suite 1 (Auth): [✅/⚠️/❌]
- Test Suite 2 (Books): [✅/⚠️/❌]
- Test Suite 3 (Like/Dislike): [✅/⚠️/❌]
- Test Suite 4 (Search): [✅/⚠️/❌]
- Test Suite 5 (Profile): [✅/⚠️/❌]
- Test Suite 6 (Admin): [✅/⚠️/❌]
- Test Suite 7 (API): [✅/⚠️/❌]
- Test Suite 8 (Errors): [✅/⚠️/❌]
- Test Suite 9 (Performance): [✅/⚠️/❌]
- Test Suite 10 (Data): [✅/⚠️/❌]

Issues Found:
1. [Issue description] - Priority: [High/Medium/Low]
2. [Issue description] - Priority: [High/Medium/Low]

Recommendations:
- [Recommendation 1]
- [Recommendation 2]

Sign-Off: [Tester Name]
```

---

## Estimated Timeline

| Test Suite | Time | Status |
|-----------|------|--------|
| 1. Authentication | 10 min | Not started |
| 2. Homepage | 10 min | Not started |
| 3. Like/Dislike | 10 min | Not started |
| 4. Search | 15 min | Not started |
| 5. Profile | 10 min | Not started |
| 6. Admin | 10 min | Not started |
| 7. API | 10 min | Not started |
| 8. Error Handling | 10 min | Not started |
| 9. Performance | 10 min | Not started |
| 10. Data Consistency | 10 min | Not started |
| **TOTAL** | **~95 min** | **Not started** |

---

## What To Do After Testing

✅ **If All Tests Pass**:
1. Update VERIFICATION_CHECKLIST_UPDATED.md with results
2. Mark project as "Ready for Production"
3. Plan deployment
4. Get final sign-off from stakeholders

❌ **If Tests Fail**:
1. Document issues in detail
2. Create GitHub issues or tickets
3. Prioritize by severity
4. Fix issues
5. Retest fixed functionality
6. Return to step ✅ after all critical issues fixed

---

## Quick Access Commands

```powershell
# Start tests
npm start

# View API directly
Start-Process http://localhost:5000/api/tableName

# View app in browser
Start-Process http://localhost:3000

# Check database
$env:PGPASSWORD = 'postgres'
psql -U app_user -h localhost -d look_up_book_db

# View server logs
Get-Content "C:\Program Files\PostgreSQL\17\data\log\*" | Tail -50

# Stop server
Ctrl+C
```

---

**Ready to test?** Start with Test 1.1 and work through in order.  
**Questions?** Check QUICK_START_UPDATED.md or POSTGRESQL_SECURITY_IMPLEMENTATION_GUIDE.md  
**Issues?** Document them and create a GitHub issue or email to the team.

---

*Last Updated*: January 3, 2025  
*Version*: 1.0  
*Purpose*: Comprehensive integration testing for updated application
