import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createOrGetConversationWithUser } from '../../services/patientPortalService';
import {
  addDoctorPatientNote,
  createDoctorPrescription,
  getDoctorAppointments,
  getDoctorPatientDetail,
  getDoctorPatientTrends,
  getDoctorPrescriptions,
  type DoctorAppointment,
  type DoctorPatientDetail,
  type DoctorPatientTrends,
  type DoctorPrescription,
  type DoctorVitalRecord
} from '../../services/doctorPortalService';
import {
  formatBloodPressure,
  formatDate,
  formatDateTime,
  formatTime,
  riskClass,
  riskLabel
} from './doctorUi';

const TABS = ['vitals', 'trends', 'prescriptions', 'appointments', 'notes'] as const;
type TabKey = (typeof TABS)[number];

type MedicationDraft = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

function linePath(values: number[], width: number, height: number): string {
  if (values.length <= 1) {
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function getVitalsForChart(vitals: DoctorVitalRecord[]) {
  const filtered = vitals.filter((item) => item.bloodPressure?.systolic && item.bloodPressure?.diastolic);

  return {
    labels: filtered.map((item) => formatDate(item.datetime)),
    systolic: filtered.map((item) => item.bloodPressure?.systolic || 0),
    diastolic: filtered.map((item) => item.bloodPressure?.diastolic || 0)
  };
}

function initialMedication(): MedicationDraft {
  return {
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  };
}

export default function DoctorPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();

  const patientId = params.id || '';

  const [detail, setDetail] = useState<DoctorPatientDetail | null>(null);
  const [trends, setTrends] = useState<DoctorPatientTrends | null>(null);
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('vitals');
  const [noteDraft, setNoteDraft] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState('');
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medications, setMedications] = useState<MedicationDraft[]>([initialMedication()]);
  const [isCreatingPrescription, setIsCreatingPrescription] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPatient() {
      if (!patientId) {
        setError('Patient id is missing.');
        setLoading(false);
        return;
      }

      try {
        const [detailData, trendData, allPrescriptions, allAppointments] = await Promise.all([
          getDoctorPatientDetail(patientId),
          getDoctorPatientTrends(patientId, 30),
          getDoctorPrescriptions(),
          getDoctorAppointments()
        ]);

        if (cancelled) return;

        setDetail(detailData);
        setTrends(trendData);
        setPrescriptions(allPrescriptions.filter((item) => item.patientId === patientId));
        setAppointments(allAppointments.filter((item) => item.patientId === patientId));
        setError('');
      } catch {
        if (cancelled) return;
        setError('Unable to load patient record right now.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const latestVital = detail?.latestVitals[0];

  const alerts = useMemo(() => {
    return (detail?.latestVitals || []).filter((item) => item.riskLevel !== 'normal').slice(0, 4);
  }, [detail?.latestVitals]);

  const trendSeries = useMemo(() => getVitalsForChart(trends?.vitals || []), [trends?.vitals]);
  const systolicPath = useMemo(() => linePath(trendSeries.systolic, 680, 220), [trendSeries.systolic]);
  const diastolicPath = useMemo(() => linePath(trendSeries.diastolic, 680, 220), [trendSeries.diastolic]);

  async function onSendMessage() {
    if (!detail?.user.id) return;

    try {
      const conversation = await createOrGetConversationWithUser(detail.user.id);
      navigate(`/doctor/messages?conversationId=${conversation.id}`);
    } catch {
      setError('Unable to start conversation with this patient right now.');
    }
  }

  async function onSaveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteDraft.trim()) return;

    try {
      setIsSavingNote(true);
      const note = await addDoctorPatientNote(patientId, noteDraft.trim());

      setDetail((previous) => {
        if (!previous) return previous;
        const nextNotes = [note, ...previous.doctorNotes];
        return {
          ...previous,
          doctorNotes: nextNotes,
          profile: {
            ...previous.profile,
            doctorNotes: nextNotes
          }
        };
      });

      setNoteDraft('');
      setError('');
    } catch {
      setError('Unable to save note right now.');
    } finally {
      setIsSavingNote(false);
    }
  }

  function updateMedication(index: number, key: keyof MedicationDraft, value: string) {
    setMedications((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  }

  function addMedicationRow() {
    setMedications((previous) => [...previous, initialMedication()]);
  }

  async function onCreatePrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = medications
      .map((item) => ({
        name: item.name.trim(),
        dosage: item.dosage.trim() || undefined,
        frequency: item.frequency.trim() || undefined,
        duration: item.duration.trim() || undefined
      }))
      .filter((item) => item.name.length > 0);

    if (normalized.length === 0) {
      setError('At least one medication is required.');
      return;
    }

    try {
      setIsCreatingPrescription(true);

      const created = await createDoctorPrescription(patientId, {
        diagnosis: prescriptionDiagnosis.trim() || undefined,
        medications: normalized,
        instructions: prescriptionInstructions.trim() || undefined,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined
      });

      setPrescriptions((previous) => [created, ...previous]);
      setIsPrescriptionModalOpen(false);
      setPrescriptionDiagnosis('');
      setPrescriptionInstructions('');
      setFollowUpDate('');
      setMedications([initialMedication()]);
      setError('');
    } catch {
      setError('Unable to create prescription right now.');
    } finally {
      setIsCreatingPrescription(false);
    }
  }

  if (loading) {
    return <p className="doctor-page-status">Loading patient details...</p>;
  }

  if (!detail) {
    return <p className="doctor-error-banner">Patient record is not available.</p>;
  }

  return (
    <section className="doctor-page doctor-patient-detail-page">
      <header className="doctor-page-head">
        <div>
          <p className="doctor-breadcrumb">
            <Link to="/doctor/dashboard">Dashboard</Link> / <Link to="/doctor/patients">My Patients</Link> / {detail.user.fullName}
          </p>
          <h2>{detail.user.fullName}</h2>
          <p>
            {detail.profile.gender || 'Patient'} {detail.profile.dob ? `· ${formatDate(detail.profile.dob)}` : ''}
          </p>
        </div>
      </header>

      {error ? <p className="doctor-error-banner">{error}</p> : null}

      <article className="doctor-card doctor-patient-header-card">
        <div className="doctor-header-main">
          <div className="doctor-avatar-large">{detail.user.fullName.slice(0, 2).toUpperCase()}</div>
          <div>
            <h3>{detail.user.fullName}</h3>
            <p>{detail.user.email}</p>
            <div className="doctor-tag-row">
              {detail.profile.bloodGroup ? <span className="doctor-data-chip">Blood: {detail.profile.bloodGroup}</span> : null}
              {detail.profile.allergies.map((allergy) => (
                <span key={allergy} className="doctor-data-chip alert">
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="doctor-inline-actions wrap">
          <button type="button" className="doctor-secondary-button" onClick={onSendMessage}>
            Send Message
          </button>
          <button type="button" className="doctor-primary-button" onClick={() => setIsPrescriptionModalOpen(true)}>
            New Prescription
          </button>
          <button type="button" className="doctor-secondary-button" onClick={() => setActiveTab('appointments')}>
            Schedule Appointment
          </button>
          <button type="button" className="doctor-secondary-button" onClick={() => setActiveTab('notes')}>
            Add Note
          </button>
        </div>
      </article>

      <section className="doctor-grid doctor-vitals-overview-grid">
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">Blood Pressure</p>
          <p className={`doctor-stat-value ${latestVital?.riskLevel === 'high' ? 'is-danger' : ''}`}>
            {formatBloodPressure(latestVital?.bloodPressure)}
          </p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">Heart Rate</p>
          <p className="doctor-stat-value">{latestVital?.heartRate ?? '-'}</p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">Glucose</p>
          <p className="doctor-stat-value">{latestVital?.glucose?.value ?? '-'}</p>
        </article>
        <article className="doctor-stat-card">
          <p className="doctor-stat-label">SpO2</p>
          <p className="doctor-stat-value">{latestVital?.spo2 ?? '-'}</p>
        </article>
      </section>

      {alerts.length > 0 ? (
        <article className="doctor-card doctor-risk-card">
          <h3>⚠ {alerts.length} Active Alerts</h3>
          <ul className="doctor-list">
            {alerts.map((alert) => (
              <li key={alert.id} className="doctor-list-item">
                <div>
                  <p>
                    {riskLabel(alert.riskLevel)} - {formatBloodPressure(alert.bloodPressure)} mmHg
                  </p>
                  <small>{formatDateTime(alert.datetime)}</small>
                </div>
                <span className={`doctor-risk-pill ${riskClass(alert.riskLevel)}`}>
                  {riskLabel(alert.riskLevel)}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      <section className="doctor-tab-row">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`doctor-tab-pill ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'vitals'
              ? 'Vitals History'
              : tab === 'trends'
                ? 'Trends'
                : tab === 'prescriptions'
                  ? 'Prescriptions'
                  : tab === 'appointments'
                    ? 'Appointments'
                    : 'My Notes'}
          </button>
        ))}
      </section>

      {activeTab === 'vitals' ? (
        <article className="doctor-card">
          <div className="doctor-table-wrap">
            <table className="doctor-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Blood Pressure</th>
                  <th>Heart Rate</th>
                  <th>SpO2</th>
                  <th>Glucose</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {detail.latestVitals.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <p className="doctor-empty-state">No vitals available for this patient yet.</p>
                    </td>
                  </tr>
                ) : (
                  detail.latestVitals.map((vital) => (
                    <tr key={vital.id}>
                      <td>{formatDateTime(vital.datetime)}</td>
                      <td>{formatBloodPressure(vital.bloodPressure)}</td>
                      <td>{vital.heartRate ?? '-'}</td>
                      <td>{vital.spo2 ?? '-'}</td>
                      <td>{vital.glucose?.value ?? '-'}</td>
                      <td>
                        <span className={`doctor-risk-pill ${riskClass(vital.riskLevel)}`}>
                          {riskLabel(vital.riskLevel)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="doctor-link-button"
                          onClick={() => {
                            setNoteDraft(`Note on ${formatDateTime(vital.datetime)}: `);
                            setActiveTab('notes');
                          }}
                        >
                          Add Note
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {activeTab === 'trends' ? (
        <article className="doctor-card">
          <h3>Viewing {detail.user.fullName}&apos;s Health Trends</h3>
          {trendSeries.systolic.length <= 1 ? (
            <p className="doctor-empty-state">Not enough data points to render trends.</p>
          ) : (
            <div className="doctor-trend-chart-wrap">
              <svg viewBox="0 0 680 260" preserveAspectRatio="none" className="doctor-trend-chart">
                <path d={systolicPath} className="doctor-trend-line" />
                <path d={diastolicPath} className="doctor-trend-line-alt" />
              </svg>
              <div className="doctor-chart-legend">
                <span>Systolic</span>
                <span>Diastolic</span>
              </div>
              <div className="doctor-chart-labels">
                {trendSeries.labels.slice(-6).map((label) => (
                  <small key={label}>{label}</small>
                ))}
              </div>
            </div>
          )}
        </article>
      ) : null}

      {activeTab === 'prescriptions' ? (
        <article className="doctor-card">
          <div className="doctor-card-head">
            <h3>Prescriptions Sent</h3>
            <button type="button" className="doctor-primary-button" onClick={() => setIsPrescriptionModalOpen(true)}>
              New Prescription
            </button>
          </div>

          {prescriptions.length === 0 ? (
            <p className="doctor-empty-state">No prescriptions created for this patient yet.</p>
          ) : (
            <ul className="doctor-prescription-list">
              {prescriptions.map((prescription) => (
                <li key={prescription.id} className="doctor-prescription-card">
                  <header>
                    <p>{prescription.diagnosis || 'General care'}</p>
                    <small>{formatDate(prescription.issuedAt)}</small>
                  </header>
                  <ul>
                    {prescription.medications.map((medication) => (
                      <li key={`${prescription.id}-${medication.name}`}>
                        {medication.name} {medication.dosage ? `- ${medication.dosage}` : ''}{' '}
                        {medication.frequency ? `(${medication.frequency})` : ''}
                      </li>
                    ))}
                  </ul>
                  {prescription.instructions ? <p>{prescription.instructions}</p> : null}
                  {prescription.pdfUrl ? (
                    <a href={prescription.pdfUrl} target="_blank" rel="noreferrer" className="doctor-link-button">
                      Download PDF
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : null}

      {activeTab === 'appointments' ? (
        <article className="doctor-card">
          <h3>Appointments</h3>
          {appointments.length === 0 ? (
            <p className="doctor-empty-state">No appointments with this patient yet.</p>
          ) : (
            <ul className="doctor-list">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="doctor-list-item">
                  <div>
                    <p>
                      {formatDate(appointment.date)} at {formatTime(appointment.time)}
                    </p>
                    <small>
                      {appointment.type === 'teleconsult' ? 'Teleconsult' : 'In-person'} • {appointment.status}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : null}

      {activeTab === 'notes' ? (
        <article className="doctor-card">
          <h3>Private Doctor Notes</h3>
          <p className="doctor-micro-copy">Only you can see these notes.</p>

          <form className="doctor-notes-form" onSubmit={onSaveNote}>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Write your private patient note..."
              rows={5}
            />
            <button type="submit" className="doctor-primary-button" disabled={isSavingNote || noteDraft.trim().length < 3}>
              {isSavingNote ? 'Saving...' : 'Save Notes'}
            </button>
          </form>

          <ul className="doctor-list">
            {detail.doctorNotes.length === 0 ? (
              <li className="doctor-list-item">
                <p className="doctor-empty-state">No notes yet.</p>
              </li>
            ) : (
              detail.doctorNotes.map((note) => (
                <li key={note.id} className="doctor-list-item">
                  <div>
                    <p>{note.note}</p>
                    <small>{formatDateTime(note.createdAt)}</small>
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>
      ) : null}

      {isPrescriptionModalOpen ? (
        <div className="doctor-modal-backdrop" role="presentation" onClick={() => setIsPrescriptionModalOpen(false)}>
          <article className="doctor-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Create Prescription</h3>
            <form className="doctor-form-grid" onSubmit={onCreatePrescription}>
              <label className="doctor-form-span-2">
                Diagnosis
                <input
                  type="text"
                  value={prescriptionDiagnosis}
                  onChange={(event) => setPrescriptionDiagnosis(event.target.value)}
                  placeholder="Hypertension - Stage 1"
                />
              </label>

              {medications.map((medication, index) => (
                <div key={`medication-${index}`} className="doctor-medication-row">
                  <input
                    type="text"
                    placeholder="Medication name"
                    value={medication.name}
                    onChange={(event) => updateMedication(index, 'name', event.target.value)}
                    required={index === 0}
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={medication.dosage}
                    onChange={(event) => updateMedication(index, 'dosage', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency"
                    value={medication.frequency}
                    onChange={(event) => updateMedication(index, 'frequency', event.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={medication.duration}
                    onChange={(event) => updateMedication(index, 'duration', event.target.value)}
                  />
                </div>
              ))}

              <button type="button" className="doctor-secondary-button" onClick={addMedicationRow}>
                + Add Medication
              </button>

              <label className="doctor-form-span-2">
                Instructions
                <textarea
                  rows={3}
                  value={prescriptionInstructions}
                  onChange={(event) => setPrescriptionInstructions(event.target.value)}
                  placeholder="Any guidance for the patient..."
                />
              </label>

              <label>
                Follow-up Date
                <input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
              </label>

              <div className="doctor-inline-actions wrap doctor-form-span-2">
                <button type="button" className="doctor-secondary-button" onClick={() => setIsPrescriptionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="doctor-primary-button" disabled={isCreatingPrescription}>
                  {isCreatingPrescription ? 'Creating...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}
