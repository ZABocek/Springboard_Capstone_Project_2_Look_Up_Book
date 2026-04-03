import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Lazy-loaded route components – each page only downloads its JS bundle when
// first visited, so the initial page load is significantly smaller and
// switching to a new page shows a brief spinner while its chunk downloads.
// ---------------------------------------------------------------------------
const LoginSignup       = lazy(() => import('./Loginsignup'));
const Homepage          = lazy(() => import('./Homepage'));
const AddDbBook         = lazy(() => import('./add-db-book'));
const AddNewBook        = lazy(() => import('./add-new-book'));
const AdminVerification = lazy(() => import('./admin-verification'));
const SearchBooks       = lazy(() => import('./search-books'));
const Profile           = lazy(() => import('./Profile'));
const SearchAwards      = lazy(() => import('./search-awards'));

// Minimal loading indicator displayed while a chunk is being fetched
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>Loading…</p>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate replace to="/homepage" />;
  }

  return children;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem('token')));
    };

    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route
          path="/"
          element={<Navigate replace to={isAuthenticated ? '/homepage' : '/login'} />}
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate replace to="/homepage" />
            ) : (
              <LoginSignup setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route
          path="/homepage"
          element={
            <ProtectedRoute>
              <Homepage setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-db-book"
          element={
            <ProtectedRoute>
              <AddDbBook userId={localStorage.getItem('userId')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-new-book"
          element={
            <ProtectedRoute>
              <AddNewBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-verification"
          element={
            <ProtectedRoute adminOnly>
              <AdminVerification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search-books"
          element={
            <ProtectedRoute>
              <SearchBooks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile userId={localStorage.getItem('userId')} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search-awards"
          element={
            <ProtectedRoute>
              <SearchAwards />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
