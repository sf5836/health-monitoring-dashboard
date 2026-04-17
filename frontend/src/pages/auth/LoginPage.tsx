
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../services/apiClient';
import authService from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);
    try {
      const session = await authService.login(email, password);
      if (session.user.role === 'patient') {
        navigate('/patient/dashboard');
      } else if (session.user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage(
      'Password reset flow will be enabled in the next auth release. Contact support for urgent access recovery.'
    );
  };

  return (
    <div className="hm-login">
      <aside className="hm-login-left">
        <div className="hm-register-brand">HealthMonitor Pro</div>
        <h1>Welcome Back</h1>
        <p>Continue monitoring your health journey</p>

        <div className="hm-login-illustration">
          <div className="line" />
          <div className="hm-login-mini-cards">
            <div>BP: 120/80 Normal</div>
            <div>HR: 72 bpm</div>
            <div>SpO2: 98%</div>
          </div>
        </div>
      </aside>

      <main className="hm-login-right">
        <Link to="/" className="hm-back-home">
          Back to home
        </Link>

        {mode === 'login' ? (
          <form className="hm-login-form" onSubmit={handleLogin}>
            <h2>Sign in to your account</h2>

            <label>
              Email Address
              <div className="hm-input-icon-wrap">
                <span>@</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </label>

            <label>
              Password
              <div className="hm-input-icon-wrap">
                <span>🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button type="button" className="hm-link-btn hm-forgot-link" onClick={() => setMode('forgot')}>
              Forgot password?
            </button>

            <button type="submit" className="hm-btn hm-btn-primary hm-btn-block">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {errorMessage ? <p className="hm-register-footer">{errorMessage}</p> : null}

            <div className="hm-divider">or</div>

            <p className="hm-login-note">
              Signing in as Admin? <Link to="/admin/login">Use the admin portal</Link>
            </p>

            <p className="hm-register-footer">
              Don&apos;t have an account? <Link to="/register">Register here</Link>
            </p>
          </form>
        ) : (
          <form className="hm-login-form" onSubmit={handleForgot}>
            <h2>Reset Your Password</h2>
            <p className="hm-login-subtext">
              Enter your account email to request a secure password reset link.
            </p>

            <label>
              Email Address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <button type="submit" className="hm-btn hm-btn-primary hm-btn-block">
              Request Password Reset
            </button>
            {infoMessage ? <p className="hm-login-subtext">{infoMessage}</p> : null}

            <button type="button" className="hm-link-btn" onClick={() => setMode('login')}>
              Back to Login
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
