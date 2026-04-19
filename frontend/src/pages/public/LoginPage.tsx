<<<<<<< HEAD
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';
import { ROUTE_PATHS } from '../../routes/routePaths';

type ForgotStep = 'email' | 'otp' | 'reset';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const otpValue = useMemo(() => otpDigits.join(''), [otpDigits]);

  function resetAlerts() {
    setMessage('');
    setError('');
  }

  function startForgotFlow() {
    setIsForgotFlow(true);
    setForgotStep('email');
    setForgotEmail(email);
    setOtpDigits(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    resetAlerts();
  }

  function backToLogin() {
    setIsForgotFlow(false);
    setForgotStep('email');
    resetAlerts();
  }

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

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
            id?: string;
            role?: 'patient' | 'doctor';
            fullName?: string;
          };
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.data?.accessToken) {
        throw new Error('No access token in response');
      }

      // Store tokens and role
      sessionStore.setTokens(response.data.accessToken, response.data.refreshToken || '');
      if (response.data.user?.role) {
        sessionStore.setRole(response.data.user.role);
      }
      if (response.data.user?.id) {
        sessionStore.setUserId(response.data.user.id);
      }
      if (response.data.user?.fullName) {
        sessionStore.setFullName(response.data.user.fullName);
      }

      setMessage('Login successful. Redirecting...');

      // Navigate based on user role
      const userRole = response.data.user?.role;
      setTimeout(() => {
        if (userRole === 'doctor') {
          navigate(ROUTE_PATHS.doctor.dashboard);
        } else if (userRole === 'patient') {
          navigate(ROUTE_PATHS.patient.dashboard);
        } else {
          navigate(ROUTE_PATHS.public.home);
        }
      }, 500);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Unable to sign in. Please check your credentials.');
      console.error('Login error:', apiErr);
    } finally {
      setLoading(false);
    }
  }

  function onOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
  }

  function onSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (!isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address to receive OTP.');
      return;
    }

    setForgotStep('otp');
    setMessage('OTP sent (demo flow). Backend reset endpoint is not available yet.');
  }

  function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setForgotStep('reset');
    setMessage('OTP verified (demo flow).');
  }

  function onResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    setMessage('Password reset API is not yet available on backend. Please use regular login for now.');
  }

  return (
    <div className="hm-login-page-wrap">
      <div className="hm-login-page">
        <section className="hm-login-left">
          <div className="hm-login-left-inner">
            <a href={ROUTE_PATHS.public.home} className="hm-login-logo">
              <span className="hm-login-logo-mark" aria-hidden="true">
                +
              </span>
              HealthMonitor Pro
            </a>
            <h1>Welcome Back</h1>
            <p className="hm-login-subtitle">Continue monitoring your health journey</p>
            <p className="hm-login-trust">Trusted by 10k+ patients and 500+ verified doctors</p>

            <div className="hm-login-graphic" aria-hidden="true">
              <div className="hm-login-ecg" />
              <div className="hm-login-cards">
                <div className="hm-login-mini-card">
                  <strong>BP</strong>
                  <span>120/80 - Normal</span>
                </div>
                <div className="hm-login-mini-card">
                  <strong>HR</strong>
                  <span>72 bpm</span>
                </div>
                <div className="hm-login-mini-card">
                  <strong>SpO2</strong>
                  <span>98%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hm-login-right">
          <div className="hm-login-surface">
            <Link className="hm-login-back-home" to={ROUTE_PATHS.public.home}>
              {'<- Back to home'}
            </Link>

            {!isForgotFlow ? (
              <>
                <p className="hm-login-eyebrow">HealthMonitor Pro Secure Portal</p>
                <h2>Sign in to your account</h2>

                {error ? <p className="hm-login-alert hm-login-alert-error">{error}</p> : null}
                {message ? <p className="hm-login-alert hm-login-alert-success">{message}</p> : null}

                <form className="hm-login-form" onSubmit={onLoginSubmit}>
                  <label>
                    Email Address
                    <div className="hm-login-input-wrap">
                      <span aria-hidden="true">mail</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <label>
                    Password
                    <div className="hm-login-input-wrap">
                      <span aria-hidden="true">key</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <button
                        className="hm-login-eye"
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <button type="button" className="hm-login-forgot" onClick={startForgotFlow}>
                    Forgot password?
                  </button>

                  <button className="hm-login-submit" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <p className="hm-login-foot">
                  Don&apos;t have an account? <Link to={ROUTE_PATHS.auth.register}>Register here</Link>
                </p>
              </>
            ) : (
              <>
                <h2>Reset Your Password</h2>
                <p className="hm-login-subtext">Enter your email address and we&apos;ll send you an OTP.</p>

                {error ? <p className="hm-login-alert hm-login-alert-error">{error}</p> : null}
                {message ? <p className="hm-login-alert hm-login-alert-success">{message}</p> : null}

                {forgotStep === 'email' ? (
                  <form className="hm-login-form" onSubmit={onSendOtp}>
                    <label>
                      Email Address
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        required
                      />
                    </label>
                    <button className="hm-login-submit" type="submit">
                      Send OTP
                    </button>
                  </form>
                ) : null}

                {forgotStep === 'otp' ? (
                  <form className="hm-login-form" onSubmit={onVerifyOtp}>
                    <label>Enter OTP</label>
                    <div className="hm-login-otp-row">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => onOtpChange(index, event.target.value)}
                          className="hm-login-otp"
                        />
                      ))}
                    </div>
                    <button className="hm-login-submit" type="submit">
                      Verify OTP
                    </button>
                  </form>
                ) : null}

                {forgotStep === 'reset' ? (
                  <form className="hm-login-form" onSubmit={onResetPassword}>
                    <label>
                      New Password
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Confirm Password
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                        required
                      />
                    </label>
                    <button
                      className="hm-login-eye hm-login-eye-inline"
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                    >
                      {showNewPassword ? 'Hide passwords' : 'Show passwords'}
                    </button>
                    <button className="hm-login-submit" type="submit">
                      Reset Password
                    </button>
                  </form>
                ) : null}

                <button type="button" className="hm-login-back-link" onClick={backToLogin}>
                  Back to Login
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .hm-login-page-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: clamp(0.9rem, 2.6vw, 1.8rem);
          background: radial-gradient(circle at 14% 15%, rgba(26, 158, 114, 0.14), transparent 40%),
            radial-gradient(circle at 88% 80%, rgba(13, 92, 69, 0.08), transparent 42%),
            linear-gradient(180deg, #f7faf8 0%, #edf3f0 100%);
          font-family: 'DM Sans', sans-serif;
        }

        .hm-login-page {
          width: min(1180px, 100%);
          min-height: min(820px, calc(100vh - 1.8rem));
          display: grid;
          grid-template-columns: 48% 52%;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #d9e3de;
          box-shadow: 0 34px 70px rgba(15, 23, 42, 0.14);
          overflow: hidden;
          animation: hmLoginEnter 420ms ease;
        }

        .hm-login-left {
          background: #0d5c45;
          color: #ffffff;
          padding: clamp(1.4rem, 2.8vw, 2.4rem);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .hm-login-left::before,
        .hm-login-left::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }

        .hm-login-left::before {
          width: 410px;
          height: 410px;
          top: -165px;
          right: -130px;
          background: radial-gradient(circle, rgba(45, 196, 141, 0.22) 0%, rgba(45, 196, 141, 0) 72%);
        }

        .hm-login-left::after {
          width: 360px;
          height: 360px;
          left: -150px;
          bottom: -130px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 72%);
        }

        .hm-login-left-inner {
          width: min(100%, 530px);
          display: grid;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .hm-login-logo {
          color: #ffffff;
          font-weight: 700;
          text-decoration: none;
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.01em;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          width: fit-content;
        }

        .hm-login-logo-mark {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          font-size: 0.95rem;
          line-height: 1;
        }

        .hm-login-left h1 {
          margin: 0;
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.2rem, 3.5vw, 3rem);
          line-height: 1.07;
        }

        .hm-login-subtitle {
          margin: 0;
          color: #d8f5e9;
          line-height: 1.45;
          font-size: 1.02rem;
        }

        .hm-login-trust {
          margin: -0.15rem 0 0;
          color: rgba(233, 251, 243, 0.88);
          font-size: 0.84rem;
          letter-spacing: 0.01em;
        }

        .hm-login-graphic {
          margin-top: 0.5rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(45, 196, 141, 0.2));
          padding: 1rem;
          display: grid;
          gap: 0.85rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 14px 30px rgba(0, 0, 0, 0.14);
          animation: hmLoginFloat 5.8s ease-in-out infinite;
        }

        .hm-login-ecg {
          height: 52px;
          border-radius: 999px;
          background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 14px,
              rgba(255, 255, 255, 0.08) 14px,
              rgba(255, 255, 255, 0.08) 15px
            ),
            linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(45, 196, 141, 0.9), rgba(255, 255, 255, 0.2));
          background-size: 100% 100%, 180% 100%;
          animation: hmLoginSweep 2.8s linear infinite;
        }

        .hm-login-cards {
          display: grid;
          gap: 0.6rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .hm-login-mini-card {
          border: 1px solid rgba(255, 255, 255, 0.32);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.56rem;
          display: grid;
          gap: 0.24rem;
          animation: hmLoginPulse 2.3s ease-in-out infinite;
        }

        .hm-login-mini-card:nth-child(2) {
          animation-delay: 0.22s;
        }

        .hm-login-mini-card:nth-child(3) {
          animation-delay: 0.44s;
        }

        .hm-login-mini-card strong {
          font-size: 0.82rem;
          line-height: 1;
        }

        .hm-login-mini-card span {
          font-size: 0.74rem;
          color: #c6f1e1;
        }

        .hm-login-right {
          background: linear-gradient(180deg, #ffffff 0%, #f9fcfb 100%);
          padding: clamp(1.1rem, 2.3vw, 1.8rem);
          display: grid;
          align-items: center;
        }

        .hm-login-surface {
          width: min(100%, 620px);
          margin-inline: auto;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdfc 100%);
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 18px 36px rgba(13, 92, 69, 0.11);
          padding: 1.45rem 1.55rem;
        }

        .hm-login-back-home {
          display: inline-block;
          color: #4b5563;
          font-size: 0.83rem;
          text-decoration: none;
          margin-bottom: 0.64rem;
          font-weight: 600;
        }

        .hm-login-eyebrow {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: #1a9e72;
          text-transform: uppercase;
          font-weight: 800;
        }

        .hm-login-surface h2 {
          margin: 0.28rem 0 0;
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 2.3vw, 2rem);
          color: #111827;
          line-height: 1.15;
        }

        .hm-login-subtext {
          margin: 0.6rem 0 0.75rem;
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.45;
        }

        .hm-login-alert {
          margin: 0.75rem 0;
          border-radius: 12px;
          padding: 0.62rem 0.78rem;
          font-size: 0.84rem;
          font-weight: 600;
        }

        .hm-login-alert-error {
          color: #991b1b;
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .hm-login-alert-success {
          color: #065f46;
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
        }

        .hm-login-form {
          margin-top: 0.9rem;
          display: grid;
          gap: 0.78rem;
        }

        .hm-login-form label {
          display: grid;
          gap: 0.35rem;
          color: #111827;
          font-weight: 600;
          font-size: 0.92rem;
        }

        .hm-login-form input {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          font-size: 0.94rem;
          font-family: 'DM Sans', sans-serif;
          padding: 0.54rem 0.72rem;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hm-login-form input:focus {
          outline: none;
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .hm-login-input-wrap {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #ffffff;
        }

        .hm-login-input-wrap:focus-within {
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .hm-login-input-wrap span {
          color: #6b7280;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding-left: 0.72rem;
          font-weight: 700;
        }

        .hm-login-input-wrap input {
          border: 0;
          box-shadow: none;
          min-height: 44px;
          padding-left: 0.54rem;
        }

        .hm-login-input-wrap input:focus {
          box-shadow: none;
        }

        .hm-login-eye {
          border: 0;
          background: transparent;
          color: #0d5c45;
          font-weight: 700;
          font-size: 0.76rem;
          cursor: pointer;
          padding: 0 0.72rem;
        }

        .hm-login-eye-inline {
          justify-self: start;
          padding: 0;
        }

        .hm-login-forgot,
        .hm-login-back-link {
          border: 0;
          background: transparent;
          color: #0d5c45;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          justify-self: end;
          padding: 0;
        }

        .hm-login-back-link {
          justify-self: start;
          margin-top: 0.62rem;
        }

        .hm-login-submit {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          border: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #0d5c45 0%, #147657 100%);
          font-size: 0.96rem;
          font-weight: 800;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 11px 24px rgba(13, 92, 69, 0.23);
        }

        .hm-login-submit:hover {
          background: linear-gradient(135deg, #0b4f3b 0%, #126349 100%);
        }

        .hm-login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hm-login-divider {
          margin: 0.92rem 0 0.52rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.78rem;
          font-weight: 700;
          position: relative;
        }

        .hm-login-divider::before,
        .hm-login-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 1.8rem);
          border-top: 1px solid #d1d5db;
        }

        .hm-login-divider::before {
          left: 0;
        }

        .hm-login-divider::after {
          right: 0;
        }

        .hm-login-note,
        .hm-login-foot {
          margin: 0.2rem 0;
          color: #4b5563;
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .hm-login-note a,
        .hm-login-foot a {
          color: #0d5c45;
          font-weight: 700;
          text-decoration: none;
        }

        .hm-login-otp-row {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.48rem;
        }

        .hm-login-otp {
          text-align: center;
          font-weight: 800;
          font-size: 1.03rem;
          min-height: 50px;
        }

        @keyframes hmLoginEnter {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes hmLoginFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes hmLoginSweep {
          0% {
            background-position: 0% 0%, 0% 0%;
          }
          100% {
            background-position: 0% 0%, 180% 0%;
          }
        }

        @keyframes hmLoginPulse {
          0%,
          100% {
            opacity: 0.78;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 1040px) {
          .hm-login-page {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .hm-login-right {
            padding-top: 1rem;
          }

          .hm-login-surface {
            width: min(100%, 700px);
          }
        }

        @media (max-width: 720px) {
          .hm-login-page-wrap {
            padding: 0.5rem;
          }

          .hm-login-cards {
            grid-template-columns: 1fr;
          }

          .hm-login-otp-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hm-login-surface h2 {
            font-size: 1.52rem;
          }

          .hm-login-surface {
            padding: 1.1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
=======
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';
import { ROUTE_PATHS } from '../../routes/routePaths';

type ForgotStep = 'email' | 'otp' | 'reset';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const otpValue = useMemo(() => otpDigits.join(''), [otpDigits]);

  function resetAlerts() {
    setMessage('');
    setError('');
  }

  function startForgotFlow() {
    setIsForgotFlow(true);
    setForgotStep('email');
    setForgotEmail(email);
    setOtpDigits(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    resetAlerts();
  }

  function backToLogin() {
    setIsForgotFlow(false);
    setForgotStep('email');
    resetAlerts();
  }

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

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
          user?: { role?: 'patient' | 'doctor' };
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.data?.accessToken) {
        throw new Error('No access token in response');
      }

      // Store tokens and role
      sessionStore.setTokens(response.data.accessToken, response.data.refreshToken || '');
      if (response.data.user?.role) {
        sessionStore.setRole(response.data.user.role);
      }

      setMessage('Login successful. Redirecting...');

      // Navigate based on user role
      const userRole = response.data.user?.role;
      setTimeout(() => {
        if (userRole === 'doctor') {
          navigate(ROUTE_PATHS.doctor.dashboard);
        } else if (userRole === 'patient') {
          navigate(ROUTE_PATHS.patient.dashboard);
        } else {
          navigate(ROUTE_PATHS.public.home);
        }
      }, 500);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Unable to sign in. Please check your credentials.');
      console.error('Login error:', apiErr);
    } finally {
      setLoading(false);
    }
  }

  function onOtpChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
  }

  function onSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (!isValidEmail(forgotEmail)) {
      setError('Please enter a valid email address to receive OTP.');
      return;
    }

    setForgotStep('otp');
    setMessage('OTP sent (demo flow). Backend reset endpoint is not available yet.');
  }

  function onVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setForgotStep('reset');
    setMessage('OTP verified (demo flow).');
  }

  function onResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAlerts();

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password must match.');
      return;
    }

    setMessage('Password reset API is not yet available on backend. Please use regular login for now.');
  }

  return (
    <div className="hm-login-page-wrap">
      <div className="hm-login-page">
        <section className="hm-login-left">
          <div className="hm-login-left-inner">
            <a href={ROUTE_PATHS.public.home} className="hm-login-logo">
              <span className="hm-login-logo-mark" aria-hidden="true">
                +
              </span>
              HealthMonitor Pro
            </a>
            <h1>Welcome Back</h1>
            <p className="hm-login-subtitle">Continue monitoring your health journey</p>
            <p className="hm-login-trust">Trusted by 10k+ patients and 500+ verified doctors</p>

            <div className="hm-login-graphic" aria-hidden="true">
              <div className="hm-login-ecg" />
              <div className="hm-login-cards">
                <div className="hm-login-mini-card">
                  <strong>BP</strong>
                  <span>120/80 - Normal</span>
                </div>
                <div className="hm-login-mini-card">
                  <strong>HR</strong>
                  <span>72 bpm</span>
                </div>
                <div className="hm-login-mini-card">
                  <strong>SpO2</strong>
                  <span>98%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hm-login-right">
          <div className="hm-login-surface">
            <Link className="hm-login-back-home" to={ROUTE_PATHS.public.home}>
              {'<- Back to home'}
            </Link>

            {!isForgotFlow ? (
              <>
                <p className="hm-login-eyebrow">HealthMonitor Pro Secure Portal</p>
                <h2>Sign in to your account</h2>

                {error ? <p className="hm-login-alert hm-login-alert-error">{error}</p> : null}
                {message ? <p className="hm-login-alert hm-login-alert-success">{message}</p> : null}

                <form className="hm-login-form" onSubmit={onLoginSubmit}>
                  <label>
                    Email Address
                    <div className="hm-login-input-wrap">
                      <span aria-hidden="true">mail</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  </label>

                  <label>
                    Password
                    <div className="hm-login-input-wrap">
                      <span aria-hidden="true">key</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <button
                        className="hm-login-eye"
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </label>

                  <button type="button" className="hm-login-forgot" onClick={startForgotFlow}>
                    Forgot password?
                  </button>

                  <button className="hm-login-submit" type="submit" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <p className="hm-login-foot">
                  Don&apos;t have an account? <Link to={ROUTE_PATHS.auth.register}>Register here</Link>
                </p>
              </>
            ) : (
              <>
                <h2>Reset Your Password</h2>
                <p className="hm-login-subtext">Enter your email address and we&apos;ll send you an OTP.</p>

                {error ? <p className="hm-login-alert hm-login-alert-error">{error}</p> : null}
                {message ? <p className="hm-login-alert hm-login-alert-success">{message}</p> : null}

                {forgotStep === 'email' ? (
                  <form className="hm-login-form" onSubmit={onSendOtp}>
                    <label>
                      Email Address
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        required
                      />
                    </label>
                    <button className="hm-login-submit" type="submit">
                      Send OTP
                    </button>
                  </form>
                ) : null}

                {forgotStep === 'otp' ? (
                  <form className="hm-login-form" onSubmit={onVerifyOtp}>
                    <label>Enter OTP</label>
                    <div className="hm-login-otp-row">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(event) => onOtpChange(index, event.target.value)}
                          className="hm-login-otp"
                        />
                      ))}
                    </div>
                    <button className="hm-login-submit" type="submit">
                      Verify OTP
                    </button>
                  </form>
                ) : null}

                {forgotStep === 'reset' ? (
                  <form className="hm-login-form" onSubmit={onResetPassword}>
                    <label>
                      New Password
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Confirm Password
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                        required
                      />
                    </label>
                    <button
                      className="hm-login-eye hm-login-eye-inline"
                      type="button"
                      onClick={() => setShowNewPassword((current) => !current)}
                    >
                      {showNewPassword ? 'Hide passwords' : 'Show passwords'}
                    </button>
                    <button className="hm-login-submit" type="submit">
                      Reset Password
                    </button>
                  </form>
                ) : null}

                <button type="button" className="hm-login-back-link" onClick={backToLogin}>
                  Back to Login
                </button>
              </>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .hm-login-page-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: clamp(0.9rem, 2.6vw, 1.8rem);
          background: radial-gradient(circle at 14% 15%, rgba(26, 158, 114, 0.14), transparent 40%),
            radial-gradient(circle at 88% 80%, rgba(13, 92, 69, 0.08), transparent 42%),
            linear-gradient(180deg, #f7faf8 0%, #edf3f0 100%);
          font-family: 'DM Sans', sans-serif;
        }

        .hm-login-page {
          width: min(1180px, 100%);
          min-height: min(820px, calc(100vh - 1.8rem));
          display: grid;
          grid-template-columns: 48% 52%;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #d9e3de;
          box-shadow: 0 34px 70px rgba(15, 23, 42, 0.14);
          overflow: hidden;
          animation: hmLoginEnter 420ms ease;
        }

        .hm-login-left {
          background: #0d5c45;
          color: #ffffff;
          padding: clamp(1.4rem, 2.8vw, 2.4rem);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .hm-login-left::before,
        .hm-login-left::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }

        .hm-login-left::before {
          width: 410px;
          height: 410px;
          top: -165px;
          right: -130px;
          background: radial-gradient(circle, rgba(45, 196, 141, 0.22) 0%, rgba(45, 196, 141, 0) 72%);
        }

        .hm-login-left::after {
          width: 360px;
          height: 360px;
          left: -150px;
          bottom: -130px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 72%);
        }

        .hm-login-left-inner {
          width: min(100%, 530px);
          display: grid;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .hm-login-logo {
          color: #ffffff;
          font-weight: 700;
          text-decoration: none;
          font-family: 'Sora', sans-serif;
          letter-spacing: 0.01em;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          width: fit-content;
        }

        .hm-login-logo-mark {
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          font-size: 0.95rem;
          line-height: 1;
        }

        .hm-login-left h1 {
          margin: 0;
          font-family: 'Sora', sans-serif;
          font-size: clamp(2.2rem, 3.5vw, 3rem);
          line-height: 1.07;
        }

        .hm-login-subtitle {
          margin: 0;
          color: #d8f5e9;
          line-height: 1.45;
          font-size: 1.02rem;
        }

        .hm-login-trust {
          margin: -0.15rem 0 0;
          color: rgba(233, 251, 243, 0.88);
          font-size: 0.84rem;
          letter-spacing: 0.01em;
        }

        .hm-login-graphic {
          margin-top: 0.5rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(45, 196, 141, 0.2));
          padding: 1rem;
          display: grid;
          gap: 0.85rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 14px 30px rgba(0, 0, 0, 0.14);
          animation: hmLoginFloat 5.8s ease-in-out infinite;
        }

        .hm-login-ecg {
          height: 52px;
          border-radius: 999px;
          background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 14px,
              rgba(255, 255, 255, 0.08) 14px,
              rgba(255, 255, 255, 0.08) 15px
            ),
            linear-gradient(90deg, rgba(255, 255, 255, 0.2), rgba(45, 196, 141, 0.9), rgba(255, 255, 255, 0.2));
          background-size: 100% 100%, 180% 100%;
          animation: hmLoginSweep 2.8s linear infinite;
        }

        .hm-login-cards {
          display: grid;
          gap: 0.6rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .hm-login-mini-card {
          border: 1px solid rgba(255, 255, 255, 0.32);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.56rem;
          display: grid;
          gap: 0.24rem;
          animation: hmLoginPulse 2.3s ease-in-out infinite;
        }

        .hm-login-mini-card:nth-child(2) {
          animation-delay: 0.22s;
        }

        .hm-login-mini-card:nth-child(3) {
          animation-delay: 0.44s;
        }

        .hm-login-mini-card strong {
          font-size: 0.82rem;
          line-height: 1;
        }

        .hm-login-mini-card span {
          font-size: 0.74rem;
          color: #c6f1e1;
        }

        .hm-login-right {
          background: linear-gradient(180deg, #ffffff 0%, #f9fcfb 100%);
          padding: clamp(1.1rem, 2.3vw, 1.8rem);
          display: grid;
          align-items: center;
        }

        .hm-login-surface {
          width: min(100%, 620px);
          margin-inline: auto;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdfc 100%);
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          box-shadow: 0 18px 36px rgba(13, 92, 69, 0.11);
          padding: 1.45rem 1.55rem;
        }

        .hm-login-back-home {
          display: inline-block;
          color: #4b5563;
          font-size: 0.83rem;
          text-decoration: none;
          margin-bottom: 0.64rem;
          font-weight: 600;
        }

        .hm-login-eyebrow {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          color: #1a9e72;
          text-transform: uppercase;
          font-weight: 800;
        }

        .hm-login-surface h2 {
          margin: 0.28rem 0 0;
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 2.3vw, 2rem);
          color: #111827;
          line-height: 1.15;
        }

        .hm-login-subtext {
          margin: 0.6rem 0 0.75rem;
          font-size: 0.9rem;
          color: #4b5563;
          line-height: 1.45;
        }

        .hm-login-alert {
          margin: 0.75rem 0;
          border-radius: 12px;
          padding: 0.62rem 0.78rem;
          font-size: 0.84rem;
          font-weight: 600;
        }

        .hm-login-alert-error {
          color: #991b1b;
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .hm-login-alert-success {
          color: #065f46;
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
        }

        .hm-login-form {
          margin-top: 0.9rem;
          display: grid;
          gap: 0.78rem;
        }

        .hm-login-form label {
          display: grid;
          gap: 0.35rem;
          color: #111827;
          font-weight: 600;
          font-size: 0.92rem;
        }

        .hm-login-form input {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          font-size: 0.94rem;
          font-family: 'DM Sans', sans-serif;
          padding: 0.54rem 0.72rem;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hm-login-form input:focus {
          outline: none;
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .hm-login-input-wrap {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #ffffff;
        }

        .hm-login-input-wrap:focus-within {
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .hm-login-input-wrap span {
          color: #6b7280;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding-left: 0.72rem;
          font-weight: 700;
        }

        .hm-login-input-wrap input {
          border: 0;
          box-shadow: none;
          min-height: 44px;
          padding-left: 0.54rem;
        }

        .hm-login-input-wrap input:focus {
          box-shadow: none;
        }

        .hm-login-eye {
          border: 0;
          background: transparent;
          color: #0d5c45;
          font-weight: 700;
          font-size: 0.76rem;
          cursor: pointer;
          padding: 0 0.72rem;
        }

        .hm-login-eye-inline {
          justify-self: start;
          padding: 0;
        }

        .hm-login-forgot,
        .hm-login-back-link {
          border: 0;
          background: transparent;
          color: #0d5c45;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          justify-self: end;
          padding: 0;
        }

        .hm-login-back-link {
          justify-self: start;
          margin-top: 0.62rem;
        }

        .hm-login-submit {
          width: 100%;
          min-height: 48px;
          border-radius: 12px;
          border: 0;
          color: #ffffff;
          background: linear-gradient(135deg, #0d5c45 0%, #147657 100%);
          font-size: 0.96rem;
          font-weight: 800;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow: 0 11px 24px rgba(13, 92, 69, 0.23);
        }

        .hm-login-submit:hover {
          background: linear-gradient(135deg, #0b4f3b 0%, #126349 100%);
        }

        .hm-login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hm-login-divider {
          margin: 0.92rem 0 0.52rem;
          text-align: center;
          color: #6b7280;
          font-size: 0.78rem;
          font-weight: 700;
          position: relative;
        }

        .hm-login-divider::before,
        .hm-login-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 1.8rem);
          border-top: 1px solid #d1d5db;
        }

        .hm-login-divider::before {
          left: 0;
        }

        .hm-login-divider::after {
          right: 0;
        }

        .hm-login-note,
        .hm-login-foot {
          margin: 0.2rem 0;
          color: #4b5563;
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .hm-login-note a,
        .hm-login-foot a {
          color: #0d5c45;
          font-weight: 700;
          text-decoration: none;
        }

        .hm-login-otp-row {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.48rem;
        }

        .hm-login-otp {
          text-align: center;
          font-weight: 800;
          font-size: 1.03rem;
          min-height: 50px;
        }

        @keyframes hmLoginEnter {
          from {
            transform: translateY(10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes hmLoginFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes hmLoginSweep {
          0% {
            background-position: 0% 0%, 0% 0%;
          }
          100% {
            background-position: 0% 0%, 180% 0%;
          }
        }

        @keyframes hmLoginPulse {
          0%,
          100% {
            opacity: 0.78;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 1040px) {
          .hm-login-page {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .hm-login-right {
            padding-top: 1rem;
          }

          .hm-login-surface {
            width: min(100%, 700px);
          }
        }

        @media (max-width: 720px) {
          .hm-login-page-wrap {
            padding: 0.5rem;
          }

          .hm-login-cards {
            grid-template-columns: 1fr;
          }

          .hm-login-otp-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hm-login-surface h2 {
            font-size: 1.52rem;
          }

          .hm-login-surface {
            padding: 1.1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
>>>>>>> 3679fdb51da36730665e1e953a244aa81087f3e4
