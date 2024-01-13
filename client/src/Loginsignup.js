// LoginSignup.js in your React app

import React, { useState } from 'react';
function LoginSignup() {
    const [loginInfo, setLoginInfo] = useState({ username: '', password: '' });
    const [signupInfo, setSignupInfo] = useState({ username: '', email: '', password: '' });

    const toggleLogin = () => {
        setIsLogin(!isLogin);
    };
    // Inside your signup route in server.js

    return (
        <div>
            <h1>{isLogin ? 'Please Log In' : 'Please Sign Up'}</h1>
            <form>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
                
                {isLogin ? '' : <input type="email" placeholder="Email" />}
                <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
            </form>
            <button onClick={toggleLogin}>
                {isLogin ? 'Need to create an account?' : 'Already have an account?'}
            </button>
        </div>
    );
};


export default LoginSignup;
