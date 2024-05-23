import React, { useState, useEffect } from 'react'; // Import React and necessary hooks
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // Import React Router components
import LoginSignup from './LoginSignup'; // Import LoginSignup component
import Homepage from './Homepage'; // Import Homepage component
import AddDbBook from './add-db-book'; // Import AddDbBook component
import AddNewBook from './add-new-book'; // Import AddNewBook component
import AdminVerification from './admin-verification'; // Import AdminVerification component
import SearchBooks from './search-books'; // Import SearchBooks component
import Profile from './Profile'; // Import the Profile component
import SearchAwards from './search-awards'; // Import SearchAwards component

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // State to track authentication status

    useEffect(() => {
        const token = localStorage.getItem('token'); // Get token from localStorage
        setIsAuthenticated(!!token); // Set authentication status based on token presence
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <Router>
            <Routes>
                {/* If authenticated, navigate to Homepage, otherwise to LoginSignup */}
                <Route path="/" element={isAuthenticated ? <Navigate replace to="/homepage" /> : <Navigate replace to="/login" />} />
                {/* Route for login/signup page */}
                <Route path="/login" element={<LoginSignup setIsAuthenticated={setIsAuthenticated} />} />
                {/* Route for homepage */}
                <Route path="/homepage" element={<Homepage />} />
                {/* Route for adding a database book, passing userId from localStorage */}
                <Route path="/add-db-book" element={<AddDbBook userId={localStorage.getItem('userId')} />} />
                {/* Route for adding a new book */}
                <Route path="/add-new-book" element={<AddNewBook />} />
                {/* Route for admin verification */}
                <Route path="/admin-verification" element={<AdminVerification />} />
                {/* Route for searching books */}
                <Route path="/search-books" element={<SearchBooks />} />
                {/* Route for user profile, passing userId from localStorage */}
                <Route path="/profile" element={<Profile userId={localStorage.getItem('userId')} />} />
                {/* Route for searching awards */}
                <Route path="/search-awards" element={<SearchAwards />} />
            </Routes>
        </Router>
    );
}

export default App; // Export the App component as default export
