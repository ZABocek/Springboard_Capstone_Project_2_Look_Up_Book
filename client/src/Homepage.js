import React, { useState, useEffect } from 'react';
import './Homepage.css';

const Homepage = () => {
    const [selectedBooks, setSelectedBooks] = useState([]);

    useEffect(() => {
        async function fetchBooks() {
            try {
                const response = await fetch('http://localhost:5000/api/tableName');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const books = await response.json();
                
                setSelectedBooks(books);
                console.log(selectedBooks);
            } catch (error) {
                console.error('Error fetching books:', error);
            }
        }
    
        fetchBooks();
    }, []);    

    return (
        <div className="homepage">
            <h1 className="welcome-message">Welcome to Look Up Book!</h1>
            <h2 className="recommendation-message">Here are 10 books recommended for you to enjoy from award-winning authors!</h2>
            <nav className="navbar">
                <ul>
                    <li><a href="/add-db-book">Add Book from Database to Profile</a></li>
                    <li><a href="/add-new-book">Submit New Award-winning Book for Verification</a></li>
                    <li><a href="/search-books">Search Books By Authors</a></li>
                    <li><a href="/profile">Profile Page</a></li>
                    <li><a href="/search-awards">Search Books by Awards</a></li>
                    <li><a href="/delete-book">Delete Book from Profile</a></li>
                    <li><a href="/logout">Logout</a></li>
                </ul>
            </nav>
            <div className="book-table">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Genre</th>
                            <th>Year</th>
                            <th>Verified</th>
                            <th>Author ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBooks.map((book, index) => (
                            <tr key={index}>
                                <td>{book.title_of_winning_book}</td>
                                <td>{book.prize_genre}</td>
                                <td>{book.prize_year}</td>
                                <td>{book.verified ? 'True' : 'False'}</td>
                                <td>{book.person_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Homepage;
