# API Endpoint Testing Guide

**Status:** ✅ Ready to Test  
**Last Updated:** 2024  
**Test Environment:** Development (localhost:5000)

---

## Quick Start

### 1. Start the Server

```bash
cd server
npm install  # First time only
npm start
```

Expected output:
```
Server is running on port 5000
```

### 2. Run Automated Tests

```bash
python test_api_endpoints.py
```

### 3. Manual Testing (Using cURL or Postman)

See sections below for individual endpoint testing.

---

## API Endpoints Summary

| # | Method | Endpoint | Auth Required | Purpose |
|---|--------|----------|---------------|---------|
| 1 | POST | `/signup` | ❌ No | Create new user account |
| 2 | POST | `/login` | ❌ No | Login existing user |
| 3 | POST | `/admin/login` | ❌ No | Admin login |
| 4 | GET | `/api/is-admin/:userId` | ❌ No | Check if user is admin |
| 5 | GET | `/api/tableName` | ❌ No | Get 10 random books |
| 6 | GET | `/api/authors` | ❌ No | Get all authors |
| 7 | GET | `/api/books/:authorId` | ❌ No | Get books by author |
| 8 | GET | `/api/awards` | ❌ No | Get all awards |
| 9 | GET | `/api/awards/:awardId` | ❌ No | Get books by award |
| 10 | POST | `/api/like` | ❌ No | Like/dislike book |
| 11 | GET | `/api/user/preference/:userId` | ❌ No | Get user preferences |
| 12 | POST | `/api/user/preference/update` | ❌ No | Update user preferences |
| 13 | GET | `/api/books-for-profile` | ❌ No | Get books for profile |
| 14 | GET | `/api/user/:userId/preferred-books` | ❌ No | Get user's preferred books |
| 15 | POST | `/api/user/add-book` | ❌ No | Add book to profile |
| 16 | POST | `/api/user/remove-book` | ❌ No | Remove book from profile |
| 17 | GET | `/api/unverified-books` | ❌ No | Get unverified books (admin) |
| 18 | PATCH | `/api/books/:bookId/verification` | ❌ No | Update book verification |
| 19 | POST | `/api/submit-book` | ❌ No | Submit new book for verification |

---

## Detailed Endpoint Tests

### Authentication Endpoints

#### 1. User Signup

**Endpoint:** `POST /signup`

**Request:**
```bash
curl -X POST http://localhost:5000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

**Test Cases:**
- ✅ Valid signup with all fields
- ❌ Missing username
- ❌ Missing email
- ❌ Missing password
- ❌ Invalid email format
- ❌ Duplicate username

---

#### 2. User Login

**Endpoint:** `POST /login`

**Request:**
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

**Test Cases:**
- ✅ Valid login
- ❌ Wrong password
- ❌ User not found
- ❌ Missing username
- ❌ Missing password

---

#### 3. Admin Login

**Endpoint:** `POST /admin/login`

**Request:**
```bash
curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Drewadoo",
    "password": "admin_password"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "adminId": 1
}
```

**Note:** Default admin credentials are seeded in database. Change before production!

---

### Content Endpoints

#### 4. Get Random Books

**Endpoint:** `GET /api/tableName`

**Request:**
```bash
curl http://localhost:5000/api/tableName
```

**Expected Response (200):**
```json
[
  {
    "book_id": 1,
    "title": "The Great Gatsby",
    "prize_genre": "Fiction",
    "prize_year": 2020,
    "verified": true,
    "like_count": 5,
    "dislike_count": 1
  },
  ...
]
```

**Test Cases:**
- ✅ Returns 10 books
- ✅ All books have required fields
- ✅ like_count and dislike_count are numbers

---

#### 5. Get All Authors

**Endpoint:** `GET /api/authors`

**Request:**
```bash
curl http://localhost:5000/api/authors
```

**Expected Response (200):**
```json
[
  {
    "author_id": 1,
    "last_name": "Fitzgerald",
    "given_name": "F. Scott"
  },
  ...
]
```

---

#### 6. Get Books by Author

**Endpoint:** `GET /api/books/:authorId`

**Request:**
```bash
curl http://localhost:5000/api/books/1
```

**Expected Response (200):**
```json
[
  {
    "book_id": 1,
    "title": "The Great Gatsby",
    "prize_genre": "Fiction",
    "prize_year": 2020,
    "verified": true,
    "author_id": 1
  },
  ...
]
```

**Test Cases:**
- ✅ Returns only books by specified author
- ✅ Returns empty array for non-existent author
- ✅ All books have author_id matching request

---

#### 7. Get All Awards

**Endpoint:** `GET /api/awards`

**Request:**
```bash
curl http://localhost:5000/api/awards
```

**Expected Response (200):**
```json
[
  {
    "award_id": 1,
    "prize_name": "Pulitzer Prize"
  },
  ...
]
```

---

#### 8. Get Books by Award

**Endpoint:** `GET /api/awards/:awardId`

**Request:**
```bash
curl http://localhost:5000/api/awards/1
```

**Expected Response (200):**
```json
[
  {
    "id": 1,
    "title": "The Grapes of Wrath",
    "author_id": 5,
    "prize_year": 1940,
    ...
  },
  ...
]
```

---

### User Interaction Endpoints

#### 9. Like/Dislike Book

**Endpoint:** `POST /api/like`

**Request:**
```bash
curl -X POST http://localhost:5000/api/like \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookId": 42,
    "liked": true
  }'
