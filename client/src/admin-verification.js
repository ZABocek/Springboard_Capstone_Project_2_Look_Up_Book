// In src/AdminVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminVerification = () => {
    const [unverifiedBooks, setUnverifiedBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch unverified books from your backend
        const fetchUnverifiedBooks = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/unverified-books'); // Adjust endpoint as needed
                const data = await response.json();
                setUnverifiedBooks(data);
            } catch (error) {
                console.error("Error fetching unverified books:", error);
            }
        };

        fetchUnverifiedBooks();
    }, []);

    const handleVerification = async (bookId, verified) => {
        // Update verification status in your backend
        console.log(`Book ID: ${bookId}, Verified: ${verified}`);
        // Logic to update the book's verification status
        // Remove book from the unverifiedBooks state or refetch the unverified books
    };

    if (!unverifiedBooks.length) return <p>Loading...</p>;

    return (
        <div>
            <h1>Admin Verification</h1>
            <ul>
                {unverifiedBooks.map(book => (
                    <li key={book.bookId}>
                        {book.titleOfWinningBook} by {book.fullName} - <button onClick={() => handleVerification(book.bookId, true)}>Verify</button> <button onClick={() => handleVerification(book.bookId, false)}>Reject</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminVerification;
