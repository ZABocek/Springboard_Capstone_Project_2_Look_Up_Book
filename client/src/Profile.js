import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
function Profile({ userId }) {
  const [username, setUsername] = useState('');
  const [readingPreference, setReadingPreference] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [preferredBooks, setPreferredBooks] = useState([]);
  const navigate = useNavigate();

  // Fetch user preferences
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
  
    fetchPreferences();
  }, [userId]);
  

  // Update user preferences
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

  useEffect(() => {
    const fetchPreferredBooks = async () => {
      const response = await fetch(`http://localhost:5000/api/user/${userId}/preferred-books`);
      if (response.ok) {
        const data = await response.json();
        setPreferredBooks(data);
      }
    };

    fetchPreferredBooks();
  }, [userId]); // Add this line to the dependencies array if it's not already there


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
