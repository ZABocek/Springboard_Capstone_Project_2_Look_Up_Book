import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import Homepage from './Homepage'; // Ensure this component is correctly imported

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Placeholder function to check authentication status
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={isAuthenticated ? <Homepage /> : <LoginSignup />} />
                <Route path="/homepage" element={<Homepage />} />
            </Routes>
        </Router>
    );
}

export default App;
