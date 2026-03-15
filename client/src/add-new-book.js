import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl, getAuthHeaders } from './api';

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
    titleOfWinningBook: '',
    awardId: '',
  });
  const [awards, setAwards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/awards'));

        if (!response.ok) {
          throw new Error('Failed to fetch awards.');
        }

        const data = await response.json();
        setAwards(data);
      } catch (error) {
        console.error('Error loading awards:', error);
      }
    };

    fetchAwards();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setBookDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const bookDetailsToSend = {
        ...bookDetails,
        prizeYear: Number.parseInt(bookDetails.prizeYear, 10),
        awardId: Number.parseInt(bookDetails.awardId, 10),
      };

      const response = await fetch(buildApiUrl('/api/submit-book'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(bookDetailsToSend),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.message || `Error: ${response.status}`);
      }

      alert('Book submitted for verification successfully.');
      navigate('/homepage');
    } catch (error) {
      console.error('Error submitting new book for verification:', error);
      alert(error.message || 'Submission failed, please try again.');
    }
  };

  return (
    <div>
      <h1>Submit New Award-Winning Book for Verification</h1>
      <form onSubmit={handleSubmit}>
        <label>Author&apos;s Full Name:</label>
        <input type="text" name="fullName" value={bookDetails.fullName} onChange={handleChange} required />

        <label>Author&apos;s Given Name:</label>
        <input type="text" name="givenName" value={bookDetails.givenName} onChange={handleChange} required />

        <label>Author&apos;s Last Name:</label>
        <input type="text" name="lastName" value={bookDetails.lastName} onChange={handleChange} required />

        <label>Author&apos;s Desired Gender (please type female, male, or nonbinary):</label>
        <input type="text" name="gender" value={bookDetails.gender} onChange={handleChange} required />

        <label>Exceptional University Author Went To (If They Went To An Elite Institution):</label>
        <input type="text" name="eliteInstitution" value={bookDetails.eliteInstitution} onChange={handleChange} />

        <label>Graduate Degree? (please fill with word &quot;graduate&quot; if so):</label>
        <input type="text" name="graduateDegree" value={bookDetails.graduateDegree} onChange={handleChange} />

        <label>Master of Fine Arts Degree? (please enter where they got their Master&apos;s, if so):</label>
        <input type="text" name="mfaDegree" value={bookDetails.mfaDegree} onChange={handleChange} />

        <label>Prize Name:</label>
        <select name="awardId" value={bookDetails.awardId} onChange={handleChange} required>
          <option value="">Select an Award</option>
          {awards.map((award) => (
            <option key={award.award_id} value={award.award_id}>
              {award.prize_name}
            </option>
          ))}
        </select>

        <label>Year Book Won The Award:</label>
        <input type="number" name="prizeYear" value={bookDetails.prizeYear} onChange={handleChange} required />

        <label>Prize Genre (Prose or Poetry):</label>
        <select name="prizeGenre" value={bookDetails.prizeGenre} onChange={handleChange} required>
          <option value="">Select Genre</option>
          <option value="prose">Prose</option>
          <option value="poetry">Poetry</option>
        </select>

        <label>Title of Winning Book:</label>
        <input
          type="text"
          name="titleOfWinningBook"
          value={bookDetails.titleOfWinningBook}
          onChange={handleChange}
          required
        />

        <button type="submit">Submit for Verification</button>
      </form>
      <button onClick={() => navigate('/homepage')}>Back to Homepage</button>
    </div>
  );
};

export default AddNewBook;
