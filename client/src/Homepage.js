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
                            <th>Genre</th>
                            <th>Year</th>
                            <th>Author_ID</th>
                            <th>Verified</th>
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBooks.map((book, index) => (
                            <tr key={index}>
                                <td>{book.title_of_winning_book}</td>
                                <td>{book.prize_genre}</td>
                                <td>{book.prize_year}</td>
                                <td>(book.person_id)</td>
                                <td>True</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Homepage;
