import React from 'react';
import './Homepage.css';

const Homepage = () => {
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
        </div>
    );
};

export default Homepage;
