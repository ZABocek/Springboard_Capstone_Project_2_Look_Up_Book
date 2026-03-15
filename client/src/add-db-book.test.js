import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddDbBook from './add-db-book';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('AddDbBook indexed lookup behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.alert = jest.fn();
    localStorage.setItem('token', 'fake-token');
  });

  test('redirects to login if userId is missing', () => {
    render(<AddDbBook userId={null} />);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('lets user filter by author last-name initial and select a title', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          book_id: 1,
          clean_title: 'Atlas Light',
          author_first_name: 'Zoe',
          author_last_name: 'Adams',
          prize_name: 'Prize A',
          prize_year: '2001',
        },
        {
          book_id: 2,
          clean_title: 'Blue Harbor',
          author_first_name: 'Amy',
          author_last_name: 'Brown',
          prize_name: 'Prize B',
          prize_year: '2002',
        },
        {
          book_id: 3,
          clean_title: 'Breeze Notes',
          author_first_name: 'Bob',
          author_last_name: 'Brown',
          prize_name: 'Prize C',
          prize_year: '2003',
        },
      ],
    });

    render(<AddDbBook userId="7" />);

    await waitFor(() => {
      expect(screen.getByText('Authors')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'B' }));

    expect(screen.getByRole('button', { name: /Brown, Amy/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Brown, Bob/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Brown, Amy/ }));

    expect(screen.getByLabelText(/Blue Harbor/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Atlas Light/)).not.toBeInTheDocument();
  });
});
