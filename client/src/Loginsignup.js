import './LoginSignup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Other necessary imports

function LoginSignup() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [isLogin, setIsLogin] = useState(true); // isLogin state defined here

    const navigate = useNavigate();

    const onLoginSubmit = (event) => {
        event.preventDefault();
        // Your existing login logic
        navigate('/Homepage');
    };

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
                body: JSON.stringify(newUser),
            });
    
            if (!response.ok) {
                // Attempt to read the response as text if it's not OK and not JSON
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }
    
            const data = await response.json(); // Assuming the happy path returns JSON
            if (data.token) {
                localStorage.setItem('token', data.token);
                navigate('/Homepage');
            } else {
                console.error("Registration error:", data.message);
            }
        } catch (error) {
            console.error("Error registering new user:", error);
            // Update the component state here to display the error
        }
    };
    

    const toggleLogin = () => setIsLogin(!isLogin); // Function to toggle between login and signup

    return (
        <div>
            <h1>{isLogin ? 'Please Log In' : 'Please Sign Up'}</h1>
            <form onSubmit={isLogin ? onLoginSubmit : onRegisterSubmit}>
                {isLogin ? (
                    <>
                        <input
                            type="text"
                            placeholder="Username"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            autoComplete="current-username"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="current-password"
                        />

                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            autoComplete="new-name"
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
                            autoComplete="new-password" // Use "new-password" for registration forms
                        />

                    </>
                )}
                <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            <button onClick={toggleLogin}>
                {isLogin ? 'Need to create an account?' : 'Already have an account?'}
            </button>
        </div>
    );
}

export default LoginSignup;
