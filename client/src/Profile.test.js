import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from './Profile';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Profile page smoke tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    global.fetch = jest.fn();
    global.alert = jest.fn();
  });

  test('redirects to login when userId is missing', () => {
    render(<Profile userId={null} />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('loads user preferences and preferred books for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'Smoke User',
          reading_preference: 'poetry',
          favorite_genre: 'mystery',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            preference_type: 'book',
            preference_id: 42,
            book_id: 42,
            title_of_winning_book: 'Test Book',
            full_name: 'A. Author',
            prize_name: 'Some Prize',
            prize_year: 2024,
          },
        ]),
      });

    render(<Profile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Welcome, Smoke User!')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test('renders career award label instead of unknown title', async () => {
    localStorage.setItem('token', 'fake-token');

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'Smoke User',
          reading_preference: 'poetry',
          favorite_genre: 'mystery',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            preference_type: 'career',
            preference_id: 9,
            author_award_id: 9,
            title_of_winning_book: 'Career Award',
            full_name: 'Career Winner',
            prize_name: 'Lifetime Prize',
            prize_year: 2014,
          },
        ]),
      });

    render(<Profile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Career Award')).toBeInTheDocument();
    });
  });

  test('submits preference updates', async () => {
    localStorage.setItem('token', 'fake-token');

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'Smoke User',
          reading_preference: '',
          favorite_genre: '',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'ok' }),
      });

    render(<Profile userId="1" />);

    await waitFor(() => {
      expect(screen.getByText('Update Preferences')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Do you prefer prose or poetry?'), {
      target: { value: 'poetry' },
    });
    fireEvent.change(screen.getByLabelText("What's your favorite book genre?"), {
      target: { value: 'mystery' },
    });

    fireEvent.click(screen.getByText('Update Preferences'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/preference/update'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});
