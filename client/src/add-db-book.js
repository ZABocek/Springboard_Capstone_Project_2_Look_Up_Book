import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// AddDbBook component that allows a user to add a book from the database to their profile
function AddDbBook({ userId }) {
  // State to store the list of books
  const [books, setBooks] = useState([]);
  // State to store the selected book ID
  const [selectedBookId, setSelectedBookId] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  // useEffect to fetch the list of books when the component mounts
  useEffect(() => {
    fetch(`http://localhost:5000/api/books-for-profile`)
      .then(response => response.json())
      .then(data => setBooks(data)) // Set the fetched books into the state
      .catch(error => console.error("Error fetching books:", error)); // Log any errors
  }, []);

  // Handle the form submission to add a book to the user's profile
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    // Send a POST request to add the selected book to the profile
    const response = await fetch('http://localhost:5000/api/user/add-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, bookId: selectedBookId }), // Send the userId and selectedBookId in the request body
    });

    // Handle the response
    if (response.ok) {
      alert('Book added to profile successfully!'); // Show success message
    } else {
      alert('Failed to add book to profile.'); // Show error message
    }
  };

  return (
    <div>
      <h2>Welcome, User!</h2>
      <form onSubmit={handleSubmit}>
        <label>Add a book from the database to your profile:</label>
        <select value={selectedBookId} onChange={e => setSelectedBookId(e.target.value)}>
          {/* Populate the dropdown with the list of books */}
          {books.map(book => (
            <option key={book.book_id} value={book.book_id}>
              {book.title_of_winning_book} by {book.full_name}
            </option>
          ))}
        </select>
        <button type="submit">Add Book to Profile</button>
      </form>
      {/* Navigation buttons */}
      <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
      <button onClick={() => navigate('/Profile')}>Proceed to Profile</button>
    </div>
  );
}

export default AddDbBook;
