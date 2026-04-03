import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// ---------------------------------------------------------------------------
// Mock every lazy-loaded page so tests don't need to hit the network /
// real render tree.  Jest.mock calls are hoisted to the top of the file
// by Babel so the lazy() imports in App.js will resolve these mocks.
// ---------------------------------------------------------------------------
jest.mock('./Loginsignup', () => () => <div>Login Page</div>);
jest.mock('./Homepage', () => () => <div>Homepage</div>);
jest.mock('./add-db-book', () => () => <div>Add DB Book</div>);
jest.mock('./add-new-book', () => () => <div>Add New Book</div>);
jest.mock('./admin-verification', () => () => <div>Admin Verification</div>);
jest.mock('./search-books', () => () => <div>Search Books</div>);
jest.mock('./Profile', () => () => <div>Profile</div>);
jest.mock('./search-awards', () => () => <div>Search Awards</div>);

// Helper: render and wait for the Suspense boundary to resolve
async function renderAndWait(element) {
  render(element);
  // The Suspense fallback may flash; waitFor until it resolves
  await waitFor(() => {
    expect(document.querySelector('[aria-busy]')).toBeNull();
  }, { timeout: 2000 }).catch(() => {});
}

describe('App route protection smoke tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  test('redirects unauthenticated users to login', async () => {
    window.history.pushState({}, '', '/homepage');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
  });

  test('allows authenticated users to load homepage route', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/homepage');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Homepage')).toBeInTheDocument());
  });

  test('blocks non-admin users from admin page', async () => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('isAdmin', 'false');
    window.history.pushState({}, '', '/admin-verification');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Homepage')).toBeInTheDocument());
  });

  test('allows admin users to access admin-verification page', async () => {
    localStorage.setItem('token', 'fake-admin-token');
    localStorage.setItem('isAdmin', 'true');
    window.history.pushState({}, '', '/admin-verification');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Admin Verification')).toBeInTheDocument());
  });

  test('root path redirects authenticated user to /homepage', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Homepage')).toBeInTheDocument());
  });

  test('root path redirects unauthenticated user to /login', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
  });

  test('unknown routes redirect to root', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/does-not-exist');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Homepage')).toBeInTheDocument());
  });

  test('search-books route renders for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/search-books');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Search Books')).toBeInTheDocument());
  });

  test('search-awards route renders for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/search-awards');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Search Awards')).toBeInTheDocument());
  });

  test('profile route renders for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/profile');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument());
  });

  test('add-db-book route renders for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/add-db-book');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Add DB Book')).toBeInTheDocument());
  });

  test('add-new-book route renders for authenticated user', async () => {
    localStorage.setItem('token', 'fake-token');
    window.history.pushState({}, '', '/add-new-book');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Add New Book')).toBeInTheDocument());
  });
});
