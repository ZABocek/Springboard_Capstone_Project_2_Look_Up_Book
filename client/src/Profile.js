import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from './api';
import './Profile.css';

function Profile({ userId }) {
  const [username, setUsername] = useState('');
  const [readingPreference, setReadingPreference] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [preferredBooks, setPreferredBooks] = useState([]);
  const navigate = useNavigate();

  const cleanTitle = (title) => {
    if (!title) return 'Career Award';

    let cleaned = title.replace(/^["']|["']$/g, '');
    const parts = cleaned.split(/\s*\/\s*\|\s*|\s*\/\s*\$c:\s*/);

    if (parts.length > 0) cleaned = parts[0];

    cleaned = cleaned.replace(/\s*\|\s*\$c:.*/g, '');
    cleaned = cleaned.replace(/\s*\|\s*$/g, '');
    cleaned = cleaned.replace(/\s*\/\s*$/g, '');
    cleaned = cleaned.replace(/\s+by\s+[A-Z][a-z\s]+\.?\s*$/i, '');
    return cleaned.replace(/\s+/g, ' ').trim() || 'Career Award';
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchPreferences = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/user/preference/${userId}`), {
          headers: {
            ...getAuthHeaders(),
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load user preferences.');
        }

        const data = await response.json();
        setUsername(data.username || 'User');
        setReadingPreference(data.reading_preference || '');
        setFavoriteGenre(data.favorite_genre || '');
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    fetchPreferences();
  }, [navigate, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchPreferredBooks = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/user/${userId}/preferred-books`), {
          headers: {
            ...getAuthHeaders(),
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load preferred books.');
        }

        const data = await response.json();
        setPreferredBooks(data);
      } catch (error) {
        console.error("Error fetching user's preferred books:", error);
      }
    };

    fetchPreferredBooks();
  }, [userId]);

  const updatePreferences = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/user/preference/update'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ userId, readingPreference, favoriteGenre }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences.');
      }

      alert('Preferences updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update preferences.');
    }
  };

  const deletePreferredBook = async (book) => {
    try {
      const response = await fetch(buildApiUrl('/api/user/remove-book'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId,
          entryType: book.preference_type,
          entryId: book.preference_id,
          bookId: book.book_id,
          authorAwardId: book.author_award_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete book from profile.');
      }

      setPreferredBooks((currentBooks) =>
        currentBooks.filter(
          (currentBook) =>
            !(currentBook.preference_type === book.preference_type && currentBook.preference_id === book.preference_id)
        )
      );
    } catch (error) {
      console.error('Error deleting book from profile:', error);
      alert(error.message || 'Failed to delete book from profile.');
    }
  };

  return (
    <div>
      <h2>Welcome, {username}!</h2>
      <div>
        <label htmlFor="reading-preference-select">Do you prefer prose or poetry?</label>
        <select
          id="reading-preference-select"
          value={readingPreference}
          onChange={(e) => setReadingPreference(e.target.value)}
        >
          <option value="">Select one</option>
          <option value="prose">Prose</option>
          <option value="poetry">Poetry</option>
        </select>
      </div>
      <div>
        <label htmlFor="favorite-genre-select">What's your favorite book genre?</label>
        <select
          id="favorite-genre-select"
          value={favoriteGenre}
          onChange={(e) => setFavoriteGenre(e.target.value)}
        >
          <option value="">Select one</option>
          <option value="fantasy">Fantasy</option>
          <option value="sci-fi">Sci-Fi</option>
          <option value="nonfiction">Nonfiction</option>
          <option value="historical">Historical</option>
          <option value="romance">Romance</option>
          <option value="mystery">Mystery</option>
          <option value="adventure">Adventure</option>
        </select>
      </div>
      <button onClick={updatePreferences}>Update Preferences</button>
      <div>
        <h3>Your Preferred Books</h3>
        <div className="profile-table-wrapper">
          <table className="profile-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Prize Name</th>
                <th>Prize Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {preferredBooks.map((book) => (
                <tr key={`${book.preference_type || 'book'}-${book.preference_id || book.book_id}`}>
                  <td>{cleanTitle(book.title_of_winning_book)}</td>
                  <td>{book.full_name}</td>
                  <td>{book.prize_name}</td>
                  <td>{book.prize_year}</td>
                  <td>
                    <button onClick={() => deletePreferredBook(book)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
    </div>
  );
}

export default Profile;
