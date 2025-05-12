import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    try {
      // Initiate Google OAuth flow
      window.location.href = `http://localhost:3001/auth/google`;
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Admin Portal</h2>
      <div className="login-form">
        <button 
          onClick={handleGoogleAuth}
          disabled={isConnecting}
          className="google-auth-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;