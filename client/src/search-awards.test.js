/**
 * Tests for search-awards.js – award dropdown, book/career counts, search results, edge cases.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchAwards from './search-awards';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const FAKE_AWARDS = [
  { award_id: 1, prize_name: 'Booker Prize', prize_type: 'book', book_count: '5' },
  { award_id: 2, prize_name: 'PEN/Faulkner', prize_type: 'book', book_count: '0' },
  { award_id: 3, prize_name: 'Lifetime Achievement', prize_type: 'career', book_count: '3' },
  { award_id: 4, prize_name: 'Silent Award', prize_type: 'career', book_count: '0' },
];

const FAKE_AWARD_BOOKS = [
  { book_id: 10, title: 'Novel A', prize_name: 'Booker Prize', prize_year: 2022, prize_amount: 50000, verified: true },
  { book_id: 11, title: 'Novel B', prize_name: 'Booker Prize', prize_year: 2021, prize_amount: null, verified: true },
  { book_id: 12, title: 'Novel C', prize_name: 'Booker Prize', prize_year: 2023, prize_amount: 0, verified: true },
];

const FAKE_CAREER_AUTHORS = [
  { id: 20, title: 'Author X Career', prize_name: 'Lifetime Achievement', prize_year: 2020, prize_amount: null },
  { id: 21, title: 'Author Y Career', prize_name: 'Lifetime Achievement', prize_year: 2018, prize_amount: null },
];

function mockFetchSequence(...responses) {
  const mockFn = jest.fn();
  responses.forEach((body, i) => {
    mockFn.mockResolvedValueOnce({
      ok: body !== null,
      json: () => Promise.resolve(body ?? []),
    });
  });
  global.fetch = mockFn;
}

function renderComponent() {
  return render(
    <MemoryRouter>
      <SearchAwards />
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.alert = jest.fn();
});

// ===========================================================================
// Initial render & award list
// ===========================================================================

describe('SearchAwards – initial render', () => {
  test('renders page heading', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    expect(screen.getByText(/search books or authors by award/i)).toBeInTheDocument();
  });

  test('renders award dropdown with default option', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    expect(screen.getByText(/choose an award/i)).toBeInTheDocument();
  });

  test('populates dropdown with all awards after fetch', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/booker prize/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/pen\/faulkner/i)).toBeInTheDocument();
    expect(screen.getByText(/lifetime achievement/i)).toBeInTheDocument();
  });

  test('shows "(5 books)" suffix for book-type awards with books', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));
    const option = screen.getByText(/booker prize.*5 books/i);
    expect(option).toBeInTheDocument();
  });

  test('shows "(no books)" for book-type award with 0 books', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/pen\/faulkner/i));
    const option = screen.getByText(/pen\/faulkner.*no books/i);
    expect(option).toBeInTheDocument();
  });

  test('shows "(3 authors)" for career-type award with authors', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/lifetime achievement/i));
    const option = screen.getByText(/lifetime achievement.*3 authors/i);
    expect(option).toBeInTheDocument();
  });

  test('shows "(no authors)" for career-type award with 0 count', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/silent award/i));
    const option = screen.getByText(/silent award.*no authors/i);
    expect(option).toBeInTheDocument();
  });

  test('handles failed awards fetch with alert', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    renderComponent();
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/failed to fetch awards/i));
    });
  });

  test('handles network error during awards fetch with alert', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network'));
    renderComponent();
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/failed to fetch awards/i));
    });
  });

  test('renders Search button', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  test('renders Back to Homepage button', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    expect(screen.getByRole('button', { name: /back to homepage/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// Validation
// ===========================================================================

describe('SearchAwards – validation', () => {
  test('alerts when Search clicked with no award selected', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });
    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/please select an award/i));
  });

  test('does not fetch award detail when no award is selected', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));
    const callsBefore = global.fetch.mock.calls.length;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });
    expect(global.fetch.mock.calls.length).toBe(callsBefore);
  });
});

// ===========================================================================
// Searching
// ===========================================================================

describe('SearchAwards – search results (book award)', () => {
  test('fetches award detail when valid award selected and Search clicked', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/novel a/i)).toBeInTheDocument();
    });
  });

  test('shows all returned books in the results table', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => screen.getByText(/novel a/i));
    expect(screen.getByText(/novel b/i)).toBeInTheDocument();
    expect(screen.getByText(/novel c/i)).toBeInTheDocument();
  });

  test('displays prize amount formatted as dollars', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => screen.getByText(/50,000/i));
  });

  test('shows N/A when prize_amount is null', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => screen.getByText(/n\/a/i));
  });

  test('results are sorted by prize_year descending', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => screen.getByText(/novel a/i));

    // First row should be the most recent year (2023 = Novel C)
    const rows = screen.getAllByRole('row');
    // row[0] = thead, rows[1..] = data rows
    expect(rows[1].textContent).toMatch(/novel c/i);
  });

  test('shows award heading with award name', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize.*book award/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/books that won.*booker prize/i)).toBeInTheDocument();
    });
  });

  test('shows total books count', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARD_BOOKS) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => screen.getByText(/total books found: 3/i));
  });
});

// ===========================================================================
// Career award results
// ===========================================================================

describe('SearchAwards – search results (career award)', () => {
  test('shows "Authors that won" heading for career award', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_CAREER_AUTHORS) });

    renderComponent();
    await waitFor(() => screen.getByText(/lifetime achievement/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/authors that won.*lifetime achievement/i)).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Empty results
// ===========================================================================

describe('SearchAwards – empty results', () => {
  test('shows no-results message when award returns empty array', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/no books found for this award/i)).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Award detail fetch failure
// ===========================================================================

describe('SearchAwards – award detail error handling', () => {
  test('alerts on non-ok response from award detail endpoint', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockResolvedValueOnce({ ok: false });

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringMatching(/error fetching books for this award/i)
      );
    });
  });

  test('alerts on network error fetching award detail', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_AWARDS) })
      .mockRejectedValueOnce(new Error('Network'));

    renderComponent();
    await waitFor(() => screen.getByText(/booker prize/i));

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringMatching(/error fetching books for this award/i)
      );
    });
  });
});

// ===========================================================================
// Back to Homepage navigation
// ===========================================================================

describe('SearchAwards – navigation', () => {
  test('Back to Homepage button navigates to /homepage', async () => {
    mockFetchSequence(FAKE_AWARDS);
    renderComponent();
    await waitFor(() => screen.getByRole('button', { name: /back to homepage/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /back to homepage/i }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });
});
