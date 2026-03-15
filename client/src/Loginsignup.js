import './LoginSignup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from './api';

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function LoginSignup({ setIsAuthenticated }) {
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const navigate = useNavigate();

  const finishLogin = ({ token, userId, adminId, username, adminUsername, admin = false }) => {
    localStorage.setItem('token', token);

    if (admin) {
      localStorage.setItem('adminId', adminId);
      localStorage.setItem('adminUsername', adminUsername || username || loginName.trim());
      localStorage.setItem('isAdmin', 'true');
      localStorage.removeItem('userId');
    } else {
      localStorage.setItem('userId', userId);
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('isAdmin');
    }

    setIsAuthenticated(true);
    navigate('/homepage');
  };

  const onLoginSubmit = async (event) => {
    event.preventDefault();

    if (!loginName.trim() || !loginPassword.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    const endpoint = isAdminLogin ? '/admin/login' : '/login';

    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginName.trim(), password: loginPassword }),
      });

      const data = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data.token) {
        throw new Error('Login failed.');
      }

      if (isAdminLogin) {
        finishLogin({
          token: data.token,
          adminId: data.adminId,
          adminUsername: loginName.trim(),
          admin: true,
        });
      } else {
        finishLogin({
          token: data.token,
          userId: data.userId,
          username: loginName.trim(),
        });
      }
    } catch (error) {
      alert(`Error logging in: ${error.message}`);
    }
  };

  const onRegisterSubmit = async (event) => {
    event.preventDefault();

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: registerName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
        }),
      });

      const data = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      if (!data.token) {
        throw new Error('Registration failed.');
      }

      finishLogin({
        token: data.token,
        userId: data.userId,
        username: registerName.trim(),
      });
    } catch (error) {
      alert(`Error registering: ${error.message}`);
    }
  };

  if (isAdminLogin) {
    return (
      <div>
        <h1>Administrator Login</h1>
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
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button type="submit">Login as Admin</button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsAdminLogin(false);
            setLoginPassword('');
          }}
        >
          Back to User Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>{isLogin ? 'Please Log In' : 'Please Sign Up'}</h1>
      <form onSubmit={isLogin ? onLoginSubmit : onRegisterSubmit}>
        {isLogin ? (
          <>
            <input
              type="text"
              placeholder="Username or Email"
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
        ) : (
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
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              autoComplete="new-password"
            />
          </>
        )}
        <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
      </form>
      <button type="button" onClick={() => setIsLogin((current) => !current)}>
        {isLogin ? 'Need to create an account?' : 'Already have an account?'}
      </button>
      <div style={{ marginTop: '20px' }}>
        <h2>If you are an administrator, login here:</h2>
        <button type="button" onClick={() => setIsAdminLogin(true)}>
          Login as Admin
        </button>
      </div>
    </div>
  );
}

export default LoginSignup;
