import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
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

type UploadingMedicalDocument = {
  label: string;
  fileName: string;
  contentType: string;
  dataBase64: string;
};

type ProfilePhotoUpload = {
  fileName: string;
  contentType: string;
  dataBase64: string;
  previewUrl: string;
};

type MedicalDocumentItem = NonNullable<PatientProfile['medicalDocuments']>[number];

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

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
  const [medicalDocuments, setMedicalDocuments] = useState<MedicalDocumentItem[]>([]);
  const [newMedicalDocuments, setNewMedicalDocuments] = useState<UploadingMedicalDocument[]>([]);
  const [medicalDocumentLabel, setMedicalDocumentLabel] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profilePhotoUpload, setProfilePhotoUpload] = useState<ProfilePhotoUpload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const [profile, user] = await Promise.all([getPatientProfile(), getCurrentUser()]);
        if (cancelled) return;

        setForm(mapToForm(profile, user));
        setMedicalDocuments(profile.medicalDocuments || []);
        setProfilePhotoUrl(profile.profilePhotoUrl || '');
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

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataBase64 = await fileToBase64(file);
      setProfilePhotoUpload({
        fileName: file.name,
        contentType: file.type || 'image/jpeg',
        dataBase64,
        previewUrl: dataBase64
      });
      setProfilePhotoUrl(dataBase64);
      setSuccess('Profile photo ready to upload. Save to apply.');
      setError('');
    } catch {
      setError('Unable to read the selected image.');
    } finally {
      event.target.value = '';
    }
  }

  async function handleMedicalDocumentsChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => ({
          label: medicalDocumentLabel.trim() || file.name,
          fileName: file.name,
          contentType: file.type || 'application/pdf',
          dataBase64: await fileToBase64(file)
        }))
      );

      setNewMedicalDocuments((current) => [...current, ...uploaded]);
      setSuccess('Medical document added to the upload queue.');
      setError('');
    } catch {
      setError('Unable to read the selected file(s).');
    } finally {
      event.target.value = '';
    }
  }

  function downloadDocument(document: MedicalDocumentItem) {
    if (!document.fileUrl) return;
    window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
  }

  function removeQueuedDocument(index: number) {
    setNewMedicalDocuments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const updated = await updatePatientProfile({
        dob: form.dob ? new Date(form.dob).toISOString() : undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        allergies: parseCsv(form.allergiesText),
        medications: parseCsv(form.medicationsText),
        medicalHistory: form.medicalHistory || undefined,
        profilePhoto: profilePhotoUpload
          ? {
              fileName: profilePhotoUpload.fileName,
              contentType: profilePhotoUpload.contentType,
              dataBase64: profilePhotoUpload.dataBase64
            }
          : undefined,
        medicalDocuments: newMedicalDocuments.length > 0 ? newMedicalDocuments : undefined,
        emergencyContact: {
          name: form.emergencyName || undefined,
          relationship: form.emergencyRelationship || undefined,
          phone: form.emergencyPhone || undefined
        }
      });

      setSuccess('Profile updated successfully.');
      setMedicalDocuments((current) => [...current, ...newMedicalDocuments]);
      setNewMedicalDocuments([]);
      setProfilePhotoUpload(null);
      setProfilePhotoUrl(updated.profilePhotoUrl || profilePhotoUpload?.previewUrl || profilePhotoUrl);
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
            <div className="patient-form-span-2 patient-profile-photo-row">
              <div className="patient-profile-photo">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Patient profile" />
                ) : (
                  <span>{(form.fullName || 'PT').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="patient-profile-photo-actions">
                <h3>Profile photo</h3>
                <p>Upload a clear photo (PNG, JPG, WEBP).</p>
                <label className="patient-secondary-button" htmlFor="patient-profile-photo">
                  Choose photo
                </label>
                <input
                  id="patient-profile-photo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleProfilePhotoChange}
                  hidden
                />
              </div>
            </div>
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
              <select
                value={form.gender}
                onChange={(event) => setForm((previous) => ({ ...previous, gender: event.target.value }))}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Blood Group
              <select
                value={form.bloodGroup}
                onChange={(event) => setForm((previous) => ({ ...previous, bloodGroup: event.target.value }))}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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

            <div className="patient-form-span-2 patient-medical-documents-section">
              <div className="patient-medical-documents-head">
                <div>
                  <strong>Medical History Documents</strong>
                  <p>Upload PDFs, scans, or pictures of reports, discharge summaries, or previous records.</p>
                </div>
              </div>

              <div className="patient-medical-upload-grid">
                <label>
                  Document label
                  <input
                    value={medicalDocumentLabel}
                    onChange={(event) => setMedicalDocumentLabel(event.target.value)}
                    placeholder="For example: Lab report"
                  />
                </label>

                <label>
                  Upload files
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    multiple
                    onChange={handleMedicalDocumentsChange}
                  />
                </label>
              </div>

              {medicalDocuments.length > 0 ? (
                <div className="patient-medical-documents-list">
                  <h4>Saved documents</h4>
                  <ul>
                    {medicalDocuments.map((document) => (
                      <li key={document.id || `${document.fileName}-${document.uploadedAt || ''}`}>
                        <button type="button" onClick={() => downloadDocument(document)}>
                          {document.label || document.fileName || 'Medical document'}
                        </button>
                        <span>{document.contentType || 'File'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {newMedicalDocuments.length > 0 ? (
                <div className="patient-medical-documents-list">
                  <h4>Queued uploads</h4>
                  <ul>
                    {newMedicalDocuments.map((document, index) => (
                      <li key={`${document.fileName}-${index}`}>
                        <span>{document.label || document.fileName}</span>
                        <button type="button" onClick={() => removeQueuedDocument(index)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

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
