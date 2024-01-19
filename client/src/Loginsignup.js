import './LoginSignup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoginSignup() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerName, setRegisterName] = useState('');
    // Add other state variables as in your original file

    const navigate = useNavigate();

    const onLoginSubmit = (event) => {
        event.preventDefault();
        // Your existing logic to handle login
        // On successful login, redirect to homepage
        navigate('/homepage');
    };

    const onRegisterSubmit = (event) => {
        event.preventDefault();
        // Your existing logic to handle registration
        // On successful registration, redirect to homepage
        navigate('/homepage');
    };

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
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder="Name"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
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
};

export default LoginSignup;