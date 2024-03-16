// In src/add-new-book.js
import React, { useState } from 'react';
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
        prizeName: '',
        prizeYear: '',
        prizeGenre: '',
        titleOfWinningBook: ''
    });
    const navigate = useNavigate();

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
                    // Add Authorization header if your API requires authentication
                },
                body: JSON.stringify(bookDetails),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${await response.text()}`);
            }
            // Display success message or redirect as needed
            alert("Book submitted for verification successfully.");
            navigate('/homepage'); // or to a confirmation page
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

                {/* Repeat the above pattern for all other fields */}
                
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
        </div>
    );
};

export default AddNewBook;
