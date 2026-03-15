import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './add-db-book.css';
import { buildApiUrl, getAuthHeaders } from './api';

function AddDbBook({ userId }) {
  const [books, setBooks] = useState([]);
  const [selectedEntryValue, setSelectedEntryValue] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const [selectedPrefix, setSelectedPrefix] = useState('');
  const [selectedAwardScope, setSelectedAwardScope] = useState('all');
  const [selectedAuthorKey, setSelectedAuthorKey] = useState('');
  const [authorPage, setAuthorPage] = useState(1);
  const [booksPage, setBooksPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const AUTHORS_PER_PAGE = 24;
  const BOOKS_PER_PAGE = 20;

  const normalizeText = (value) => (value || '').trim().toLowerCase();
  const getInitialLetter = (lastName) => {
    const firstChar = (lastName || '').trim().charAt(0).toUpperCase();
    return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
  };
  const getPrefix = (lastName) => {
    const cleaned = (lastName || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!cleaned) return '#';
    return cleaned.slice(0, Math.min(3, cleaned.length));
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch(buildApiUrl('/api/books-for-profile'))
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch books.');
        }
        return response.json();
      })
      .then((data) => {
        const sortedBooks = [...data].sort((a, b) => {
          const lastNameA = (a.author_last_name || '').toLowerCase();
          const lastNameB = (b.author_last_name || '').toLowerCase();

          if (lastNameA !== lastNameB) {
            return lastNameA.localeCompare(lastNameB);
          }

          const firstNameA = (a.author_first_name || '').toLowerCase();
          const firstNameB = (b.author_first_name || '').toLowerCase();
          if (firstNameA !== firstNameB) {
            return firstNameA.localeCompare(firstNameB);
          }

          return (a.clean_title || '').localeCompare(b.clean_title || '', undefined, { sensitivity: 'base' });
        });

        setBooks(sortedBooks);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching books:', error);
        setLoading(false);
      });
  }, [navigate, userId]);

  const indexedBooks = useMemo(
    () =>
      books.map((book) => {
        const authorLastName = (book.author_last_name || '').trim();
        const authorFirstName = (book.author_first_name || '').trim();
        const initialLetter = getInitialLetter(authorLastName);
        const prefix = getPrefix(authorLastName);
        const authorKey = `${normalizeText(authorLastName)}|${normalizeText(authorFirstName)}`;
        const searchBlob = [book.clean_title, authorLastName, authorFirstName, book.prize_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const authorAwardScope = (book.author_award_scope || 'book').toLowerCase();

        return {
          ...book,
          entryType: book.entry_type || (book.author_award_id != null ? 'career' : 'book'),
          entryId: book.entry_id || book.author_award_id || book.book_id,
          authorLastName,
          authorFirstName,
          initialLetter,
          prefix,
          authorKey,
          searchBlob,
          authorAwardScope,
        };
      }),
    [books]
  );

  const availableLetters = useMemo(() => {
    const set = new Set(indexedBooks.map((book) => book.initialLetter));
    return Array.from(set).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
  }, [indexedBooks]);

  useEffect(() => {
    if (!selectedLetter && availableLetters.length > 0) {
      setSelectedLetter(availableLetters[0]);
    }
  }, [availableLetters, selectedLetter]);

  const booksForLetter = useMemo(
    () => indexedBooks.filter((book) => (selectedLetter ? book.initialLetter === selectedLetter : true)),
    [indexedBooks, selectedLetter]
  );

  const availablePrefixes = useMemo(() => {
    const set = new Set(booksForLetter.map((book) => book.prefix));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [booksForLetter]);

  useEffect(() => {
    if (availablePrefixes.length === 0) {
      setSelectedPrefix('');
      return;
    }

    if (!selectedPrefix || !availablePrefixes.includes(selectedPrefix)) {
      setSelectedPrefix(availablePrefixes[0]);
      setAuthorPage(1);
      setBooksPage(1);
      setSelectedAuthorKey('');
    }
  }, [availablePrefixes, selectedPrefix]);

  const narrowedBooks = useMemo(() => {
    const prefixFiltered = booksForLetter.filter((book) => (selectedPrefix ? book.prefix === selectedPrefix : true));
    const trimmedQuery = query.trim().toLowerCase();
    const scopeFiltered = prefixFiltered.filter((book) =>
      selectedAwardScope === 'all' ? true : book.authorAwardScope === selectedAwardScope
    );

    if (!trimmedQuery) {
      return scopeFiltered;
    }

    return scopeFiltered.filter((book) => book.searchBlob.includes(trimmedQuery));
  }, [booksForLetter, selectedPrefix, selectedAwardScope, query]);

  const authorGroups = useMemo(() => {
    const map = new Map();

    narrowedBooks.forEach((book) => {
      const existing = map.get(book.authorKey);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(book.authorKey, {
          authorKey: book.authorKey,
          authorLastName: book.authorLastName || 'Unknown',
          authorFirstName: book.authorFirstName || '',
          authorAwardScope: book.authorAwardScope,
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const lastNameComparison = a.authorLastName.localeCompare(b.authorLastName, undefined, { sensitivity: 'base' });
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }
      return a.authorFirstName.localeCompare(b.authorFirstName, undefined, { sensitivity: 'base' });
    });
  }, [narrowedBooks]);

  useEffect(() => {
    setAuthorPage(1);
    setBooksPage(1);
  }, [selectedLetter, selectedPrefix, selectedAwardScope, query]);

  useEffect(() => {
    if (authorGroups.length === 0) {
      setSelectedAuthorKey('');
      return;
    }

    if (!selectedAuthorKey || !authorGroups.some((author) => author.authorKey === selectedAuthorKey)) {
      setSelectedAuthorKey(authorGroups[0].authorKey);
      setBooksPage(1);
    }
  }, [authorGroups, selectedAuthorKey]);

  const totalAuthorPages = Math.max(1, Math.ceil(authorGroups.length / AUTHORS_PER_PAGE));
  const authorStartIndex = (authorPage - 1) * AUTHORS_PER_PAGE;
  const visibleAuthors = authorGroups.slice(authorStartIndex, authorStartIndex + AUTHORS_PER_PAGE);

  const booksForSelectedAuthor = useMemo(
    () => narrowedBooks.filter((book) => book.authorKey === selectedAuthorKey),
    [narrowedBooks, selectedAuthorKey]
  );

  const totalBookPages = Math.max(1, Math.ceil(booksForSelectedAuthor.length / BOOKS_PER_PAGE));
  const bookStartIndex = (booksPage - 1) * BOOKS_PER_PAGE;
  const visibleBooks = booksForSelectedAuthor.slice(bookStartIndex, bookStartIndex + BOOKS_PER_PAGE);

  useEffect(() => {
    if (authorPage > totalAuthorPages) {
      setAuthorPage(totalAuthorPages);
    }
  }, [authorPage, totalAuthorPages]);

  useEffect(() => {
    if (booksPage > totalBookPages) {
      setBooksPage(totalBookPages);
    }
  }, [booksPage, totalBookPages]);

  const generateRangePaginationLinks = (current, total, perPage, totalItems) => {
    const links = [];
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(total, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      links.push({
        pageNum: 1,
        label: `1-${Math.min(perPage, totalItems)}`,
      });
    }

    for (let pageNum = startPage; pageNum <= endPage; pageNum += 1) {
      const rangeStart = (pageNum - 1) * perPage + 1;
      const rangeEnd = Math.min(pageNum * perPage, totalItems);
      links.push({
        pageNum,
        label: `${rangeStart}-${rangeEnd}`,
      });
    }

    if (endPage < total) {
      const lastRangeStart = (total - 1) * perPage + 1;
      links.push({
        pageNum: total,
        label: `${lastRangeStart}-${totalItems}`,
      });
    }

    return links;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add items to your profile.');
      navigate('/login');
      return;
    }

    if (!selectedEntryValue) {
      alert('Please select an entry from the list.');
      return;
    }

    const [entryType, rawEntryId] = selectedEntryValue.split(':');
    const entryId = Number(rawEntryId);

    try {
      const response = await fetch(buildApiUrl('/api/user/add-book'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          userId,
          entryType,
          entryId,
          bookId: entryType === 'book' ? entryId : null,
          authorAwardId: entryType === 'career' ? entryId : null,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          alert('Your session has expired. Please log in again.');
          navigate('/login');
          return;
        }
        throw new Error(payload.message || 'Failed to add book to profile.');
      }

      alert(payload.message || 'Selection added to profile successfully!');
      setSelectedEntryValue('');
    } catch (error) {
      alert(error.message || 'Failed to add book to profile.');
    }
  };

  if (loading) {
    return (
      <div className="add-db-book-container">
        <p>Loading books...</p>
      </div>
    );
  }

  const authorPaginationLinks = generateRangePaginationLinks(
    authorPage,
    totalAuthorPages,
    AUTHORS_PER_PAGE,
    authorGroups.length
  );
  const bookPaginationLinks = generateRangePaginationLinks(
    booksPage,
    totalBookPages,
    BOOKS_PER_PAGE,
    booksForSelectedAuthor.length
  );

  return (
    <div className="add-db-book-container">
      <h1>Add a Book to Your Profile</h1>
      <p className="subtitle">
        Browse by author last-name letter, then author, then title. This keeps large lists fast and easy to scan.
      </p>

      <form onSubmit={handleSubmit} className="add-book-form">
        <div className="lookup-controls">
          <label htmlFor="author-book-query" className="lookup-label">
            Quick search within selected letter and sublist
          </label>
          <input
            id="author-book-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type author last name, first name, title, or prize"
            className="lookup-search"
          />
        </div>

        <div className="letter-grid" role="group" aria-label="Author last-name initials">
          {availableLetters.map((letter) => (
            <button
              key={letter}
              type="button"
              className={`letter-chip ${selectedLetter === letter ? 'active' : ''}`}
              onClick={() => {
                setSelectedLetter(letter);
                setSelectedPrefix('');
                setSelectedAuthorKey('');
                setAuthorPage(1);
                setBooksPage(1);
              }}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="sublist-grid" role="group" aria-label="Author last-name prefixes">
          {availablePrefixes.map((prefix) => (
            <button
              key={prefix}
              type="button"
              className={`sublist-chip ${selectedPrefix === prefix ? 'active' : ''}`}
              onClick={() => {
                setSelectedPrefix(prefix);
                setSelectedAuthorKey('');
                setAuthorPage(1);
                setBooksPage(1);
              }}
            >
              {prefix}
            </button>
          ))}
        </div>

        <div className="scope-grid" role="group" aria-label="Author award scope filters">
          {[
            { value: 'all', label: 'All Award Scopes' },
            { value: 'book', label: 'Book Awards' },
            { value: 'career', label: 'Career Awards' },
            { value: 'both', label: 'Both Types' },
          ].map((scope) => (
            <button
              key={scope.value}
              type="button"
              className={`scope-chip ${selectedAwardScope === scope.value ? 'active' : ''}`}
              onClick={() => {
                setSelectedAwardScope(scope.value);
                setSelectedAuthorKey('');
                setAuthorPage(1);
                setBooksPage(1);
              }}
            >
              {scope.label}
            </button>
          ))}
        </div>

        <div className="results-layout">
          <div className="authors-panel">
            <h2>Authors</h2>
            <p className="page-info">
              {authorGroups.length === 0
                ? 'No authors in this slice.'
                : `Showing ${authorStartIndex + 1}-${Math.min(authorStartIndex + AUTHORS_PER_PAGE, authorGroups.length)} of ${authorGroups.length} authors`}
            </p>

            <div className="authors-list">
              {visibleAuthors.length > 0 ? (
                visibleAuthors.map((author) => (
                  <button
                    key={author.authorKey}
                    type="button"
                    className={`author-item ${selectedAuthorKey === author.authorKey ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAuthorKey(author.authorKey);
                      setBooksPage(1);
                    }}
                  >
                    <span className="author-name">
                      {author.authorLastName}
                      {author.authorFirstName ? `, ${author.authorFirstName}` : ''}
                    </span>
                    <span className="author-meta">
                      <span className="author-scope-badge">{author.authorAwardScope}</span>
                      <span className="author-count">{author.count}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p>No matching authors.</p>
              )}
            </div>

            {totalAuthorPages > 1 && (
              <div className="pagination">
                {authorPaginationLinks.map((link, idx) => (
                  <span key={link.pageNum}>
                    {idx > 0 && <span className="pagination-separator"> | </span>}
                    <button
                      type="button"
                      className={`pagination-link ${authorPage === link.pageNum ? 'active' : ''}`}
                      onClick={() => setAuthorPage(link.pageNum)}
                    >
                      {link.label}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="books-panel">
            <h2>Books by Selected Author</h2>
            <p className="page-info">
              {booksForSelectedAuthor.length === 0
                ? 'Select an author to view books.'
                : `Showing ${bookStartIndex + 1}-${Math.min(bookStartIndex + BOOKS_PER_PAGE, booksForSelectedAuthor.length)} of ${booksForSelectedAuthor.length} books`}
            </p>

            <div className="books-list">
              {visibleBooks.length > 0 ? (
                visibleBooks.map((book) => {
                  const displayText = `${book.clean_title} — ${book.prize_name} (${book.prize_year})`;
                  const optionValue = `${book.entryType}:${book.entryId}`;
                  return (
                    <div key={optionValue} className="book-item">
                      <input
                        type="radio"
                        id={`book-${optionValue}`}
                        name="book-selection"
                        value={optionValue}
                        checked={selectedEntryValue === optionValue}
                        onChange={(e) => setSelectedEntryValue(e.target.value)}
                      />
                      <label htmlFor={`book-${optionValue}`}>{displayText}</label>
                    </div>
                  );
                })
              ) : (
                <p>No books found in this author slice.</p>
              )}
            </div>

            {totalBookPages > 1 && (
              <div className="pagination">
                {bookPaginationLinks.map((link, idx) => (
                  <span key={link.pageNum}>
                    {idx > 0 && <span className="pagination-separator"> | </span>}
                    <button
                      type="button"
                      className={`pagination-link ${booksPage === link.pageNum ? 'active' : ''}`}
                      onClick={() => setBooksPage(link.pageNum)}
                    >
                      {link.label}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="add-button">
          Add Selected Entry to Profile
        </button>
      </form>

      <div className="navigation-buttons">
        <button onClick={() => navigate('/homepage')} className="nav-button">
          Back to Homepage
        </button>
        <button onClick={() => navigate('/profile')} className="nav-button">
          Proceed to Profile
        </button>
      </div>
    </div>
  );
}

export default AddDbBook;
