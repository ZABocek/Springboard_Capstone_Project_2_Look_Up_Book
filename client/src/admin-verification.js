// src/admin-verification.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminVerification = () => {
    const [adminName, setAdminName] = useState('');
    const [unverifiedBooks, setUnverifiedBooks] = useState([]);
    const navigate = useNavigate();

    // Check for admin status immediately on component mount
    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const adminUsername = localStorage.getItem('adminUsername'); // Assuming adminUsername is set during admin login
        
        if (!isAdmin) {
            alert('You do not have permission to access this page.');
            navigate('/login'); // Redirect non-admin users
            return; // Exit the useEffect callback to prevent further execution
        }
        
        setAdminName(adminUsername);
        fetchUnverifiedBooks();
    }, [navigate]); // navigate is a dependency of this effect

    const fetchUnverifiedBooks = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/unverified-books', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming your API requires authorization
                },
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            setUnverifiedBooks(data);
        } catch (error) {
            console.error("Error fetching unverified books:", error);
        }
    };

    const handleVerification = async (bookId, verified) => {
        try {
            const response = await fetch(`http://localhost:5000/api/books/${bookId}/verification`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming your API requires authorization
                },
                body: JSON.stringify({ verified }),
            });
            if (!response.ok) {
                throw new Error('Failed to update book verification status');
            }
            fetchUnverifiedBooks(); // Refetch to update the UI
        } catch (error) {
            console.error('Error updating verification status:', error);
        }
    };

    return (
        <div>
            <h1>Welcome, {adminName}!</h1>
            <h2>Books Awaiting Verification</h2>
            {unverifiedBooks.length ? (
                <ul>
                    {unverifiedBooks.map(book => (
                        <li key={book.bookId}>
                            {book.titleOfWinningBook} by {book.fullName}
                            <button onClick={() => handleVerification(book.bookId, true)}>Verify</button>
                            <button onClick={() => handleVerification(book.bookId, false)}>Reject</button>
                        </li>
                    ))}
                </ul>
            ) : <p>No books awaiting verification.</p>}
            <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
        </div>
    );
};

export default AdminVerification;
