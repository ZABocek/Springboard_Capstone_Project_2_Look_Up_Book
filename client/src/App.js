// App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import axios from 'axios';
import LoginSignup from './LoginSignup';
// Import other components here, if needed

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);

    // Function to check if user is authenticated
    const checkAuthentication = async () => {
        try {
            const response = await axios.get('/api/auth/check');
            setIsAuthenticated(response.data.isAuthenticated);
            setUserData(response.data.user);
        } catch (error) {
            console.error('Authentication check failed:', error);
        }
    };

    useEffect(() => {
        checkAuthentication();
    }, []);

    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    {/* Home page or landing page component */}
                </Route>
                <Route path="/login">
                    <LoginSignup mode="login" />
                </Route>
                <Route path="/signup">
                    <LoginSignup mode="signup" />
                </Route>
                {/* Define other routes and components here */}
            </Switch>
        </Router>
    );
}

export default App;
