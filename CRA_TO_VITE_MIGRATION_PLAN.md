# CRA to Vite Migration Plan (Client)

## Goal
Migrate `client/` from Create React App (`react-scripts`) to Vite to reduce legacy dependency risk and remove remaining frontend vulnerabilities tied to the CRA toolchain.

## Current Baseline
- React app uses React 18 + React Router 6.
- API base URL is centralized in `client/src/api.js` via `REACT_APP_API_BASE_URL`.
- Frontend tests currently run through CRA/Jest (`react-scripts test`).
- Remaining vulnerabilities are primarily transitive through `react-scripts` and old build tooling.

## Migration Strategy
Use an incremental migration with a short rollback path:
1. Add Vite config and scripts while preserving existing source code.
2. Switch environment variables from CRA naming to Vite naming in a backward-compatible way.
3. Replace CRA entrypoint/bootstrap with Vite-compatible bootstrap.
4. Replace test runner (Jest in CRA) with Vitest + Testing Library.
5. Remove `react-scripts` after parity checks pass.

## Detailed Steps

### Phase 1: Scaffold Vite in Place
1. Install dependencies in `client/`:
   - `vite`
   - `@vitejs/plugin-react`
   - `vitest`
   - `jsdom`
2. Add files:
   - `client/vite.config.js`
   - `client/index.html` (Vite root HTML; move from `public/index.html` semantics)
3. Update scripts in `client/package.json`:
   - `dev`: `vite`
   - `build`: `vite build`
   - `preview`: `vite preview`
   - `test`: `vitest run`

### Phase 2: Environment and API Compatibility
1. Update `client/src/api.js` to support both env variable names during migration:
   - Preferred: `import.meta.env.VITE_API_BASE_URL`
   - Fallback during transition: `process.env.REACT_APP_API_BASE_URL`
2. Add `.env.example` in `client/`:
   - `VITE_API_BASE_URL=http://localhost:5000`

### Phase 3: Entry and Asset Wiring
1. Ensure React bootstrap in `client/src/index.js` is Vite-compatible.
2. Confirm static assets load correctly under Vite dev server and build output.
3. Validate React Router deep links in Vite dev mode.

### Phase 4: Test Migration
1. Add `client/src/setupTests.js` compatibility for Vitest if needed.
2. Update existing tests (`App.test.js`, `Profile.test.js`, `add-db-book.test.js`) for Vitest globals if required.
3. Ensure all client tests pass under `vitest`.

### Phase 5: Remove CRA
1. Remove `react-scripts` from dependencies.
2. Remove obsolete CRA-only config/docs references.
3. Re-run `npm audit` in `client/` and record remaining findings (if any).

## Acceptance Criteria
- `npm --prefix client run dev` serves all SPA routes.
- `npm --prefix client run build` succeeds.
- Existing frontend tests pass under Vitest.
- API calls from all pages still resolve correctly.
- Client vulnerability count is materially reduced from CRA baseline.

## Verification Checklist (Post-Migration)
- Login/signup flow works.
- Homepage list loads from database.
- Search Books page loads database-backed records.
- Search Awards page loads awards and award-specific results.
- Profile page loads preferences and preferred books.
- Add from DB flow can add and remove profile items.
- Add New Book page loads awards list.
- Admin Verification page works with admin credentials.

## Rollback Plan
If parity fails:
1. Revert `client/package.json`, lockfile, and Vite config files.
2. Restore `react-scripts` scripts.
3. Re-run `npm --prefix client install` and `npm --prefix client test`.

## Estimated Effort
- Baseline migration and scripts: 1 session.
- Test runner migration and test fixes: 1 session.
- Final parity and cleanup: 1 session.
