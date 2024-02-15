import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Homepage.css';
import likeIconURL from "./like_9790408.png";
import dislikeIconURL from "./dislike_6933384.png";
const Homepage = () => {
    const [selectedBooks, setSelectedBooks] = useState([]);
    const navigate = useNavigate(); // Initialize useNavigate

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

    // Inside the Homepage component
const handleLike = async (bookId, liked) => {
    const userId = localStorage.getItem('userId'); // Ensure you're setting this upon user login
    console.log(userId);
    try {
        const response = await fetch('http://localhost:5000/api/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookId, liked })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Optionally, you might want to refresh the list of books to show updated like/dislike status
        console.log('Like/dislike successfully processed');
    } catch (error) {
        console.error('Error processing like/dislike:', error);
    }
};

    
    // Add this function to handle logout
    const handleLogout = () => {
        // Here you should clear your authentication token or session
        localStorage.removeItem('token'); // For example, if you're using localStorage
        navigate('/login'); // Redirect to login page
    };

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
                    <li><a href="#" onClick={handleLogout}>Logout</a></li> {/* Modify this line */}
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
                        </tr>
                    </thead>
                    <tbody>
                        {selectedBooks.map((book, index) => (
                        <tr key={index}>
                            <td>{book.title_of_winning_book}</td>
                            <td>
                                <img src={likeIconURL} alt="Like" onClick={() => handleLike(book.book_id, true)} style={{ cursor: 'pointer', marginRight: '10px', height: '50px' }} />
                                <img src={dislikeIconURL} alt="Dislike" onClick={() => handleLike(book.book_id, false)} style={{ cursor: 'pointer', height: '50px' }} />
                                </td>
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
