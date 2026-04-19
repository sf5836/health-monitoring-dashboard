<<<<<<< HEAD
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';
import { ROUTE_PATHS } from '../../routes/routePaths';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  function resetAlerts() {
    setMessage('');
    setError('');
  }

  async function onAdminLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (isLocked) {
      setError(`Admin portal is locked. Please try again in ${lockoutTimeRemaining} minutes.`);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest<{
        message?: string;
        data?: {
          accessToken?: string;
          refreshToken?: string;
          user?: {
            id: string;
            email: string;
            role: string;
          };
        };
      }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.data?.accessToken) {
        throw new Error('No access token in response');
      }

      // Reset failed attempts on success
      setFailedAttempts(0);

      // Store tokens and role
      sessionStore.setTokens(response.data.accessToken, response.data.refreshToken || '');
      sessionStore.setRole('admin');
      if (response.data.user?.id) {
        sessionStore.setUserId(response.data.user.id);
      }
      sessionStore.setFullName('Super Admin');

      setMessage('Admin access granted. Redirecting...');

      setTimeout(() => {
        navigate(ROUTE_PATHS.admin.dashboard);
      }, 500);
    } catch (err) {
      const apiErr = err as ApiError;
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setIsLocked(true);
        setLockoutTimeRemaining(15);

        // Start lockout timer
        const interval = setInterval(() => {
          setLockoutTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsLocked(false);
              setFailedAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 60000); // 60 seconds per minute

        setError('Too many failed attempts. Admin portal locked for 15 minutes.');
      } else {
        const remaining = 5 - newFailedAttempts;
        setError(
          remaining > 0
            ? `Invalid credentials. ${remaining} attempts remaining before 15-minute lockout.`
            : 'Admin portal locked due to too many failed attempts.',
        );
      }

      console.error('Admin login error:', apiErr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hm-admin-login-page-wrap">
      <div className="hm-admin-login-background-pattern" />

      <div className="hm-admin-login-container">
        <div className="hm-admin-login-card">
          {/* Logo Section */}
          <div className="hm-admin-login-logo">
            <svg
              className="hm-admin-shield-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" />
            </svg>
            <h2 className="hm-admin-logo-text">HealthMonitor Pro</h2>
          </div>

          {/* Heading */}
          <h1 className="hm-admin-heading">Admin Portal</h1>

          {/* Security Warning */}
          <p className="hm-admin-security-notice">
            🔒 Restricted access — authorized personnel only
          </p>

          {/* Divider */}
          <div className="hm-admin-divider" />

          {/* Alerts */}
          {error && <div className="hm-admin-alert hm-admin-alert-error">{error}</div>}
          {message && <div className="hm-admin-alert hm-admin-alert-success">{message}</div>}

          {/* Login Form */}
          <form onSubmit={onAdminLoginSubmit} className="hm-admin-form">
            {/* Email Field */}
            <div className="hm-admin-form-group">
              <label htmlFor="admin-email" className="hm-admin-label">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked || loading}
                className="hm-admin-input"
              />
            </div>

            {/* Password Field */}
            <div className="hm-admin-form-group">
              <label htmlFor="admin-password" className="hm-admin-label">
                Password
              </label>
              <div className="hm-admin-password-wrapper">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked || loading}
                  className="hm-admin-input"
                />
                <button
                  type="button"
                  className="hm-admin-show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || loading}
              className="hm-admin-submit-btn"
            >
              {loading ? 'Signing In...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          {/* Security Disclaimer */}
          <p className="hm-admin-security-disclaimer">
            🔐 This portal is monitored. All actions are logged.
          </p>

          {/* Return to Main Site */}
          <a href={ROUTE_PATHS.public.home} className="hm-admin-return-link">
            Return to main site
          </a>
        </div>
      </div>

      <style>{`
        /* Admin Login Page Wrapper */
        .hm-admin-login-page-wrap {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1a12 0%, #0d2818 50%, #051410 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Background Pattern */
        .hm-admin-login-background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.08;
          background-image: repeating-linear-gradient(
            45deg,
            #0d5c45 0px,
            #0d5c45 1px,
            transparent 1px,
            transparent 35px
          );
          pointer-events: none;
        }

        /* Admin Login Container */
        .hm-admin-login-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          animation: hmAdminFadeIn 500ms ease;
        }

        /* Admin Login Card */
        .hm-admin-login-card {
          background: linear-gradient(135deg, #111f17 0%, #0f1d15 100%);
          border: 1px solid #1a3d2a;
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(26, 158, 114, 0.1);
          backdrop-filter: blur(10px);
        }

        /* Logo Section */
        .hm-admin-login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .hm-admin-shield-icon {
          width: 28px;
          height: 28px;
          stroke: #1a9e72;
          flex-shrink: 0;
        }

        .hm-admin-logo-text {
          font-size: 1rem;
          font-weight: 600;
          color: #1a9e72;
          margin: 0;
          letter-spacing: 0.5px;
          font-family: 'Sora', -apple-system, sans-serif;
        }

        /* Main Heading */
        .hm-admin-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          text-align: center;
          font-family: 'Sora', -apple-system, sans-serif;
        }

        /* Security Notice */
        .hm-admin-security-notice {
          font-size: 0.8rem;
          color: #ef4444;
          text-align: center;
          margin: 0.5rem 0 1.25rem 0;
          font-weight: 500;
        }

        /* Divider */
        .hm-admin-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #1a3d2a 50%,
            transparent 100%
          );
          margin: 1.5rem 0;
        }

        /* Alerts */
        .hm-admin-alert {
          padding: 0.875rem 1rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          border-left: 4px solid;
        }

        .hm-admin-alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border-left-color: #ef4444;
        }

        .hm-admin-alert-success {
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
          border-left-color: #22c55e;
        }

        /* Form */
        .hm-admin-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Form Group */
        .hm-admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Label */
        .hm-admin-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #d1d5db;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        /* Input Fields */
        .hm-admin-input {
          background: #0a1410;
          border: 1px solid #1a3d2a;
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: #ffffff;
          font-family: 'DM Sans', -apple-system, sans-serif;
          transition: all 200ms ease;
        }

        .hm-admin-input::placeholder {
          color: #6b7280;
        }

        .hm-admin-input:focus {
          outline: none;
          border-color: #0d5c45;
          background: #0f1d15;
          box-shadow: 0 0 0 3px rgba(13, 92, 69, 0.1);
        }

        .hm-admin-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Password Wrapper */
        .hm-admin-password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hm-admin-password-wrapper .hm-admin-input {
          width: 100%;
        }

        /* Show Password Button */
        .hm-admin-show-password-btn {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1rem;
          transition: color 150ms ease;
        }

        .hm-admin-show-password-btn:hover:not(:disabled) {
          color: #d1d5db;
        }

        .hm-admin-show-password-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Submit Button */
        .hm-admin-submit-btn {
          background: linear-gradient(135deg, #0d5c45 0%, #0a4229 100%);
          color: #ffffff;
          border: 1px solid #1a3d2a;
          border-radius: 0.625rem;
          padding: 0.875rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          font-family: 'Sora', -apple-system, sans-serif;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 20px rgba(13, 92, 69, 0.2);
          margin-top: 0.5rem;
        }

        .hm-admin-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(13, 92, 69, 0.3);
          background: linear-gradient(135deg, #0a4229 0%, #082d1f 100%);
        }

        .hm-admin-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .hm-admin-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Security Disclaimer */
        .hm-admin-security-disclaimer {
          font-size: 0.8rem;
          color: #9ca3af;
          text-align: center;
          margin: 1.25rem 0;
          line-height: 1.4;
        }

        /* Return Link */
        .hm-admin-return-link {
          display: block;
          text-align: center;
          font-size: 0.8rem;
          color: #6b7280;
          text-decoration: none;
          transition: color 150ms ease;
          margin-top: 0.75rem;
        }

        .hm-admin-return-link:hover {
          color: #1a9e72;
        }

        /* Keyframe Animation */
        @keyframes hmAdminFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .hm-admin-login-page-wrap {
            padding: 1rem;
          }

          .hm-admin-login-card {
            padding: 2rem 1.5rem;
          }

          .hm-admin-heading {
            font-size: 1.25rem;
          }

          .hm-admin-input,
          .hm-admin-submit-btn {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
=======
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';
import { ROUTE_PATHS } from '../../routes/routePaths';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0);

  function resetAlerts() {
    setMessage('');
    setError('');
  }

  async function onAdminLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (isLocked) {
      setError(`Admin portal is locked. Please try again in ${lockoutTimeRemaining} minutes.`);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest<{
        message?: string;
        data?: {
          accessToken?: string;
          refreshToken?: string;
          user?: {
            id: string;
            email: string;
            role: string;
          };
        };
      }>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.data?.accessToken) {
        throw new Error('No access token in response');
      }

      // Reset failed attempts on success
      setFailedAttempts(0);

      // Store tokens and role
      sessionStore.setTokens(response.data.accessToken, response.data.refreshToken || '');
      sessionStore.setRole('admin');

      setMessage('Admin access granted. Redirecting...');

      setTimeout(() => {
        navigate(ROUTE_PATHS.admin.dashboard);
      }, 500);
    } catch (err) {
      const apiErr = err as ApiError;
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 5) {
        setIsLocked(true);
        setLockoutTimeRemaining(15);

        // Start lockout timer
        const interval = setInterval(() => {
          setLockoutTimeRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsLocked(false);
              setFailedAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 60000); // 60 seconds per minute

        setError('Too many failed attempts. Admin portal locked for 15 minutes.');
      } else {
        const remaining = 5 - newFailedAttempts;
        setError(
          remaining > 0
            ? `Invalid credentials. ${remaining} attempts remaining before 15-minute lockout.`
            : 'Admin portal locked due to too many failed attempts.',
        );
      }

      console.error('Admin login error:', apiErr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hm-admin-login-page-wrap">
      <div className="hm-admin-login-background-pattern" />

      <div className="hm-admin-login-container">
        <div className="hm-admin-login-card">
          {/* Logo Section */}
          <div className="hm-admin-login-logo">
            <svg
              className="hm-admin-shield-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" />
            </svg>
            <h2 className="hm-admin-logo-text">HealthMonitor Pro</h2>
          </div>

          {/* Heading */}
          <h1 className="hm-admin-heading">Admin Portal</h1>

          {/* Security Warning */}
          <p className="hm-admin-security-notice">
            🔒 Restricted access — authorized personnel only
          </p>

          {/* Divider */}
          <div className="hm-admin-divider" />

          {/* Alerts */}
          {error && <div className="hm-admin-alert hm-admin-alert-error">{error}</div>}
          {message && <div className="hm-admin-alert hm-admin-alert-success">{message}</div>}

          {/* Login Form */}
          <form onSubmit={onAdminLoginSubmit} className="hm-admin-form">
            {/* Email Field */}
            <div className="hm-admin-form-group">
              <label htmlFor="admin-email" className="hm-admin-label">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked || loading}
                className="hm-admin-input"
              />
            </div>

            {/* Password Field */}
            <div className="hm-admin-form-group">
              <label htmlFor="admin-password" className="hm-admin-label">
                Password
              </label>
              <div className="hm-admin-password-wrapper">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked || loading}
                  className="hm-admin-input"
                />
                <button
                  type="button"
                  className="hm-admin-show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked || loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || loading}
              className="hm-admin-submit-btn"
            >
              {loading ? 'Signing In...' : 'Sign In to Admin Portal'}
            </button>
          </form>

          {/* Security Disclaimer */}
          <p className="hm-admin-security-disclaimer">
            🔐 This portal is monitored. All actions are logged.
          </p>

          {/* Return to Main Site */}
          <a href={ROUTE_PATHS.public.home} className="hm-admin-return-link">
            Return to main site
          </a>
        </div>
      </div>

      <style>{`
        /* Admin Login Page Wrapper */
        .hm-admin-login-page-wrap {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1a12 0%, #0d2818 50%, #051410 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Background Pattern */
        .hm-admin-login-background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.08;
          background-image: repeating-linear-gradient(
            45deg,
            #0d5c45 0px,
            #0d5c45 1px,
            transparent 1px,
            transparent 35px
          );
          pointer-events: none;
        }

        /* Admin Login Container */
        .hm-admin-login-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 420px;
          animation: hmAdminFadeIn 500ms ease;
        }

        /* Admin Login Card */
        .hm-admin-login-card {
          background: linear-gradient(135deg, #111f17 0%, #0f1d15 100%);
          border: 1px solid #1a3d2a;
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(26, 158, 114, 0.1);
          backdrop-filter: blur(10px);
        }

        /* Logo Section */
        .hm-admin-login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .hm-admin-shield-icon {
          width: 28px;
          height: 28px;
          stroke: #1a9e72;
          flex-shrink: 0;
        }

        .hm-admin-logo-text {
          font-size: 1rem;
          font-weight: 600;
          color: #1a9e72;
          margin: 0;
          letter-spacing: 0.5px;
          font-family: 'Sora', -apple-system, sans-serif;
        }

        /* Main Heading */
        .hm-admin-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          text-align: center;
          font-family: 'Sora', -apple-system, sans-serif;
        }

        /* Security Notice */
        .hm-admin-security-notice {
          font-size: 0.8rem;
          color: #ef4444;
          text-align: center;
          margin: 0.5rem 0 1.25rem 0;
          font-weight: 500;
        }

        /* Divider */
        .hm-admin-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #1a3d2a 50%,
            transparent 100%
          );
          margin: 1.5rem 0;
        }

        /* Alerts */
        .hm-admin-alert {
          padding: 0.875rem 1rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          border-left: 4px solid;
        }

        .hm-admin-alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border-left-color: #ef4444;
        }

        .hm-admin-alert-success {
          background: rgba(34, 197, 94, 0.1);
          color: #86efac;
          border-left-color: #22c55e;
        }

        /* Form */
        .hm-admin-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Form Group */
        .hm-admin-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Label */
        .hm-admin-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #d1d5db;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'DM Sans', -apple-system, sans-serif;
        }

        /* Input Fields */
        .hm-admin-input {
          background: #0a1410;
          border: 1px solid #1a3d2a;
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: #ffffff;
          font-family: 'DM Sans', -apple-system, sans-serif;
          transition: all 200ms ease;
        }

        .hm-admin-input::placeholder {
          color: #6b7280;
        }

        .hm-admin-input:focus {
          outline: none;
          border-color: #0d5c45;
          background: #0f1d15;
          box-shadow: 0 0 0 3px rgba(13, 92, 69, 0.1);
        }

        .hm-admin-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Password Wrapper */
        .hm-admin-password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hm-admin-password-wrapper .hm-admin-input {
          width: 100%;
        }

        /* Show Password Button */
        .hm-admin-show-password-btn {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1rem;
          transition: color 150ms ease;
        }

        .hm-admin-show-password-btn:hover:not(:disabled) {
          color: #d1d5db;
        }

        .hm-admin-show-password-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Submit Button */
        .hm-admin-submit-btn {
          background: linear-gradient(135deg, #0d5c45 0%, #0a4229 100%);
          color: #ffffff;
          border: 1px solid #1a3d2a;
          border-radius: 0.625rem;
          padding: 0.875rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          font-family: 'Sora', -apple-system, sans-serif;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 20px rgba(13, 92, 69, 0.2);
          margin-top: 0.5rem;
        }

        .hm-admin-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(13, 92, 69, 0.3);
          background: linear-gradient(135deg, #0a4229 0%, #082d1f 100%);
        }

        .hm-admin-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .hm-admin-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Security Disclaimer */
        .hm-admin-security-disclaimer {
          font-size: 0.8rem;
          color: #9ca3af;
          text-align: center;
          margin: 1.25rem 0;
          line-height: 1.4;
        }

        /* Return Link */
        .hm-admin-return-link {
          display: block;
          text-align: center;
          font-size: 0.8rem;
          color: #6b7280;
          text-decoration: none;
          transition: color 150ms ease;
          margin-top: 0.75rem;
        }

        .hm-admin-return-link:hover {
          color: #1a9e72;
        }

        /* Keyframe Animation */
        @keyframes hmAdminFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .hm-admin-login-page-wrap {
            padding: 1rem;
          }

          .hm-admin-login-card {
            padding: 2rem 1.5rem;
          }

          .hm-admin-heading {
            font-size: 1.25rem;
          }

          .hm-admin-input,
          .hm-admin-submit-btn {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
