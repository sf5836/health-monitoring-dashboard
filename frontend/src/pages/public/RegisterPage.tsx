import { type FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { ApiError, apiRequest } from '../../services/apiClient';
import { sessionStore } from '../../services/sessionStore';

type Role = 'patient' | 'doctor';
type Step = 1 | 2;

function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak' };
  if (score === 2) return { score: 2, label: 'Medium' };
  return { score: 3, label: 'Strong' };
}

function StepIndicator({ step, labels }: Readonly<{ step: Step; labels: string[] }>) {
  return (
    <div className="hm-reg-steps" role="list" aria-label="Registration steps">
      {labels.map((label, index) => {
        const itemStep = (index + 1) as Step;
        const stateClass = itemStep < step ? 'done' : itemStep === step ? 'active' : 'idle';
        return (
          <div key={label} className={`hm-reg-step ${stateClass}`} role="listitem">
            <span className="hm-reg-step-dot">{index + 1}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('patient');
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [doctorQualifications, setDoctorQualifications] = useState<string[]>(['']);
  const [experienceYears, setExperienceYears] = useState('');
  const [hospital, setHospital] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const stepLabels = role === 'doctor' ? ['Personal Info', 'Professional Info'] : ['Personal Info'];
  const isDoctorProfessionalStep = role === 'doctor' && step === 2;

  const emailStatus = useMemo(() => {
    if (!email.trim()) return 'Enter email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid format';
    return 'Format looks good';
  }, [email]);

  function updateQualification(index: number, value: string) {
    setDoctorQualifications((current) =>
      current.map((item, currentIndex) => (currentIndex === index ? value : item))
    );
  }

  function addQualificationRow() {
    setDoctorQualifications((current) => [...current, '']);
  }

  function nextStep() {
    if (role !== 'doctor') return;
    setErrorMessage('');
    setStep(2);
  }

  function backStep() {
    setStep(1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password must match.');
      return;
    }

    if (role === 'doctor' && step === 1) {
      nextStep();
      return;
    }

    const payload: Record<string, unknown> = {
      fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password
    };

    if (role === 'doctor') {
      payload.specialization = specialization.trim();
      payload.licenseNumber = licenseNumber.trim();

      const cleanedQualifications = doctorQualifications.map((item) => item.trim()).filter(Boolean);
      if (cleanedQualifications.length > 0) {
        payload.qualifications = cleanedQualifications;
      }

      if (experienceYears.trim()) {
        payload.experienceYears = Number(experienceYears);
      }

      if (hospital.trim()) {
        payload.hospital = hospital.trim();
      }

      if (fee.trim()) {
        payload.fee = Number(fee);
      }

      if (bio.trim()) {
        payload.bio = bio.trim();
      }

      if (availability.trim()) {
        payload.availability = availability.trim();
      }
    }

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

      if (response?.data?.accessToken && response?.data?.refreshToken) {
        sessionStore.setTokens(response.data.accessToken, response.data.refreshToken);
      }
      if (response?.data?.user?.role) {
        sessionStore.setRole(response.data.user.role);
      }

      setSuccessMessage(
        response?.message ||
          (role === 'doctor'
            ? 'Doctor registered. Approval is pending.'
            : 'Patient registered successfully.')
      );
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderPatientFields() {
    return (
      <>
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
          <span className={`hm-reg-status ${emailStatus === 'Format looks good' ? 'ok' : 'warn'}`}>{emailStatus}</span>
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
          <span className="hm-reg-help">Strength: {passwordStrength.label}</span>
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
      </>
    );
  }

  function renderDoctorPersonalFields() {
    return renderPatientFields();
  }

  function renderDoctorProfessionalFields() {
    return (
      <>
        <button type="button" className="hm-reg-back" onClick={backStep}>
          {'<- Back'}
        </button>

        <label>
          Specialization
          <input
            type="text"
            placeholder="Cardiology"
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            required
          />
        </label>

        <label>
          License Number
          <input
            type="text"
            placeholder="PMDC-XXXX-1234"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            required
          />
        </label>

        <div className="hm-reg-grid-2">
          <label>
            Experience (years)
            <input
              type="number"
              min="0"
              placeholder="8"
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
            />
          </label>

          <label>
            Consultation Fee (PKR)
            <input
              type="number"
              min="0"
              placeholder="1500"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
            />
          </label>
        </div>

        <label>
          Hospital / Clinic
          <input
            type="text"
            placeholder="Hospital name"
            value={hospital}
            onChange={(event) => setHospital(event.target.value)}
          />
        </label>

        <div className="hm-reg-qualifications">
          <span className="hm-reg-label">Qualifications</span>
          {doctorQualifications.map((qualification, index) => (
            <input
              key={`qualification-${index}`}
              type="text"
              placeholder={`Qualification ${index + 1}`}
              value={qualification}
              onChange={(event) => updateQualification(index, event.target.value)}
            />
          ))}
          <button type="button" className="hm-reg-ghost" onClick={addQualificationRow}>
            + Add Qualification
          </button>
        </div>

        <label>
          Bio
          <textarea
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a short professional bio"
          />
          <span className="hm-reg-help">{bio.length}/500</span>
        </label>

        <label>
          Availability (Optional)
          <textarea
            rows={3}
            placeholder="Mon-Fri: 9:00-17:00"
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
          />
        </label>
      </>
    );
  }

  return (
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
          <p className="hm-register-subtitle">Monitor your health, connect with experts</p>

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
            <li>Real-time health monitoring</li>
          </ul>
        </div>
      </section>

      <section className="hm-register-right">
        <div className="hm-reg-surface">
          <StepIndicator step={step} labels={stepLabels} />
          <h2>Create your account</h2>
          <p className="hm-reg-intro">
            We collect only essential registration data now. Additional profile details can be completed
            after signup.
          </p>

          <div className="hm-reg-role-row" role="tablist" aria-label="Role selector">
            <button
              type="button"
              className={`hm-reg-role ${role === 'patient' ? 'active' : ''}`}
              onClick={() => {
                setRole('patient');
                setStep(1);
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
                setStep(1);
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <span className="hm-reg-role-copy">I am a Doctor</span>
              <span className="hm-reg-role-mini">Requires approval</span>
            </button>
          </div>

          {errorMessage ? <p className="hm-reg-alert hm-reg-alert-error">{errorMessage}</p> : null}
          {successMessage ? <p className="hm-reg-alert hm-reg-alert-success">{successMessage}</p> : null}

          <form className="hm-reg-form" onSubmit={onSubmit}>
            <div className="hm-reg-section-heading">
              <p>
                {role === 'patient'
                  ? 'Patient account details'
                  : isDoctorProfessionalStep
                    ? 'Doctor professional details'
                    : 'Doctor personal details'}
              </p>
              <span className="hm-reg-meta">
                {role === 'patient'
                  ? 'Required: fullName, email, password'
                  : isDoctorProfessionalStep
                    ? 'Required: specialization, licenseNumber'
                    : 'Required: fullName, email, password'}
              </span>
            </div>

            {role === 'patient' ? renderPatientFields() : step === 1 ? renderDoctorPersonalFields() : renderDoctorProfessionalFields()}

            <div className="hm-reg-actions">
              {role === 'doctor' && step === 1 ? (
                <button type="button" className="hm-reg-primary" onClick={nextStep}>
                  Next Step &rarr;
                </button>
              ) : (
                <button type="submit" className="hm-reg-primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Submitting...'
                    : role === 'doctor'
                      ? 'Submit Doctor Application'
                      : 'Create Patient Account'}
                </button>
              )}
            </div>
          </form>

          <p className="hm-reg-login-link">
            Already have an account? <Link to={ROUTE_PATHS.auth.login}>Login</Link>
          </p>
        </div>
      </section>

      <style>{`
        .hm-register-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 40% 60%;
          font-family: 'DM Sans', sans-serif;
          background: #f9fafb;
          overflow: hidden;
          isolation: isolate;
        }

        .hm-register-left {
          background: #0d5c45;
          color: #ffffff;
          padding: 2rem 2.2rem;
          display: flex;
          align-items: center;
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
          gap: 1rem;
          position: relative;
          z-index: 1;
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
          line-height: 1.6;
          max-width: 38ch;
        }

        .hm-register-graphic {
          margin-top: 0.6rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(45, 196, 141, 0.2));
          padding: 0.85rem;
          display: grid;
          gap: 0.7rem;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 14px 30px rgba(0, 0, 0, 0.14);
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
        }

        .hm-register-graphic-card-wide {
          grid-column: 1 / 3;
        }

        .hm-register-graphic .line {
          height: 8px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.82), rgba(45, 196, 141, 0.72));
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
        }

        .hm-register-benefits {
          margin: 0.45rem 0 0;
          padding-left: 0;
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
          content: '✓';
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
        }

        .hm-register-right {
          background: #ffffff;
          padding: 1.6rem 2.1rem;
          overflow-y: auto;
          opacity: 1;
        }

        .hm-reg-surface {
          max-width: 840px;
          margin-inline: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 12px 26px rgba(13, 92, 69, 0.08);
          padding: 1.2rem;
        }

        .hm-register-right h2 {
          margin: 0.9rem 0 0.85rem;
          font-family: 'Sora', sans-serif;
          font-size: 1.75rem;
          color: #111827;
        }

        .hm-reg-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.55rem;
        }

        .hm-reg-step {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          border-radius: 999px;
          border: 1px solid #d1d5db;
          padding: 0.38rem 0.55rem;
          color: #4b5563;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .hm-reg-step-dot {
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 999px;
          display: inline-grid;
          place-items: center;
          background: #e5e7eb;
        }

        .hm-reg-step.active,
        .hm-reg-step.done {
          border-color: #0d5c45;
          color: #0d5c45;
          background: #e8f9f2;
        }

        .hm-reg-step.active .hm-reg-step-dot,
        .hm-reg-step.done .hm-reg-step-dot {
          background: #0d5c45;
          color: #ffffff;
        }

        .hm-reg-role-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
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

        .hm-reg-intro {
          margin: 0 0 0.9rem;
          color: #4b5563;
          font-size: 0.9rem;
          line-height: 1.45;
        }

        .hm-reg-alert {
          margin: 0 0 0.9rem;
          border-radius: 10px;
          padding: 0.68rem 0.8rem;
          font-size: 0.88rem;
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
          gap: 0.8rem;
          background: #ffffff;
        }

        .hm-reg-section-heading {
          display: grid;
          gap: 0.18rem;
          padding: 0.62rem 0.72rem;
          border-radius: 10px;
          border: 1px solid #dbe5e1;
          background: #f7fcf9;
        }

        .hm-reg-section-heading p {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 800;
          color: #0d5c45;
        }

        .hm-reg-meta {
          font-size: 0.74rem;
          color: #4b5563;
          font-weight: 600;
        }

        .hm-reg-form label,
        .hm-reg-label {
          display: grid;
          gap: 0.35rem;
          color: #111827;
          font-weight: 600;
          font-size: 0.93rem;
        }

        .hm-reg-form input,
        .hm-reg-form textarea {
          width: 100%;
          min-height: 42px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          font-size: 0.94rem;
          font-family: 'DM Sans', sans-serif;
          padding: 0.58rem 0.72rem;
          color: #111827;
          background: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .hm-reg-form textarea {
          min-height: 90px;
          resize: vertical;
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
          gap: 0.7rem;
        }

        .hm-reg-help,
        .hm-reg-status {
          font-size: 0.78rem;
          color: #4b5563;
        }

        .hm-reg-status.ok {
          color: #0d7f5a;
        }

        .hm-reg-status.warn {
          color: #b45309;
        }

        .hm-reg-strength-wrap {
          margin-top: 0.35rem;
          border-radius: 999px;
          background: #e5e7eb;
          height: 8px;
          overflow: hidden;
        }

        .hm-reg-strength-bar {
          height: 100%;
          width: 35%;
          transition: width 0.2s ease, background 0.2s ease;
        }

        .hm-reg-strength-bar.level-1 {
          width: 35%;
          background: #ef4444;
        }

        .hm-reg-strength-bar.level-2 {
          width: 68%;
          background: #f59e0b;
        }

        .hm-reg-strength-bar.level-3 {
          width: 100%;
          background: #22c55e;
        }

        .hm-reg-qualifications {
          display: grid;
          gap: 0.5rem;
        }

        .hm-reg-ghost {
          width: fit-content;
          border: 1px solid #0d5c45;
          color: #0d5c45;
          background: #ffffff;
          border-radius: 8px;
          padding: 0.45rem 0.66rem;
          cursor: pointer;
          font-weight: 700;
        }

        .hm-reg-back {
          width: fit-content;
          border: 0;
          background: transparent;
          color: #0d5c45;
          padding: 0;
          font-weight: 700;
          cursor: pointer;
        }

        .hm-reg-actions {
          margin-top: 0.4rem;
        }

        .hm-reg-primary {
          width: 100%;
          min-height: 46px;
          border-radius: 10px;
          border: 0;
          color: #ffffff;
          background: #0d5c45;
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
          margin-top: 1rem;
          color: #4b5563;
          font-size: 0.9rem;
        }

        .hm-reg-login-link a {
          color: #0d5c45;
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 1120px) {
          .hm-register-page {
            grid-template-columns: 1fr;
          }

          .hm-register-left {
            padding: 1.5rem;
          }

          .hm-register-left-inner {
            margin-block: 0;
          }

          .hm-register-right {
            padding: 1.4rem;
          }
        }

        @media (max-width: 760px) {
          .hm-reg-grid-2,
          .hm-reg-role-row {
            grid-template-columns: 1fr;
          }

          .hm-register-right h2 {
            font-size: 1.45rem;
          }
        }
      `}</style>
    </div>
  );
}
