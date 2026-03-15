import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from './api';

const SearchBooks = () => {
  const [authors, setAuthors] = useState([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/authors'));

        if (!response.ok) {
          throw new Error('Unable to load authors.');
        }

        const data = await response.json();
        setAuthors(data);
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };

    fetchAuthors();
  }, []);

  const handleAuthorChange = async (event) => {
    const nextAuthorId = event.target.value;
    setSelectedAuthorId(nextAuthorId);

    if (!nextAuthorId) {
      setBooks([]);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/books/${nextAuthorId}`));

      if (!response.ok) {
        throw new Error('Unable to load books for that author.');
      }

      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  return (
    <div>
      <h1>Welcome to the Search Page where You can search books by authors!</h1>
      <p>Please click the dropdown menu to select an author whose books you want to browse.</p>
      <select onChange={handleAuthorChange} value={selectedAuthorId}>
        <option value="">Select an author</option>
        {authors.map((author) => (
          <option key={author.author_id} value={author.author_id}>
            {author.last_name}, {author.given_name}
          </option>
        ))}
      </select>
      <div>
        {books.map((book) => (
          <table key={book.book_id}>
            <tbody>
              <tr>
                <td>Book ID</td>
                <td>{book.book_id}</td>
              </tr>
              <tr>
                <td>Title</td>
                <td>{book.title}</td>
              </tr>
              <tr>
                <td>Genre</td>
                <td>{book.prize_genre}</td>
              </tr>
              <tr>
                <td>Year</td>
                <td>{book.publication_year || 'Unknown'}</td>
              </tr>
              <tr>
                <td>Verified</td>
                <td>{book.verified ? 'True' : 'False'}</td>
              </tr>
              <tr>
                <td>Author ID</td>
                <td>{book.author_id}</td>
              </tr>
            </tbody>
          </table>
        ))}
      </div>
      <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
    </div>
  );
};

export default SearchBooks;
