import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Profile component to display and update user preferences and their preferred books
function Profile({ userId }) {
  // State variables to store user information and preferences
  const [username, setUsername] = useState('');
  const [readingPreference, setReadingPreference] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [preferredBooks, setPreferredBooks] = useState([]);
  const navigate = useNavigate(); // Hook to programmatically navigate to different routes

  // useEffect hook to fetch user preferences when the component mounts or when userId changes
  useEffect(() => {
    const fetchPreferences = async () => {
      const response = await fetch(`http://localhost:5000/api/user/preference/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || 'User');
        setReadingPreference(data.reading_preference || '');
        setFavoriteGenre(data.favorite_genre || '');
      }
    };
  
    fetchPreferences(); // Call the function to fetch user preferences
  }, [userId]); // Dependency array to re-run the effect when userId changes

  // Function to update user preferences
  const updatePreferences = async () => {
    const response = await fetch('http://localhost:5000/api/user/preference/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, readingPreference, favoriteGenre }),
    });

    if (response.ok) {
      alert('Preferences updated successfully!');
    }
  };

  // useEffect hook to fetch user's preferred books when the component mounts or when userId changes
  useEffect(() => {
    const fetchPreferredBooks = async () => {
      const response = await fetch(`http://localhost:5000/api/user/${userId}/preferred-books`);
      if (response.ok) {
        const data = await response.json();
        setPreferredBooks(data);
      }
    };

    fetchPreferredBooks(); // Call the function to fetch user's preferred books
  }, [userId]); // Dependency array to re-run the effect when userId changes

  // Function to delete a preferred book from the user's profile
  const deletePreferredBook = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/user/remove-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, bookId }),
      });
  
      if (response.ok) {
        // Remove the book from the preferredBooks state to update the UI
        setPreferredBooks(preferredBooks.filter(book => book.book_id !== bookId));
      } else {
        alert('Failed to delete book from profile.');
      }
    } catch (error) {
      console.error("Error deleting book from profile:", error);
    }
  };

  return (
    <div>
      <h2>Welcome, {username}!</h2>
      <div>
        <label>Do you prefer prose or poetry?</label>
        <select value={readingPreference} onChange={e => setReadingPreference(e.target.value)}>
          <option value="prose">Prose</option>
          <option value="poetry">Poetry</option>
        </select>
      </div>
      <div>
        <label>What's your favorite book genre?</label>
        <select value={favoriteGenre} onChange={e => setFavoriteGenre(e.target.value)}>
          {/* Populate with common book genres */}
          <option value="fantasy">Fantasy</option>
          <option value="sci-fi">Sci-Fi</option>
          <option value="nonfiction">Nonfiction</option>
          <option value="historical">Historical</option>
          <option value="romance">Romance</option>
          <option value="mystery">Mystery</option>
          <option value="adventure">Adventure</option>
          {/* Add more options as needed */}
        </select>
      </div>
      <button onClick={updatePreferences}>Update Preferences</button>
      <div>
      <h3>Your Preferred Books</h3>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Prize Name</th>
            <th>Prize Year</th>
          </tr>
        </thead>
        <tbody>
          {preferredBooks.map((book, index) => (
            <tr key={index}>
              <td>{book.title_of_winning_book}</td>
              <td>{book.full_name}</td>
              <td>{book.prize_name}</td>
              <td>{book.prize_year}</td>
              <td>
                <button onClick={() => deletePreferredBook(book.book_id)}>Delete</button>
                </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
    </div>
  );
}

export default Profile;
