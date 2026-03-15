import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from './api';

const AdminVerification = () => {
  const [adminName, setAdminName] = useState('');
  const [unverifiedBooks, setUnverifiedBooks] = useState([]);
  const navigate = useNavigate();

  const fetchUnverifiedBooks = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/unverified-books'), {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setUnverifiedBooks(data);
    } catch (error) {
      console.error('Error fetching unverified books:', error);
      alert(error.message || 'Error fetching unverified books.');
    }
  };

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminUsername = localStorage.getItem('adminUsername');

    if (!isAdmin) {
      alert('You do not have permission to access this page.');
      navigate('/login');
      return;
    }

    setAdminName(adminUsername || 'Admin');
    fetchUnverifiedBooks();
  }, [navigate]);

  const handleVerification = async (bookId, verified) => {
    try {
      const response = await fetch(buildApiUrl(`/api/books/${bookId}/verification`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ verified }),
      });

      if (!response.ok) {
        throw new Error('Failed to update book verification status.');
      }

      fetchUnverifiedBooks();
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert(error.message || 'Error updating verification status.');
    }
  };

  return (
    <div>
      <h1>Welcome, {adminName}!</h1>
      <h2>Books Awaiting Verification</h2>
      {unverifiedBooks.length ? (
        <ul>
          {unverifiedBooks.map((book) => (
            <li key={book.bookId}>
              {book.titleOfWinningBook} by {book.fullName}
              <button onClick={() => handleVerification(book.bookId, true)}>Verify</button>
              <button onClick={() => handleVerification(book.bookId, false)}>Reject</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No books awaiting verification.</p>
      )}
      <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
    </div>
  );
};

export default AdminVerification;
