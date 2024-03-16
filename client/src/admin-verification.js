// src/admin-verification.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminVerification = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminName, setAdminName] = useState('');
    const [unverifiedBooks, setUnverifiedBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const adminId = localStorage.getItem('adminId');
        const adminUsername = localStorage.getItem('adminUsername'); // Ensure this is set during login

        if (!adminId) {
            alert('You do not have permission to access this page.');
            navigate('/login'); // Redirect non-admin users
        } else {
            setIsAdmin(true);
            setAdminName(adminUsername);
            fetchUnverifiedBooks();
        }
    }, [navigate]);

    const fetchUnverifiedBooks = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/unverified-books', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming your API requires authorization
                },
            }); // Adjust endpoint as needed
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
        console.log(`Book ID: ${bookId}, Verified: ${verified}`);
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

    if (!isAdmin) return <p>You do not have access to this page.</p>;

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
        </div>
    );
};

export default AdminVerification;
