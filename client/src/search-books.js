// client/src/search-books.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBooks = () => {
    const [authors, setAuthors] = useState([]);
    const [selectedAuthorId, setSelectedAuthorId] = useState('');
    const [books, setBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAuthors = async () => {
            const response = await fetch('http://localhost:5000/api/authors');
            const data = await response.json();
            setAuthors(data);
        };

        fetchAuthors();
    }, []);

    const handleAuthorChange = async (e) => {
        setSelectedAuthorId(e.target.value);
        const response = await fetch(`http://localhost:5000/api/books/${e.target.value}`);
        const data = await response.json();
        setBooks(data);
    };

    return (
        <div>
            <h1>Welcome to the Search Page where You can search books by authors!</h1>
            <p>Please click the dropdown menu to select an author whose books you want to browse.</p>
            <select onChange={handleAuthorChange} value={selectedAuthorId}>
                <option value="">Select an author</option>
                {authors.map(author => (
                    <option key={author.author_id} value={author.author_id}>{author.last_name}, {author.given_name}</option>
                ))}
            </select>
            <div>
                {books.map(book => (
                    <table key={book.book_id}>
                        <tbody>
                            <tr><td>Book ID</td><td>{book.book_id}</td></tr>
                            <tr><td>Title</td><td>{book.title_of_winning_book}</td></tr>
                            <tr><td>Genre</td><td>{book.prize_genre}</td></tr>
                            <tr><td>Year</td><td>{book.prize_year}</td></tr>
                            <tr><td>Verified</td><td>{book.verified ? 'True' : 'False'}</td></tr>
                            <tr><td>Author ID</td><td>{book.author_id}</td></tr>
                        </tbody>
                    </table>
                ))}
            </div>
            <button onClick={() => navigate('/')}>Back to Homepage</button>
        </div>
    );
};

export default SearchBooks;
