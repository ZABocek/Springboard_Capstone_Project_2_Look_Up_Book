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
        // Here, add the logic to submit the form data to your server
        console.log(bookDetails);
        // Redirect to a confirmation page or show a success message
        navigate('/homepage'); // Adjust the navigation as needed
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