```

**Expected Response (200):**
```json
{
  "message": "Success",
  "likes": 15,
  "dislikes": 3
}
```

**Test Cases:**
- ✅ Like a book (liked: true)
- ✅ Dislike a book (liked: false)
- ✅ Change like to dislike (update)
- ✅ Like counts update correctly

---

#### 10. Get User Preferences

**Endpoint:** `GET /api/user/preference/:userId`

**Request:**
```bash
curl http://localhost:5000/api/user/preference/1
```

**Expected Response (200):**
```json
{
  "username": "testuser",
  "reading_preference": "Fiction",
  "favorite_genre": "Mystery"
}
```

---

#### 11. Update User Preferences

**Endpoint:** `POST /api/user/preference/update`

**Request:**
```bash
curl -X POST http://localhost:5000/api/user/preference/update \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "readingPreference": "Non-Fiction",
    "favoriteGenre": "Biography"
  }'
```

**Expected Response (200):**
```json
{
  "message": "User preferences updated successfully"
}
```

---

#### 12. Get Books for Profile

**Endpoint:** `GET /api/books-for-profile`

**Request:**
```bash
curl http://localhost:5000/api/books-for-profile
```

**Expected Response (200):**
```json
[
  {
    "book_id": 1,
    "title": "The Great Gatsby",
    "full_name": "F. Scott Fitzgerald"
  },
  ...
]
```

---

#### 13. Get User's Preferred Books

**Endpoint:** `GET /api/user/:userId/preferred-books`

**Request:**
```bash
curl http://localhost:5000/api/user/1/preferred-books
```

**Expected Response (200):**
```json
[
  {
    "book_id": 1,
    "title_of_winning_book": "The Great Gatsby",
    "full_name": "F. Scott Fitzgerald",
    "prize_name": "Pulitzer Prize",
    "prize_year": 2020
  },
  ...
]
```

---

#### 14. Add Book to User's Profile

**Endpoint:** `POST /api/user/add-book`

**Request:**
```bash
curl -X POST http://localhost:5000/api/user/add-book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookId": 42
  }'
```

**Expected Response (200):**
```json
{
  "message": "Book added to user's profile successfully"
}
```

---

#### 15. Remove Book from User's Profile

**Endpoint:** `POST /api/user/remove-book`

**Request:**
```bash
curl -X POST http://localhost:5000/api/user/remove-book \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "bookId": 42
  }'
```

**Expected Response (200):**
```json
{
  "message": "Book removed from profile successfully"
}
```

---

### Admin Endpoints

#### 16. Get Unverified Books

**Endpoint:** `GET /api/unverified-books`

**Request:**
```bash
curl http://localhost:5000/api/unverified-books \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Response (200):**
```json
[
  {
    "book_id": 1,
    "titleOfWinningBook": "New Book",
    "fullName": "Unknown Author"
  },
  ...
]
```

