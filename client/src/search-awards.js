import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchAwards = () => {
    const [awards, setAwards] = useState([]);
    const [selectedAwardBooks, setSelectedAwardBooks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAwards = async () => {
            const response = await fetch('http://localhost:5000/api/awards');
            const data = await response.json();
            setAwards(data);
        };

        fetchAwards();
    }, []);

    const handleAwardChange = async (e) => {
        const awardId = e.target.value;
        if (!awardId) {
            setSelectedAwardBooks([]);
            return;
        }
        const response = await fetch(`http://localhost:5000/api/awards/${awardId}`);
        const data = await response.json();
        setSelectedAwardBooks(data);
    };

    return (
        <div>
            <h1>Welcome to the Search Page where You can search books by awards!</h1>
            <p>Please select an award to browse books that have won.</p>
            <select onChange={handleAwardChange}>
                <option value="">Select an award</option>
                {awards.map(award => (
                    <option key={award.award_id} value={award.award_id}>{award.award_id} - {award.prize_name}</option>
                ))}
            </select>
            {selectedAwardBooks.map((book, index) => (
                <div key={index} style={{ marginTop: '20px' }}>
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
        </div>
    );
};

export default SearchAwards;
