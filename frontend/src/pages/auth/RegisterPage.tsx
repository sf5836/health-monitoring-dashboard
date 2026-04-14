
import { FormEvent, KeyboardEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { ApiError } from '../../services/apiClient';

type Role = 'patient' | 'doctor';

type Qualification = {
  degree: string;
  institution: string;
  year: string;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

function getPasswordStrength(password: string): { label: string; score: number; tone: string } {
  if (password.length === 0) return { label: 'Enter password', score: 0, tone: '#d1d5db' };
  if (password.length < 6) return { label: 'Weak', score: 30, tone: '#ef4444' };
  if (password.length < 10) return { label: 'Medium', score: 65, tone: '#f59e0b' };
  return { label: 'Strong', score: 100, tone: '#22c55e' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('patient');
  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [bloodGroup, setBloodGroup] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [medications, setMedications] = useState<string[]>([]);
  const [medicalHistory, setMedicalHistory] = useState('');

  const [emergencyName, setEmergencyName] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [specialization, setSpecialization] = useState('Cardiology');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualifications, setQualifications] = useState<Qualification[]>([
    { degree: '', institution: '', year: '' }
  ]);
  const [experience, setExperience] = useState('');
  const [hospital, setHospital] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const resetStepOnRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setStep(1);
  };

  const addTag = (
    event: KeyboardEvent<HTMLInputElement>,
    value: string,
    setValue: (newValue: string) => void,
    list: string[],
    setList: (next: string[]) => void
  ) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    setValue('');
  };

  const removeTag = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.filter((item) => item !== value));
  };

  const updateQualification = (index: number, key: keyof Qualification, value: string) => {
    const next = [...qualifications];
    next[index] = { ...next[index], [key]: value };
    setQualifications(next);
  };

  const addQualificationRow = () => {
    setQualifications([...qualifications, { degree: '', institution: '', year: '' }]);
  };

  const toggleSlot = (day: string, slot: string) => {
    const id = `${day}-${slot}`;
    if (selectedSlots.includes(id)) {
      setSelectedSlots(selectedSlots.filter((item) => item !== id));
      return;
    }
    setSelectedSlots([...selectedSlots, id]);
  };

  const nextStep = () => setStep(Math.min(3, step + 1));
  const prevStep = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (step < 3) {
      nextStep();
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match');
      return;
    }

    setSubmitting(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      if (role === 'patient') {
        await authService.registerPatient({
          fullName,
          email,
          phone,
          password
        });
        navigate('/patient/dashboard');
      } else {
        await authService.registerDoctor({
          fullName,
          email,
          phone,
          password,
          specialization,
          licenseNumber,
          qualifications: qualifications
            .map((q) => `${q.degree} ${q.institution} ${q.year}`.trim())
            .filter(Boolean),
          experienceYears: experience ? Number(experience) : undefined,
          hospital,
          fee: fee ? Number(fee) : undefined,
          bio,
          availability: selectedSlots.join(', ')
        });
        navigate('/doctor/pending-approval');
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hm-register">
      <aside className="hm-register-left">
        <div className="hm-register-brand">HealthMonitor Pro</div>
        <h1>Join HealthMonitor Pro</h1>
        <p>Monitor your health, connect with experts</p>

        <div className="hm-register-illustration">
          <div className="line" />
          <div className="card">BP 120/80</div>
          <div className="card">HR 72 bpm</div>
          <div className="card">SpO2 98%</div>
        </div>

        <ul>
          <li>Secure and encrypted health data</li>
          <li>500+ verified specialist doctors</li>
          <li>Real-time health monitoring</li>
        </ul>
      </aside>

      <main className="hm-register-right">
        <div className="hm-step-indicator">
          {[1, 2, 3].map((item) => (
            <div key={item} className={item <= step ? 'active' : ''}>
              <span>{item}</span>
              <p>{item === 1 ? 'Personal Info' : item === 2 ? (role === 'patient' ? 'Medical Info' : 'Professional Info') : role === 'patient' ? 'Emergency Contact' : 'Availability'}</p>
            </div>
          ))}
        </div>

        <h2>Create your account</h2>

        <div className="hm-role-toggle">
          <button
            type="button"
            className={role === 'patient' ? 'active' : ''}
            onClick={() => resetStepOnRoleChange('patient')}
          >
            I&apos;m a Patient
          </button>
          <button
            type="button"
            className={role === 'doctor' ? 'active' : ''}
            onClick={() => resetStepOnRoleChange('doctor')}
          >
            I&apos;m a Doctor
          </button>
        </div>

        <form className="hm-register-form" onSubmit={handleSubmit}>
          {errorMessage ? <p className="hm-register-footer">{errorMessage}</p> : null}
          {step === 1 && (
            <>
              <div className="grid-two">
                <label>
                  First Name
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </label>
                <label>
                  Last Name
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </label>
              </div>

              <label>
                Email Address
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <small>{email ? 'Email format looks valid.' : 'Real-time availability check ready.'}</small>
              </label>

              <label>
                Phone Number
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>

              <div className="grid-two">
                <label>
                  Date of Birth
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                </label>
                <fieldset>
                  <legend>Gender</legend>
                  <div className="pill-options">
                    {['male', 'female', 'other'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={gender === value ? 'active' : ''}
                        onClick={() => setGender(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <label>
                Password
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div className="hm-strength">
                  <div style={{ width: `${strength.score}%`, background: strength.tone }} />
                </div>
                <small>{strength.label}</small>
              </label>

              <label>
                Confirm Password
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </label>
            </>
          )}

          {step === 2 && role === 'patient' && (
            <>
              <button type="button" className="hm-link-btn" onClick={prevStep}>
                {'<- Back'}
              </button>

              <label>
                Blood Group
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>

              <div className="grid-two">
                <label>
                  Height (cm)
                  <input value={height} onChange={(e) => setHeight(e.target.value)} required />
                </label>
                <label>
                  Weight (kg)
                  <input value={weight} onChange={(e) => setWeight(e.target.value)} required />
                </label>
              </div>

              <label>
                Allergies
                <input
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => addTag(e, allergyInput, setAllergyInput, allergies, setAllergies)}
                  placeholder="Type and press Enter"
                />
                <div className="hm-tags">
                  {allergies.map((item) => (
                    <button key={item} type="button" onClick={() => removeTag(item, allergies, setAllergies)}>
                      {item} x
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Current Medications
                <input
                  value={medicationInput}
                  onChange={(e) => setMedicationInput(e.target.value)}
                  onKeyDown={(e) => addTag(e, medicationInput, setMedicationInput, medications, setMedications)}
                  placeholder="Type and press Enter"
                />
                <div className="hm-tags">
                  {medications.map((item) => (
                    <button key={item} type="button" onClick={() => removeTag(item, medications, setMedications)}>
                      {item} x
                    </button>
                  ))}
                </div>
              </label>

              <label>
                Medical History
                <textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} rows={4} />
                <small>{medicalHistory.length}/300</small>
              </label>
            </>
          )}

          {step === 2 && role === 'doctor' && (
            <>
              <button type="button" className="hm-link-btn" onClick={prevStep}>
                {'<- Back'}
              </button>

              <label>
                Specialization
                <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                  {['Cardiology', 'Neurology', 'Diabetology', 'Orthopedic', 'General Medicine'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                License Number
                <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
              </label>

              <div className="hm-qualifications">
                <p>Qualifications</p>
                {qualifications.map((row, index) => (
                  <div key={`${index}-${row.degree}`} className="grid-three">
                    <input
                      placeholder="Degree"
                      value={row.degree}
                      onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                    />
                    <input
                      placeholder="Institution"
                      value={row.institution}
                      onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                    />
                    <input
                      placeholder="Year"
                      value={row.year}
                      onChange={(e) => updateQualification(index, 'year', e.target.value)}
                    />
                  </div>
                ))}
                <button type="button" className="hm-btn hm-btn-outline" onClick={addQualificationRow}>
                  + Add Qualification
                </button>
              </div>

              <div className="grid-two">
                <label>
                  Experience (years)
                  <input value={experience} onChange={(e) => setExperience(e.target.value)} required />
                </label>
                <label>
                  Consultation Fee
                  <input value={fee} onChange={(e) => setFee(e.target.value)} required />
                </label>
              </div>

              <label>
                Hospital / Clinic
                <input value={hospital} onChange={(e) => setHospital(e.target.value)} required />
              </label>

              <label>
                Professional Bio
                <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
              </label>

              <div className="grid-two">
                <label>
                  Profile Photo
                  <input type="file" />
                </label>
                <label>
                  License Document
                  <input type="file" />
                </label>
              </div>
            </>
          )}

          {step === 3 && role === 'patient' && (
            <>
              <button type="button" className="hm-link-btn" onClick={prevStep}>
                {'<- Back'}
              </button>

              <label>
                Emergency Contact Name
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required />
              </label>

              <label>
                Relationship
                <select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
                  {['Parent', 'Spouse', 'Sibling', 'Friend', 'Other'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                Contact Phone Number
                <input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
              </label>

              <label className="hm-checkbox">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                I agree to the Terms of Service and Privacy Policy
              </label>
            </>
          )}

          {step === 3 && role === 'doctor' && (
            <>
              <button type="button" className="hm-link-btn" onClick={prevStep}>
                {'<- Back'}
              </button>
              <div className="hm-availability-grid">
                <div className="hm-availability-header">
                  <span>Time</span>
                  {weekDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                {timeSlots.map((slot) => (
                  <div key={slot} className="hm-availability-row">
                    <span>{slot}</span>
                    {weekDays.map((day) => {
                      const id = `${day}-${slot}`;
                      return (
                        <label key={id}>
                          <input
                            type="checkbox"
                            checked={selectedSlots.includes(id)}
                            onChange={() => toggleSlot(day, slot)}
                          />
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          <button type="submit" className="hm-btn hm-btn-primary hm-btn-block" disabled={submitting}>
            {submitting
              ? 'Submitting...'
              : step < 3
                ? 'Next Step ->'
                : role === 'patient'
                  ? 'Create My Account'
                  : 'Submit Doctor Application'}
          </button>
        </form>

        <p className="hm-register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </main>
    </div>
  );
}
