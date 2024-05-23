import React, { useState, useEffect } from 'react'; // Importing React and hooks from the 'react' library
import { useNavigate } from 'react-router-dom'; // Importing useNavigate hook from 'react-router-dom' for navigation

// Component for adding a new book
const AddNewBook = () => {
    // State to hold the details of the book being added
    const [bookDetails, setBookDetails] = useState({
        fullName: '', // Full name of the author
        givenName: '', // Given name of the author
        lastName: '', // Last name of the author
        gender: '', // Gender of the author
        eliteInstitution: '', // Exceptional university the author went to, if any
        graduateDegree: '', // Graduate degree details, if any
        mfaDegree: '', // Master of Fine Arts degree details, if any
        prizeYear: '', // Year the book won the award
        prizeGenre: '', // Genre of the prize (Prose or Poetry)
        titleOfWinningBook: '', // Title of the winning book
        awardId: '' // ID of the award
    });

    // State to hold the list of awards fetched from the server
    const [awards, setAwards] = useState([]);
    const navigate = useNavigate(); // Initialize the useNavigate hook for navigation

    // useEffect hook to fetch the list of awards from the server when the component mounts
    useEffect(() => {
        const fetchAwards = async () => {
            const response = await fetch('http://localhost:5000/api/awards'); // Fetch awards from the server
            const data = await response.json(); // Parse the JSON response
            setAwards(data); // Update the awards state with the fetched data
        };
        fetchAwards(); // Call the function to fetch awards
    }, []); // Empty dependency array means this effect runs once on mount

    // Handle changes to input fields and update the corresponding state
    const handleChange = (e) => {
        const { name, value } = e.target; // Destructure the name and value from the event target
        setBookDetails(prevState => ({
            ...prevState, // Copy the previous state
            [name]: value // Update the state for the changed input field
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior
        try {
            // Ensure prizeYear and awardId are numbers before sending the request
            const bookDetailsToSend = {
                ...bookDetails, // Copy the current state of book details
                prizeYear: parseInt(bookDetails.prizeYear, 10), // Convert prizeYear to an integer
                awardId: parseInt(bookDetails.awardId, 10) // Convert awardId to an integer
            };
            // Send a POST request to the server to submit the book details for verification
            const response = await fetch('http://localhost:5000/api/submit-book', {
                method: 'POST', // HTTP method
                headers: {
                    'Content-Type': 'application/json', // Specify the content type as JSON
                },
                body: JSON.stringify(bookDetailsToSend), // Convert the book details to a JSON string
            });
            if (!response.ok) { // Check if the response is not OK
                throw new Error(`Error: ${response.status} ${await response.text()}`); // Throw an error with the response status and text
            }
            alert("Book submitted for verification successfully."); // Show an alert on successful submission
            navigate('/homepage'); // Navigate to the homepage
        } catch (error) {
            console.error("Error submitting new book for verification:", error); // Log any errors
            alert("Submission failed, please try again."); // Show an alert on submission failure
        }
    };

    return (
        <div>
            <h1>Submit New Award-Winning Book for Verification</h1> {/* Heading for the form */}
            <form onSubmit={handleSubmit}> {/* Form for submitting the new book */}
                <label>Author's Full Name:</label>
                <input type="text" name="fullName" value={bookDetails.fullName} onChange={handleChange} required />
                {/* Input field for the author's full name */}
                
                <label>Author's Given Name:</label>
                <input type="text" name="givenName" value={bookDetails.givenName} onChange={handleChange} required />
                {/* Input field for the author's given name */}
                
                <label>Author's Last Name:</label>
                <input type="text" name="lastName" value={bookDetails.lastName} onChange={handleChange} required />
                {/* Input field for the author's last name */}
                
                <label>Author's Desired Gender (please type female, male, or nonbinary):</label>
                <input type="text" name="gender" value={bookDetails.gender} onChange={handleChange} required />
                {/* Input field for the author's gender */}
                
                <label>Exceptional University Author Went To (If They Went To An Elite Institution):</label>
                <input type="text" name="eliteInstitution" value={bookDetails.eliteInstitution} onChange={handleChange} />
                {/* Input field for the elite institution the author attended, if any */}
                
                <label>Graduate Degree? (please fill with word "graduate" if so):</label>
                <input type="text" name="graduateDegree" value={bookDetails.graduateDegree} onChange={handleChange} />
                {/* Input field for the graduate degree details, if any */}
                
                <label>Master of Fine Arts Degree? (please enter where they got their Master's, if so):</label>
                <input type="text" name="mfaDegree" value={bookDetails.mfaDegree} onChange={handleChange} />
                {/* Input field for the Master of Fine Arts degree details, if any */}
                
                <label>Prize Name:</label>
                <select name="awardId" value={bookDetails.awardId} onChange={handleChange} required>
                    <option value="">Select an Award</option>
                    {/* Dropdown menu for selecting an award */}
                    {awards.map(award => (
                        <option key={award.award_id} value={award.award_id}>{award.prize_name}</option>
                        // Options for each award fetched from the server
                    ))}
                </select>
                
                <label>Year Book Won The Award:</label>
                <input type="number" name="prizeYear" value={bookDetails.prizeYear} onChange={handleChange} required />
                {/* Input field for the year the book won the award */}
                
                <label>Prize Genre (Prose or Poetry):</label>
                <select name="prizeGenre" value={bookDetails.prizeGenre} onChange={handleChange} required>
                    <option value="">Select Genre</option>
                    <option value="prose">Prose</option>
                    <option value="poetry">Poetry</option>
                    {/* Dropdown menu for selecting the genre of the prize */}
                </select>
                
                <label>Title of Winning Book:</label>
                <input type="text" name="titleOfWinningBook" value={bookDetails.titleOfWinningBook} onChange={handleChange} required />
                {/* Input field for the title of the winning book */}
                
                <button type="submit">Submit for Verification</button>
                {/* Button to submit the form */}
            </form>
            <button onClick={() => navigate('/Homepage')}>Back to Homepage</button>
            {/* Button to navigate back to the homepage */}
        </div>
    );
};

export default AddNewBook; // Export the AddNewBook component as the default export
