// Import necessary modules from React and react-router-dom
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminVerification = () => {
    // State variables to store admin name and unverified books
    const [adminName, setAdminName] = useState('');
    const [unverifiedBooks, setUnverifiedBooks] = useState([]);
    const navigate = useNavigate();

    // useEffect hook to check admin status and fetch unverified books on component mount
    useEffect(() => {
        // Check if the user is an admin by looking at localStorage
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const adminUsername = localStorage.getItem('adminUsername'); // Assuming adminUsername is set during admin login
        
        // If the user is not an admin, show an alert and redirect to login page
        if (!isAdmin) {
            alert('You do not have permission to access this page.');
            navigate('/login'); // Redirect non-admin users
            return; // Exit the useEffect callback to prevent further execution
        }
        
        // Set admin name and fetch unverified books
        setAdminName(adminUsername);
        fetchUnverifiedBooks();
    }, [navigate]); // navigate is a dependency of this effect

    // Function to fetch unverified books from the server
    const fetchUnverifiedBooks = async () => {
        try {
            // Make a GET request to fetch unverified books
            const response = await fetch('http://localhost:5000/api/unverified-books', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming your API requires authorization
                },
            });
            // Check if the response is not OK
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            // Parse the response data
            const data = await response.json();
            // Set the unverified books in state
            setUnverifiedBooks(data);
        } catch (error) {
            // Log any errors
            console.error("Error fetching unverified books:", error);
        }
    };

    // Function to handle verification of books
    const handleVerification = async (bookId, verified) => {
        try {
            // Make a PATCH request to update the verification status of the book
            const response = await fetch(`http://localhost:5000/api/books/${bookId}/verification`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming your API requires authorization
                },
                body: JSON.stringify({ verified }), // Send the verification status in the request body
            });
            // Check if the response is not OK
            if (!response.ok) {
                throw new Error('Failed to update book verification status');
            }
            // Refetch the unverified books to update the UI
            fetchUnverifiedBooks();
        } catch (error) {
            // Log any errors
            console.error('Error updating verification status:', error);
        }
    };

    return (
        <div>
            {/* Display admin name */}
            <h1>Welcome, {adminName}!</h1>
            {/* Display a heading for books awaiting verification */}
            <h2>Books Awaiting Verification</h2>
            {/* Conditionally render the list of unverified books or a message if there are none */}
            {unverifiedBooks.length ? (
                <ul>
                    {/* Map through the unverified books and display each one */}
                    {unverifiedBooks.map(book => (
                        <li key={book.bookId}>
                            {book.titleOfWinningBook} by {book.fullName}
                            {/* Buttons to verify or reject the book */}
                            <button onClick={() => handleVerification(book.bookId, true)}>Verify</button>
                            <button onClick={() => handleVerification(book.bookId, false)}>Reject</button>
                        </li>
                    ))}
                </ul>
            ) : <p>No books awaiting verification.</p>}
            {/* Button to navigate back to the homepage */}
            <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
        </div>
    );
};

export default AdminVerification;
