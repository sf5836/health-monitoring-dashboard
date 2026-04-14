import { FormEvent, useEffect, useState } from 'react';
import doctorService, { type DoctorPrescription, type DoctorPatientProfile } from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [patients, setPatients] = useState<DoctorPatientProfile[]>([]);
  const [patientId, setPatientId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [rx, pts] = await Promise.all([doctorService.getMyPrescriptions(), doctorService.getMyPatients()]);
      setPrescriptions(rx);
      setPatients(pts);
      if (!patientId && pts.length > 0) {
        setPatientId(pts[0].userId._id);
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId || !medicationName.trim()) return;
    try {
      await doctorService.createPatientPrescription(patientId, {
        diagnosis,
        medications: [{ name: medicationName.trim() }],
        instructions: ''
      });
      setDiagnosis('');
      setMedicationName('');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Failed to create prescription');
    }
  };

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>Doctor Prescriptions</h2>
      {loading ? <p>Loading prescriptions...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      <section className="hm-card" style={{ marginBottom: '1rem' }}>
        <h3>Create Prescription</h3>
        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '0.6rem' }}>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            {patients.map((p) => <option key={p.userId._id} value={p.userId._id}>{p.userId.fullName}</option>)}
          </select>
          <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Diagnosis" />
          <input value={medicationName} onChange={(e) => setMedicationName(e.target.value)} placeholder="Medication" required />
          <button className="hm-btn hm-btn-primary" type="submit">Create</button>
        </form>
      </section>

      {prescriptions.map((rx) => (
        <article key={rx._id} className="hm-card" style={{ marginTop: '0.8rem' }}>
          <h4>{rx.patientId?.fullName || 'Patient'}</h4>
          <p>{rx.diagnosis || 'No diagnosis'} | {new Date(rx.issuedAt).toLocaleString()}</p>
          <ul>{rx.medications.map((m, idx) => <li key={`${rx._id}-${idx}`}>{m.name}</li>)}</ul>
        </article>
      ))}
    </main>
  );
}
