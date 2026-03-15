import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Homepage.css';
import likeIconURL from './like_9790408.png';
import dislikeIconURL from './dislike_6933384.png';
import { buildApiUrl, getAuthHeaders } from './api';

const Homepage = ({ setIsAuthenticated }) => {
  const [selectedBooks, setSelectedBooks] = useState([]);
  const navigate = useNavigate();

  const cleanTitle = (title) => {
    if (!title) return 'Career Award';

    let cleaned = title.replace(/^["']|["']$/g, '');
    const parts = cleaned.split(/\s*\/\s*\|\s*|\s*\/\s*\$c:\s*/);

    if (parts.length > 0) {
      cleaned = parts[0];
    }

    cleaned = cleaned.replace(/\s*\|\s*\$c:.*/g, '');
    cleaned = cleaned.replace(/\s*\|\s*$/g, '');
    cleaned = cleaned.replace(/\s*\/\s*$/g, '');
    cleaned = cleaned.replace(/\s+by\s+[A-Z][a-z\s]+\.?\s*$/i, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned || 'Career Award';
  };

  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await fetch(buildApiUrl('/api/tableName'));

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const books = await response.json();
        const normalizedBooks = books.map((book) => ({
          ...book,
          bookId: book.book_id,
        }));

        setSelectedBooks(normalizedBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    }

    fetchBooks();
  }, []);

  const handleLike = async (bookId, liked) => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please log in again before rating books.');
      navigate('/login');
      return;
    }

    if (bookId == null) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/like'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ bookId, liked }),
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || `Network response was not ok: ${response.status}`);
      }

      setSelectedBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.bookId === bookId
            ? { ...book, like_count: data.likes, dislike_count: data.dislikes }
            : book
        )
      );
    } catch (error) {
      console.error('Error processing like/dislike:', error);
      alert(error.message || 'Unable to save your rating.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminUsername');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="homepage">
      <h1 className="welcome-message">Welcome to Look Up Book!</h1>
      <h2 className="recommendation-message">
        Here are 10 random award highlights including both award-winning books and author career awards.
      </h2>
      <nav className="navbar">
        <ul>
          <li>
            <Link to="/add-db-book">Add Book from Database to Profile</Link>
          </li>
          <li>
            <Link to="/add-new-book">Submit New Award-winning Book for Verification</Link>
          </li>
          <li>
            <Link to="/admin-verification">Verification of Books Submitted</Link>
          </li>
          <li>
            <Link to="/search-books">Search Books By Authors</Link>
          </li>
          <li>
            <Link to="/profile">Profile Page</Link>
          </li>
          <li>
            <Link to="/search-awards">Search Books or Authors by Awards</Link>
          </li>
          <li>
            <button type="button" onClick={handleLogout} className="link-button">
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <div className="book-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Like/Dislike</th>
              <th>Genre</th>
              <th>Year</th>
              <th>Verified</th>
              <th>Author ID</th>
              <th>Award</th>
              <th>Award Type</th>
            </tr>
          </thead>
          <tbody>
            {selectedBooks.map((book) => (
              <tr key={book.bookId ?? `${book.title_of_winning_book}-${book.author_id}`}> 
                <td className="title-cell">
                  {book.title_of_winning_book
                    ? cleanTitle(book.title_of_winning_book)
                    : 'Career Award'}
                </td>
                <td className="like-dislike-cell">
                  {book.prize_type === 'career' || book.bookId == null ? (
                    'Not Applicable'
                  ) : (
                    <>
                      <button
                        type="button"
                        className="vote-icon-button"
                        aria-label="Like this book"
                        onClick={() => handleLike(book.bookId, true)}
                      >
                        <img src={likeIconURL} alt="Like" className="vote-icon" />
                      </button>
                      {book.like_count} Likes / {book.dislike_count} Dislikes
                      <button
                        type="button"
                        className="vote-icon-button"
                        aria-label="Dislike this book"
                        onClick={() => handleLike(book.bookId, false)}
                      >
                        <img src={dislikeIconURL} alt="Dislike" className="vote-icon" />
                      </button>
                    </>
                  )}
                </td>
                <td>{book.prize_genre}</td>
                <td>{book.display_year || book.prize_year || book.publication_year || 'Unknown'}</td>
                <td>{book.verified ? 'True' : 'False'}</td>
                <td>{book.author_id || 'N/A'}</td>
                <td>{book.prize_name || 'N/A'}</td>
                <td>{book.prize_type === 'career' ? 'Author Career Award' : 'Book Award'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Homepage;
