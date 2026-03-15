import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import LoginSignup from './Loginsignup';
import Homepage from './Homepage';
import AddDbBook from './add-db-book';
import AddNewBook from './add-new-book';
import AdminVerification from './admin-verification';
import SearchBooks from './search-books';
import Profile from './Profile';
import SearchAwards from './search-awards';

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
    </Router>
  );
}

export default App;
