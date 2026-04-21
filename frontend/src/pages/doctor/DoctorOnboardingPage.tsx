import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { ApiError } from '../../services/apiClient';
import { getDoctorProfile, updateDoctorProfile } from '../../services/doctorPortalService';

type DoctorDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type AvailabilitySlot = {
  day: DoctorDay;
  startTime: string;
  endTime: string;
};

type LegalDocumentRow = {
  label: string;
  fileName: string;
  contentType: string;
  dataBase64: string;
};

const WEEK_DAYS: DoctorDay[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      const base64 = value.includes(',') ? value.split(',')[1] : value;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

export default function DoctorOnboardingPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [doctorQualifications, setDoctorQualifications] = useState<string[]>(['']);
  const [experienceYears, setExperienceYears] = useState('');
  const [hospital, setHospital] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState('');
  const [availabilitySchedule, setAvailabilitySchedule] = useState<AvailabilitySlot[]>([
    { day: 'monday', startTime: '09:00', endTime: '17:00' }
  ]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocumentRow[]>([
    { label: 'License PDF', fileName: '', contentType: '', dataBase64: '' }
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await getDoctorProfile();
        if (cancelled) return;

        if (profile.approvalStatus === 'approved') {
          navigate(ROUTE_PATHS.doctor.dashboard, { replace: true });
          return;
        }

        setSpecialization(profile.specialization || '');
        setLicenseNumber(profile.licenseNumber || '');
        setDoctorQualifications(profile.qualifications.length > 0 ? profile.qualifications : ['']);
        setExperienceYears(
          typeof profile.experienceYears === 'number' ? String(profile.experienceYears) : ''
        );
        setHospital(profile.hospital || '');
        setFee(typeof profile.fee === 'number' ? String(profile.fee) : '');
        setBio(profile.bio || '');
        setAvailability(profile.availability || '');

        if (profile.availabilitySchedule.length > 0) {
          setAvailabilitySchedule(profile.availabilitySchedule);
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError) {
          setErrorMessage(error.message || 'Unable to load onboarding profile.');
        } else {
          setErrorMessage('Unable to load onboarding profile.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function updateQualification(index: number, value: string) {
    setDoctorQualifications((current) =>
      current.map((item, currentIndex) => (currentIndex === index ? value : item))
    );
  }

  function addQualificationRow() {
    setDoctorQualifications((current) => [...current, '']);
  }

  function removeQualificationRow(index: number) {
    setDoctorQualifications((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function updateScheduleSlot(index: number, patch: Partial<AvailabilitySlot>) {
    setAvailabilitySchedule((current) =>
      current.map((slot, currentIndex) => (currentIndex === index ? { ...slot, ...patch } : slot))
    );
  }

  function addScheduleSlot() {
    setAvailabilitySchedule((current) => [...current, { day: 'monday', startTime: '09:00', endTime: '17:00' }]);
  }

  function removeScheduleSlot(index: number) {
    setAvailabilitySchedule((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function updateLegalDocument(index: number, patch: Partial<LegalDocumentRow>) {
    setLegalDocuments((current) =>
      current.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
    );
  }

  async function onSelectLegalDocument(index: number, file: File | null) {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are allowed for legal documents.');
      return;
    }

    try {
      const dataBase64 = await fileToBase64(file);
      updateLegalDocument(index, {
        fileName: file.name,
        contentType: file.type,
        dataBase64
      });
      setErrorMessage('');
    } catch {
      setErrorMessage('Unable to process selected document. Please try again.');
    }
  }

  function addLegalDocumentRow() {
    setLegalDocuments((current) => [...current, { label: '', fileName: '', contentType: '', dataBase64: '' }]);
  }

  function removeLegalDocumentRow(index: number) {
    setLegalDocuments((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  function validateForm() {
    if (!specialization.trim()) {
      setErrorMessage('Specialization is required.');
      return false;
    }

    if (!licenseNumber.trim()) {
      setErrorMessage('License number is required.');
      return false;
    }

    if (experienceYears.trim() && (Number.isNaN(Number(experienceYears)) || Number(experienceYears) < 0)) {
      setErrorMessage('Experience years must be a valid non-negative number.');
      return false;
    }

    if (fee.trim() && (Number.isNaN(Number(fee)) || Number(fee) < 0)) {
      setErrorMessage('Consultation fee must be a valid non-negative number.');
      return false;
    }

    const cleanedSlots = availabilitySchedule.filter(
      (slot) => slot.day && slot.startTime.trim() && slot.endTime.trim()
    );

    if (cleanedSlots.length === 0) {
      setErrorMessage('Please add at least one weekly availability slot.');
      return false;
    }

    const hasInvalidSlot = cleanedSlots.some((slot) => slot.startTime >= slot.endTime);
    if (hasInvalidSlot) {
      setErrorMessage('Each availability slot must have an end time after start time.');
      return false;
    }

    const uploadedDocuments = legalDocuments.filter((doc) => doc.dataBase64 && doc.fileName);
    if (uploadedDocuments.length === 0) {
      setErrorMessage('Please upload at least one legal document in PDF format.');
      return false;
    }

    return true;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    const cleanedQualifications = doctorQualifications.map((item) => item.trim()).filter(Boolean);

    try {
      setIsSubmitting(true);
      await updateDoctorProfile({
        specialization: specialization.trim(),
        licenseNumber: licenseNumber.trim(),
        qualifications: cleanedQualifications,
        experienceYears: experienceYears.trim() ? Number(experienceYears) : undefined,
        hospital: hospital.trim() || undefined,
        fee: fee.trim() ? Number(fee) : undefined,
        bio: bio.trim() || undefined,
        availability: availability.trim() || undefined,
        availabilitySchedule: availabilitySchedule
          .filter((slot) => slot.day && slot.startTime.trim() && slot.endTime.trim())
          .map((slot) => ({
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime
          })),
        legalDocuments: legalDocuments
          .filter((doc) => doc.dataBase64 && doc.fileName)
          .map((doc, index) => ({
            label: doc.label.trim() || `Document ${index + 1}`,
            fileName: doc.fileName,
            contentType: doc.contentType || 'application/pdf',
            dataBase64: doc.dataBase64
          }))
      });

      setSuccessMessage('Professional details submitted. Your application is now under review.');

      window.setTimeout(() => {
        navigate(ROUTE_PATHS.doctor.pendingApproval, { replace: true });
      }, 450);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || 'Unable to save onboarding details.');
      } else {
        setErrorMessage('Unable to save onboarding details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="doctor-onboarding-wrap">
      <div className="doctor-onboarding-shell">
        <header className="doctor-onboarding-header">
          <p className="doctor-onboarding-badge">Step 2 of 2</p>
          <h1>Complete Your Doctor Profile</h1>
          <p>
            Add your professional details, weekly slots, and legal documents to move your application into
            admin review.
          </p>
        </header>

        {errorMessage ? <p className="doctor-onboarding-alert doctor-onboarding-alert-error">{errorMessage}</p> : null}
        {successMessage ? (
          <p className="doctor-onboarding-alert doctor-onboarding-alert-success">{successMessage}</p>
        ) : null}

        {isLoading ? (
          <p className="doctor-onboarding-loading">Loading profile...</p>
        ) : (
          <form className="doctor-onboarding-form" onSubmit={onSubmit}>
            <div className="doctor-onboarding-grid-2">
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
            </div>

            <div className="doctor-onboarding-grid-2">
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

            <div className="doctor-onboarding-repeatable">
              <span className="doctor-onboarding-label">Qualifications</span>
              {doctorQualifications.map((qualification, index) => (
                <div key={`qualification-${index}`} className="doctor-onboarding-inline-row">
                  <input
                    type="text"
                    placeholder={`Qualification ${index + 1}`}
                    value={qualification}
                    onChange={(event) => updateQualification(index, event.target.value)}
                  />
                  <button type="button" onClick={() => removeQualificationRow(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="doctor-onboarding-ghost" onClick={addQualificationRow}>
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
              <span className="doctor-onboarding-help">{bio.length}/500</span>
            </label>

            <label>
              Availability Summary (Optional)
              <textarea
                rows={3}
                placeholder="Mon-Fri: 9:00-17:00"
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              />
            </label>

            <div className="doctor-onboarding-repeatable">
              <span className="doctor-onboarding-label">Weekly Availability Slots</span>
              {availabilitySchedule.map((slot, index) => (
                <div key={`slot-${index}`} className="doctor-onboarding-grid-3">
                  <label>
                    Day
                    <select
                      value={slot.day}
                      onChange={(event) =>
                        updateScheduleSlot(index, {
                          day: event.target.value as DoctorDay
                        })
                      }
                    >
                      {WEEK_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start Time
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(event) => updateScheduleSlot(index, { startTime: event.target.value })}
                    />
                  </label>
                  <label>
                    End Time
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(event) => updateScheduleSlot(index, { endTime: event.target.value })}
                    />
                  </label>
                  <button type="button" onClick={() => removeScheduleSlot(index)}>
                    Remove Slot
                  </button>
                </div>
              ))}
              <button type="button" className="doctor-onboarding-ghost" onClick={addScheduleSlot}>
                + Add Availability Slot
              </button>
            </div>

            <div className="doctor-onboarding-repeatable">
              <span className="doctor-onboarding-label">Legal Documents (PDF only)</span>
              {legalDocuments.map((document, index) => (
                <div key={`doc-${index}`} className="doctor-onboarding-grid-2">
                  <label>
                    Document Label
                    <input
                      type="text"
                      placeholder="License, Degree, Certificate"
                      value={document.label}
                      onChange={(event) => updateLegalDocument(index, { label: event.target.value })}
                    />
                  </label>
                  <label>
                    Upload PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => onSelectLegalDocument(index, event.target.files?.[0] || null)}
                    />
                    <span className="doctor-onboarding-help">{document.fileName || 'No file selected'}</span>
                  </label>
                  <button type="button" onClick={() => removeLegalDocumentRow(index)}>
                    Remove Document
                  </button>
                </div>
              ))}
              <button type="button" className="doctor-onboarding-ghost" onClick={addLegalDocumentRow}>
                + Add Document
              </button>
            </div>

            <div className="doctor-onboarding-actions">
              <Link to={ROUTE_PATHS.auth.login} className="doctor-onboarding-back-link">
                Back to Login
              </Link>
              <button type="submit" className="doctor-onboarding-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit For Review'}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .doctor-onboarding-wrap {
          min-height: 100vh;
          padding: clamp(1rem, 2.8vw, 2.2rem);
          display: grid;
          place-items: center;
          background: radial-gradient(circle at 12% 14%, rgba(26, 158, 114, 0.14), transparent 40%),
            linear-gradient(180deg, #f7faf8 0%, #edf4f1 100%);
          font-family: 'DM Sans', sans-serif;
        }

        .doctor-onboarding-shell {
          width: min(920px, 100%);
          background: #ffffff;
          border: 1px solid #dbe5e1;
          border-radius: 18px;
          padding: clamp(1rem, 2.8vw, 1.8rem);
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.08);
          display: grid;
          gap: 0.9rem;
        }

        .doctor-onboarding-header {
          display: grid;
          gap: 0.35rem;
        }

        .doctor-onboarding-badge {
          margin: 0;
          width: fit-content;
          border-radius: 999px;
          padding: 0.3rem 0.65rem;
          background: #e8f9f2;
          border: 1px solid #b6ecd8;
          color: #0d5c45;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .doctor-onboarding-header h1 {
          margin: 0;
          font-family: 'Sora', sans-serif;
          color: #0f172a;
          font-size: clamp(1.5rem, 2.8vw, 2rem);
        }

        .doctor-onboarding-header p {
          margin: 0;
          color: #475569;
          line-height: 1.55;
        }

        .doctor-onboarding-alert {
          margin: 0;
          border-radius: 12px;
          padding: 0.58rem 0.72rem;
          font-weight: 600;
          font-size: 0.84rem;
        }

        .doctor-onboarding-alert-error {
          color: #991b1b;
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .doctor-onboarding-alert-success {
          color: #065f46;
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
        }

        .doctor-onboarding-loading {
          margin: 0;
          color: #334155;
        }

        .doctor-onboarding-form {
          display: grid;
          gap: 0.75rem;
        }

        .doctor-onboarding-form label,
        .doctor-onboarding-label {
          display: grid;
          gap: 0.25rem;
          color: #0f172a;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .doctor-onboarding-form input,
        .doctor-onboarding-form textarea,
        .doctor-onboarding-form select {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          min-height: 40px;
          padding: 0.45rem 0.56rem;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          color: #0f172a;
          background: #ffffff;
        }

        .doctor-onboarding-form textarea {
          min-height: 86px;
          resize: vertical;
        }

        .doctor-onboarding-form input:focus,
        .doctor-onboarding-form textarea:focus,
        .doctor-onboarding-form select:focus {
          outline: none;
          border-color: #1a9e72;
          box-shadow: 0 0 0 3px rgba(26, 158, 114, 0.2);
        }

        .doctor-onboarding-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.62rem;
        }

        .doctor-onboarding-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.52rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.62rem;
        }

        .doctor-onboarding-repeatable {
          display: grid;
          gap: 0.52rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.62rem;
          background: #f9fcfb;
        }

        .doctor-onboarding-inline-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.5rem;
          align-items: end;
        }

        .doctor-onboarding-repeatable button,
        .doctor-onboarding-inline-row button {
          width: fit-content;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          padding: 0.38rem 0.58rem;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        .doctor-onboarding-ghost {
          border: 1px solid #0d5c45;
          color: #0d5c45;
        }

        .doctor-onboarding-help {
          font-size: 0.74rem;
          color: #64748b;
        }

        .doctor-onboarding-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.7rem;
          margin-top: 0.2rem;
        }

        .doctor-onboarding-back-link {
          color: #0d5c45;
          font-weight: 700;
          text-decoration: none;
        }

        .doctor-onboarding-submit {
          border: 0;
          border-radius: 10px;
          min-height: 42px;
          padding: 0 1rem;
          background: #0d5c45;
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
        }

        .doctor-onboarding-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 760px) {
          .doctor-onboarding-grid-2,
          .doctor-onboarding-grid-3 {
            grid-template-columns: 1fr;
          }

          .doctor-onboarding-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .doctor-onboarding-submit {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
