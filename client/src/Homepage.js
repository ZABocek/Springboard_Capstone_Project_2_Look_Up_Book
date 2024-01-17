import React, { useState, useEffect } from 'react';
import './Homepage.css';

const Homepage = () => {
    const [selectedBooks, setSelectedBooks] = useState([]);

    useEffect(() => {
        // Mock data representing the filtered and sorted data from the spreadsheet
        const books = [
            // ... include all filtered and sorted books here ...
            { title: 'Insurrections', author: 'Rion Amilcar Scott', prize: 'Robert W. Bingham Prize for Debut Short Story Collection' },
            // ... more book entries ...
        ];

        // Randomly select 10 unique books
        const shuffledBooks = books.sort(() => 0.5 - Math.random());
        setSelectedBooks(shuffledBooks.slice(0, 10));
    }, []);

    return (
        <div className="homepage">
            <h1 className="welcome-message">Welcome to Look Up Book!</h1>
            <h2 className="recommendation-message">Here are 10 books recommended for you to enjoy from award-winning authors!</h2>
            <nav className="navbar">
                <ul>
                    <li><a href="/add-book">Add Book to Profile</a></li>
                    <li><a href="/search-books">Search Books</a></li>
                    <li><a href="/profile">Profile Page</a></li>
                    <li><a href="/search-authors">Search Authors</a></li>
                    <li><a href="/search-awards">Search Books by Awards</a></li>
                    <li><a href="/delete-book">Delete Book from Profile</a></li>
                </ul>
            </nav>
            <div className="book-table">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Prize</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBooks.map((book, index) => (
                            <tr key={index}>
                                <td>{book.title}</td>
                                <td>{book.author}</td>
                                <td>{book.prize}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Homepage;