---

#### 17. Update Book Verification Status

**Endpoint:** `PATCH /api/books/:bookId/verification`

**Request:**
```bash
curl -X PATCH http://localhost:5000/api/books/1/verification \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**Expected Response (200):**
```json
{
  "message": "Book verification status updated successfully"
}
```

---

#### 18. Submit New Book

**Endpoint:** `POST /api/submit-book`

**Request:**
```bash
curl -X POST http://localhost:5000/api/submit-book \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "New Author",
    "givenName": "New",
    "lastName": "Author",
    "titleOfWinningBook": "Amazing Book",
    "prizeYear": 2024,
    "prizeGenre": "Fiction",
    "awardId": 1
  }'
```

**Expected Response (200):**
```json
{
  "id": 100,
  "book_id": 100,
  "title": "Amazing Book",
  "author_id": 50,
  ...
}
```

---

## Automated Test Suite

### Running Tests

```bash
# From project root directory
python test_api_endpoints.py
```

### Test File Location

`test_api_endpoints.py` in project root

### Test Coverage

The automated test suite includes 12 comprehensive tests:

1. ✅ Server Connection Test
2. ✅ Get 10 Random Books
3. ✅ Get All Authors
4. ✅ Get Books by Author ID
5. ✅ Get All Awards
6. ✅ Get Books by Award ID
7. ✅ Get Books for Profile
8. ✅ User Signup
9. ✅ User Login
10. ✅ Admin Login
11. ✅ Like/Dislike Books
12. ✅ User Preferences

### Expected Test Output

```
Running API Endpoint Tests...

✅ Test 1/12: Server Connection - PASSED
✅ Test 2/12: Get Random Books - PASSED
✅ Test 3/12: Get Authors - PASSED
...

Tests Completed: 12/12 passed, 0 failed
Coverage: 100%
```

---

## Error Codes Reference

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database or server error |

---

## Common Issues & Solutions

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Kill process on port 5000
lsof -i :5000  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process  # Windows

# Or change port in server.js:
app.listen(3001, () => console.log("Server running on 3001"));
```

### Issue: "ECONNREFUSED" - Can't connect to server

**Solution:**
1. Ensure server is running: `npm start`
2. Verify port is 5000
3. Check firewall settings
4. Try: `curl http://localhost:5000/api/tableName`

### Issue: "Database connection failed"

**Solution:**
1. Check `.env` file has correct credentials
2. Ensure PostgreSQL is running
3. Verify database `look_up_book_db` exists
4. Check credentials: `psql -U postgres -d look_up_book_db`

### Issue: "CORS error in browser"

**Solution:**
The server has CORS enabled. If still getting errors:
```javascript
// In server.js, update:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## Performance Testing

### Load Testing

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils
# Windows: Download from Apache Lounge

# Test endpoint with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/api/tableName
```

### Expected Performance

- Random books: < 100ms
- Authors list: < 100ms
- Books by author: < 200ms
- Like/dislike: < 150ms

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] All 19 endpoints respond
- [ ] Signup creates new user with hashed password
- [ ] Login returns valid JWT token
- [ ] Admin login requires admin credentials
- [ ] Random books returns exactly 10 books
- [ ] Books by author filters correctly
- [ ] Awards list shows all awards
- [ ] Like/dislike updates counts correctly
- [ ] User preferences can be updated
- [ ] Add/remove books works correctly
- [ ] Unverified books endpoint works
- [ ] Book verification updates work
- [ ] New book submission works
- [ ] No SQL injection vulnerabilities
- [ ] No hardcoded secrets in responses
- [ ] All error codes are correct
- [ ] Performance is acceptable
- [ ] CORS headers are present
- [ ] Database transactions are atomic

---

## Next Steps

1. **Start Server:** `cd server && npm start`
2. **Run Tests:** `python test_api_endpoints.py`
3. **Review Results:** Check test output and browser dev tools
4. **Fix Issues:** See error codes and common issues above
5. **Security Check:** Review [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)
6. **Production Deploy:** Follow [SETUP_QUICK_START.md](SETUP_QUICK_START.md)

---

**Last Updated:** 2024  
**Status:** ✅ Ready to Test
