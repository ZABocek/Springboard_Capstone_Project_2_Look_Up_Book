import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from './api';

const SearchAwards = () => {
  const [awards, setAwards] = useState([]);
  const [selectedAwardId, setSelectedAwardId] = useState('');
  const [selectedAwardBooks, setSelectedAwardBooks] = useState([]);
  const [selectedAwardName, setSelectedAwardName] = useState('');
  const [selectedAwardType, setSelectedAwardType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/awards'));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAwards(data);
      } catch (error) {
        console.error('Error fetching awards:', error);
        alert('Failed to fetch awards.');
      }
    };

    fetchAwards();
  }, []);

  const handleSearchAward = async () => {
    if (!selectedAwardId) {
      alert('Please select an award to search.');
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/awards/${selectedAwardId}`));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sortedData = [...data].sort((a, b) => {
        if ((a.prize_year || 0) !== (b.prize_year || 0)) {
          return (b.prize_year || 0) - (a.prize_year || 0);
        }
        return (a.title || '').localeCompare(b.title || '');
      });

      const award = awards.find((item) => item.award_id === Number.parseInt(selectedAwardId, 10));
      setSelectedAwardName(award ? award.prize_name : 'Unknown Award');
      setSelectedAwardType(award ? award.prize_type : 'unknown');
      setSelectedAwardBooks(sortedData);
    } catch (error) {
      console.error('Error fetching award books:', error);
      alert('Error fetching books for this award.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Search Books or Authors by Award</h1>
      <p>
        Select an award from the list below and click &quot;Search&quot; to view all books or authors
        that have won that award.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="award-select" style={{ marginRight: '10px' }}>
          Select an Award:
        </label>
        <select
          id="award-select"
          style={{ padding: '8px', marginRight: '10px' }}
          value={selectedAwardId}
          onChange={(e) => setSelectedAwardId(e.target.value)}
        >
          <option value="">-- Choose an Award --</option>
          {awards.map((award) => (
            <option key={award.award_id} value={award.award_id}>
              {award.prize_name}
              {award.prize_type === 'book' ? ' [Book Award]' : ' [Career Award]'}
              {award.prize_type === 'book'
                ? (Number(award.book_count) > 0 ? ` (${award.book_count} books)` : ' (no books)')
                : (Number(award.book_count) > 0 ? ` (${award.book_count} authors)` : ' (no authors)')}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearchAward}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      {selectedAwardBooks.length > 0 && (
        <div>
          <h2>
            {selectedAwardType === 'book' ? 'Books' : 'Authors'} that won: {selectedAwardName}
            <span
              style={{
                marginLeft: '10px',
                fontSize: '0.8em',
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              ({selectedAwardType === 'book' ? 'Book Award' : 'Career Award'})
            </span>
          </h2>
          <p>Total {selectedAwardType === 'book' ? 'books' : 'authors'} found: {selectedAwardBooks.length}</p>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '20px',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Award</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>
                  {selectedAwardType === 'book' ? 'Book Title' : 'Author Name'}
                </th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Prize Amount</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Year</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {selectedAwardBooks.map((book, index) => (
                <tr key={`${book.id || book.book_id || book.title}-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{book.prize_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{book.title}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {book.prize_amount != null && book.prize_amount !== ''
                      ? `$${Number(book.prize_amount).toLocaleString()}`
                      : 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{book.prize_year}</td>
                  <td
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      textAlign: 'center',
                      color: 'green',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAwardBooks.length === 0 && selectedAwardName && (
        <div style={{ marginTop: '20px', color: '#999' }}>
          <p>No {selectedAwardType === 'book' ? 'books' : 'authors'} found for this award.</p>
        </div>
      )}

      <button
        onClick={() => navigate('/homepage')}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Back to Homepage
      </button>
    </div>
  );
};

export default SearchAwards;
