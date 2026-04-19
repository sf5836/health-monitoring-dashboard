import { type FormEvent, useEffect, useState } from 'react';
import {
  getCurrentUser,
  getPatientProfile,
  updatePatientProfile,
  type PatientProfile
} from '../../services/patientPortalService';

type ProfileFormState = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  heightCm: string;
  weightKg: string;
  allergiesText: string;
  medicationsText: string;
  medicalHistory: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
};

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInputDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function mapToForm(profile: PatientProfile, user: { fullName: string; email: string; phone?: string }): ProfileFormState {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    dob: toInputDate(profile.dob),
    gender: profile.gender || '',
    bloodGroup: profile.bloodGroup || '',
    heightCm: profile.heightCm ? String(profile.heightCm) : '',
    weightKg: profile.weightKg ? String(profile.weightKg) : '',
    allergiesText: (profile.allergies || []).join(', '),
    medicationsText: (profile.medications || []).join(', '),
    medicalHistory: profile.medicalHistory || '',
    emergencyName: profile.emergencyContact?.name || '',
    emergencyRelationship: profile.emergencyContact?.relationship || '',
    emergencyPhone: profile.emergencyContact?.phone || ''
  };
}

export default function PatientProfilePage() {
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    heightCm: '',
    weightKg: '',
    allergiesText: '',
    medicationsText: '',
    medicalHistory: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const [profile, user] = await Promise.all([getPatientProfile(), getCurrentUser()]);
        if (cancelled) return;

        setForm(mapToForm(profile, user));
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load profile details.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      await updatePatientProfile({
        dob: form.dob ? new Date(form.dob).toISOString() : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        allergies: parseCsv(form.allergiesText),
        medications: parseCsv(form.medicationsText),
        medicalHistory: form.medicalHistory || undefined,
        emergencyContact: {
          name: form.emergencyName || undefined,
          relationship: form.emergencyRelationship || undefined,
          phone: form.emergencyPhone || undefined
        }
      });

      setSuccess('Profile updated successfully.');
    } catch {
      setError('Unable to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="patient-page">
      <header className="patient-page-head">
        <div>
          <h2>My Profile</h2>
          <p>Manage your medical profile and emergency contact details.</p>
        </div>
      </header>

      {error ? <p className="patient-error-banner">{error}</p> : null}
      {success ? <p className="patient-success-banner">{success}</p> : null}

      <article className="patient-card">
        {loading ? (
          <p className="patient-page-status">Loading profile...</p>
        ) : (
          <form className="patient-form-grid" onSubmit={handleSaveProfile}>
            <label>
              Full Name
              <input value={form.fullName} readOnly />
            </label>

            <label>
              Email
              <input value={form.email} readOnly />
            </label>

            <label>
              Phone
              <input value={form.phone} readOnly />
            </label>

            <label>
              Date of Birth
              <input
                type="date"
                value={form.dob}
                onChange={(event) => setForm((previous) => ({ ...previous, dob: event.target.value }))}
              />
            </label>

            <label>
              Gender
              <input
                value={form.gender}
                onChange={(event) => setForm((previous) => ({ ...previous, gender: event.target.value }))}
                placeholder="Male / Female / Other"
              />
            </label>

            <label>
              Blood Group
              <input
                value={form.bloodGroup}
                onChange={(event) => setForm((previous) => ({ ...previous, bloodGroup: event.target.value }))}
              />
            </label>

            <label>
              Height (cm)
              <input
                type="number"
                value={form.heightCm}
                onChange={(event) => setForm((previous) => ({ ...previous, heightCm: event.target.value }))}
              />
            </label>

            <label>
              Weight (kg)
              <input
                type="number"
                value={form.weightKg}
                onChange={(event) => setForm((previous) => ({ ...previous, weightKg: event.target.value }))}
              />
            </label>

            <label className="patient-form-span-2">
              Allergies (comma separated)
              <input
                value={form.allergiesText}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, allergiesText: event.target.value }))
                }
              />
            </label>

            <label className="patient-form-span-2">
              Current Medications (comma separated)
              <input
                value={form.medicationsText}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, medicationsText: event.target.value }))
                }
              />
            </label>

            <label className="patient-form-span-2">
              Medical History
              <textarea
                rows={4}
                value={form.medicalHistory}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, medicalHistory: event.target.value }))
                }
              />
            </label>

            <label>
              Emergency Contact Name
              <input
                value={form.emergencyName}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, emergencyName: event.target.value }))
                }
              />
            </label>

            <label>
              Emergency Contact Relationship
              <input
                value={form.emergencyRelationship}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, emergencyRelationship: event.target.value }))
                }
              />
            </label>

            <label>
              Emergency Contact Phone
              <input
                value={form.emergencyPhone}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, emergencyPhone: event.target.value }))
                }
              />
            </label>

            <div className="patient-form-actions patient-form-span-2">
              <button type="submit" className="patient-primary-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </article>
    </section>
  );
}
