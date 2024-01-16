import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginSignup from './LoginSignup';
import Homepage from './Homepage'; // You need to create this component

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Placeholder function to check authentication status
  useEffect(() => {
    // You should replace this with actual authentication check logic
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Switch>
        <Route exact path="/">
          {isAuthenticated ? <Homepage /> : <LoginSignup />}
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
