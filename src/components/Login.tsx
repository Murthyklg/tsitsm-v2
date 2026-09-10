import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Login.css';
import logo from '../assets/companyLogo.png';

interface LoginProps {
  onLoginSuccess: () => void;
}

const MicrosoftMark = () => (
  <span className="microsoft-mark" aria-hidden="true">
    <i /><i /><i /><i />
  </span>
);

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { error, loginWithMicrosoft } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleMicrosoftLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const success = await loginWithMicrosoft();
    setIsSigningIn(false);
    if (success) onLoginSuccess();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-panel">
          <img src={logo} alt="TS OneDesk logo" className="login-logo" />
          <h1>TS OneDesk</h1>
          <p>Secure access for incidents and asset management.</p>
        </div>
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p className="login-description">Use your company Microsoft account to continue.</p>
          <button type="button" className="microsoft-login-button" onClick={handleMicrosoftLogin} disabled={isSigningIn}>
            <MicrosoftMark />
            {isSigningIn ? 'Signing in...' : 'Continue with Microsoft'}
          </button>
          {error && <div className="error-message" role="alert">{error}</div>}
          <p className="login-note">Your access is managed by your organization. ITSM data is protected by Microsoft Entra ID.</p>
        </div>
      </div>
    </div>
  );
};
