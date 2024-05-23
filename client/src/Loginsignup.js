import './LoginSignup.css'; // Import the CSS file for styling
import React, { useState } from 'react'; // Import React and useState hook
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom for navigation

function LoginSignup({ setIsAuthenticated }) {
    // Define state variables for managing form inputs and login/signup state
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [isLogin, setIsLogin] = useState(true); // State to toggle between login and signup form
    const [isAdminLogin, setIsAdminLogin] = useState(false); // State to distinguish admin login
    const navigate = useNavigate(); // Hook to navigate programmatically

    // Function to handle login form submission
    const onLoginSubmit = async (event) => {
        event.preventDefault();
        // Determine the endpoint based on whether it's an admin or user login
        const endpoint = isAdminLogin ? 'admin/login' : 'login';
    
        try {
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: loginName.trim(), password: loginPassword }), // Send username and password
            });
    
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token); // Save token in localStorage
                const idKey = isAdminLogin ? 'adminId' : 'userId'; // Use different key for admin
                localStorage.setItem(idKey, data[idKey]);
                setIsAuthenticated(true); // Set authentication state
    
                // Check if the login is for an admin and fetch admin status
                if (isAdminLogin) {
                    localStorage.setItem('adminUsername', loginName); // Save admin username
                    // Fetch the admin status
                    const isAdminResponse = await fetch(`http://localhost:5000/api/is-admin/${data[idKey]}`, {
                        headers: {
                            'Authorization': `Bearer ${data.token}`, // Use the token for authorization
                        },
                    });
                    if (!isAdminResponse.ok) {
                        throw new Error('Failed to fetch admin status');
                    }
                    const isAdminData = await isAdminResponse.json();
                    if (isAdminData.isAdmin) {
                        localStorage.setItem('isAdmin', 'true'); // Store admin status
                    } else {
                        localStorage.removeItem('isAdmin'); // Ensure it's removed if not admin
                    }
                } else {
                    localStorage.removeItem('isAdmin'); // Ensure isAdmin is removed for regular users
                }
    
                navigate('/homepage'); // Navigate to homepage
            } else {
                console.error("Login error:", data.message);
            }
        } catch (error) {
            console.error("Error during login:", error.message);
        }
    };
    
    // Function to handle switching to admin login form
    const switchToAdminLogin = () => {
        setIsLogin(true);
        setIsAdminLogin(true);
    };

    // Function to handle switching to user login/sign-up form
    const switchToUserForm = () => {
        setIsAdminLogin(false);
    };

    // Function to handle registration form submission
    const onRegisterSubmit = async (event) => {
        event.preventDefault();
        const newUser = {
            username: registerName,
            email: registerEmail,
            password: registerPassword,
        };
        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser), // Send new user data
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
            const data = await response.json(); // Assuming the happy path returns JSON
            if (data.token) {
                localStorage.setItem('token', data.token); // Save token in localStorage
                localStorage.setItem('userId', data.userId); // Save userId in localStorage
                setIsAuthenticated(true); // Set authentication state
                navigate('/homepage'); // Navigate to homepage
            } else {
                console.error("Registration error:", data.message);
            }
        } catch (error) {
            console.error("Error registering new user:", error);
        }
    };

    // Function to toggle between login and signup form
    const toggleLogin = () => setIsLogin(!isLogin); 

    return (
        <div>
            <h1>{isLogin ? 'Please Log In' : 'Please Sign Up'}</h1>
            <form onSubmit={isLogin ? onLoginSubmit : onRegisterSubmit}>
                {isLogin && !isAdminLogin ? (
                    <>
                        <input
                            type="text"
                            placeholder="Username"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            autoComplete="username"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </>
                ) : null}
                {!isLogin ? (
                    <>
                        <input
                            type="text"
                            placeholder="Name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            autoComplete="name"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </>
                ) : null}
                <button type="submit" onClick={switchToUserForm}>{isLogin && !isAdminLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            {isLogin && !isAdminLogin ? (
                <button onClick={toggleLogin}>
                    {isLogin ? 'Need to create an account?' : 'Already have an account?'}
                </button>
            ) : null}
            <div style={{ marginTop: '20px' }}>
                <h2>If you are an administrator, login here:</h2>
                {isAdminLogin ? (
                    <form onSubmit={onLoginSubmit}>
                        <input
                            type="text"
                            placeholder="Admin Username"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            autoComplete="username"
                        />
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        <button type="submit">Login as Admin</button>
                    </form>
                ) : (
                    <button onClick={switchToAdminLogin}>Login as Admin</button>
                )}
            </div>
        </div>
    );
}

export default LoginSignup; // Export the LoginSignup component
