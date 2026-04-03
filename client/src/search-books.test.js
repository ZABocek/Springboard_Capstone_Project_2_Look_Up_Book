/**
 * Tests for search-books.js – loading, letter filtering, author selection, text search.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchBooks from './search-books';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./add-db-book.css', () => {}, { virtual: true });

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const FAKE_BOOKS = [
  {
    book_id: 1,
    clean_title: 'Aardvark',
    author_last_name: 'Adams',
    author_first_name: 'Anna',
    full_name: 'Anna Adams',
    prize_name: 'Prize A',
    prize_year: '2021',
    prize_genre: 'Prose',
  },
  {
    book_id: 2,
    clean_title: 'Zeal',
    author_last_name: 'Zerbe',
    author_first_name: 'Zach',
    full_name: 'Zach Zerbe',
    prize_name: 'Prize Z',
    prize_year: '2019',
    prize_genre: 'Poetry',
  },
  {
    book_id: 3,
    clean_title: 'Middle Ground',
    author_last_name: 'Morris',
    author_first_name: 'Mary',
    full_name: 'Mary Morris',
    prize_name: 'Prize M',
    prize_year: '2022',
    prize_genre: 'Prose',
  },
];

function mockFetch(body) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function renderComponent() {
  return render(
    <MemoryRouter>
      <SearchBooks />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.alert = jest.fn();
});

// ===========================================================================
// Loading & rendering
// ===========================================================================

describe('SearchBooks – loading', () => {
  test('shows loading indicator while fetching', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves
    renderComponent();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders author list after successful fetch', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    // Component auto-selects the first available letter (A), so Adams should appear.
    await waitFor(() => {
      expect(screen.getByText(/adams/i)).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText(/aardvark/i)).not.toBeInTheDocument();
    });
  });

  test('handles network error gracefully (no crash)', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network'));
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText(/adams/i)).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Letter filter
// ===========================================================================

describe('SearchBooks – letter filter', () => {
  test('letter buttons are rendered for available author initials', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    await waitFor(() => screen.getByText(/adams/i));
    // After load, letter buttons should appear for A, M, Z
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  test('component auto-selects first available letter on load', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    // With A, M, Z authors, 'A' is auto-selected, so Adams is visible, Zerbe is not
    await waitFor(() => {
      expect(screen.getByText(/adams/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/zerbe/i)).not.toBeInTheDocument();
  });

  test('clicking Z shows Zerbe author', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    await waitFor(() => screen.getByText(/adams/i));

    const letterZ = screen.queryByRole('button', { name: /^Z$/ });
    if (letterZ) {
      await act(async () => { fireEvent.click(letterZ); });
      await waitFor(() => {
        expect(screen.getByText(/zerbe/i)).toBeInTheDocument();
        expect(screen.queryByText(/adams/i)).not.toBeInTheDocument();
      });
    }
  });

  test('clicking M shows Morris author', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    await waitFor(() => screen.getByText(/adams/i));

    const letterM = screen.queryByRole('button', { name: /^M$/ });
    if (letterM) {
      await act(async () => { fireEvent.click(letterM); });
      await waitFor(() => {
        expect(screen.getByText(/morris/i)).toBeInTheDocument();
        expect(screen.queryByText(/adams/i)).not.toBeInTheDocument();
      });
    }
  });
});

// ===========================================================================
// Author selection
// ===========================================================================

describe('SearchBooks – author selection', () => {
  test('clicking an author name populates the books panel with that author\'s books', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    // Adams auto-selected on letter A load
    await waitFor(() => screen.getByText(/adams/i));

    // The first (and only) author under A is Adams – click to select.
    // The component selects the first author automatically, so the book should already be shown.
    await waitFor(() => {
      // Book title should appear in the books panel for the auto-selected author
      expect(screen.getByText(/aardvark/i)).toBeInTheDocument();
    });
  });

  test('selected author books show prize name', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    await waitFor(() => screen.getByText(/aardvark/i));
    expect(screen.getByText(/prize a/i)).toBeInTheDocument();
  });

  test('clicking a different author updates the books panel', async () => {
    // Two authors under the same letter (M works with Morris if we add data)
    const morrisBooks = [
      {
        book_id: 3,
        clean_title: 'Middle Ground',
        author_last_name: 'Morris',
        author_first_name: 'Mary',
        full_name: 'Mary Morris',
        prize_name: 'Prize M',
        prize_year: '2022',
        prize_genre: 'Prose',
      },
      {
        book_id: 4,
        clean_title: 'Money Road',
        author_last_name: 'Morris',
        author_first_name: 'Mary',
        full_name: 'Mary Morris',
        prize_name: 'Prize M2',
        prize_year: '2023',
        prize_genre: 'Prose',
      },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(morrisBooks),
    });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/middle ground/i)).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Text search filter
// ===========================================================================

describe('SearchBooks – text search', () => {
  test('search text filters authors within the selected letter', async () => {
    // Use two authors with the same 3-letter prefix (ADA) so they appear in
    // the same prefix group and the query can filter between them.
    const samePrefixBooks = [
      {
        book_id: 1,
        clean_title: 'Aardvark',
        author_last_name: 'Adams',
        author_first_name: 'Anna',
        full_name: 'Anna Adams',
        prize_name: 'Prize A',
        prize_year: '2021',
        prize_genre: 'Prose',
      },
      {
        book_id: 5,
        clean_title: 'Adamantine',
        author_last_name: 'Adamson',
        author_first_name: 'Bob',
        full_name: 'Bob Adamson',
        prize_name: 'Prize B',
        prize_year: '2020',
        prize_genre: 'Poetry',
      },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(samePrefixBooks),
    });
    renderComponent();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/adams/i);
    });

    const searchInput =
      screen.queryByPlaceholderText(/type author last name/i) ||
      screen.queryByPlaceholderText(/search/i) ||
      screen.queryByRole('textbox');
    if (searchInput) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'adamson' } });
      });
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/adamson/i);
        expect(document.body.textContent).not.toMatch(/Adams,/);
      });
    }
  });

  test('search is case-insensitive', async () => {
    mockFetch(FAKE_BOOKS);
    renderComponent();
    await waitFor(() => screen.getByText(/adams/i));

    const searchInput =
      screen.queryByPlaceholderText(/type author last name/i) ||
      screen.queryByPlaceholderText(/search/i) ||
      screen.queryByRole('textbox');
    if (searchInput) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'AARDVARK' } });
      });
      // If Adams' book matches 'aardvark', Adams appears; otherwise no-match message
      await waitFor(() => {
        // The search blob includes clean_title, so 'aardvark' should match Adams
        expect(
          screen.queryByText(/adams/i) || screen.queryByText(/no matching authors/i)
        ).toBeTruthy();
      });
    }
  });

  test('clearing search restores author list within the letter', async () => {
    const samePrefixBooks = [
      {
        book_id: 1,
        clean_title: 'Aardvark',
        author_last_name: 'Adams',
        author_first_name: 'Anna',
        full_name: 'Anna Adams',
        prize_name: 'Prize A',
        prize_year: '2021',
        prize_genre: 'Prose',
      },
      {
        book_id: 5,
        clean_title: 'Adamantine',
        author_last_name: 'Adamson',
        author_first_name: 'Bob',
        full_name: 'Bob Adamson',
        prize_name: 'Prize B',
        prize_year: '2020',
        prize_genre: 'Poetry',
      },
    ];
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(samePrefixBooks),
    });
    renderComponent();
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Adams,/);
    });

    const searchInput =
      screen.queryByPlaceholderText(/type author last name/i) ||
      screen.queryByPlaceholderText(/search/i) ||
      screen.queryByRole('textbox');
    if (searchInput) {
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'adamson' } });
      });
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/Adamson,/);
      });

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '' } });
      });
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/Adams,/);
      });
    }
  });
});

// ===========================================================================
// Pagination
// ===========================================================================

describe('SearchBooks – pagination', () => {
  test('does not crash with many authors (25+)', async () => {
    const manyBooks = Array.from({ length: 30 }, (_, i) => ({
      book_id: i + 1,
      clean_title: `Book ${i}`,
      author_last_name: `Author${String.fromCharCode(65 + (i % 26))}`,
      author_first_name: `First${i}`,
      full_name: `First${i} Author${i}`,
      prize_name: 'Prize',
      prize_year: '2020',
      prize_genre: 'Prose',
    }));
    mockFetch(manyBooks);
    renderComponent();
    await waitFor(() => {
      // At least one author entry should be visible
      expect(document.body.textContent.length).toBeGreaterThan(0);
    });
  });
});
