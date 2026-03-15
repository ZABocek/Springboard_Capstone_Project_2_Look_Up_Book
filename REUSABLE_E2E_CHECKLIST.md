# Reusable E2E Checklist (Look Up Book)

## Quick One-Command Option
- [ ] Run everything: `npm run verify:all`
- [ ] Confirm final output says `All checks passed.`
- [ ] Optional verbose mode (shows full server test output): `npm run verify:all:verbose`

## 1. Start App
- [ ] `npm --prefix server install`
- [ ] `npm --prefix client install`
- [ ] Start backend: `npm --prefix server start`
- [ ] Start frontend: `npm --prefix client start`
- [ ] Confirm URLs load:
  - [ ] `http://localhost:5000`
  - [ ] `http://localhost:3000`

## 2. Automated Test Pass
- [ ] Frontend tests: `npm --prefix client test -- --watchAll=false`
- [ ] API smoke suite: `python test_api_endpoints.py`
- [ ] Server scripts: run all `server/test-*.js`

## 3. Critical User Journey (Manual)
- [ ] Register a new user
- [ ] Login with that user
- [ ] Homepage loads 10 books
- [ ] Like or dislike a book (count updates)
- [ ] Open Search by Author (results load)
- [ ] Open Search by Awards (results load)
- [ ] Add a book from database to profile
- [ ] Open profile and verify added book appears
- [ ] Update reading preference + genre
- [ ] Remove the book from profile
- [ ] Logout and verify protected routes redirect to `/login`

## 4. Admin (Optional)
- [ ] Set `SMOKE_ADMIN_USERNAME` and `SMOKE_ADMIN_PASSWORD`
- [ ] Re-run `python test_api_endpoints.py` and confirm admin login test passes

## 5. Release Readiness
- [ ] Frontend build passes: `npm --prefix client run build`
- [ ] No failed tests remain
- [ ] No blocking runtime errors in browser console/server logs
