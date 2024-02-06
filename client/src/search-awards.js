// client/src/search-awards.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchAwards = () => {
    const [awards, setAwards] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAwards = async () => {
            const response = await fetch('http://localhost:5000/api/awards');
            const data = await response.json();
            setAwards(data);
        };

        fetchAwards();
    }, []);

    return (
        <div>
            <h1>Welcome to the Search Page where You can search books by awards!</h1>
            <p>Please select an award to browse books that have won.</p>
            <select onChange={(e) => navigate(`/awards/${e.target.value}`)}>
                <option value="">Select an award</option>
                {awards.map(award => (
                    <option key={award.award_id} value={award.award_id}>{award.award_id} - {award.prize_name}</option>
                ))}
            </select>
            <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
        </div>
    );
};

export default SearchAwards;
