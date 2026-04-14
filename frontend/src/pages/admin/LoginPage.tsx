import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';

const LOCKOUT_SECONDS = 15 * 60;

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (lockoutRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setLockoutRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockoutRemaining]);

  const isLocked = lockoutRemaining > 0;
  const warningState = failedAttempts >= 3 && failedAttempts < 5 && !isLocked;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLocked) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.adminLogin(email, password);
      navigate('/admin/dashboard');
      return;
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setLockoutRemaining(LOCKOUT_SECONDS);
      }
      setErrorMessage(error instanceof ApiError ? error.message : 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const formatRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <section className="hm-admin-login-page">
      <div className="hm-admin-login-pattern" aria-hidden="true" />

      <article className="hm-admin-login-card">
        <header className="hm-admin-login-head">
          <div className="hm-admin-brand-row">
            <span className="hm-admin-shield">🛡️</span>
            <strong>HealthMonitor Pro</strong>
          </div>
          <h1>Admin Portal</h1>
          <p>Restricted access - authorized personnel only</p>
        </header>

        <form className="hm-admin-login-form" onSubmit={handleSubmit}>
          <label>
            Administrator Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@healthmonitorpro.com"
              disabled={isLocked}
              required
            />
          </label>

          <label>
            Password
            <div className="hm-admin-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={isLocked}
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} disabled={isLocked}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <button type="submit" className="hm-admin-signin-btn" disabled={isLocked || loading}>
            {loading ? 'Signing In...' : 'Sign In to Admin Portal'}
          </button>
        </form>

        {errorMessage ? <aside className="hm-admin-alert danger">{errorMessage}</aside> : null}

        {warningState ? (
          <aside className="hm-admin-alert warning" role="status">
            3 failed attempts. 2 attempts remaining before 15-minute lockout.
          </aside>
        ) : null}

        {isLocked ? (
          <aside className="hm-admin-alert danger" role="alert">
            <p>Too many failed attempts. Please try again in 15 minutes.</p>
            <strong>Lockout remaining: {formatRemaining(lockoutRemaining)}</strong>
          </aside>
        ) : null}

        <footer className="hm-admin-login-foot">
          <p>🔒 This portal is monitored. All actions are logged.</p>
          <a href="/">Return to main site</a>
        </footer>
      </article>
    </section>
  );
}
