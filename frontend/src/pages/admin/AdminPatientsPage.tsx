import { useEffect, useMemo, useState } from 'react';
import {
  deleteAdminPatient,
  getAdminPatients,
  updateAdminPatient,
  type AdminPatient
} from '../../services/adminPortalService';
import { formatDate } from './adminUi';

type PatientEditForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  heightCm: string;
  weightKg: string;
  isActive: boolean;
};

function createPatientEditForm(patient: AdminPatient): PatientEditForm {
  return {
    fullName: patient.fullName || '',
    email: patient.email || '',
    phone: patient.phone || '',
    gender: patient.gender || '',
    bloodGroup: patient.bloodGroup || '',
    medicalHistory: patient.medicalHistory || '',
    allergies: (patient.allergies || []).join(', '),
    medications: (patient.medications || []).join(', '),
    heightCm: String(patient.heightCm ?? ''),
    weightKg: String(patient.weightKg ?? ''),
    isActive: Boolean(patient.isActive)
  };
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<AdminPatient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<AdminPatient | null>(null);
  const [editForm, setEditForm] = useState<PatientEditForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      try {
        const data = await getAdminPatients();
        if (cancelled) return;
        setPatients(data);
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load patient directory.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      return (
        patient.fullName.toLowerCase().includes(query) ||
        (patient.email || '').toLowerCase().includes(query) ||
        (patient.medicalHistory || '').toLowerCase().includes(query)
      );
    });
  }, [patients, search]);

  function openPatientModal(patient: AdminPatient) {
    setSelectedPatient(patient);
    setEditForm(createPatientEditForm(patient));
  }

  async function onSavePatient() {
    if (!selectedPatient || !editForm) return;

    try {
      setSaving(true);

      const updatedPatient = await updateAdminPatient(selectedPatient.patientId, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        gender: editForm.gender.trim() || undefined,
        bloodGroup: editForm.bloodGroup.trim() || undefined,
        medicalHistory: editForm.medicalHistory.trim(),
        allergies: editForm.allergies
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        medications: editForm.medications
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        heightCm: editForm.heightCm.trim() ? Number(editForm.heightCm) : undefined,
        weightKg: editForm.weightKg.trim() ? Number(editForm.weightKg) : undefined,
        isActive: editForm.isActive
      });

      setPatients((previous) =>
        previous.map((patient) => (patient.patientId === selectedPatient.patientId ? updatedPatient : patient))
      );
      setSelectedPatient(updatedPatient);
      setEditForm(createPatientEditForm(updatedPatient));
      setError('');
    } catch {
      setError('Unable to update this patient right now.');
    } finally {
      setSaving(false);
    }
  }

  async function onDeletePatient(patient: AdminPatient) {
    if (!window.confirm(`Delete ${patient.fullName}? This action cannot be undone.`)) return;

    try {
      await deleteAdminPatient(patient.patientId);
      setPatients((previous) => previous.filter((item) => item.patientId !== patient.patientId));
      if (selectedPatient?.patientId === patient.patientId) {
        setSelectedPatient(null);
        setEditForm(null);
      }
      setError('');
    } catch {
      setError('Unable to delete this patient right now.');
    }
  }

  if (loading) {
    return <p className="admin-page-status">Loading patients...</p>;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-head">
        <div>
          <h2>Patient Management</h2>
          <p>{patients.length} registered patients</p>
        </div>
      </header>

      {error ? <p className="admin-error-banner">{error}</p> : null}

      <article className="admin-card">
        <div className="admin-table-toolbar">
          <input
            type="search"
            placeholder="Search patients"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Blood Group</th>
                <th>High Risk Events</th>
                <th>Appointments</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePatients.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <p className="admin-empty-state">No patients found.</p>
                  </td>
                </tr>
              ) : (
                visiblePatients.map((patient) => (
                  <tr key={patient.profileId}>
                    <td>{patient.fullName}</td>
                    <td>{patient.email || '-'}</td>
                    <td>{patient.gender || '-'}</td>
                    <td>{patient.bloodGroup || '-'}</td>
                    <td>{patient.highRiskEvents}</td>
                    <td>{patient.appointmentCount}</td>
                    <td>{formatDate(patient.updatedAt)}</td>
                    <td>
                      <div className="admin-inline-actions">
                        <button type="button" className="admin-icon-button" onClick={() => openPatientModal(patient)}>
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="admin-icon-button danger"
                          onClick={() => onDeletePatient(patient)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>

      {selectedPatient && editForm ? (
        <section
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPatient(null)}
        >
          <article className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <header className="admin-card-head">
              <h3>Edit Patient</h3>
              <button type="button" className="admin-link-button" onClick={() => setSelectedPatient(null)}>
                Close
              </button>
            </header>

            <div className="admin-form-grid">
              <label>
                Full Name
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, fullName: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, email: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Phone
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, phone: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Gender
                <input
                  type="text"
                  value={editForm.gender}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, gender: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Blood Group
                <input
                  type="text"
                  value={editForm.bloodGroup}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, bloodGroup: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Height (cm)
                <input
                  type="number"
                  min={0}
                  value={editForm.heightCm}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, heightCm: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Weight (kg)
                <input
                  type="number"
                  min={0}
                  value={editForm.weightKg}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, weightKg: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Allergies (comma separated)
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, allergies: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Medications (comma separated)
                <input
                  type="text"
                  value={editForm.medications}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, medications: event.target.value } : previous))
                  }
                />
              </label>
              <label>
                Medical History
                <textarea
                  rows={3}
                  value={editForm.medicalHistory}
                  onChange={(event) =>
                    setEditForm((previous) =>
                      previous ? { ...previous, medicalHistory: event.target.value } : previous
                    )
                  }
                />
              </label>
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(event) =>
                    setEditForm((previous) => (previous ? { ...previous, isActive: event.target.checked } : previous))
                  }
                />
                Active User
              </label>
            </div>

            <footer className="admin-modal-footer">
              <div className="admin-inline-actions end">
                <button type="button" className="admin-danger-button" onClick={() => onDeletePatient(selectedPatient)}>
                  Delete Patient
                </button>
                <button type="button" className="admin-primary-button" onClick={onSavePatient} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </footer>
          </article>
        </section>
      ) : null}
    </section>
  );
}
