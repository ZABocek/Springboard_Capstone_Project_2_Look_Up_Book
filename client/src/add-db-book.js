import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
function AddDbBook({ userId }) {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    fetch(`http://localhost:5000/api/books-for-profile`)
      .then(response => response.json())
      .then(data => setBooks(data))
      .catch(error => console.error("Error fetching books:", error));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Use the new endpoint to handle adding a book to the profile
    const response = await fetch('http://localhost:5000/api/user/add-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, bookId: selectedBookId }),
    });
  
    if (response.ok) {
      alert('Book added to profile successfully!');
    } else {
      alert('Failed to add book to profile.');
    }
  };
  
  return (
    <div>
      <h2>Welcome, User!</h2>
      <form onSubmit={handleSubmit}>
        <label>Add a book from the database to your profile:</label>
        <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
          {books.map(book => (
            <option key={book.book_id} value={book.book_id}>{book.title_of_winning_book} by {book.full_name}</option>
          ))}
        </select>
        <button type="submit">Add Book to Profile</button>
      </form>
      <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
      <button onClick={() => navigate('/Profile')}>Proceed to Profile</button>
    </div>
  );
}

export default AddDbBook;
