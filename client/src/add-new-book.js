// In src/add-new-book.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddNewBook = () => {
    const [bookDetails, setBookDetails] = useState({
        fullName: '',
        givenName: '',
        lastName: '',
        gender: '',
        eliteInstitution: '',
        graduateDegree: '',
        mfaDegree: '',
        prizeYear: '',
        prizeGenre: '',
        titleOfWinningBook: ''
    });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookDetails(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/submit-book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookDetails),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${await response.text()}`);
            }
            alert("Book submitted for verification successfully.");
            navigate('/homepage');
        } catch (error) {
            console.error("Error submitting new book for verification:", error);
            alert("Submission failed, please try again.");
        }
    };


    return (
        <div>
            <h1>Submit New Award-Winning Book for Verification</h1>
            <form onSubmit={handleSubmit}>
                <label>Author's Full Name:</label>
                <input type="text" name="fullName" value={bookDetails.fullName} onChange={handleChange} required />
                <label>Author's Given Name:</label>
                <input type="text" name="givenName" value={bookDetails.givenName} onChange={handleChange} required />
                <label>Author's Last Name:</label>
                <input type="text" name="lastName" value={bookDetails.lastName} onChange={handleChange} required />
                <label>Author's Desired Gender (please type female, male, or nonbinary):</label>
                <input type="text" name="gender" value={bookDetails.gender} onChange={handleChange} required />
                <label>Exceptional University Author Went To (If They Went To An Elite Institution):</label>
                <input type="text" name="eliteInstitution" value={bookDetails.eliteInstitution} onChange={handleChange} />
                <label>Graduate Degree? (please fill with word "graduate" if so):</label>
                <input type="text" name="graduateDegree" value={bookDetails.graduateDegree} onChange={handleChange} />
                <label>Master of Fine Arts Degree? (please enter where they got their Master's, if so):</label>
                <input type="text" name="mfaDegree" value={bookDetails.mfaDegree} onChange={handleChange} />
                {/* New dropdown for selecting award */}
                <label>Prize Name:</label>
                <select name="awardId" value={bookDetails.awardId} onChange={handleChange} required>
                    <option value="">Select an Award</option>
                    {awards.map(award => (
                        <option key={award.award_id} value={award.award_id}>{award.prize_name}</option>
                    ))}
                </select>
                <label>Year Book Won The Award:</label>
                <input type="integer" name="prizeYear" value={bookDetails.prizeYear} onChange={handleChange} required />
                <label>Prize Genre (Prose or Poetry):</label>
                <select name="prizeGenre" value={bookDetails.prizeGenre} onChange={handleChange} required>
                    <option value="">Select Genre</option>
                    <option value="prose">Prose</option>
                    <option value="poetry">Poetry</option>
                </select>
                
                <label>Title of Winning Book:</label>
                <input type="text" name="titleOfWinningBook" value={bookDetails.titleOfWinningBook} onChange={handleChange} required />
                
                <button type="submit">Submit for Verification</button>
            </form>
            <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
        </div>
    );
};

export default AddNewBook;
