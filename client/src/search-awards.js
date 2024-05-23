import React, { useState, useEffect } from 'react';
// Importing necessary modules from React and React Router

import { useNavigate } from 'react-router-dom';
// Importing useNavigate from React Router for navigation

const SearchAwards = () => {
    // Using React's useState hook to manage state for awards and selectedAwardBooks
    const [awards, setAwards] = useState([]);
    const [selectedAwardBooks, setSelectedAwardBooks] = useState([]);
    const navigate = useNavigate(); // Initializing the navigate function

    useEffect(() => {
        // useEffect hook to fetch awards when the component mounts
        const fetchAwards = async () => {
            const response = await fetch('http://localhost:5000/api/awards');
            const data = await response.json();
            setAwards(data); // Updating the awards state with the fetched data
        };

        fetchAwards(); // Calling the function to fetch awards
    }, []); // Empty dependency array means this effect runs once on mount

    const handleAwardChange = async (e) => {
        // Function to handle changes in the selected award dropdown
        const awardId = e.target.value;
        if (!awardId) {
            setSelectedAwardBooks([]); // If no award is selected, clear the selected books
            return;
        }
        const response = await fetch(`http://localhost:5000/api/awards/${awardId}`);
        const data = await response.json();
        setSelectedAwardBooks(data); // Updating the selected books state with the fetched data
    };

    return (
        <div>
            <h1>Welcome to the Search Page where You can search books by awards!</h1>
            <p>Please select an award to browse books that have won.</p>
            <select onChange={handleAwardChange}>
                {/* Dropdown menu for selecting an award */}
                <option value="">Select an award</option>
                {awards.map(award => (
                    <option key={award.award_id} value={award.award_id}>{award.award_id} - {award.prize_name}</option>
                ))}
            </select>
            {selectedAwardBooks.map((book, index) => (
                <div key={index} style={{ marginTop: '20px' }}>
                    {/* Displaying the books that have won the selected award */}
                    <table>
                        <tbody>
                            <tr><td>Award ID</td><td>{book.award_id}</td></tr>
                            <tr><td>Prize Name</td><td>{book.prize_name}</td></tr>
                            <tr><td>Prize Amount</td><td>{book.prize_amount}</td></tr>
                            <tr><td>Title of Winning Book</td><td>{book.title_of_winning_book}</td></tr>
                            <tr><td>Prize Year</td><td>{book.prize_year}</td></tr>
                            <tr><td>Verified</td><td>{book.verified ? 'True' : 'False'}</td></tr>
                        </tbody>
                    </table>
                </div>
            ))}
            <button onClick={() => navigate('/Homepage')} style={{ marginTop: '20px' }}>Back to Homepage</button>
            {/* Button to navigate back to the homepage */}
        </div>
    );
};

export default SearchAwards;
