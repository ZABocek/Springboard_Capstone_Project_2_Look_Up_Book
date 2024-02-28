import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import Homepage from './Homepage';
import SearchBooks from './search-books';
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
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/homepage" element={<Homepage />} />
                <Route path="/search-books" element={<SearchBooks />} />
                <Route path="/search-awards" element={<SearchAwards />} />
            </Routes>
        </Router>
    );
}

export default App;
