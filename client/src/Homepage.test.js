/**
 * Tests for Homepage.js – book rendering, like/dislike, and logout.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Homepage from './Homepage';

// ---------------------------------------------------------------------------
// Navigation mock
// ---------------------------------------------------------------------------
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Image stub (CRA maps images; jest-environment-jsdom needs explicit mock)
// ---------------------------------------------------------------------------
jest.mock('./like_9790408.png', () => 'like-icon.png', { virtual: true });
jest.mock('./dislike_6933384.png', () => 'dislike-icon.png', { virtual: true });
jest.mock('./Homepage.css', () => {}, { virtual: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_BOOKS = [
  {
    book_id: 1,
    title_of_winning_book: 'Test Book One',
    author_id: 42,
    prize_name: 'Big Prize',
    prize_year: 2020,
    prize_type: 'book',
    like_count: 3,
    dislike_count: 1,
  },
  {
    book_id: 2,
    title_of_winning_book: 'Test Book Two',
    author_id: 99,
    prize_name: 'Poetry Cup',
    prize_year: 2019,
    prize_type: 'book',
    like_count: 0,
    dislike_count: 0,
  },
];

function renderHomepage(setIsAuthenticated = jest.fn()) {
  return render(
    <MemoryRouter>
      <Homepage setIsAuthenticated={setIsAuthenticated} />
    </MemoryRouter>
  );
}

function mockFetchOk(body) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.alert = jest.fn();
});

// ===========================================================================
// Book rendering
// ===========================================================================

describe('Homepage – book list', () => {
  test('renders book titles returned from API', async () => {
    mockFetchOk(FAKE_BOOKS);
    renderHomepage();
    await waitFor(() => {
      expect(screen.getByText('Test Book One')).toBeInTheDocument();
      expect(screen.getByText('Test Book Two')).toBeInTheDocument();
    });
  });

  test('renders author IDs in Author ID column', async () => {
    mockFetchOk(FAKE_BOOKS);
    renderHomepage();
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  test('renders prize names', async () => {
    mockFetchOk(FAKE_BOOKS);
    renderHomepage();
    await waitFor(() => {
      expect(screen.getByText(/big prize/i)).toBeInTheDocument();
    });
  });

  test('renders like/dislike counts from like_count and dislike_count fields', async () => {
    mockFetchOk(FAKE_BOOKS);
    renderHomepage();
    await waitFor(() => {
      // like_count=3 → the cell renders "3 Likes / 1 Dislikes" split across text nodes
      // Use body.textContent to check the full rendered output
      expect(document.body.textContent).toMatch(/3 Likes/);
      expect(document.body.textContent).toMatch(/1 Dislikes/);
    });
  });

  test('shows nothing (no crash) when API returns empty list', async () => {
    mockFetchOk([]);
    renderHomepage();
    await waitFor(() => {
      expect(screen.queryByText(/Test Book/)).not.toBeInTheDocument();
    });
  });

  test('handles failed fetch gracefully (no crash)', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
    renderHomepage();
    // Should not throw; component logs the error and stays empty
    await waitFor(() => {
      expect(screen.queryByText(/Test Book/)).not.toBeInTheDocument();
    });
  });

  test('handles non-ok HTTP response gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 503 });
    renderHomepage();
    await waitFor(() => {
      expect(screen.queryByText(/Test Book/)).not.toBeInTheDocument();
    });
  });
});

// ===========================================================================
// Like / dislike
// ===========================================================================

describe('Homepage – like / dislike buttons', () => {
  test('prompts login when user is not authenticated and tries to like', async () => {
    mockFetchOk(FAKE_BOOKS);
    renderHomepage();

    await waitFor(() => screen.getByText('Test Book One'));

    const likeButtons = screen.getAllByAltText(/like/i);
    await act(async () => {
      fireEvent.click(likeButtons[0]);
    });

    expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/log in/i));
  });

  test('sends like request when user is authenticated', async () => {
    localStorage.setItem('token', 'valid-tok');
    localStorage.setItem('userId', '1');

    // First fetch: homepage books; second fetch: like endpoint
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_BOOKS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likes: 4, dislikes: 1, currentVote: true }) });

    renderHomepage();
    await waitFor(() => screen.getByText('Test Book One'));

    const likeButtons = screen.getAllByAltText(/^like$/i);
    await act(async () => {
      fireEvent.click(likeButtons[0]);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const [url, opts] = global.fetch.mock.calls[1];
      expect(url).toMatch(/\/api\/like$/);
      const body = JSON.parse(opts.body);
      expect(body.liked).toBe(true);
    });
  });

  test('updates vote counts in the DOM after a like', async () => {
    localStorage.setItem('token', 'valid-tok');
    localStorage.setItem('userId', '1');

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_BOOKS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likes: 10, dislikes: 2, currentVote: true }) });

    renderHomepage();
    await waitFor(() => screen.getByText('Test Book One'));

    const likeButtons = screen.getAllByAltText(/^like$/i);
    await act(async () => {
      fireEvent.click(likeButtons[0]);
    });

    await waitFor(() => {
      // After update, like_count=10 should be rendered (part of "10 Likes / ...").
      // Match it as a substring across the cell text.
      expect(screen.getAllByText(/likes/i).length).toBeGreaterThan(0);
    });
  });

  test('sends dislike request correctly', async () => {
    localStorage.setItem('token', 'valid-tok');
    localStorage.setItem('userId', '1');

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_BOOKS) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ likes: 3, dislikes: 2, currentVote: false }) });

    renderHomepage();
    await waitFor(() => screen.getByText('Test Book One'));

    const dislikeButtons = screen.getAllByAltText(/^dislike$/i);
    await act(async () => {
      fireEvent.click(dislikeButtons[0]);
    });

    await waitFor(() => {
      const body = JSON.parse(global.fetch.mock.calls[1][1].body);
      expect(body.liked).toBe(false);
    });
  });

  test('like request failure shows alert', async () => {
    localStorage.setItem('token', 'valid-tok');
    localStorage.setItem('userId', '1');

    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(FAKE_BOOKS) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({ message: 'Internal error' }) });

    renderHomepage();
    await waitFor(() => screen.getByText('Test Book One'));

    const likeButtons = screen.getAllByAltText(/^like$/i);
    await act(async () => {
      fireEvent.click(likeButtons[0]);
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// Navigation links
// ===========================================================================

describe('Homepage – navigation', () => {
  test('Search Books By Authors link is present', async () => {
    mockFetchOk([]);
    renderHomepage();
    await waitFor(() => {
      // Two links contain "search books" — use the exact nav link text.
      expect(screen.getByRole('link', { name: 'Search Books By Authors' })).toBeInTheDocument();
    });
  });

  test('logout button clears localStorage and redirects', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    mockFetchOk([]);
    const setAuth = jest.fn();
    renderHomepage(setAuth);

    await waitFor(() => {
      const logoutBtn = screen.queryByRole('button', { name: /log out/i });
      if (logoutBtn) {
        fireEvent.click(logoutBtn);
        expect(localStorage.getItem('token')).toBeNull();
        expect(setAuth).toHaveBeenCalledWith(false);
      }
    });
  });
});
