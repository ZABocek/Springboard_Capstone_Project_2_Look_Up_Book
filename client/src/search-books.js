// Import React and hooks for state and effect management
import React, { useState, useEffect } from 'react';
// Import the useNavigate hook for navigation
import { useNavigate } from 'react-router-dom';

// Define the SearchBooks component
const SearchBooks = () => {
    // State variables to store authors, selected author ID, and books
    const [authors, setAuthors] = useState([]);
    const [selectedAuthorId, setSelectedAuthorId] = useState('');
    const [books, setBooks] = useState([]);
    const navigate = useNavigate(); // Initialize the navigate function

    // useEffect hook to fetch authors when the component mounts
    useEffect(() => {
        // Define an asynchronous function to fetch authors
        const fetchAuthors = async () => {
            const response = await fetch('http://localhost:5000/api/authors'); // Make a GET request to the API to fetch authors
            const data = await response.json(); // Parse the response JSON
            setAuthors(data); // Update the authors state with the fetched data
        };

        fetchAuthors(); // Call the fetchAuthors function
    }, []); // Empty dependency array means this effect runs once after the initial render

    // Function to handle the selection of an author from the dropdown
    const handleAuthorChange = async (e) => {
        setSelectedAuthorId(e.target.value); // Update the selected author ID state
        const response = await fetch(`http://localhost:5000/api/books/${e.target.value}`); // Fetch books by the selected author ID
        const data = await response.json(); // Parse the response JSON
        setBooks(data); // Update the books state with the fetched data
    };

    // Render the component
    return (
        <div>
            <h1>Welcome to the Search Page where You can search books by authors!</h1>
            <p>Please click the dropdown menu to select an author whose books you want to browse.</p>
            <select onChange={handleAuthorChange} value={selectedAuthorId}>
                <option value="">Select an author</option>
                {authors.map(author => (
                    <option key={author.author_id} value={author.author_id}>
                        {author.last_name}, {author.given_name}
                    </option>
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
            <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
        </div>
    );
};

export default SearchBooks;
