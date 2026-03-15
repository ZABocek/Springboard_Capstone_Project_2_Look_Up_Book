import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./Loginsignup', () => () => <div>Login Page</div>);
jest.mock('./Homepage', () => () => <div>Homepage</div>);
jest.mock('./add-db-book', () => () => <div>Add DB Book</div>);
jest.mock('./add-new-book', () => () => <div>Add New Book</div>);
jest.mock('./admin-verification', () => () => <div>Admin Verification</div>);
jest.mock('./search-books', () => () => <div>Search Books</div>);
jest.mock('./Profile', () => () => <div>Profile</div>);
jest.mock('./search-awards', () => () => <div>Search Awards</div>);

describe('App route protection smoke tests', () => {
	beforeEach(() => {
		localStorage.clear();
		window.history.pushState({}, '', '/');
	});

	test('redirects unauthenticated users to login', () => {
		window.history.pushState({}, '', '/homepage');
		render(<App />);
		expect(screen.getByText('Login Page')).toBeInTheDocument();
	});

	test('allows authenticated users to load homepage route', () => {
		localStorage.setItem('token', 'fake-token');
		window.history.pushState({}, '', '/homepage');
		render(<App />);
		expect(screen.getByText('Homepage')).toBeInTheDocument();
	});

	test('blocks non-admin users from admin page', () => {
		localStorage.setItem('token', 'fake-token');
		localStorage.setItem('isAdmin', 'false');
		window.history.pushState({}, '', '/admin-verification');
		render(<App />);
		expect(screen.getByText('Homepage')).toBeInTheDocument();
	});
});
