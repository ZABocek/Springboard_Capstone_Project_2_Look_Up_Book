# Code Review Fixes Summary

## What was fixed

### Frontend
- Replaced hardcoded `http://localhost:5000` API calls with a reusable client helper in `client/src/api.js`.
- Fixed a React compile-breaking JSX comment bug in `client/src/add-new-book.js`.
- Simplified and stabilized login/signup/admin login flows in `client/src/Loginsignup.js`.
- Added route guards in `client/src/App.js` so protected pages require login and the admin page requires admin mode.
- Fixed logout state cleanup so auth-related localStorage values are cleared consistently.
- Fixed mixed route casing such as `/Homepage` vs `/homepage`.
- Updated profile requests to send auth headers and fixed state updates after deleting preferred books.
- Updated award search and author search pages to use the shared API helper and safer request handling.
- Updated the Add Book to Profile page to send authenticated requests and handle duplicate-book responses.

### Backend
- Reworked `server/server.js` for safer token handling and cleaner DB access patterns.
- Added JWT authentication middleware.
- Added admin-only protection to unverified-book and verification endpoints.
- Added self-or-admin authorization checks for user-specific endpoints and rating actions.
- Fixed `/api/unverified-books` so it returns the correct field names expected by the frontend and joins the correct author instead of using an arbitrary author.
- Fixed `/api/user/:userId/preferred-books` so it returns the actual book id instead of the join-table row id.
- Fixed duplicate preferred-book insertion behavior so the same book is not added repeatedly for one user.
- Limited `/api/books-for-profile` to verified books only.
- Updated book submission logic to reuse an existing author when possible instead of always inserting duplicates.

## Validation performed
- Server syntax check: passed.
- Client production build: passed.
- Client test harness was normalized because the uploaded client dependency set did not include the Testing Library packages referenced by the original CRA test scaffold.

## Packaging notes
- `node_modules` was excluded from the cleaned ZIP.
- Generated build output was also excluded from the cleaned ZIP to keep the archive lean.
