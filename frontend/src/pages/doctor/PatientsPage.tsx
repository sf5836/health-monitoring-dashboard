import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import doctorService, { type DoctorPatientProfile } from '../../services/doctorService';
import { ApiError } from '../../services/apiClient';

export default function PatientsPage() {
  const [patients, setPatients] = useState<DoctorPatientProfile[]>([]);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    doctorService
      .getMyPatients()
      .then(setPatients)
      .catch((error: unknown) => setErrorMessage(error instanceof ApiError ? error.message : 'Failed to load patients'));
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((p) => (p.userId.fullName || '').toLowerCase().includes(needle));
  }, [patients, search]);

  return (
    <main className="hm-container" style={{ padding: '1.5rem 0' }}>
      <h2>My Patients</h2>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient" />
      {errorMessage ? <p>{errorMessage}</p> : null}
      {filtered.map((p) => (
        <article key={p._id} className="hm-card" style={{ marginTop: '0.7rem' }}>
          <strong>{p.userId.fullName}</strong>
          <p>{p.userId.email}</p>
          <Link className="hm-btn hm-btn-outline" to={`/doctor/patients/${p.userId._id}`}>Open Detail</Link>
        </article>
      ))}
    </main>
  );
}
