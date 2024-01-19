import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import Homepage from './Homepage'; // You need to create this component

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Placeholder function to check authentication status
  useEffect(() => {
    // You should replace this with actual authentication check logic
    if (isAuthenticated) {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }}, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginSignup />} />
        
        <Route path="/homepage" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
