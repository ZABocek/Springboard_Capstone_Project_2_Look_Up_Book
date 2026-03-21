import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from './api';

const AdminVerification = () => {
  const [adminName, setAdminName] = useState('');
  const [unverifiedBooks, setUnverifiedBooks] = useState([]);
  const [verifiedBooks, setVerifiedBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState('pending');
  const navigate = useNavigate();

  const fetchAdminBooks = async () => {
    try {
      const [pendingResponse, verifiedResponse] = await Promise.all([
        fetch(buildApiUrl('/api/unverified-books'), {
          headers: {
            ...getAuthHeaders(),
          },
        }),
        fetch(buildApiUrl('/api/verified-submitted-books'), {
          headers: {
            ...getAuthHeaders(),
          },
        }),
      ]);

      if (!pendingResponse.ok) {
        throw new Error(`Pending queue error: ${pendingResponse.statusText}`);
      }

      if (!verifiedResponse.ok) {
        throw new Error(`Verified queue error: ${verifiedResponse.statusText}`);
      }

      const [pendingData, verifiedData] = await Promise.all([
        pendingResponse.json(),
        verifiedResponse.json(),
      ]);

      setUnverifiedBooks(pendingData);
      setVerifiedBooks(verifiedData);
    } catch (error) {
      console.error('Error fetching admin books:', error);
      alert(error.message || 'Error fetching books for admin review.');
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
    fetchAdminBooks();
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

      fetchAdminBooks();
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert(error.message || 'Error updating verification status.');
    }
  };

  const handleDelete = async (bookId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/admin/books/${bookId}`), {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove book.');
      }

      fetchAdminBooks();
    } catch (error) {
      console.error('Error removing book:', error);
      alert(error.message || 'Error removing book.');
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredVerifiedBooks = normalizedQuery
    ? verifiedBooks.filter((book) =>
      [book.titleOfWinningBook, book.fullName, book.prizeName, String(book.prizeYear || '')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    )
    : verifiedBooks;

  return (
    <div>
      <h1>Welcome, {adminName}!</h1>
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => setActiveView('pending')}>Pending Submissions</button>
        <button type="button" onClick={() => setActiveView('verified')} style={{ marginLeft: '0.5rem' }}>
          Verified Submissions
        </button>
      </div>

      {activeView === 'pending' ? (
        <>
          <h2>Books Awaiting Verification</h2>
          {unverifiedBooks.length ? (
            <ul>
              {unverifiedBooks.map((book) => (
                <li key={book.bookId}>
                  {book.titleOfWinningBook} by {book.fullName}
                  <button type="button" onClick={() => handleVerification(book.bookId, true)} style={{ marginLeft: '0.5rem' }}>
                    Verify
                  </button>
                  <button type="button" onClick={() => handleVerification(book.bookId, false)} style={{ marginLeft: '0.5rem' }}>
                    Reject and Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No books awaiting verification.</p>
          )}
        </>
      ) : (
        <>
          <h2>Verified Submitted Books</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, award, or year"
            style={{ marginBottom: '1rem', width: '100%', maxWidth: '460px' }}
          />

          {filteredVerifiedBooks.length ? (
            <ul>
              {filteredVerifiedBooks.map((book) => (
                <li key={book.bookId}>
                  {book.titleOfWinningBook} by {book.fullName}
                  {book.prizeName ? ` | Award: ${book.prizeName}` : ''}
                  {book.prizeYear ? ` | Year: ${book.prizeYear}` : ''}
                  <button type="button" onClick={() => handleDelete(book.bookId)} style={{ marginLeft: '0.5rem' }}>
                    Remove from Database
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No verified submitted books match this search.</p>
          )}
        </>
      )}

      <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
    </div>
  );
};

export default AdminVerification;
