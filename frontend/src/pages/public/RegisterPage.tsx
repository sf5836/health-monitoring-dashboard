import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';

type Role = 'patient' | 'doctor';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4 | 5; label: string } {
  if (!password) return { score: 0, label: 'Not set' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: score as 0 | 1, label: 'Very Weak' };
  if (score === 2) return { score: 2, label: 'Weak' };
  if (score === 3) return { score: 3, label: 'Medium' };
  if (score === 4) return { score: 4, label: 'Strong' };
  return { score: 5, label: 'Very Strong' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('patient');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const emailStatus = useMemo(() => {
    if (!email.trim()) return 'Enter email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid format';
    return 'Format looks good';
  }, [email]);

  function validatePersonalStep() {
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required.');
      return false;
    }

    if (!isValidEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return false;
    }

    if (phone.trim() && phone.trim().length < 5) {
      setErrorMessage('Phone number must be at least 5 characters if provided.');
      return false;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return false;
    }

    if (passwordStrength.score < 3) {
      setErrorMessage('Use a stronger password with uppercase, lowercase, number, and symbol.');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password must match.');
      return false;
    }

    return true;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validatePersonalStep()) {
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password
    };

    try {
      setIsSubmitting(true);
      const response = await apiRequest<{
        message?: string;
        data?: {
          accessToken?: string;
          refreshToken?: string;
          user?: { role?: 'patient' | 'doctor' | 'admin' };
        };
      }>(`/auth/register/${role}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const registeredRole = response?.data?.user?.role ?? role;

      if (response?.data?.accessToken && response?.data?.refreshToken) {
        sessionStore.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      if (response?.data?.user?.role) {
        sessionStore.setRole(response.data.user.role);
      }

      setSuccessMessage(
        response?.message ||
          (role === 'doctor'
            ? 'Account created. Please complete your professional profile next.'
            : 'Patient registered successfully.')
      );

      window.setTimeout(() => {
        if (registeredRole === 'doctor') {
          navigate(ROUTE_PATHS.doctor.onboarding);
          return;
        }

        if (registeredRole === 'patient') {
          navigate(ROUTE_PATHS.patient.dashboard);
          return;
        }

        navigate(ROUTE_PATHS.public.home);
      }, 450);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          setErrorMessage(error.message || 'Please check your input and try again.');
        } else if (error.status === 409) {
          setErrorMessage('This email is already registered. Please login instead.');
        } else {
          setErrorMessage(error.message || 'Registration failed. Please try again.');
        }
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="hm-register-page-wrap">
      <div className="hm-register-page">
        <section className="hm-register-left">
          <div className="hm-register-left-inner">
            <a href={ROUTE_PATHS.public.home} className="hm-register-logo">
              <span className="hm-register-logo-mark" aria-hidden="true">
                +
              </span>
              HealthMonitor Pro
            </a>
            <h1>Join HealthMonitor Pro</h1>
            <p className="hm-register-subtitle">Create your secure account in under two minutes.</p>

            <div className="hm-register-metrics" aria-hidden="true">
              <div>
                <strong>256-bit</strong>
                <span>Encrypted</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Doctors</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Monitoring</span>
              </div>
            </div>

            <div className="hm-register-graphic" aria-hidden="true">
              <div className="hm-register-graphic-top">
                <span />
                <span />
                <span />
              </div>
              <div className="hm-register-graphic-grid">
                <div className="hm-register-graphic-card hm-register-graphic-card-wide">
                  <div className="line one" />
                  <div className="line two" />
                  <div className="line three" />
                </div>
                <div className="hm-register-graphic-card">
                  <div className="mini-value" />
                  <div className="mini-wave" />
                </div>
                <div className="hm-register-graphic-card hm-register-graphic-card-chart">
                  <div className="chart-line" />
                </div>
              </div>
            </div>

            <ul className="hm-register-benefits">
              <li>Secure and encrypted health data</li>
              <li>500+ verified specialist doctors</li>
              <li>Professional onboarding for doctor accounts</li>
            </ul>
          </div>
        </section>

        <section className="hm-register-right">
          <div className="hm-reg-surface">
            <h2>Create your account</h2>
            <p className="hm-reg-intro">
              Doctors register personal details first, then complete professional profile on the next page.
            </p>

            <div className="hm-reg-role-row" role="tablist" aria-label="Role selector">
              <button
                type="button"
                className={`hm-reg-role ${role === 'patient' ? 'active' : ''}`}
                onClick={() => {
                  setRole('patient');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                <span className="hm-reg-role-copy">I am a Patient</span>
                <span className="hm-reg-role-mini">Personal account</span>
              </button>
              <button
                type="button"
                className={`hm-reg-role ${role === 'doctor' ? 'active' : ''}`}
                onClick={() => {
                  setRole('doctor');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                <span className="hm-reg-role-copy">I am a Doctor</span>
                <span className="hm-reg-role-mini">Professional onboarding next</span>
              </button>
            </div>

            {errorMessage ? <p className="hm-reg-alert hm-reg-alert-error">{errorMessage}</p> : null}
            {successMessage ? <p className="hm-reg-alert hm-reg-alert-success">{successMessage}</p> : null}

            <form className="hm-reg-form" onSubmit={onSubmit}>
              <div className="hm-reg-grid-2">
                <label>
                  First Name
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Last Name
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Email Address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                <span className={`hm-reg-status ${emailStatus === 'Format looks good' ? 'ok' : 'warn'}`}>
                  {emailStatus}
                </span>
              </label>

              <label>
                Phone Number (Optional)
                <input
                  type="tel"
                  placeholder="03xx xxxxxxx"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <div className="hm-reg-strength-wrap" aria-label="Password strength">
                  <div className={`hm-reg-strength-bar level-${passwordStrength.score}`} />
                </div>
                <span className={`hm-reg-help hm-reg-help-strength level-${passwordStrength.score}`}>
                  Strength: {passwordStrength.label}
                </span>
              </label>

              <label>
                Confirm Password
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>

              <button type="submit" className="hm-reg-primary" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Submitting...'
                  : role === 'doctor'
                    ? 'Continue To Professional Setup'
                    : 'Create Patient Account'}
              </button>
            </form>

            <p className="hm-reg-login-link">
              Already have an account? <Link to={ROUTE_PATHS.auth.login}>Login</Link>
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .hm-register-page-wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: clamp(0.8rem, 2.5vw, 1.6rem);
          background: radial-gradient(circle at 14% 20%, rgba(26, 158, 114, 0.09), transparent 42%),
            linear-gradient(180deg, #f8faf9 0%, #f1f5f3 100%);
        }

        .hm-register-page {
          width: min(1180px, 100%);
          min-height: min(860px, calc(100vh - 2rem));
          display: grid;
          grid-template-columns: 46% 54%;
          font-family: 'DM Sans', sans-serif;
          background: #ffffff;
          overflow: hidden;
          isolation: isolate;
          border-radius: 18px;
          border: 1px solid #d9e3de;
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
        }

        .hm-register-left {
          background: #0d5c45;
          color: #ffffff;
          padding: clamp(1.2rem, 2.4vw, 2rem);
          display: flex;
          align-items: stretch;
          justify-content: flex-start;
          position: relative;
          overflow: hidden;
          opacity: 1;
        }

        .hm-register-left::before,
        .hm-register-left::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }

        .hm-register-left::before {
          width: 380px;
          height: 380px;
          top: -150px;
          right: -120px;
          background: radial-gradient(circle, rgba(45, 196, 141, 0.22) 0%, rgba(45, 196, 141, 0) 72%);
        }

        .hm-register-left::after {
          width: 320px;
          height: 320px;
          left: -130px;
          bottom: -110px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0) 72%);
        }

        .hm-register-left-inner {
          width: min(100%, 500px);
          margin-block: auto;
          display: grid;
          gap: 0.85rem;
          position: relative;
          z-index: 1;
        }

        .hm-register-metrics {
          margin-top: 0.3rem;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.45rem;
        }

        .hm-register-metrics div {
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(255, 255, 255, 0.1);
          padding: 0.42rem 0.5rem;
          display: grid;
          gap: 0.08rem;
        }

        .hm-register-metrics strong {
          font-size: 0.78rem;
          line-height: 1;
        }

        .hm-register-metrics span {
          font-size: 0.68rem;
          color: #c6f1e1;
        }

        .hm-register-logo {
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

        .hm-register-logo-mark {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.35);
          font-size: 0.95rem;
          line-height: 1;
        }

        .hm-register-left h1 {
          margin: 0;
          font-family: 'Sora', sans-serif;
          font-size: clamp(1.8rem, 2.8vw, 2.5rem);
          line-height: 1.15;
          max-width: 13ch;
        }

        .hm-register-subtitle {
          margin: 0;
          color: #d8f5e9;
          line-height: 1.55;
          max-width: 38ch;
          font-size: 0.98rem;
        }

        .hm-register-graphic {
          margin-top: 0.45rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(45, 196, 141, 0.2));
          padding: 0.85rem;
          display: grid;
          gap: 0.7rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 14px 30px rgba(0, 0, 0, 0.14);
          animation: hmFloat 5.6s ease-in-out infinite;
          overflow: hidden;
        }

        .hm-register-graphic-top {
          display: flex;
          gap: 0.35rem;
          align-items: center;
        }

        .hm-register-graphic-top span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          animation: hmBlink 2.1s ease-in-out infinite;
        }

        .hm-register-graphic-top span:nth-child(2) {
          animation-delay: 0.35s;
        }

        .hm-register-graphic-top span:nth-child(3) {
          animation-delay: 0.7s;
        }

        .hm-register-graphic-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
        }

        .hm-register-graphic-card {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          background: rgba(255, 255, 255, 0.1);
          padding: 0.65rem;
          min-height: 68px;
          overflow: hidden;
        }

        .hm-register-graphic-card-wide {
          grid-column: 1 / 3;
        }

        .hm-register-graphic .line {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.82), rgba(45, 196, 141, 0.72));
          background-size: 180% 100%;
          animation: hmLineShift 3.2s linear infinite;
        }

        .hm-register-graphic .line.one {
          width: 78%;
        }

        .hm-register-graphic .line.two {
          margin-top: 0.52rem;
          width: 92%;
        }

        .hm-register-graphic .line.three {
          margin-top: 0.52rem;
          width: 58%;
        }

        .mini-value {
          width: 56%;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
        }

        .mini-wave {
          margin-top: 0.85rem;
          height: 24px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.3), rgba(45, 196, 141, 0.72), rgba(255, 255, 255, 0.3));
          background-size: 170% 100%;
          animation: hmLineShift 2.8s linear infinite;
        }

        .hm-register-graphic-card-chart {
          display: grid;
          align-content: center;
        }

        .chart-line {
          height: 30px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.78);
          border-top-color: transparent;
          border-left-color: transparent;
          transform: skewX(-16deg);
          animation: hmPulse 2.4s ease-in-out infinite;
        }

        .hm-register-benefits {
          margin: 0.45rem 0 0;
          padding-left: 0;
          list-style: none;
          display: grid;
          gap: 0.68rem;
        }

        .hm-register-benefits li {
          color: #e8f9f2;
          line-height: 1.5;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        .hm-register-benefits li::before {
          content: 'v';
          width: 20px;
          height: 20px;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.33);
          flex-shrink: 0;
          font-weight: 800;
          color: #b6f1dd;
          font-size: 0.7rem;
          line-height: 1;
        }

        .hm-register-right {
          background: #ffffff;
          padding: clamp(1rem, 2.2vw, 1.8rem);
          overflow-y: auto;
          opacity: 1;
          display: grid;
          align-items: center;
        }

        .hm-reg-surface {
          max-width: 640px;
          margin-inline: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 12px 26px rgba(13, 92, 69, 0.08);
          padding: 0.9rem;
        }

        .hm-register-right h2 {
          margin: 0.62rem 0 0.58rem;
          font-family: 'Sora', sans-serif;
          font-size: 1.58rem;
          color: #111827;
        }

        .hm-reg-intro {
          margin: 0 0 0.72rem;
          color: #4b5563;
          font-size: 0.84rem;
          line-height: 1.45;
        }

        .hm-reg-role-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
          margin-bottom: 0.75rem;
        }

        .hm-reg-role {
          min-height: 62px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-weight: 700;
          cursor: pointer;
          display: grid;
          align-content: center;
          justify-content: center;
          gap: 0.18rem;
          text-align: center;
          padding: 0.5rem;
        }

        .hm-reg-role.active {
          border-color: #0d5c45;
          background: #e8f9f2;
          color: #0d5c45;
        }

        .hm-reg-role-copy {
          font-size: 0.92rem;
          line-height: 1.15;
        }

        .hm-reg-role-mini {
          font-size: 0.73rem;
          font-weight: 600;
          opacity: 0.82;
        }

        .hm-reg-alert {
          margin: 0 0 0.65rem;
          border-radius: 10px;
          padding: 0.56rem 0.72rem;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .hm-reg-alert-error {
          color: #991b1b;
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .hm-reg-alert-success {
          color: #065f46;
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
        }

        .hm-reg-form {
          display: grid;
          gap: 0.56rem;
          background: #ffffff;
        }

        .hm-reg-form label {
          display: grid;
          gap: 0.22rem;
          color: #111827;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .hm-reg-form input,
        .hm-reg-form textarea {
          width: 100%;
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          padding: 0.4rem 0.56rem;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hm-reg-form input:focus,
        .hm-reg-form textarea:focus {
          outline: none;
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .hm-reg-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.52rem;
        }

        .hm-reg-help,
        .hm-reg-status {
          font-size: 0.74rem;
          color: #4b5563;
        }

        .hm-reg-status.ok {
          color: #0d7f5a;
        }

        .hm-reg-status.warn {
          color: #b45309;
        }

        .hm-reg-strength-wrap {
          margin-top: 0.25rem;
          border-radius: 999px;
          background: #e5e7eb;
          height: 6px;
          overflow: hidden;
        }

        .hm-reg-strength-bar {
          height: 100%;
          width: 0;
          transition: width 0.2s ease, background 0.2s ease;
          background: #d1d5db;
        }

        .hm-reg-strength-bar.level-0 {
          width: 0;
          background: #d1d5db;
        }

        .hm-reg-strength-bar.level-1 {
          width: 20%;
          background: #ef4444;
        }

        .hm-reg-strength-bar.level-2 {
          width: 40%;
          background: #f97316;
        }

        .hm-reg-strength-bar.level-3 {
          width: 60%;
          background: #f59e0b;
        }

        .hm-reg-strength-bar.level-4 {
          width: 80%;
          background: #84cc16;
        }

        .hm-reg-strength-bar.level-5 {
          width: 100%;
          background: #22c55e;
        }

        .hm-reg-help-strength.level-0,
        .hm-reg-help-strength.level-1 {
          color: #b91c1c;
        }

        .hm-reg-help-strength.level-2,
        .hm-reg-help-strength.level-3 {
          color: #b45309;
        }

        .hm-reg-help-strength.level-4,
        .hm-reg-help-strength.level-5 {
          color: #0f766e;
        }

        .hm-reg-primary {
          width: 100%;
          min-height: 40px;
          border-radius: 10px;
          border: 0;
          color: #ffffff;
          background: #0d5c45;
          font-size: 0.9rem;
          font-weight: 800;
          cursor: pointer;
        }

        .hm-reg-primary:hover {
          background: #0b4f3b;
        }

        .hm-reg-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .hm-reg-login-link {
          margin-top: 0.62rem;
          color: #4b5563;
          font-size: 0.85rem;
        }

        .hm-reg-login-link a {
          color: #0d5c45;
          font-weight: 700;
          text-decoration: none;
        }

        @keyframes hmFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes hmPulse {
          0%,
          100% {
            opacity: 0.65;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes hmLineShift {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 180% 0%;
          }
        }

        @keyframes hmBlink {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }

        @media (max-width: 1120px) {
          .hm-register-page-wrap {
            padding: 0.7rem;
          }

          .hm-register-page {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .hm-register-metrics {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hm-register-left {
            padding: 1.15rem;
          }

          .hm-register-left-inner {
            margin-block: 0;
          }

          .hm-register-right {
            padding: 0.85rem;
          }
        }

        @media (max-width: 760px) {
          .hm-reg-grid-2,
          .hm-reg-role-row {
            grid-template-columns: 1fr;
          }

          .hm-register-right h2 {
            font-size: 1.35rem;
          }

          .hm-register-subtitle {
            font-size: 0.92rem;
          }
        }
      `}</style>
    </div>
  );
}
