import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import Homepage from './Homepage';
import AddDbBook from './add-db-book';
import SearchBooks from './search-books';
import Profile from './Profile'; // Import the Profile component
import SearchAwards from './search-awards';
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);
    return (
        <Router>
            <Routes>
                {/* If authenticated, navigate to Homepage, otherwise to LoginSignup */}
                <Route path="/" element={isAuthenticated ? <Navigate replace to="/homepage" /> : <Navigate replace to="/login" />} />
                <Route path="/login" element={<LoginSignup setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/add-db-book" element={<AddDbBook userId={localStorage.getItem('userId')} />} />
                <Route path="/add-new-book" element={<AddNewBook />} />
                <Route path="/admin-verification" element={<AdminVerification />} />
                <Route path="/search-books" element={<SearchBooks />} />
                <Route path="/profile" element={<Profile userId={localStorage.getItem('userId')} />} />
                <Route path="/search-awards" element={<SearchAwards />} />
            </Routes>
        </Router>
    );
}
export default App;
